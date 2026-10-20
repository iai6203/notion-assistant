import * as z from "zod/v4";

export const pageBodyEditsSchema = z
  .array(
    z.object({
      oldStr: z
        .string()
        .min(1)
        .describe(
          "The exact Markdown to find in the current body. Copy it verbatim from the detail tool's Markdown and include enough context to match a single location.",
        ),
      newStr: z
        .string()
        .describe(
          "The Markdown that replaces oldStr. To insert content, repeat oldStr and append the new content.",
        ),
      replaceAll: z
        .boolean()
        .optional()
        .describe(
          "Whether to replace every match. When false or omitted, multiple matches fail the edit.",
        ),
    }),
  )
  .min(1)
  .max(100)
  .describe("Search-and-replace edits applied to the Markdown body.");

export const allowDeletingContentSchema = z
  .boolean()
  .optional()
  .describe(
    "Whether edits may delete child pages or databases. Defaults to false.",
  );
