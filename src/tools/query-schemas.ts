import * as z from "zod/v4";

export const startCursorSchema = z
  .string()
  .optional()
  .describe("The pagination cursor returned as nextCursor by a previous request.");

export function pageSizeSchema(itemName: string) {
  return z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe(`The number of ${itemName} to return.`);
}

export const titleContainsSchema = z
  .string()
  .optional()
  .describe("Only return pages whose title contains this text.");

export const editedAfterSchema = z
  .string()
  .optional()
  .describe(
    "Only return pages edited on or after this ISO 8601 date or date-time.",
  );

export const sortBySchema = z
  .enum(["lastEditedTime", "createdTime"])
  .optional()
  .describe("Sort newest first by this timestamp. Defaults to lastEditedTime.");

export const detailIncludeSchema = z
  .enum(["all", "properties", "body"])
  .optional()
  .describe(
    "Which parts to return. Use properties to skip the Markdown body, or body to skip properties. Defaults to all.",
  );

export const LIST_RESULT_NOTE =
  "Returns compact results with id, title, lastEditedTime, and non-empty properties.";
