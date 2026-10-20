import { editPageBody, notion, type PageBodyEdit } from "../lib/notion.js";

function getDataSourceId(): string {
  const dataSourceId = process.env.NOTE_DATASOURCE_ID;

  if (!dataSourceId) {
    throw new Error("NOTE_DATASOURCE_ID is not set");
  }

  return dataSourceId;
}

export function getNotes({
  startCursor,
  pageSize,
}: {
  startCursor?: string;
  pageSize?: number;
} = {}) {
  return notion.dataSources.query({
    data_source_id: getDataSourceId(),
    ...(startCursor === undefined ? {} : { start_cursor: startCursor }),
    ...(pageSize === undefined ? {} : { page_size: pageSize }),
  });
}

export async function getNoteDetail(pageId: string) {
  const [page, content] = await Promise.all([
    notion.pages.retrieve({ page_id: pageId }),
    notion.pages.retrieveMarkdown({ page_id: pageId }),
  ]);

  return { page, content };
}

export function createNote({
  title,
  body,
  pinned,
  areaResourceIds,
  projectIds,
  relatedNoteIds,
}: {
  title: string;
  body?: string;
  pinned?: boolean;
  areaResourceIds?: string[];
  projectIds?: string[];
  relatedNoteIds?: string[];
}) {
  return notion.pages.create({
    parent: { data_source_id: getDataSourceId() },
    properties: {
      이름: {
        title: [{ text: { content: title } }],
      },
      ...(pinned === undefined
        ? {}
        : {
            고정하기: { checkbox: pinned },
          }),
      ...(areaResourceIds === undefined
        ? {}
        : {
            "영역 · 자원": {
              relation: areaResourceIds.map((id) => ({ id })),
            },
          }),
      ...(projectIds === undefined
        ? {}
        : {
            프로젝트: {
              relation: projectIds.map((id) => ({ id })),
            },
          }),
      ...(relatedNoteIds === undefined
        ? {}
        : {
            "연결된 노트": {
              relation: relatedNoteIds.map((id) => ({ id })),
            },
          }),
    },
    ...(body === undefined ? {} : { markdown: body }),
  });
}

export async function updateNote(
  pageId: string,
  updates: {
    title?: string;
    body?: string;
    pinned?: boolean;
    areaResourceIds?: string[];
    projectIds?: string[];
    relatedNoteIds?: string[];
  },
) {
  const {
    title,
    body,
    pinned,
    areaResourceIds,
    projectIds,
    relatedNoteIds,
  } = updates;

  if (
    title === undefined &&
    body === undefined &&
    pinned === undefined &&
    areaResourceIds === undefined &&
    projectIds === undefined &&
    relatedNoteIds === undefined
  ) {
    throw new Error("At least one note field must be provided");
  }

  const properties = {
    ...(title === undefined
      ? {}
      : {
          이름: {
            title: [{ text: { content: title } }],
          },
        }),
    ...(pinned === undefined
      ? {}
      : {
          고정하기: { checkbox: pinned },
        }),
    ...(areaResourceIds === undefined
      ? {}
      : {
          "영역 · 자원": {
            relation: areaResourceIds.map((id) => ({ id })),
          },
        }),
    ...(projectIds === undefined
      ? {}
      : {
          프로젝트: {
            relation: projectIds.map((id) => ({ id })),
          },
        }),
    ...(relatedNoteIds === undefined
      ? {}
      : {
          "연결된 노트": {
            relation: relatedNoteIds.map((id) => ({ id })),
          },
        }),
  };

  const page =
    title === undefined &&
    pinned === undefined &&
    areaResourceIds === undefined &&
    projectIds === undefined &&
    relatedNoteIds === undefined
      ? undefined
      : await notion.pages.update({ page_id: pageId, properties });

  const content =
    body === undefined
      ? undefined
      : await notion.pages.updateMarkdown({
          page_id: pageId,
          type: "replace_content",
          replace_content: {
            new_str: body,
            allow_deleting_content: true,
          },
        });

  return { page, content };
}

export function editNoteBody(
  pageId: string,
  edits: PageBodyEdit[],
  allowDeletingContent?: boolean,
) {
  return editPageBody(pageId, edits, allowDeletingContent);
}

export function deleteNote(pageId: string) {
  return notion.pages.update({ page_id: pageId, in_trash: true });
}