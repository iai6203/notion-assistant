import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  createProject,
  deleteProject,
  getProjectDetail,
  getProjects,
  getProjectStatuses,
  updateProject,
} from "../services/project.service.js";

import { createTextResult } from "./tool-result.js";

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
      description: "Retrieve projects from the Notion project database.",
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
          .describe("The number of projects to return."),
      }),
    },
    async ({ startCursor, pageSize }) =>
      createTextResult(await getProjects({ startCursor, pageSize })),
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
      }),
    },
    async ({ pageId }) => createTextResult(await getProjectDetail(pageId)),
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
    }) =>
      createTextResult(
        await createProject({
          title,
          body,
          status,
          startDate,
          endDate,
          archived,
          areaResourceIds,
          noteIds,
        }),
      ),
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
              "The new project body in Markdown. Replaces the existing body.",
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
    }) =>
      createTextResult(
        await updateProject(pageId, {
          title,
          body,
          status,
          startDate,
          endDate,
          archived,
          areaResourceIds,
          noteIds,
        }),
      ),
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
    async ({ pageId }) => createTextResult(await deleteProject(pageId)),
  );
}
