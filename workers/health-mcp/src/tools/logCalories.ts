import type { McpTool } from "../mcpTypes";
import { textResult } from "../mcpTypes";
import { insertRow } from "../supabaseClient";
import { optionalNumber, optionalString, requireNumber } from "../validate";

interface CalorieLogRow {
  id: string;
}

// Health Auto Export / the phone's local timezone isn't known to the Worker,
// so "today" for a caller that omits logged_date is UTC-today -- callers
// that care about a different day should pass logged_date explicitly.
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export const logCalories: McpTool = {
  name: "log_calories",
  description: "Log a meal or daily kcal total.",
  inputSchema: {
    type: "object",
    properties: {
      logged_date: { type: "string", format: "date", description: "YYYY-MM-DD, defaults to today (UTC)" },
      meal_label: { type: "string", description: "e.g. 'breakfast', 'snack'" },
      description: { type: "string" },
      kcal: { type: "number", minimum: 0 },
      protein_g: { type: "number", minimum: 0 },
      carbs_g: { type: "number", minimum: 0 },
      fat_g: { type: "number", minimum: 0 },
    },
    required: ["kcal"],
  },
  async handler(args, env) {
    const kcal = requireNumber(args.kcal, "kcal", 0, 20000);
    const loggedDate = optionalString(args.logged_date) ?? todayUtc();

    const row = await insertRow<CalorieLogRow>(env, "calorie_log", {
      user_id: env.OWNER_USER_ID,
      logged_date: loggedDate,
      meal_label: optionalString(args.meal_label),
      description: optionalString(args.description),
      kcal,
      protein_g: optionalNumber(args.protein_g, "protein_g", 0, 2000),
      carbs_g: optionalNumber(args.carbs_g, "carbs_g", 0, 2000),
      fat_g: optionalNumber(args.fat_g, "fat_g", 0, 2000),
      source: "MCP tool",
    });

    const label = optionalString(args.meal_label);
    return textResult(
      `Logged ${kcal} kcal${label ? ` (${label})` : ""} for ${loggedDate} (id ${row.id}).`,
    );
  },
};
