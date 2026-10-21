import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { insertPageBody, replacePageBodyRange } from "../lib/notion.js";

import { allowDeletingContentSchema } from "./page-body-edit.js";
import { createTextResult } from "./tool-result.js";

const SELECTION_FORMAT =
  'Use exact text, or "start text...end text" to select from the start text through the first end text after it. The start text must match a single location.';

export function registerPageBodyTools(server: McpServer): void {
  server.registerTool(
    "insert-page-body",
    {
      title: "Insert Page Body",
      description:
        "Insert Markdown into the body of a note, project, area, resource, or archive Notion page without resending existing content. Appends to the end by default.",
      inputSchema: z
        .object({
          pageId: z.string().describe("The ID of the Notion page to edit."),
          content: z.string().min(1).describe("The Markdown to insert."),
          position: z
            .enum(["start", "end"])
            .optional()
            .describe("Where to insert when after is omitted. Defaults to end."),
          after: z
            .string()
            .min(1)
            .optional()
            .describe(
              `Existing content to insert after. ${SELECTION_FORMAT}`,
            ),
        })
        .refine(
          ({ position, after }) =>
            position === undefined || after === undefined,
          { message: "Position and after cannot be provided together." },
        ),
    },
    async ({ pageId, content, position, after }) => {
      await insertPageBody(pageId, content, { position, after });
      return createTextResult({ id: pageId });
    },
  );

  server.registerTool(
    "replace-page-body-range",
    {
      title: "Replace Page Body Range",
      description:
        "Replace a range of the Markdown body of a note, project, area, resource, or archive Notion page, selected by its start and end text, without copying the whole range.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion page to edit."),
        contentRange: z
          .string()
          .min(1)
          .describe(`The existing content to replace. ${SELECTION_FORMAT}`),
        content: z
          .string()
          .describe("The Markdown that replaces the selected range."),
        allowDeletingContent: allowDeletingContentSchema,
      }),
    },
    async ({ pageId, contentRange, content, allowDeletingContent }) => {
      await replacePageBodyRange(
        pageId,
        contentRange,
        content,
        allowDeletingContent,
      );
      return createTextResult({ id: pageId });
    },
  );
}
