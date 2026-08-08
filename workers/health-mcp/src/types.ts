export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  WEBHOOK_SECRET: string;
  // The single HealthOS user's auth.users UUID. Service-role writes have no
  // JWT session, so `user_id default auth.uid()` can't resolve on its own --
  // every row the Worker inserts must be stamped with this explicitly.
  OWNER_USER_ID: string;
}

// Health Auto Export's REST API webhook payload shape:
// https://www.healthyapps.dev/docs (metrics grouped by name, workouts as a flat list)
export interface HealthAutoExportPayload {
  data: {
    metrics?: HealthAutoExportMetric[];
    workouts?: HealthAutoExportWorkout[];
  };
}

// Most metrics carry a flat `qty`, but a few don't: heart_rate reports
// Avg/Min/Max instead, and sleep_analysis reports totalSleep -- see
// extractMetricValue in webhook.ts, must not assume `qty` is present.
export interface HealthAutoExportMetricSample {
  date: string; // 'YYYY-MM-DD HH:mm:ss +ZZZZ'
  qty?: number;
  Avg?: number;
  Min?: number;
  Max?: number;
  totalSleep?: number;
  asleep?: number;
  source?: string;
}

export interface HealthAutoExportMetric {
  name: string; // e.g. 'step_count', 'heart_rate', 'active_energy'
  units: string;
  data: HealthAutoExportMetricSample[];
}

export interface HealthAutoExportWorkout {
  name: string; // e.g. 'Functional Strength Training'
  start: string;
  end: string;
  duration?: number; // seconds
  // `units` varies per-account (kJ vs kcal for energy, km vs mi for distance) --
  // see mapWorkouts in webhook.ts, must not be assumed.
  activeEnergyBurned?: { qty: number; units?: string };
  distance?: { qty: number; units?: string };
  avgHeartRate?: { qty: number };
  maxHeartRate?: { qty: number };
  source?: string;
}

// Row shapes matching supabase/migrations/0001_init.sql
export interface HealthMetricRow {
  user_id: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  source: string | null;
  raw_payload: unknown;
}

export interface WorkoutRow {
  user_id: string;
  workout_type: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number | null;
  active_energy_kcal: number | null;
  total_distance_m: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  source: string | null;
  raw_payload: unknown;
}
