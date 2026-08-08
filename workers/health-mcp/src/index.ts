import type { Env } from "./types";
import { handleWebhook } from "./webhook";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/webhook/health-auto-export") {
      return handleWebhook(request, env);
    }

    if (url.pathname === "/mcp") {
      // Full MCP tool coverage (log_set, log_calories, get_training_plan, ...)
      // is Phase 2 scope -- see PLAN.md. Stubbed for now.
      return new Response("MCP server not implemented yet", { status: 501 });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
