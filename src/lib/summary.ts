import {
  isFullPage,
  type ListCommentsResponse,
  type PageObjectResponse,
  type QueryDataSourceResponse,
  type RichTextItemResponse,
} from "@notionhq/client";

type PropertyValue = PageObjectResponse["properties"][string];

function toPlainText(items: RichTextItemResponse[]): string {
  return items.map(({ plain_text }) => plain_text).join("");
}

function summarizeDate(
  date: { start: string; end: string | null } | null,
): unknown {
  if (date === null) {
    return null;
  }

  return date.end === null ? date.start : { start: date.start, end: date.end };
}

function summarizePropertyValue(value: PropertyValue): unknown {
  switch (value.type) {
    case "title":
      return toPlainText(value.title);
    case "rich_text":
      return toPlainText(value.rich_text);
    case "status":
      return value.status?.name ?? null;
    case "select":
      return value.select?.name ?? null;
    case "multi_select":
      return value.multi_select.map(({ name }) => name);
    case "checkbox":
      return value.checkbox;
    case "number":
      return value.number;
    case "url":
      return value.url;
    case "email":
      return value.email;
    case "phone_number":
      return value.phone_number;
    case "date":
      return summarizeDate(value.date);
    case "relation":
      return value.relation.map(({ id }) => id);
    case "people":
      return value.people.map((person) =>
        "name" in person && person.name ? person.name : person.id,
      );
    case "created_time":
      return value.created_time;
    case "last_edited_time":
      return value.last_edited_time;
    case "unique_id":
      return value.unique_id.prefix === null
        ? value.unique_id.number
        : `${value.unique_id.prefix}-${value.unique_id.number}`;
    case "formula": {
      const { formula } = value;
      switch (formula.type) {
        case "string":
          return formula.string;
        case "number":
          return formula.number;
        case "boolean":
          return formula.boolean;
        case "date":
          return summarizeDate(formula.date);
        default:
          return undefined;
      }
    }
    case "rollup": {
      const { rollup } = value;
      switch (rollup.type) {
        case "number":
          return rollup.number;
        case "date":
          return summarizeDate(rollup.date);
        default:
          return undefined;
      }
    }
    default:
      return undefined;
  }
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Reduces a Notion page object to its ID, title, last edited time, and
 * non-empty property values in plain form.
 */
export function summarizePage(page: QueryDataSourceResponse["results"][number]) {
  if (!isFullPage(page)) {
    return { id: page.id };
  }

  let title = "";
  const properties: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(page.properties)) {
    if (value.type === "title") {
      title = toPlainText(value.title);
      continue;
    }

    const summary = summarizePropertyValue(value);

    if (!isEmptyValue(summary)) {
      properties[name] = summary;
    }
  }

  return {
    id: page.id,
    title,
    lastEditedTime: page.last_edited_time,
    ...(Object.keys(properties).length === 0 ? {} : { properties }),
  };
}

export function summarizePageList({
  results,
  next_cursor,
}: Pick<QueryDataSourceResponse, "results" | "next_cursor">) {
  return {
    results: results.map(summarizePage),
    ...(next_cursor === null ? {} : { nextCursor: next_cursor }),
  };
}

export function summarizeCommentList({
  results,
  next_cursor,
}: ListCommentsResponse) {
  return {
    results: results.map((comment) => ({
      id: comment.id,
      discussionId: comment.discussion_id,
      author: comment.display_name.resolved_name ?? comment.created_by.id,
      createdTime: comment.created_time,
      text: toPlainText(comment.rich_text),
    })),
    ...(next_cursor === null ? {} : { nextCursor: next_cursor }),
  };
}
