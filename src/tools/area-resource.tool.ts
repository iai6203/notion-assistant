import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { summarizePageList } from "../lib/summary.js";
import {
  createAreaResource,
  editAreaResourceBody,
  getAreaResourceDetail,
  getAreaResources,
  getAreaResourceTemplates,
  updateAreaResource,
} from "../services/area-resource.service.js";

import {
  allowDeletingContentSchema,
  pageBodyEditsSchema,
} from "./page-body-edit.js";
import {
  detailIncludeSchema,
  LIST_RESULT_NOTE,
  pageSizeSchema,
  startCursorSchema,
  titleContainsSchema,
} from "./query-schemas.js";
import {
  createTextResult,
  summarizePageDetail,
  summarizeWrite,
} from "./tool-result.js";

const areaResourceStatusSchema = z.enum(["영역", "자원", "아카이브"]);

const areaResourceTemplateSchema = z.object({
  type: z.literal("template_id"),
  templateId: z.string(),
});

export function registerAreaResourceTools(server: McpServer): void {
  server.registerTool(
    "get-area-resources",
    {
      title: "Get Area Resources",
      description: `Search areas, resources, and archives, which share one Notion database and differ by status. ${LIST_RESULT_NOTE}`,
      inputSchema: z.object({
        status: areaResourceStatusSchema
          .optional()
          .describe("Only return pages with this status: 영역 (area), 자원 (resource), or 아카이브 (archive)."),
        name: z
          .string()
          .optional()
          .describe("Only return pages whose title exactly matches this name."),
        titleContains: titleContainsSchema,
        startCursor: startCursorSchema,
        pageSize: pageSizeSchema("pages"),
      }),
    },
    async (filters) =>
      createTextResult(summarizePageList(await getAreaResources(filters))),
  );

  server.registerTool(
    "get-area-resource-detail",
    {
      title: "Get Area Resource Detail",
      description:
        "Retrieve the properties and Markdown body of an area, resource, or archive Notion page.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion page to retrieve."),
        include: detailIncludeSchema,
      }),
    },
    async ({ pageId, include }) =>
      createTextResult(
        summarizePageDetail(
          pageId,
          await getAreaResourceDetail(pageId, include),
        ),
      ),
  );

  server.registerTool(
    "get-area-resource-templates",
    {
      title: "Get Area Resource Templates",
      description:
        "List templates available in the Notion area-resource database.",
      inputSchema: z.object({
        name: z.string().optional().describe("Filter templates by name."),
        startCursor: startCursorSchema,
        pageSize: pageSizeSchema("templates"),
      }),
    },
    async ({ name, startCursor, pageSize }) => {
      const { templates, next_cursor } = await getAreaResourceTemplates({
        name,
        startCursor,
        pageSize,
      });

      return createTextResult({
        templates: templates.map(({ id, name, is_default }) => ({
          id,
          name,
          ...(is_default ? { isDefault: true } : {}),
        })),
        ...(next_cursor === null ? {} : { nextCursor: next_cursor }),
      });
    },
  );

  server.registerTool(
    "create-area-resource",
    {
      title: "Create Area Resource",
      description:
        "Create an area, resource, or archive in the Notion area-resource database.",
      inputSchema: z
        .object({
          title: z.string().describe("The page title."),
          status: areaResourceStatusSchema.describe(
            "The area-resource status.",
          ),
          body: z
            .string()
            .optional()
            .describe("The initial page body in Markdown."),
          template: areaResourceTemplateSchema.describe(
            "The required database template to apply to the new page.",
          ),
        })
        .refine(
          ({ body, template }) =>
            body === undefined || template === undefined,
          { message: "Body and template cannot be provided together" },
        ),
    },
    async ({ title, status, body, template }) =>
      createTextResult(
        summarizeWrite(
          await createAreaResource({ title, status, body, template }),
        ),
      ),
  );

  server.registerTool(
    "update-area-resource",
    {
      title: "Update Area Resource",
      description:
        "Update the title, status, or Markdown body of an area, resource, or archive Notion page.",
      inputSchema: z
        .object({
          pageId: z.string().describe("The ID of the Notion page to update."),
          title: z.string().optional().describe("The new page title."),
          status: areaResourceStatusSchema
            .optional()
            .describe("The new area-resource status."),
          body: z
            .string()
            .optional()
            .describe("The new page body in Markdown. Replaces the existing body; use edit-area-resource-body for partial edits."),
        })
        .refine(
          ({ title, status, body }) =>
            title !== undefined || status !== undefined || body !== undefined,
          { message: "At least one of title, status, or body is required." },
        ),
    },
    async ({ pageId, title, status, body }) => {
      await updateAreaResource(pageId, { title, status, body });
      return createTextResult({ id: pageId });
    },
  );

  server.registerTool(
    "edit-area-resource-body",
    {
      title: "Edit Area Resource Body",
      description:
        "Partially edit the Markdown body of an area, resource, or archive Notion page with search-and-replace. Retrieve the body with get-area-resource-detail first.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion page to edit."),
        edits: pageBodyEditsSchema,
        allowDeletingContent: allowDeletingContentSchema,
      }),
    },
    async ({ pageId, edits, allowDeletingContent }) => {
      await editAreaResourceBody(pageId, edits, allowDeletingContent);
      return createTextResult({ id: pageId });
    },
  );
}
