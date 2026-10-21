import { Client, type QueryDataSourceParameters } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type PageBodyEdit = {
  oldStr: string;
  newStr: string;
  replaceAll?: boolean;
};

export type PageDetailInclude = "all" | "properties" | "body";

export type QueryFilter = NonNullable<QueryDataSourceParameters["filter"]>;

export type QuerySortBy = "lastEditedTime" | "createdTime";

export function combineFilters(
  filters: (QueryFilter | undefined)[],
): QueryFilter | undefined {
  const defined = filters.filter(
    (filter): filter is QueryFilter => filter !== undefined,
  );

  if (defined.length === 0) {
    return undefined;
  }

  return defined.length === 1
    ? defined[0]
    : ({ and: defined } as QueryFilter);
}

export function editedAfterFilter(editedAfter?: string): QueryFilter | undefined {
  return editedAfter === undefined
    ? undefined
    : {
        timestamp: "last_edited_time",
        last_edited_time: { on_or_after: editedAfter },
      };
}

export function timestampSorts(
  sortBy: QuerySortBy = "lastEditedTime",
): QueryDataSourceParameters["sorts"] {
  return [
    {
      timestamp:
        sortBy === "createdTime" ? "created_time" : "last_edited_time",
      direction: "descending",
    },
  ];
}

export async function getPageDetail(
  pageId: string,
  include: PageDetailInclude = "all",
) {
  const [page, content] = await Promise.all([
    include === "body"
      ? undefined
      : notion.pages.retrieve({ page_id: pageId }),
    include === "properties"
      ? undefined
      : notion.pages.retrieveMarkdown({ page_id: pageId }),
  ]);

  return { page, content };
}

export function editPageBody(
  pageId: string,
  edits: PageBodyEdit[],
  allowDeletingContent?: boolean,
) {
  return notion.pages.updateMarkdown({
    page_id: pageId,
    type: "update_content",
    update_content: {
      content_updates: edits.map(({ oldStr, newStr, replaceAll }) => ({
        old_str: oldStr,
        new_str: newStr,
        ...(replaceAll === undefined ? {} : { replace_all_matches: replaceAll }),
      })),
      ...(allowDeletingContent === undefined
        ? {}
        : { allow_deleting_content: allowDeletingContent }),
    },
  });
}

function countOccurrences(text: string, search: string): number {
  let count = 0;

  for (
    let index = text.indexOf(search);
    index !== -1;
    index = text.indexOf(search, index + 1)
  ) {
    count += 1;
  }

  return count;
}

function findUniqueIndex(markdown: string, search: string): number {
  const count = countOccurrences(markdown, search);

  if (count === 0) {
    throw new Error(`Selection not found in page body: ${search}`);
  }

  if (count > 1) {
    throw new Error(
      `Selection matches ${count} locations in page body; include more context: ${search}`,
    );
  }

  return markdown.indexOf(search);
}

/**
 * Resolves a selection to the exact Markdown it covers. A selection is either
 * exact text or "start text...end text", which spans from the start text to the
 * first end text after it.
 */
export function resolveSelection(markdown: string, selection: string): string {
  const separatorIndex = selection.indexOf("...");

  if (separatorIndex === -1) {
    findUniqueIndex(markdown, selection);
    return selection;
  }

  const startText = selection.slice(0, separatorIndex);
  const endText = selection.slice(separatorIndex + 3);

  if (startText === "" || endText === "") {
    throw new Error(
      'Selection must use "start text...end text" with both ends non-empty',
    );
  }

  const startIndex = findUniqueIndex(markdown, startText);
  const endIndex = markdown.indexOf(endText, startIndex + startText.length);

  if (endIndex === -1) {
    throw new Error(`Selection end not found after its start: ${endText}`);
  }

  return markdown.slice(startIndex, endIndex + endText.length);
}

function findUniqueEdgeLines(
  markdown: string,
  edge: "start" | "end",
): string {
  const lines = markdown.split("\n");

  for (let size = 1; size <= lines.length; size += 1) {
    const candidate = (
      edge === "start" ? lines.slice(0, size) : lines.slice(-size)
    ).join("\n");

    if (
      candidate.trim() !== "" &&
      countOccurrences(markdown, candidate) === 1
    ) {
      return candidate;
    }
  }

  return markdown;
}

async function retrieveFullMarkdown(pageId: string): Promise<string> {
  const { markdown, truncated } = await notion.pages.retrieveMarkdown({
    page_id: pageId,
  });

  if (truncated) {
    throw new Error(
      "Page body is too large to edit by selection; use search-and-replace edits instead",
    );
  }

  return markdown;
}

export async function insertPageBody(
  pageId: string,
  content: string,
  { after, position = "end" }: { after?: string; position?: "start" | "end" },
) {
  const markdown = (await retrieveFullMarkdown(pageId)).trim();

  if (markdown === "") {
    return notion.pages.updateMarkdown({
      page_id: pageId,
      type: "replace_content",
      replace_content: { new_str: content },
    });
  }

  if (after !== undefined) {
    const anchor = resolveSelection(markdown, after);
    return editPageBody(pageId, [
      { oldStr: anchor, newStr: `${anchor}\n${content}` },
    ]);
  }

  const anchor = findUniqueEdgeLines(markdown, position);
  return editPageBody(pageId, [
    {
      oldStr: anchor,
      newStr:
        position === "start" ? `${content}\n${anchor}` : `${anchor}\n${content}`,
    },
  ]);
}

export async function replacePageBodyRange(
  pageId: string,
  contentRange: string,
  content: string,
  allowDeletingContent?: boolean,
) {
  const markdown = await retrieveFullMarkdown(pageId);
  const oldStr = resolveSelection(markdown, contentRange);

  return editPageBody(
    pageId,
    [{ oldStr, newStr: content }],
    allowDeletingContent,
  );
}
