import type { McpTool } from "./mcpTypes";
import { getTrainingPlan } from "./tools/getTrainingPlan";
import { logCalories } from "./tools/logCalories";
import { logMeasurement } from "./tools/logMeasurement";
import { logPhotoCheckin } from "./tools/logPhotoCheckin";
import { logSet } from "./tools/logSet";

export const tools: McpTool[] = [logSet, logCalories, logMeasurement, logPhotoCheckin, getTrainingPlan];
