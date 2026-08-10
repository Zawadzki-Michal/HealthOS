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

export function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}
