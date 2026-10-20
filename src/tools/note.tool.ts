import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  createNote,
  deleteNote,
  editNoteBody,
  getNoteDetail,
  getNotes,
  updateNote,
} from "../services/note.service.js";

import {
  allowDeletingContentSchema,
  pageBodyEditsSchema,
} from "./page-body-edit.js";
import { createTextResult } from "./tool-result.js";

const relationIdsSchema = z
  .array(z.string())
  .optional()
  .describe("The IDs of related Notion pages.");

export function registerNoteTools(server: McpServer): void {
  server.registerTool(
    "get-notes",
    {
      title: "Get Notes",
      description: "Retrieve notes from the Notion note database.",
      inputSchema: z.object({
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
          .describe("The number of notes to return."),
      }),
    },
    async ({ startCursor, pageSize }) =>
      createTextResult(await getNotes({ startCursor, pageSize })),
  );

  server.registerTool(
    "get-note-detail",
    {
      title: "Get Note Detail",
      description: "Retrieve the properties and Markdown body of a Notion note.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion note page to retrieve."),
      }),
    },
    async ({ pageId }) => createTextResult(await getNoteDetail(pageId)),
  );

  server.registerTool(
    "create-note",
    {
      title: "Create Note",
      description: "Create a note in the Notion note database.",
      inputSchema: z.object({
        title: z.string().describe("The note title."),
        body: z
          .string()
          .optional()
          .describe("The initial note body in Markdown."),
        pinned: z
          .boolean()
          .optional()
          .describe("Whether the note is pinned."),
        areaResourceIds: relationIdsSchema.describe(
          "The IDs of related area-resource pages.",
        ),
        projectIds: relationIdsSchema.describe(
          "The IDs of related project pages.",
        ),
        relatedNoteIds: relationIdsSchema.describe(
          "The IDs of related note pages.",
        ),
      }),
    },
    async ({
      title,
      body,
      pinned,
      areaResourceIds,
      projectIds,
      relatedNoteIds,
    }) =>
      createTextResult(
        await createNote({
          title,
          body,
          pinned,
          areaResourceIds,
          projectIds,
          relatedNoteIds,
        }),
      ),
  );

  server.registerTool(
    "update-note",
    {
      title: "Update Note",
      description: "Update a Notion note's fields or Markdown body.",
      inputSchema: z
        .object({
          pageId: z.string().describe("The ID of the Notion note page to update."),
          title: z.string().optional().describe("The new note title."),
          body: z
            .string()
            .optional()
            .describe("The new note body in Markdown. Replaces the existing body; use edit-note-body for partial edits."),
          pinned: z
            .boolean()
            .optional()
            .describe("Whether the note is pinned."),
          areaResourceIds: relationIdsSchema.describe(
            "The IDs of related area-resource pages. Use an empty array to clear the relation.",
          ),
          projectIds: relationIdsSchema.describe(
            "The IDs of related project pages. Use an empty array to clear the relation.",
          ),
          relatedNoteIds: relationIdsSchema.describe(
            "The IDs of related note pages. Use an empty array to clear the relation.",
          ),
        })
        .refine(
          ({
            title,
            body,
            pinned,
            areaResourceIds,
            projectIds,
            relatedNoteIds,
          }) =>
            title !== undefined ||
            body !== undefined ||
            pinned !== undefined ||
            areaResourceIds !== undefined ||
            projectIds !== undefined ||
            relatedNoteIds !== undefined,
          { message: "At least one note field must be provided." },
        ),
    },
    async ({
      pageId,
      title,
      body,
      pinned,
      areaResourceIds,
      projectIds,
      relatedNoteIds,
    }) =>
      createTextResult(
        await updateNote(pageId, {
          title,
          body,
          pinned,
          areaResourceIds,
          projectIds,
          relatedNoteIds,
        }),
      ),
  );

  server.registerTool(
    "edit-note-body",
    {
      title: "Edit Note Body",
      description:
        "Partially edit a Notion note's Markdown body with search-and-replace. Retrieve the body with get-note-detail first.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion note page to edit."),
        edits: pageBodyEditsSchema,
        allowDeletingContent: allowDeletingContentSchema,
      }),
    },
    async ({ pageId, edits, allowDeletingContent }) =>
      createTextResult(await editNoteBody(pageId, edits, allowDeletingContent)),
  );

  server.registerTool(
    "delete-note",
    {
      title: "Delete Note",
      description: "Delete a Notion note by moving it to trash.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion note page to delete."),
      }),
    },
    async ({ pageId }) => createTextResult(await deleteNote(pageId)),
  );
}
