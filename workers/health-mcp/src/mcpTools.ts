import type { McpTool } from "./mcpTypes";
import { logCalories } from "./tools/logCalories";
import { logSet } from "./tools/logSet";

export const tools: McpTool[] = [logSet, logCalories];
