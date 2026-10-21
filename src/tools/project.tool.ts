import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { summarizePageList } from "../lib/summary.js";
import {
  createProject,
  deleteProject,
  editProjectBody,
  getProjectDetail,
  getProjects,
  getProjectStatuses,
  updateProject,
} from "../services/project.service.js";

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

const projectStatusSchema = z
  .string()
  .optional()
  .describe(
    "The project status. Available values are discoverable with get-project-statuses.",
  );

const startDateSchema = z
  .string()
  .nullable()
  .optional()
  .describe(
    "The project start date. Omit to leave it unchanged or unset; use null to clear it.",
  );

const endDateSchema = z
  .string()
  .nullable()
  .optional()
  .describe(
    "The project end date. Omit to leave it unchanged or unset; use null to clear it.",
  );

const relationIdsSchema = z
  .array(z.string())
  .optional()
  .describe("The IDs of related Notion pages.");

export function registerProjectTools(server: McpServer): void {
  server.registerTool(
    "get-project-statuses",
    {
      title: "Get Project Statuses",
      description:
        "Retrieve the available project statuses from the Notion project database.",
      inputSchema: z.object({}),
    },
    async () => createTextResult(await getProjectStatuses()),
  );

  server.registerTool(
    "get-projects",
    {
      title: "Get Projects",
      description: `Search projects in the Notion project database, newest first. ${LIST_RESULT_NOTE}`,
      inputSchema: z.object({
        titleContains: titleContainsSchema,
        status: z
          .string()
          .optional()
          .describe(
            "Only return projects with this status. Available values are discoverable with get-project-statuses.",
          ),
        archived: z
          .boolean()
          .optional()
          .describe("Only return projects with this archived state."),
        areaResourceId: z
          .string()
          .optional()
          .describe("Only return projects related to this area-resource page."),
        editedAfter: editedAfterSchema,
        sortBy: sortBySchema,
        startCursor: startCursorSchema,
        pageSize: pageSizeSchema("projects"),
      }),
    },
    async (filters) =>
      createTextResult(summarizePageList(await getProjects(filters))),
  );

  server.registerTool(
    "get-project-detail",
    {
      title: "Get Project Detail",
      description:
        "Retrieve the properties and Markdown body of a Notion project.",
      inputSchema: z.object({
        pageId: z
          .string()
          .describe("The ID of the Notion project page to retrieve."),
        include: detailIncludeSchema,
      }),
    },
    async ({ pageId, include }) =>
      createTextResult(
        summarizePageDetail(pageId, await getProjectDetail(pageId, include)),
      ),
  );

  server.registerTool(
    "create-project",
    {
      title: "Create Project",
      description: "Create a project in the Notion project database.",
      inputSchema: z.object({
        title: z.string().describe("The project title."),
        body: z
          .string()
          .optional()
          .describe("The initial project body in Markdown."),
        status: projectStatusSchema,
        startDate: startDateSchema,
        endDate: endDateSchema,
        archived: z
          .boolean()
          .optional()
          .describe("Whether the project is archived."),
        areaResourceIds: relationIdsSchema.describe(
          "The IDs of related area-resource pages.",
        ),
        noteIds: relationIdsSchema.describe("The IDs of related note pages."),
      }),
    },
    async ({
      title,
      body,
      status,
      startDate,
      endDate,
      archived,
      areaResourceIds,
      noteIds,
    }) => {
      const page = await createProject({
        title,
        body,
        status,
        startDate,
        endDate,
        archived,
        areaResourceIds,
        noteIds,
      });
      return createTextResult(summarizeWrite(page));
    },
  );

  server.registerTool(
    "update-project",
    {
      title: "Update Project",
      description: "Update a Notion project's fields or Markdown body.",
      inputSchema: z
        .object({
          pageId: z
            .string()
            .describe("The ID of the Notion project page to update."),
          title: z.string().optional().describe("The new project title."),
          body: z
            .string()
            .optional()
            .describe(
              "The new project body in Markdown. Replaces the existing body; use edit-project-body for partial edits.",
            ),
          status: projectStatusSchema,
          startDate: startDateSchema,
          endDate: endDateSchema,
          archived: z
            .boolean()
            .optional()
            .describe("Whether the project is archived."),
          areaResourceIds: relationIdsSchema.describe(
            "The IDs of related area-resource pages. Use an empty array to clear the relation.",
          ),
          noteIds: relationIdsSchema.describe(
            "The IDs of related note pages. Use an empty array to clear the relation.",
          ),
        })
        .refine(
          ({
            title,
            body,
            status,
            startDate,
            endDate,
            archived,
            areaResourceIds,
            noteIds,
          }) =>
            title !== undefined ||
            body !== undefined ||
            status !== undefined ||
            startDate !== undefined ||
            endDate !== undefined ||
            archived !== undefined ||
            areaResourceIds !== undefined ||
            noteIds !== undefined,
          { message: "At least one project field must be provided." },
        ),
    },
    async ({
      pageId,
      title,
      body,
      status,
      startDate,
      endDate,
      archived,
      areaResourceIds,
      noteIds,
    }) => {
      await updateProject(pageId, {
        title,
        body,
        status,
        startDate,
        endDate,
        archived,
        areaResourceIds,
        noteIds,
      });
      return createTextResult({ id: pageId });
    },
  );

  server.registerTool(
    "edit-project-body",
    {
      title: "Edit Project Body",
      description:
        "Partially edit a Notion project's Markdown body with search-and-replace. Retrieve the body with get-project-detail first.",
      inputSchema: z.object({
        pageId: z.string().describe("The ID of the Notion project page to edit."),
        edits: pageBodyEditsSchema,
        allowDeletingContent: allowDeletingContentSchema,
      }),
    },
    async ({ pageId, edits, allowDeletingContent }) => {
      await editProjectBody(pageId, edits, allowDeletingContent);
      return createTextResult({ id: pageId });
    },
  );

  server.registerTool(
    "delete-project",
    {
      title: "Delete Project",
      description: "Delete a Notion project by moving it to trash.",
      inputSchema: z.object({
        pageId: z
          .string()
          .describe("The ID of the Notion project page to delete."),
      }),
    },
    async ({ pageId }) => {
      await deleteProject(pageId);
      return createTextResult({ id: pageId, inTrash: true });
    },
  );
}
