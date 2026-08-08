import type {
  Env,
  HealthAutoExportPayload,
  HealthMetricRow,
  WorkoutRow,
} from "./types";

function mapMetrics(payload: HealthAutoExportPayload, ownerUserId: string): HealthMetricRow[] {
  const rows: HealthMetricRow[] = [];
  for (const metric of payload.data.metrics ?? []) {
    for (const sample of metric.data) {
      rows.push({
        user_id: ownerUserId,
        metric_type: metric.name,
        value: sample.qty,
        unit: metric.units,
        recorded_at: new Date(sample.date).toISOString(),
        source: sample.source ?? null,
        raw_payload: sample,
      });
    }
  }
  return rows;
}

// Health Auto Export reports each workout's energy/distance in whatever unit
// the account is set to (kJ or kcal; km or mi) -- LifeOS's health_client.py
// found this the hard way (7164 "kcal" for one day that was actually kJ).
// The row's units are fixed columns, so normalize here rather than trusting qty.
function energyToKcal(qty: number, units?: string): number {
  const u = (units ?? "").trim().toLowerCase();
  if (u === "kj" || u === "kilojoule" || u === "kilojoules") {
    return qty / 4.184;
  }
  return qty;
}

function distanceToMeters(qty: number, units?: string): number {
  const u = (units ?? "").trim().toLowerCase();
  if (u === "km" || u === "kilometer" || u === "kilometers") return qty * 1000;
  if (u === "mi" || u === "mile" || u === "miles") return qty * 1609.344;
  return qty;
}

function mapWorkouts(payload: HealthAutoExportPayload, ownerUserId: string): WorkoutRow[] {
  return (payload.data.workouts ?? []).map((workout) => ({
    user_id: ownerUserId,
    workout_type: workout.name,
    started_at: new Date(workout.start).toISOString(),
    ended_at: new Date(workout.end).toISOString(),
    duration_seconds: workout.duration ?? null,
    active_energy_kcal: workout.activeEnergyBurned
      ? energyToKcal(workout.activeEnergyBurned.qty, workout.activeEnergyBurned.units)
      : null,
    total_distance_m: workout.distance
      ? distanceToMeters(workout.distance.qty, workout.distance.units)
      : null,
    avg_heart_rate: workout.avgHeartRate?.qty ?? null,
    max_heart_rate: workout.maxHeartRate?.qty ?? null,
    source: workout.source ?? null,
    raw_payload: workout,
  }));
}

async function insertRows(env: Env, table: string, rows: unknown[]): Promise<void> {
  if (rows.length === 0) return;
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase insert into ${table} failed: ${response.status} ${body}`);
  }
}

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const providedSecret = request.headers.get("X-Webhook-Secret");
  if (!providedSecret || providedSecret !== env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: HealthAutoExportPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const metricRows = mapMetrics(payload, env.OWNER_USER_ID);
  const workoutRows = mapWorkouts(payload, env.OWNER_USER_ID);

  try {
    await Promise.all([
      insertRows(env, "health_metrics", metricRows),
      insertRows(env, "workouts", workoutRows),
    ]);
  } catch (error) {
    console.error(error);
    return new Response("Failed to store health data", { status: 502 });
  }

  return new Response(
    JSON.stringify({ ok: true, metrics: metricRows.length, workouts: workoutRows.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
