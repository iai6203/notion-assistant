import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  createAreaResource,
  getArchive,
  getArchives,
  getArea,
  getAreas,
  getAreaResourceDetail,
  getAreaResourceTemplates,
  getResource,
  getResources,
  updateAreaResource,
} from "../services/area-resource.service.js";

import { createTextResult } from "./tool-result.js";

const areaResourceTemplateSchema = z.object({
  type: z.literal("template_id"),
  templateId: z.string(),
});

export function registerAreaResourceTools(server: McpServer): void {
  server.registerTool(
    "get-areas",
    {
      title: "Get Areas",
      description: "Retrieve all areas from the Notion area-resource database.",
      inputSchema: z.object({}),
    },
    async () => createTextResult(await getAreas()),
  );

  server.registerTool(
    "get-area",
    {
      title: "Get Area",
      description: "Retrieve an area by its exact name from the Notion area-resource database.",
      inputSchema: z.object({
        name: z.string().describe("The exact name of the area to retrieve."),
      }),
    },
    async ({ name }) => createTextResult(await getArea(name)),
  );

  server.registerTool(
    "get-resources",
    {
      title: "Get Resources",
      description: "Retrieve all resources from the Notion area-resource database.",
      inputSchema: z.object({}),
    },
    async () => createTextResult(await getResources()),
  );

  server.registerTool(
    "get-resource",
    {
      title: "Get Resource",
      description: "Retrieve a resource by its exact name from the Notion area-resource database.",
      inputSchema: z.object({
        name: z.string().describe("The exact name of the resource to retrieve."),
      }),
    },
    async ({ name }) => createTextResult(await getResource(name)),
  );

  server.registerTool(
    "get-archives",
    {
      title: "Get Archives",
      description: "Retrieve all archives from the Notion area-resource database.",
      inputSchema: z.object({}),
    },
    async () => createTextResult(await getArchives()),
  );

  server.registerTool(
    "get-archive",
    {
      title: "Get Archive",
      description: "Retrieve an archive by its exact name from the Notion area-resource database.",
      inputSchema: z.object({
        name: z.string().describe("The exact name of the archive to retrieve."),
      }),
    },
    async ({ name }) => createTextResult(await getArchive(name)),
  );

  server.registerTool(
    "get-area-resource-detail",
    {
      title: "Get Area Resource Detail",
      description:
        "Retrieve the properties and Markdown body of an area, resource, or archive Notion page.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion page to retrieve."),
      }),
    },
    async ({ pageId }) =>
      createTextResult(await getAreaResourceDetail(pageId)),
  );

  server.registerTool(
    "get-area-resource-templates",
    {
      title: "Get Area Resource Templates",
      description:
        "List templates available in the Notion area-resource database.",
      inputSchema: z.object({
        name: z.string().optional().describe("Filter templates by name."),
        startCursor: z
          .string()
          .optional()
          .describe("The pagination cursor returned by a previous request."),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("The number of templates to return."),
      }),
    },
    async ({ name, startCursor, pageSize }) =>
      createTextResult(
        await getAreaResourceTemplates({ name, startCursor, pageSize }),
      ),
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
          status: z
            .enum(["영역", "자원", "아카이브"])
            .describe("The area-resource status."),
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
        await createAreaResource({ title, status, body, template }),
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
          status: z
            .enum(["영역", "자원", "아카이브"])
            .optional()
            .describe("The new area-resource status."),
          body: z
            .string()
            .optional()
            .describe("The new page body in Markdown. Replaces the existing body."),
        })
        .refine(
          ({ title, status, body }) =>
            title !== undefined || status !== undefined || body !== undefined,
          { message: "At least one of title, status, or body is required." },
        ),
    },
    async ({ pageId, title, status, body }) =>
      createTextResult(
        await updateAreaResource(pageId, { title, status, body }),
      ),
  );
}
