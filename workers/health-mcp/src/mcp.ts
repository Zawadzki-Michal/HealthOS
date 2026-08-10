import type { Env } from "./types";
import { tools } from "./mcpTools";

// MCP Streamable HTTP transport (single JSON-RPC message per POST, no
// batching -- batching was dropped from the spec). No tools are registered
// yet; this handles the protocol handshake so later issues just push onto
// `tools` in mcpTools.ts.
const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "health-mcp", version: "0.1.0" };

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string };
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.jsonrpc === "2.0" && typeof v.method === "string";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Dispatches one already-validated JSON-RPC message. Returns null for
// notifications (no response is sent back, per spec) and a JSON-RPC
// response object for requests.
async function dispatch(message: JsonRpcRequest, env: Env): Promise<JsonRpcResponse | null> {
  const isNotification = !("id" in message) || message.id === undefined;
  const id: JsonRpcId = message.id ?? null;

  switch (message.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      };

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        },
      };

    case "tools/call": {
      const name = message.params?.name;
      if (typeof name !== "string") {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: INVALID_PARAMS, message: "params.name must be a string" },
        };
      }
      const tool = tools.find((t) => t.name === name);
      if (!tool) {
        return { jsonrpc: "2.0", id, error: { code: INVALID_PARAMS, message: `Unknown tool: ${name}` } };
      }
      const args = (message.params?.arguments as Record<string, unknown> | undefined) ?? {};
      try {
        const result = await tool.handler(args, env);
        return { jsonrpc: "2.0", id, result };
      } catch (error) {
        const text = error instanceof Error ? error.message : "Tool execution failed";
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError: true } };
      }
    }

    default:
      if (isNotification) return null; // unknown notifications are ignored, per spec
      return {
        jsonrpc: "2.0",
        id,
        error: { code: METHOD_NOT_FOUND, message: `Method not found: ${message.method}` },
      };
  }
}

export async function handleMcp(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!env.MCP_AUTH_TOKEN || authHeader !== `Bearer ${env.MCP_AUTH_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method !== "POST") {
    // Server-initiated streaming (GET) and explicit session termination
    // (DELETE) aren't implemented -- this server only does request/response.
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { jsonrpc: "2.0", id: null, error: { code: PARSE_ERROR, message: "Invalid JSON" } },
      400,
    );
  }

  if (Array.isArray(body)) {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: INVALID_REQUEST, message: "Batched JSON-RPC requests are not supported" },
      },
      400,
    );
  }

  if (!isJsonRpcRequest(body)) {
    return jsonResponse(
      { jsonrpc: "2.0", id: null, error: { code: INVALID_REQUEST, message: "Invalid JSON-RPC request" } },
      400,
    );
  }

  const response = await dispatch(body, env);
  if (response === null) {
    // Notification: per spec, no body is sent back.
    return new Response(null, { status: 202 });
  }
  return jsonResponse(response);
}
