import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { summarizeCommentList } from "../lib/summary.js";
import { getComments } from "../services/comment.service.js";

import { createTextResult } from "./tool-result.js";

export function registerCommentTools(server: McpServer): void {
  server.registerTool(
    "get-comments",
    {
      title: "Get Comments",
      description:
        "Retrieve unresolved comments on a Notion page or block, such as a note, project, or area-resource page.",
      inputSchema: z.object({
        blockId: z
          .string()
          .describe("The ID of the Notion page or block to retrieve comments from."),
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
          .describe("The number of comments to return."),
      }),
    },
    async ({ blockId, startCursor, pageSize }) =>
      createTextResult(
        summarizeCommentList(
          await getComments({ blockId, startCursor, pageSize }),
        ),
      ),
  );
}
