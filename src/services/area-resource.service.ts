import {
  combineFilters,
  editPageBody,
  getPageDetail,
  notion,
  timestampSorts,
  type PageBodyEdit,
  type PageDetailInclude,
} from "../lib/notion.js";

const LIST_PROPERTIES = ["이름", "상태"];

export type AreaResourceStatus = "영역" | "자원" | "아카이브";

export type AreaResourceTemplate = {
  type: "template_id";
  templateId: string;
};

function getDataSourceId(): string {
  const dataSourceId = process.env.AREA_RESOURCE_DATASOURCE_ID;

  if (!dataSourceId) {
    throw new Error("AREA_RESOURCE_DATASOURCE_ID is not set");
  }

  return dataSourceId;
}

export function getAreaResources({
  status,
  name,
  titleContains,
  startCursor,
  pageSize,
}: {
  status?: AreaResourceStatus;
  name?: string;
  titleContains?: string;
  startCursor?: string;
  pageSize?: number;
} = {}) {
  const filter = combineFilters([
    status === undefined
      ? undefined
      : { property: "상태", status: { equals: status } },
    name === undefined
      ? undefined
      : { property: "이름", title: { equals: name } },
    titleContains === undefined
      ? undefined
      : { property: "이름", title: { contains: titleContains } },
  ]);

  return notion.dataSources.query({
    data_source_id: getDataSourceId(),
    filter_properties: LIST_PROPERTIES,
    result_type: "page",
    sorts: timestampSorts(),
    ...(filter === undefined ? {} : { filter }),
    ...(startCursor === undefined ? {} : { start_cursor: startCursor }),
    ...(pageSize === undefined ? {} : { page_size: pageSize }),
  });
}

export function getAreaResourceTemplates({
  name,
  startCursor,
  pageSize,
}: {
  name?: string;
  startCursor?: string;
  pageSize?: number;
} = {}) {
  return notion.dataSources.listTemplates({
    data_source_id: getDataSourceId(),
    ...(name === undefined ? {} : { name }),
    ...(startCursor === undefined ? {} : { start_cursor: startCursor }),
    ...(pageSize === undefined ? {} : { page_size: pageSize }),
  });
}

export function getAreaResourceDetail(
  pageId: string,
  include?: PageDetailInclude,
) {
  return getPageDetail(pageId, include);
}

export function createAreaResource({
  title,
  status,
  body,
  template,
}: {
  title: string;
  status: AreaResourceStatus;
  body?: string;
  template?: AreaResourceTemplate;
}) {
  if (body !== undefined && template !== undefined) {
    throw new Error("Body and template cannot be provided together");
  }

  return notion.pages.create({
    parent: { data_source_id: getDataSourceId() },
    properties: {
      이름: {
        title: [{ text: { content: title } }],
      },
      상태: {
        status: { name: status },
      },
    },
    ...(body === undefined ? {} : { markdown: body }),
    ...(template === undefined
      ? {}
      : {
          template: {
            type: "template_id" as const,
            template_id: template.templateId,
          },
        }),
  });
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

export function editAreaResourceBody(
  pageId: string,
  edits: PageBodyEdit[],
  allowDeletingContent?: boolean,
) {
  return editPageBody(pageId, edits, allowDeletingContent);
}
