import type { McpTool } from "../mcpTypes";
import { textResult } from "../mcpTypes";
import { selectRows } from "../supabaseClient";

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

interface ExerciseLogPlanIdRow {
  training_plan_id: string | null;
}

export const getNextSession: McpTool = {
  name: "get_next_session",
  description:
    "Find the next unfinished training session: the earliest week/day in training_plan that doesn't have a logged set for every exercise.",
  inputSchema: { type: "object", properties: {} },
  async handler(_args, env) {
    const plan = await selectRows<TrainingPlanRow>(
      env,
      "training_plan",
      new URLSearchParams({
        user_id: `eq.${env.OWNER_USER_ID}`,
        order: "week_number.asc,day_of_week.asc,sort_order.asc",
      }),
    );
    if (plan.length === 0) {
      return textResult("No training plan rows found.");
    }

    const loggedRows = await selectRows<ExerciseLogPlanIdRow>(
      env,
      "exercise_log",
      new URLSearchParams({
        user_id: `eq.${env.OWNER_USER_ID}`,
        training_plan_id: "not.is.null",
        select: "training_plan_id",
      }),
    );
    const loggedPlanIds = new Set(loggedRows.map((r) => r.training_plan_id));

    const dayOrder: string[] = [];
    const days = new Map<string, TrainingPlanRow[]>();
    for (const row of plan) {
      const key = `${row.week_number}-${row.day_of_week}`;
      if (!days.has(key)) {
        days.set(key, []);
        dayOrder.push(key);
      }
      days.get(key)!.push(row);
    }

    for (const key of dayOrder) {
      const exercises = days.get(key)!;
      const fullyLogged = exercises.every((exercise) => loggedPlanIds.has(exercise.id));
      if (!fullyLogged) {
        return textResult(
          JSON.stringify({
            week_number: exercises[0].week_number,
            day_of_week: exercises[0].day_of_week,
            day_label: exercises[0].day_label,
            exercises,
          }),
        );
      }
    }

    return textResult("All sessions in the current plan are fully logged.");
  },
};
