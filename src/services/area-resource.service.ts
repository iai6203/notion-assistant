import { notion } from "../lib/notion.js";

export type AreaResourceStatus = "영역" | "자원" | "아카이브";

function getDataSourceId(): string {
  const dataSourceId = process.env.AREA_RESOURCE_DATASOURCE_ID;

  if (!dataSourceId) {
    throw new Error("AREA_RESOURCE_DATASOURCE_ID is not set");
  }

  return dataSourceId;
}

function queryByStatus(status: AreaResourceStatus) {
  return notion.dataSources.query({
    data_source_id: getDataSourceId(),
    filter: {
      property: "상태",
      status: { equals: status },
    },
  });
}

function queryByName(name: string, status: AreaResourceStatus) {
  return notion.dataSources.query({
    data_source_id: getDataSourceId(),
    filter: {
      and: [
        {
          property: "상태",
          status: { equals: status },
        },
        {
          property: "이름",
          title: { equals: name },
        },
      ],
    },
  });
}

export async function getAreaResourceDetail(pageId: string) {
  const [page, content] = await Promise.all([
    notion.pages.retrieve({ page_id: pageId }),
    notion.pages.retrieveMarkdown({ page_id: pageId }),
  ]);

  return { page, content };
}

export async function updateAreaResource(
  pageId: string,
  updates: {
    title?: string;
    status?: AreaResourceStatus;
    body?: string;
  },
) {
  const { title, status, body } = updates;

  if (title === undefined && status === undefined && body === undefined) {
    throw new Error("At least one area-resource field must be provided");
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
  };

  const page =
    title === undefined && status === undefined
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

export function getAreas() {
  return queryByStatus("영역");
}

export function getArea(name: string) {
  return queryByName(name, "영역");
}

export function getResources() {
  return queryByStatus("자원");
}

export function getResource(name: string) {
  return queryByName(name, "자원");
}

export function getArchives() {
  return queryByStatus("아카이브");
}

export function getArchive(name: string) {
  return queryByName(name, "아카이브");
}
