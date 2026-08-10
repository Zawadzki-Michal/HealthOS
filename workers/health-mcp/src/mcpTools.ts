import type { Env } from "./types";

export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface McpTool {
  name: string;
  description: string;
  // JSON Schema describing the tool's input, returned verbatim in tools/list.
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, env: Env) => Promise<McpToolResult>;
}

// Single place later issues (log_set, log_calories, get_training_plan, ...)
// register their tool. Empty until those land -- see PLAN.md Phase 2.
export const tools: McpTool[] = [];
