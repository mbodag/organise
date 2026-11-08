// A memory store made of Markdown files in a directory, optionally synced
// to a git remote so the files outlive the server and can be edited by hand.
import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface SearchHit {
  path: string;
  title: string;
  score: number;
  snippet: string;
}

export interface StoreOptions {
  root: string;
  gitRemote?: string; // e.g. https://<token>@github.com/you/memory.git
  gitBranch?: string;
  pullIntervalMs?: number;
}

export class MemoryStore {
  readonly root: string;
  private opts: StoreOptions;
  private lastPull = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(opts: StoreOptions) {
    this.opts = opts;
    this.root = path.resolve(opts.root);
  }

  // ---------- setup & git ----------

  async init(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    if (!this.opts.gitRemote) return;
    const isRepo = await exists(path.join(this.root, ".git"));
    if (!isRepo) {
      const entries = await fs.readdir(this.root);
      if (entries.length > 0) {
        throw new Error(`MEMORY_DIR ${this.root} is not empty and not a git repo`);
      }
      await this.git("clone", "--branch", this.branch, this.opts.gitRemote, ".");
    } else {
      await this.pull(true);
    }
  }

  private get branch() {
    return this.opts.gitBranch ?? "main";
  }

  private async git(...args: string[]) {
    return run("git", args, { cwd: this.root, maxBuffer: 10 * 1024 * 1024 });
  }

  /** Pull remote edits (made in GitHub, Obsidian, ...), at most once per interval. */
  private async pull(force = false) {
    if (!this.opts.gitRemote) return;
    const interval = this.opts.pullIntervalMs ?? 30_000;
    if (!force && Date.now() - this.lastPull < interval) return;
    this.lastPull = Date.now();
    try {
      await this.git("pull", "--rebase", "--autostash", "origin", this.branch);
    } catch (err) {
      console.error("[memory] git pull failed:", (err as Error).message);
    }
  }

  private async commit(message: string) {
    if (!this.opts.gitRemote) return;
    await this.git("add", "-A");
    const { stdout } = await this.git("status", "--porcelain");
    if (!stdout.trim()) return;
    await this.git("commit", "-m", message);
    try {
      await this.git("push", "origin", this.branch);
    } catch {
      await this.pull(true);
      await this.git("push", "origin", this.branch);
    }
  }

  /** Run writes one at a time so git never sees overlapping changes. */
  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }

  // ---------- paths ----------

  /** Resolve a user-supplied relative path, refusing anything outside the root. */
  resolve(rel: string): string {
    const clean = rel.replace(/^\/+/, "");
    const abs = path.resolve(this.root, clean);
    if (abs !== this.root && !abs.startsWith(this.root + path.sep)) {
      throw new Error(`Path escapes memory root: ${rel}`);
    }
    if (abs.split(path.sep).includes(".git")) throw new Error("The .git folder is off limits");
    return abs;
  }

  private rel(abs: string) {
    return path.relative(this.root, abs).split(path.sep).join("/");
  }

  private requireMarkdown(rel: string) {
    if (!rel.endsWith(".md")) throw new Error(`Memory files must end in .md: ${rel}`);
  }

  // ---------- operations ----------

  async list(dir = "", recursive = false): Promise<string[]> {
    await this.pull();
    const base = this.resolve(dir);
    const out: string[] = [];
    const walk = async (d: string, depth: number) => {
      const entries = await fs.readdir(d, { withFileTypes: true });
      for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.name.startsWith(".")) continue;
        const abs = path.join(d, e.name);
        if (e.isDirectory()) {
          out.push(this.rel(abs) + "/");
          if (recursive) await walk(abs, depth + 1);
        } else if (e.name.endsWith(".md")) {
          out.push(this.rel(abs));
        }
      }
    };
    await walk(base, 0);
    return out;
  }

  async read(rel: string): Promise<string> {
    await this.pull();
    return fs.readFile(this.resolve(rel), "utf8");
  }

  async write(rel: string, content: string, overwrite: boolean): Promise<string> {
    this.requireMarkdown(rel);
    return this.serialize(async () => {
      await this.pull(true);
      const abs = this.resolve(rel);
      if (!overwrite && (await exists(abs))) {
        throw new Error(`${rel} already exists. Read it and use overwrite=true or memory_append.`);
      }
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, ensureNewline(content), "utf8");
      await this.commit(`memory: write ${rel}`);
      return rel;
    });
  }

  async append(rel: string, content: string): Promise<string> {
    this.requireMarkdown(rel);
    return this.serialize(async () => {
      await this.pull(true);
      const abs = this.resolve(rel);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      const prev = (await exists(abs)) ? await fs.readFile(abs, "utf8") : "";
      const sep = prev && !prev.endsWith("\n") ? "\n" : "";
      await fs.writeFile(abs, prev + sep + ensureNewline(content), "utf8");
      await this.commit(`memory: append ${rel}`);
      return rel;
    });
  }

  async move(from: string, to: string): Promise<string> {
    this.requireMarkdown(to);
    return this.serialize(async () => {
      await this.pull(true);
      const src = this.resolve(from);
      const dst = this.resolve(to);
      if (await exists(dst)) throw new Error(`${to} already exists`);
      await fs.mkdir(path.dirname(dst), { recursive: true });
      await fs.rename(src, dst);
      await this.commit(`memory: move ${from} -> ${to}`);
      return to;
    });
  }

  async remove(rel: string): Promise<void> {
    return this.serialize(async () => {
      await this.pull(true);
      await fs.unlink(this.resolve(rel));
      await this.commit(`memory: delete ${rel}`);
    });
  }

  /**
   * Keyword search. Matches in the file path and in title/tags weigh more
   * than matches in the body. Swap this for embeddings later without
   * changing the tool interface.
   */
  async search(query: string, limit = 10): Promise<SearchHit[]> {
    await this.pull();
    const terms = tokenize(query);
    if (terms.length === 0) return [];
    const files = (await this.list("", true)).filter((f) => f.endsWith(".md"));
    const hits: SearchHit[] = [];

    for (const file of files) {
      const text = await fs.readFile(this.resolve(file), "utf8");
      const { meta, body } = splitFrontmatter(text);
      const title = meta.title ?? firstHeading(body) ?? file;
      const pathText = file.toLowerCase();
      const metaText = `${title} ${meta.tags ?? ""} ${meta.aliases ?? ""}`.toLowerCase();
      const bodyText = body.toLowerCase();

      let score = 0;
      let matched = 0;
      for (const t of terms) {
        const inPath = pathText.includes(t) ? 3 : 0;
        const inMeta = metaText.includes(t) ? 2 : 0;
        const inBody = Math.min(count(bodyText, t), 5) * 0.5;
        if (inPath || inMeta || inBody) matched++;
        score += inPath + inMeta + inBody;
      }
      if (score === 0) continue;
      score *= matched / terms.length; // favour files that match every term
      hits.push({ path: file, title, score: round(score), snippet: snippet(body, terms) });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

// ---------- helpers ----------

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function ensureNewline(s: string) {
  return s.endsWith("\n") ? s : s + "\n";
}

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "my", "me", "what", "about"]);

function tokenize(q: string) {
  return [...new Set(q.toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter((t) => t.length > 1 && !STOP.has(t)))];
}

function count(hay: string, needle: string) {
  let n = 0;
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function splitFrontmatter(text: string): { meta: Record<string, string>; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return { meta, body: text.slice(m[0].length) };
}

function firstHeading(body: string) {
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function snippet(body: string, terms: string[]) {
  const lines = body.split("\n").filter((l) => l.trim());
  const has = (l: string) => terms.some((t) => l.toLowerCase().includes(t));
  const hit = lines.find((l) => !l.startsWith("#") && has(l)) ?? lines.find(has);
  const line = (hit ?? lines[0] ?? "").trim();
  return line.length > 200 ? line.slice(0, 197) + "..." : line;
}
