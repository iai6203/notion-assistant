import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const serverPath = fileURLToPath(new URL("../build/index.js", import.meta.url));

test("exposes server information over MCP stdio", async () => {
  const client = new Client(
    { name: "notion-assistant-test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } },
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
  });

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map(({ name }) => name),
      [
        "get-server-info",
        "get-areas",
        "get-area",
        "get-resources",
        "get-resource",
        "get-archives",
        "get-archive",
      ],
    );

    const result = await client.callTool({ name: "get-server-info" });
    assert.deepEqual(result.structuredContent, {
      name: "notion-assistant",
      version: "0.1.0",
      status: "ok",
    });
  } finally {
    await client.close();
  }
});
