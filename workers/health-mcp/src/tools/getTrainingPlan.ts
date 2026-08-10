import type { McpTool } from "../mcpTypes";
import { textResult } from "../mcpTypes";
import { selectRows } from "../supabaseClient";
import { optionalInt } from "../validate";

interface TrainingPlanRow {
  id: string;
  week_number: number;
  day_of_week: number;
  day_label: string | null;
  exercise_name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_load_kg: number | null;
  notes: string | null;
  sort_order: number;
}

export const getTrainingPlan: McpTool = {
  name: "get_training_plan",
  description: "Read the current training program, optionally filtered to a specific week and/or day.",
  inputSchema: {
    type: "object",
    properties: {
      week_number: { type: "integer", minimum: 1 },
      day_of_week: { type: "integer", minimum: 1, maximum: 7, description: "1=Monday ... 7=Sunday" },
    },
  },
  async handler(args, env) {
    const weekNumber = optionalInt(args.week_number, "week_number", 1, 1000);
    const dayOfWeek = optionalInt(args.day_of_week, "day_of_week", 1, 7);

    const params = new URLSearchParams({
      user_id: `eq.${env.OWNER_USER_ID}`,
      order: "week_number.asc,day_of_week.asc,sort_order.asc",
    });
    if (weekNumber !== null) params.set("week_number", `eq.${weekNumber}`);
    if (dayOfWeek !== null) params.set("day_of_week", `eq.${dayOfWeek}`);

    const rows = await selectRows<TrainingPlanRow>(env, "training_plan", params);
    if (rows.length === 0) {
      return textResult("No training plan rows match that filter.");
    }
    return textResult(JSON.stringify(rows));
  },
};
