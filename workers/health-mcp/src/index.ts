import type { Env } from "./types";
import { handleMcp } from "./mcp";
import { handleWebhook } from "./webhook";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/webhook/health-auto-export") {
      return handleWebhook(request, env);
    }

    if (url.pathname === "/mcp") {
      return handleMcp(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
