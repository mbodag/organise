// The MCP tools Claude sees. Keep these stable: the storage behind them can change.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MemoryStore } from "./store.js";

const BASE_INSTRUCTIONS = `Personal memory: a folder of Markdown files about the user's life.
Before answering questions about the user, people, projects or past decisions, call memory_search.
Before creating a file, search for an existing one to update instead.
Start with INDEX.md to learn how the memory is organized, and follow its conventions.

Standing rules live in rules/ (one file per topic, e.g. rules/git.md, rules/projects.md).
When the user states a new standing rule ("from now on...", "always...", "every project..."),
save it to the right rules/ file with memory_append (or read, then memory_write to edit one),
and confirm in one line. The rules below are loaded at the start of each conversation.`;

/** Server instructions: the base text plus the user's current rules/ files. */
export async function buildInstructions(store: MemoryStore): Promise<string> {
  let rules;
  try {
    rules = await store.readRules();
  } catch (err) {
    console.error("[memory] could not read rules:", (err as Error).message);
    return BASE_INSTRUCTIONS;
  }
  if (!rules.text) return BASE_INSTRUCTIONS;
  const note = rules.truncated
    ? "\n\n(Some rules files were left out because of the size limit: use memory_list on rules/ and read the rest.)"
    : "";
  return `${BASE_INSTRUCTIONS}\n\n## The user's standing rules (follow them)\n\n${rules.text}${note}`;
}

export function buildServer(store: MemoryStore, instructions: string = BASE_INSTRUCTIONS): McpServer {
  const server = new McpServer({ name: "personal-memory", version: "0.1.0" }, { instructions });

  const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
  const safe =
    <A>(fn: (args: A) => Promise<ReturnType<typeof text>>) =>
    async (args: A) => {
      try {
        return await fn(args);
      } catch (err) {
        return { ...text(`Error: ${(err as Error).message}`), isError: true };
      }
    };

  server.registerTool(
    "memory_search",
    {
      title: "Search memory",
      description:
        "Keyword search across all memory files (paths, titles, tags and bodies). Returns the best matching files with a snippet. Use several short keyword queries rather than one long sentence.",
      inputSchema: {
        query: z.string().describe("Keywords, e.g. 'dentist appointment' or 'sarah birthday'"),
        limit: z.number().int().min(1).max(50).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ query, limit }) => {
      const hits = await store.search(query, limit ?? 10);
      if (hits.length === 0) return text(`No matches for "${query}".`);
      return text(hits.map((h) => `- ${h.path} (score ${h.score}) — ${h.title}\n  ${h.snippet}`).join("\n"));
    }),
  );

  server.registerTool(
    "memory_list",
    {
      title: "List memory files",
      description: "List folders and Markdown files. Folders end in '/'.",
      inputSchema: {
        dir: z.string().optional().describe("Folder relative to the memory root; empty for the root"),
        recursive: z.boolean().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ dir, recursive }) => {
      const items = await store.list(dir ?? "", recursive ?? false);
      return text(items.length ? items.join("\n") : "(empty)");
    }),
  );

  server.registerTool(
    "memory_read",
    {
      title: "Read a memory file",
      description: "Read the full contents of one memory file.",
      inputSchema: { path: z.string().describe("e.g. people/sarah-chen.md") },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ path }) => text(await store.read(path))),
  );

  server.registerTool(
    "memory_write",
    {
      title: "Create or replace a memory file",
      description:
        "Create a Markdown file, or replace one when overwrite=true. Read a file before overwriting it so nothing is lost. Prefer memory_append for adding facts to an existing file.",
      inputSchema: {
        path: z.string().describe("Relative path ending in .md, lowercase-kebab-case, e.g. projects/house-move.md"),
        content: z.string(),
        overwrite: z.boolean().optional(),
      },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    safe(async ({ path, content, overwrite }) => text(`Saved ${await store.write(path, content, overwrite ?? false)}`)),
  );

  server.registerTool(
    "memory_append",
    {
      title: "Append to a memory file",
      description: "Append text to the end of a file, creating it if missing. Good for logs, journals and adding facts.",
      inputSchema: { path: z.string(), content: z.string() },
    },
    safe(async ({ path, content }) => text(`Appended to ${await store.append(path, content)}`)),
  );

  server.registerTool(
    "memory_move",
    {
      title: "Move or rename a memory file",
      description: "Move or rename a file, for example to file something out of inbox.md's folder.",
      inputSchema: { from: z.string(), to: z.string() },
      annotations: { destructiveHint: true },
    },
    safe(async ({ from, to }) => text(`Moved to ${await store.move(from, to)}`)),
  );

  server.registerTool(
    "memory_delete",
    {
      title: "Delete a memory file",
      description: "Delete a file. Only do this when the user asks; history stays in git when sync is on.",
      inputSchema: { path: z.string() },
      annotations: { destructiveHint: true },
    },
    safe(async ({ path }) => {
      await store.remove(path);
      return text(`Deleted ${path}`);
    }),
  );

  return server;
}
