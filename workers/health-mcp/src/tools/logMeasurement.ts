import type { McpTool } from "../mcpTypes";
import { textResult } from "../mcpTypes";
import { insertRow } from "../supabaseClient";
import { optionalNumber, optionalString } from "../validate";

interface BodyMeasurementRow {
  id: string;
}

export const logMeasurement: McpTool = {
  name: "log_measurement",
  description: "Log a body measurement check-in (weight, body fat %, circumferences). All fields optional except at least one measurement value.",
  inputSchema: {
    type: "object",
    properties: {
      measured_at: { type: "string", format: "date-time", description: "defaults to now" },
      weight_kg: { type: "number", minimum: 0, maximum: 400 },
      body_fat_pct: { type: "number", minimum: 0, maximum: 100 },
      waist_cm: { type: "number", minimum: 0, maximum: 300 },
      chest_cm: { type: "number", minimum: 0, maximum: 300 },
      hips_cm: { type: "number", minimum: 0, maximum: 300 },
      arm_cm: { type: "number", minimum: 0, maximum: 100 },
      thigh_cm: { type: "number", minimum: 0, maximum: 150 },
      notes: { type: "string" },
    },
  },
  async handler(args, env) {
    const weightKg = optionalNumber(args.weight_kg, "weight_kg", 0, 400);
    const bodyFatPct = optionalNumber(args.body_fat_pct, "body_fat_pct", 0, 100);
    const waistCm = optionalNumber(args.waist_cm, "waist_cm", 0, 300);
    const chestCm = optionalNumber(args.chest_cm, "chest_cm", 0, 300);
    const hipsCm = optionalNumber(args.hips_cm, "hips_cm", 0, 300);
    const armCm = optionalNumber(args.arm_cm, "arm_cm", 0, 100);
    const thighCm = optionalNumber(args.thigh_cm, "thigh_cm", 0, 150);

    if (
      [weightKg, bodyFatPct, waistCm, chestCm, hipsCm, armCm, thighCm].every((v) => v === null)
    ) {
      throw new Error("At least one measurement value is required");
    }

    const row: Record<string, unknown> = {
      user_id: env.OWNER_USER_ID,
      weight_kg: weightKg,
      body_fat_pct: bodyFatPct,
      waist_cm: waistCm,
      chest_cm: chestCm,
      hips_cm: hipsCm,
      arm_cm: armCm,
      thigh_cm: thighCm,
      notes: optionalString(args.notes),
    };
    const measuredAt = optionalString(args.measured_at);
    if (measuredAt) row.measured_at = measuredAt;

    const inserted = await insertRow<BodyMeasurementRow>(env, "body_measurements", row);

    const parts: string[] = [];
    if (weightKg != null) parts.push(`weight ${weightKg}kg`);
    if (bodyFatPct != null) parts.push(`body fat ${bodyFatPct}%`);
    if (waistCm != null) parts.push(`waist ${waistCm}cm`);
    if (chestCm != null) parts.push(`chest ${chestCm}cm`);
    if (hipsCm != null) parts.push(`hips ${hipsCm}cm`);
    if (armCm != null) parts.push(`arm ${armCm}cm`);
    if (thighCm != null) parts.push(`thigh ${thighCm}cm`);

    return textResult(`Logged measurement: ${parts.join(", ")} (id ${inserted.id}).`);
  },
};
