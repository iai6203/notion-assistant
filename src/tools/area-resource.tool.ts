import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getArchive,
  getArchives,
  getArea,
  getAreas,
  getAreaResourceDetail,
  getResource,
  getResources,
  updateAreaResource,
} from "../services/area-resource.service.js";

function createTextResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

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
