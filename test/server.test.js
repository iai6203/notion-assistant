import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const serverPath = fileURLToPath(new URL("../build/index.js", import.meta.url));

function getTool(tools, name) {
  const tool = tools.find((candidate) => candidate.name === name);
  assert.ok(tool, `${name} should be registered`);
  return tool;
}

function assertRequired(schema, property) {
  assert.ok(schema.required.includes(property), `${property} should be required`);
}

function assertOptionalStringArray(schema, property) {
  assert.equal("minItems" in schema.properties[property], false);
  assert.equal(schema.properties[property].type, "array");
  assert.equal(schema.properties[property].items.type, "string");
  assert.equal(schema.required?.includes(property) ?? false, false);
}

function assertNullableString(schema) {
  const types = schema.anyOf
    ? schema.anyOf.map(({ type }) => type)
    : Array.isArray(schema.type)
      ? schema.type
      : [schema.type];
  assert.deepEqual(types.sort(), ["null", "string"]);
}

async function assertValidationError(client, name, arguments_, message) {
  const result = await client.callTool({ name, arguments: arguments_ });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, message);
  assert.doesNotMatch(result.content[0].text, /DATASOURCE_ID is not set/);
}

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
        "edit-area-resource-body",
        "get-notes",
        "get-note-detail",
        "create-note",
        "update-note",
        "edit-note-body",
        "delete-note",
        "get-project-statuses",
        "get-projects",
        "get-project-detail",
        "create-project",
        "update-project",
        "edit-project-body",
        "delete-project",
        "get-comments",
      ],
    );

    const createTool = getTool(tools, "create-area-resource");
    assert.ok(createTool.inputSchema.required.includes("template"));
    assert.equal(
      createTool.inputSchema.properties.template.properties.type.const,
      "template_id",
    );

    const getNotesSchema = getTool(tools, "get-notes").inputSchema;
    const getProjectsSchema = getTool(tools, "get-projects").inputSchema;
    const getCommentsSchema = getTool(tools, "get-comments").inputSchema;
    assertRequired(getCommentsSchema, "blockId");
    for (const schema of [getNotesSchema, getProjectsSchema, getCommentsSchema]) {
      assert.equal(schema.properties.pageSize.type, "integer");
      assert.equal(schema.properties.pageSize.minimum, 1);
      assert.equal(schema.properties.pageSize.maximum, 100);
    }

    const createNoteSchema = getTool(tools, "create-note").inputSchema;
    const updateNoteSchema = getTool(tools, "update-note").inputSchema;
    const createProjectSchema = getTool(tools, "create-project").inputSchema;
    const updateProjectSchema = getTool(tools, "update-project").inputSchema;

    assertRequired(createNoteSchema, "title");
    assertRequired(createProjectSchema, "title");

    for (const name of ["get-note-detail", "update-note", "delete-note"]) {
      assertRequired(getTool(tools, name).inputSchema, "pageId");
    }
    for (const name of [
      "get-project-detail",
      "update-project",
      "delete-project",
    ]) {
      assertRequired(getTool(tools, name).inputSchema, "pageId");
    }

    for (const property of [
      "areaResourceIds",
      "projectIds",
      "relatedNoteIds",
    ]) {
      assertOptionalStringArray(createNoteSchema, property);
      assertOptionalStringArray(updateNoteSchema, property);
    }
    for (const property of ["areaResourceIds", "noteIds"]) {
      assertOptionalStringArray(createProjectSchema, property);
      assertOptionalStringArray(updateProjectSchema, property);
    }

    for (const schema of [createProjectSchema, updateProjectSchema]) {
      assert.equal(schema.properties.status.type, "string");
      assert.equal("enum" in schema.properties.status, false);
      assertNullableString(schema.properties.startDate);
      assertNullableString(schema.properties.endDate);
    }

    for (const name of [
      "edit-note-body",
      "edit-project-body",
      "edit-area-resource-body",
    ]) {
      const schema = getTool(tools, name).inputSchema;
      assertRequired(schema, "pageId");
      assertRequired(schema, "edits");
      assert.equal(schema.properties.edits.minItems, 1);
      assert.equal(schema.properties.edits.maxItems, 100);
      assert.deepEqual(schema.properties.edits.items.required.sort(), [
        "newStr",
        "oldStr",
      ]);
      assert.equal(schema.properties.edits.items.properties.oldStr.minLength, 1);
      assert.equal(schema.properties.allowDeletingContent.type, "boolean");
      assert.equal(schema.required.includes("allowDeletingContent"), false);
    }

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

    await assertValidationError(
      client,
      "update-note",
      { pageId: "note-page-id" },
      /At least one note field must be provided\./,
    );
    await assertValidationError(
      client,
      "update-project",
      { pageId: "project-page-id" },
      /At least one project field must be provided\./,
    );

    await assertValidationError(
      client,
      "edit-note-body",
      { pageId: "note-page-id", edits: [] },
      />=1/,
    );
    await assertValidationError(
      client,
      "edit-note-body",
      { pageId: "note-page-id", edits: [{ oldStr: "", newStr: "x" }] },
      />=1/,
    );

    for (const name of ["get-notes", "get-projects", "get-comments"]) {
      await assertValidationError(
        client,
        name,
        { blockId: "page-id", pageSize: 0 },
        />=1/,
      );
      await assertValidationError(
        client,
        name,
        { blockId: "page-id", pageSize: 101 },
        /<=100/,
      );
    }

    const result = await client.callTool({ name: "get-server-info" });
    assert.deepEqual(result.structuredContent, {
      name: "notion-assistant",
      version: "0.0.4",
      status: "ok",
    });
  } finally {
    await client.close();
  }
});
