import { editPageBody, notion, type PageBodyEdit } from "../lib/notion.js";

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

export async function getProjectDetail(pageId: string) {
  const [page, content] = await Promise.all([
    notion.pages.retrieve({ page_id: pageId }),
    notion.pages.retrieveMarkdown({ page_id: pageId }),
  ]);

  return { page, content };
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
