import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { registerAreaResourceTools } from "./tools/area-resource.tool.js";
import { registerNoteTools } from "./tools/note.tool.js";
import { registerProjectTools } from "./tools/project.tool.js";

const SERVER_NAME = "notion-assistant";
const SERVER_VERSION = "0.0.4";

const serverInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  status: z.literal("ok"),
});

type ServerInfo = z.infer<typeof serverInfoSchema>;

function buildServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "get-server-info",
    {
      title: "Get Server Info",
      description: "Return the MCP server name, version, and status",
      inputSchema: z.object({}),
      outputSchema: serverInfoSchema,
    },
    async () => {
      const info: ServerInfo = {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        status: "ok",
      };

      return {
        content: [
          {
            type: "text",
            text: `${info.name} ${info.version} is ${info.status}`,
          },
        ],
        structuredContent: info,
      };
    },
  );

  registerAreaResourceTools(server);
  registerNoteTools(server);
  registerProjectTools(server);

  return server;
}

serveStdio(buildServer, {
  onerror: (error) => {
    console.error(`${SERVER_NAME} MCP server error:`, error);
  },
});

console.error(`${SERVER_NAME} MCP server running on stdio`);
