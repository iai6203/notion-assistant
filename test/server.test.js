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
        "get-area-resource-detail",
        "get-area-resource-templates",
        "create-area-resource",
        "update-area-resource",
      ],
    );

    const createTool = tools.find(
      ({ name }) => name === "create-area-resource",
    );
    assert.ok(createTool);
    assert.ok(createTool.inputSchema.required.includes("template"));
    assert.equal(
      createTool.inputSchema.properties.template.properties.type.const,
      "template_id",
    );

    const invalidCreateResult = await client.callTool({
      name: "create-area-resource",
      arguments: {
        title: "Invalid create",
        status: "영역",
        body: "",
        template: { type: "template_id", templateId: "template-id" },
      },
    });
    assert.equal(invalidCreateResult.isError, true);
    assert.match(
      invalidCreateResult.content[0].text,
      /Body and template cannot be provided together/,
    );

    const result = await client.callTool({ name: "get-server-info" });
    assert.deepEqual(result.structuredContent, {
      name: "notion-assistant",
      version: "0.0.2",
      status: "ok",
    });
  } finally {
    await client.close();
  }
});
