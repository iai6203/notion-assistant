import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  getArchive,
  getArchives,
  getArea,
  getAreas,
  getResource,
  getResources,
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
}
