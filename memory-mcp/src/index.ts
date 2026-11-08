// Entry point. Two modes:
//   HTTP  (default): a remote MCP server for a claude.ai custom connector.
//   stdio (--stdio): a local server, for running from a Claude Code plugin on a laptop.
import express, { type Request, type Response, type NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MemoryStore } from "./store.js";
import { buildInstructions, buildServer } from "./server.js";

const env = process.env;

const store = new MemoryStore({
  root: env.MEMORY_DIR ?? "./memory-data",
  gitRemote: env.GIT_REMOTE || undefined,
  gitBranch: env.GIT_BRANCH || undefined,
});

async function main() {
  await store.init();

  if (process.argv.includes("--stdio")) {
    await buildServer(store, await buildInstructions(store)).connect(new StdioServerTransport());
    console.error(`[memory] stdio server ready, root=${store.root}`);
    return;
  }

  const token = env.MCP_AUTH_TOKEN;
  if (!token && env.ALLOW_NO_AUTH !== "1") {
    throw new Error("Set MCP_AUTH_TOKEN (or ALLOW_NO_AUTH=1 for local testing only)");
  }

  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Auth: either a secret path segment (/mcp/<token>, which works with a
  // claude.ai custom connector) or an "Authorization: Bearer <token>" header.
  const auth = (req: Request, res: Response, next: NextFunction) => {
    if (!token) return next();
    const header = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const fromPath = req.params.token;
    const supplied = (typeof fromPath === "string" ? fromPath : undefined) ?? header ?? "";
    if (safeEqual(supplied, token)) return next();
    console.log(`[memory] ${req.method} rejected 401 (bad or missing token)`);
    res.status(401).json({ error: "unauthorized" });
  };

  // Stateless: a fresh server + transport per request. Simple, and fine for one user.
  // Instructions only travel in the initialize response, so the rules files
  // are read only for that request: edits show up on the next connection.
  const handle = async (req: Request, res: Response) => {
    const messages = Array.isArray(req.body) ? req.body : [req.body];
    const initializing = messages.some((m) => m?.method === "initialize");
    logRequest(req, res, messages);
    const server = buildServer(store, initializing ? await buildInstructions(store) : undefined);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[memory] request failed:", err);
      if (!res.headersSent) res.status(500).json({ error: "internal error" });
    }
  };

  app.all("/mcp", auth, handle);
  app.all("/mcp/:token", auth, handle);

  const port = Number(env.PORT ?? 8787);
  app.listen(port, () => console.log(`[memory] http server on :${port}, root=${store.root}`));
}

/**
 * One line per MCP request: which methods (and tool names) a client called,
 * the status and how long it took. Never logs arguments, results or the token,
 * so the log is safe to read and share.
 */
function logRequest(req: Request, res: Response, messages: unknown[]) {
  const started = Date.now();
  const calls = messages
    .map((m) => {
      const msg = m as { method?: string; params?: { name?: string } } | undefined;
      if (!msg?.method) return undefined;
      return msg.method === "tools/call" && msg.params?.name ? `tools/call:${msg.params.name}` : msg.method;
    })
    .filter(Boolean)
    .join(",");
  res.on("finish", () => {
    console.log(`[memory] ${req.method} ${calls || "-"} ${res.statusCode} ${Date.now() - started}ms`);
  });
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
