import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_API_KEY });

export type PageBodyEdit = {
  oldStr: string;
  newStr: string;
  replaceAll?: boolean;
};

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
