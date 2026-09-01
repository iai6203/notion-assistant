import { notion } from "../lib/notion.js";

type AreaResourceStatus = "영역" | "자원" | "아카이브";

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
