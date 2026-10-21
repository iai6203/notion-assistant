import {
  combineFilters,
  editedAfterFilter,
  editPageBody,
  getPageDetail,
  notion,
  timestampSorts,
  type PageBodyEdit,
  type PageDetailInclude,
  type QuerySortBy,
} from "../lib/notion.js";

const LIST_PROPERTIES = ["이름", "고정하기", "영역 · 자원", "프로젝트"];

function getDataSourceId(): string {
  const dataSourceId = process.env.NOTE_DATASOURCE_ID;

  if (!dataSourceId) {
    throw new Error("NOTE_DATASOURCE_ID is not set");
  }

  return dataSourceId;
}

export function getNotes({
  titleContains,
  pinned,
  areaResourceId,
  projectId,
  editedAfter,
  sortBy,
  startCursor,
  pageSize,
}: {
  titleContains?: string;
  pinned?: boolean;
  areaResourceId?: string;
  projectId?: string;
  editedAfter?: string;
  sortBy?: QuerySortBy;
  startCursor?: string;
  pageSize?: number;
} = {}) {
  const filter = combineFilters([
    titleContains === undefined
      ? undefined
      : { property: "이름", title: { contains: titleContains } },
    pinned === undefined
      ? undefined
      : { property: "고정하기", checkbox: { equals: pinned } },
    areaResourceId === undefined
      ? undefined
      : { property: "영역 · 자원", relation: { contains: areaResourceId } },
    projectId === undefined
      ? undefined
      : { property: "프로젝트", relation: { contains: projectId } },
    editedAfterFilter(editedAfter),
  ]);

  return notion.dataSources.query({
    data_source_id: getDataSourceId(),
    filter_properties: LIST_PROPERTIES,
    result_type: "page",
    sorts: timestampSorts(sortBy),
    ...(filter === undefined ? {} : { filter }),
    ...(startCursor === undefined ? {} : { start_cursor: startCursor }),
    ...(pageSize === undefined ? {} : { page_size: pageSize }),
  });
}

export function getNoteDetail(pageId: string, include?: PageDetailInclude) {
  return getPageDetail(pageId, include);
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