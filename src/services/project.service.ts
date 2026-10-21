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

const LIST_PROPERTIES = [
  "이름",
  "상태",
  "시작일",
  "종료일",
  "아카이브",
  "영역 · 자원",
];

function getDataSourceId(): string {
  const dataSourceId = process.env.PROJECT_DATASOURCE_ID;

  if (!dataSourceId) {
    throw new Error("PROJECT_DATASOURCE_ID is not set");
  }

  return dataSourceId;
}

export async function getProjectStatuses(): Promise<string[]> {
  const dataSource = await notion.dataSources.retrieve({
    data_source_id: getDataSourceId(),
  });
  const property = dataSource.properties["상태"];

  if (!property) {
    throw new Error('Project data source is missing the "상태" property');
  }

  if (property.type !== "status") {
    throw new Error(
      'Project data source "상태" property must have type "status"',
    );
  }

  return property.status.options.map(({ name }) => name);
}

export function getProjects({
  titleContains,
  status,
  archived,
  areaResourceId,
  editedAfter,
  sortBy,
  startCursor,
  pageSize,
}: {
  titleContains?: string;
  status?: string;
  archived?: boolean;
  areaResourceId?: string;
  editedAfter?: string;
  sortBy?: QuerySortBy;
  startCursor?: string;
  pageSize?: number;
} = {}) {
  const filter = combineFilters([
    titleContains === undefined
      ? undefined
      : { property: "이름", title: { contains: titleContains } },
    status === undefined
      ? undefined
      : { property: "상태", status: { equals: status } },
    archived === undefined
      ? undefined
      : { property: "아카이브", checkbox: { equals: archived } },
    areaResourceId === undefined
      ? undefined
      : { property: "영역 · 자원", relation: { contains: areaResourceId } },
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

export function getProjectDetail(pageId: string, include?: PageDetailInclude) {
  return getPageDetail(pageId, include);
}

export function createProject({
  title,
  body,
  status,
  startDate,
  endDate,
  archived,
  areaResourceIds,
  noteIds,
}: {
  title: string;
  body?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  archived?: boolean;
  areaResourceIds?: string[];
  noteIds?: string[];
}) {
  return notion.pages.create({
    parent: { data_source_id: getDataSourceId() },
    properties: {
      이름: {
        title: [{ text: { content: title } }],
      },
      ...(status === undefined
        ? {}
        : {
            상태: {
              status: { name: status },
            },
          }),
      ...(startDate === undefined
        ? {}
        : {
            시작일: {
              date: startDate === null ? null : { start: startDate },
            },
          }),
      ...(endDate === undefined
        ? {}
        : {
            종료일: {
              date: endDate === null ? null : { start: endDate },
            },
          }),
      ...(archived === undefined
        ? {}
        : {
            아카이브: { checkbox: archived },
          }),
      ...(areaResourceIds === undefined
        ? {}
        : {
            "영역 · 자원": {
              relation: areaResourceIds.map((id) => ({ id })),
            },
          }),
      ...(noteIds === undefined
        ? {}
        : {
            노트: {
              relation: noteIds.map((id) => ({ id })),
            },
          }),
    },
    ...(body === undefined ? {} : { markdown: body }),
  });
}

export async function updateProject(
  pageId: string,
  updates: {
    title?: string;
    body?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    archived?: boolean;
    areaResourceIds?: string[];
    noteIds?: string[];
  },
) {
  const {
    title,
    body,
    status,
    startDate,
    endDate,
    archived,
    areaResourceIds,
    noteIds,
  } = updates;

  if (
    title === undefined &&
    body === undefined &&
    status === undefined &&
    startDate === undefined &&
    endDate === undefined &&
    archived === undefined &&
    areaResourceIds === undefined &&
    noteIds === undefined
  ) {
    throw new Error("At least one project field must be provided");
  }

  const properties = {
    ...(title === undefined
      ? {}
      : {
          이름: {
            title: [{ text: { content: title } }],
          },
        }),
    ...(status === undefined
      ? {}
      : {
          상태: {
            status: { name: status },
          },
        }),
    ...(startDate === undefined
      ? {}
      : {
          시작일: {
            date: startDate === null ? null : { start: startDate },
          },
        }),
    ...(endDate === undefined
      ? {}
      : {
          종료일: {
            date: endDate === null ? null : { start: endDate },
          },
        }),
    ...(archived === undefined
      ? {}
      : {
          아카이브: { checkbox: archived },
        }),
    ...(areaResourceIds === undefined
      ? {}
      : {
          "영역 · 자원": {
            relation: areaResourceIds.map((id) => ({ id })),
          },
        }),
    ...(noteIds === undefined
      ? {}
      : {
          노트: {
            relation: noteIds.map((id) => ({ id })),
          },
        }),
  };

  const page =
    title === undefined &&
    status === undefined &&
    startDate === undefined &&
    endDate === undefined &&
    archived === undefined &&
    areaResourceIds === undefined &&
    noteIds === undefined
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

export function editProjectBody(
  pageId: string,
  edits: PageBodyEdit[],
  allowDeletingContent?: boolean,
) {
  return editPageBody(pageId, edits, allowDeletingContent);
}

export function deleteProject(pageId: string) {
  return notion.pages.update({ page_id: pageId, in_trash: true });
}
