import type { GetPageResponse } from "@notionhq/client";

import { summarizePage } from "../lib/summary.js";

export function createTextResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

type PageMarkdown = {
  markdown: string;
  truncated: boolean;
  unknown_block_ids: string[];
};

export function summarizePageDetail(
  pageId: string,
  { page, content }: { page?: GetPageResponse; content?: PageMarkdown },
) {
  return {
    id: pageId,
    ...(page === undefined ? {} : summarizePage(page)),
    ...(content === undefined
      ? {}
      : {
          markdown: content.markdown,
          ...(content.truncated ? { truncated: true } : {}),
          ...(content.unknown_block_ids.length === 0
            ? {}
            : { unknownBlockIds: content.unknown_block_ids }),
        }),
  };
}

export function summarizeWrite(page: { id: string; url?: string }) {
  return { id: page.id, ...(page.url === undefined ? {} : { url: page.url }) };
}
