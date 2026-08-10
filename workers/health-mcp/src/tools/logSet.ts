import type { McpTool } from "../mcpTypes";
import { textResult } from "../mcpTypes";
import { insertRow } from "../supabaseClient";
import { optionalInt, optionalNumber, optionalString, requireInt, requireString } from "../validate";

interface ExerciseLogRow {
  id: string;
}

export const logSet: McpTool = {
  name: "log_set",
  description: "Log a completed set (e.g. 'log today's bench: 3x5 @ 80kg').",
  inputSchema: {
    type: "object",
    properties: {
      exercise_name: { type: "string" },
      set_number: { type: "integer", minimum: 1 },
      reps: { type: "integer", minimum: 1 },
      load_kg: { type: "number", minimum: 0 },
      rpe: { type: "number", minimum: 0, maximum: 10 },
      training_plan_id: { type: "string", format: "uuid" },
      workout_id: { type: "string", format: "uuid" },
      notes: { type: "string" },
    },
    required: ["exercise_name", "set_number", "reps"],
  },
  async handler(args, env) {
    const exerciseName = requireString(args.exercise_name, "exercise_name");
    const setNumber = requireInt(args.set_number, "set_number", 1, 100);
    const reps = requireInt(args.reps, "reps", 1, 200);
    const loadKg = optionalNumber(args.load_kg, "load_kg", 0, 500);
    const rpe = optionalNumber(args.rpe, "rpe", 0, 10);

    const row = await insertRow<ExerciseLogRow>(env, "exercise_log", {
      user_id: env.OWNER_USER_ID,
      exercise_name: exerciseName,
      set_number: setNumber,
      reps,
      load_kg: loadKg,
      rpe,
      training_plan_id: optionalString(args.training_plan_id),
      workout_id: optionalString(args.workout_id),
      notes: optionalString(args.notes),
    });

    const loadPart = loadKg != null ? ` @ ${loadKg}kg` : "";
    const rpePart = rpe != null ? ` RPE ${rpe}` : "";
    return textResult(
      `Logged ${exerciseName} set ${setNumber}: ${reps} reps${loadPart}${rpePart} (id ${row.id}).`,
    );
  },
};
