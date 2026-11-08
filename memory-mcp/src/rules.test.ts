import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { MemoryStore } from "./store.js";
import { buildInstructions, buildServer } from "./server.js";

async function connect(store: MemoryStore) {
  const server = buildServer(store, await buildInstructions(store));
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(a), client.connect(b)]);
  const instructions = client.getInstructions() ?? "";
  await client.close();
  return instructions;
}

async function tempStore() {
  const root = await mkdtemp(path.join(tmpdir(), "memory-test-"));
  const store = new MemoryStore({ root });
  await store.init();
  return { root, store };
}

test("rules files are sent in the instructions; README is not", async () => {
  const { root, store } = await tempStore();
  try {
    await mkdir(path.join(root, "rules"));
    await writeFile(path.join(root, "rules/git.md"), "---\ntitle: Git\n---\n- Never push to main.\n");
    await writeFile(path.join(root, "rules/projects.md"), "- Every commit is atomic.\n");
    await writeFile(path.join(root, "rules/README.md"), "This folder holds rules.\n");

    const instructions = await connect(store);
    assert.match(instructions, /The user's standing rules/);
    assert.match(instructions, /### rules\/git\.md\n- Never push to main\./);
    assert.match(instructions, /Every commit is atomic/);
    assert.doesNotMatch(instructions, /This folder holds rules/);
    assert.doesNotMatch(instructions, /title: Git/); // frontmatter stripped
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("editing a rule changes the next connection's instructions", async () => {
  const { root, store } = await tempStore();
  try {
    await mkdir(path.join(root, "rules"));
    await writeFile(path.join(root, "rules/tools.md"), "- Jira is for work.\n");
    assert.match(await connect(store), /Jira is for work/);

    await store.write("rules/tools.md", "- Jira is for personal purposes only.\n", true);
    const next = await connect(store);
    assert.match(next, /Jira is for personal purposes only/);
    assert.doesNotMatch(next, /Jira is for work/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("no rules folder: base instructions only", async () => {
  const { root, store } = await tempStore();
  try {
    const instructions = await connect(store);
    assert.match(instructions, /Personal memory/);
    assert.doesNotMatch(instructions, /The user's standing rules/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rules over the size limit are truncated with a note", async () => {
  const { root, store } = await tempStore();
  try {
    await mkdir(path.join(root, "rules"));
    await writeFile(path.join(root, "rules/a.md"), "- " + "a".repeat(5000) + "\n");
    await writeFile(path.join(root, "rules/b.md"), "- " + "b".repeat(5000) + "\n");
    const rules = await store.readRules();
    assert.equal(rules.truncated, true);
    assert.deepEqual(rules.files, ["rules/a.md"]);
    assert.match(await connect(store), /left out because of the size limit/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
