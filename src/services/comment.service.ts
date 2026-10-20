import { notion } from "../lib/notion.js";

export function getComments({
  blockId,
  startCursor,
  pageSize,
}: {
  blockId: string;
  startCursor?: string;
  pageSize?: number;
}) {
  return notion.comments.list({
    block_id: blockId,
    ...(startCursor === undefined ? {} : { start_cursor: startCursor }),
    ...(pageSize === undefined ? {} : { page_size: pageSize }),
  });
}
