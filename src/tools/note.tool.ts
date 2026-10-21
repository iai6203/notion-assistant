import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { summarizePageList } from "../lib/summary.js";
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
import {
  detailIncludeSchema,
  editedAfterSchema,
  LIST_RESULT_NOTE,
  pageSizeSchema,
  sortBySchema,
  startCursorSchema,
  titleContainsSchema,
} from "./query-schemas.js";
import {
  createTextResult,
  summarizePageDetail,
  summarizeWrite,
} from "./tool-result.js";

const relationIdsSchema = z
  .array(z.string())
  .optional()
  .describe("The IDs of related Notion pages.");

export function registerNoteTools(server: McpServer): void {
  server.registerTool(
    "get-notes",
    {
      title: "Get Notes",
      description: `Search notes in the Notion note database, newest first. ${LIST_RESULT_NOTE}`,
      inputSchema: z.object({
        titleContains: titleContainsSchema,
        pinned: z
          .boolean()
          .optional()
          .describe("Only return notes with this pinned state."),
        areaResourceId: z
          .string()
          .optional()
          .describe("Only return notes related to this area-resource page."),
        projectId: z
          .string()
          .optional()
          .describe("Only return notes related to this project page."),
        editedAfter: editedAfterSchema,
        sortBy: sortBySchema,
        startCursor: startCursorSchema,
        pageSize: pageSizeSchema("notes"),
      }),
    },
    async (filters) =>
      createTextResult(summarizePageList(await getNotes(filters))),
  );

  server.registerTool(
    "get-note-detail",
    {
      title: "Get Note Detail",
      description: "Retrieve the properties and Markdown body of a Notion note.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion note page to retrieve."),
        include: detailIncludeSchema,
      }),
    },
    async ({ pageId, include }) =>
      createTextResult(
        summarizePageDetail(pageId, await getNoteDetail(pageId, include)),
      ),
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
    }) => {
      const page = await createNote({
        title,
        body,
        pinned,
        areaResourceIds,
        projectIds,
        relatedNoteIds,
      });
      return createTextResult(summarizeWrite(page));
    },
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
    }) => {
      await updateNote(pageId, {
        title,
        body,
        pinned,
        areaResourceIds,
        projectIds,
        relatedNoteIds,
      });
      return createTextResult({ id: pageId });
    },
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
    async ({ pageId, edits, allowDeletingContent }) => {
      await editNoteBody(pageId, edits, allowDeletingContent);
      return createTextResult({ id: pageId });
    },
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
    async ({ pageId }) => {
      await deleteNote(pageId);
      return createTextResult({ id: pageId, inTrash: true });
    },
  );
}
