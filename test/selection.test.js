import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveSelection } from "../src/lib/notion.ts";

const markdown = [
  "# 회의록",
  "## 결정 사항",
  "- A 진행",
  "- B 보류",
  "## 할 일",
  "- A 진행",
].join("\n");

test("resolveSelection은 정확한 텍스트가 한 곳에만 있으면 그대로 반환한다", () => {
  assert.equal(resolveSelection(markdown, "- B 보류"), "- B 보류");
});

test("resolveSelection은 \"시작...끝\" 형식을 시작부터 첫 번째 끝까지의 원문으로 펼친다", () => {
  assert.equal(
    resolveSelection(markdown, "## 결정 사항...B 보류"),
    "## 결정 사항\n- A 진행\n- B 보류",
  );
});

test("resolveSelection은 일치하는 위치가 없으면 실패한다", () => {
  assert.throws(() => resolveSelection(markdown, "없는 문장"), /not found/);
});

test("resolveSelection은 여러 곳과 일치하면 문맥을 더 요구하며 실패한다", () => {
  assert.throws(
    () => resolveSelection(markdown, "- A 진행"),
    /matches 2 locations/,
  );
});

test("resolveSelection은 시작 뒤에 끝 텍스트가 없으면 실패한다", () => {
  assert.throws(
    () => resolveSelection(markdown, "## 할 일...결정 사항"),
    /end not found/,
  );
});

test("resolveSelection은 시작이나 끝이 비어 있으면 실패한다", () => {
  assert.throws(() => resolveSelection(markdown, "...B 보류"), /non-empty/);
});
