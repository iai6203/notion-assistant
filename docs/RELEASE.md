# 릴리스

새 버전은 다음 순서로 릴리스합니다.

1. `/bump` 스킬로 버전을 올립니다.
2. 버전 변경을 커밋하고 `main` 브랜치에 푸시합니다.
3. `/new-tag` 스킬로 주석 태그를 만들고 원격 저장소에 푸시합니다.
4. 태그 푸시를 계기로 `Release` 워크플로가 실행되어 GitHub Release가 자동으로 생성됩니다.

```text
/bump <increment> → 커밋 · main 푸시 → /new-tag → 태그 푸시 → Release 워크플로 → GitHub Release
```

두 스킬 모두 `disable-model-invocation: true`가 설정되어 있어 Claude가 알아서 실행하지 않습니다. Claude Code에서 직접 `/bump`, `/new-tag`를 입력해야 실행됩니다.

## 1. 버전 올리기: `/bump`

```text
/bump patch
```

인자는 `major`, `minor`, `patch` 중 하나만 받습니다. 인자가 없거나 그 밖의 값이면 파일을 바꾸지 않고 `Usage: /bump [major|minor|patch]`를 출력합니다.

스킬은 다음 다섯 곳의 버전을 함께 관리합니다.

| 위치 | 값 |
| --- | --- |
| `package.json` | `version` |
| `package-lock.json` | 최상위 `version` |
| `package-lock.json` | `packages[""].version` |
| `src/index.ts` | `SERVER_VERSION` |
| `test/server.test.js` | 서버 버전 검증 값 |

진행 순서는 다음과 같습니다.

1. 다섯 곳의 현재 버전이 모두 같은지 확인합니다. 하나라도 다르면 아무것도 바꾸지 않고 불일치를 보고합니다.
2. `npm version <increment> --no-git-tag-version`으로 `package.json`과 `package-lock.json`을 갱신합니다. 커밋과 태그는 만들지 않습니다.
3. 새 버전을 `src/index.ts`의 `SERVER_VERSION`과 `test/server.test.js`에 반영합니다.
4. `npm test`를 실행하고, 다섯 곳의 버전이 새 버전과 같은지 확인한 뒤 이전 버전, 새 버전, 테스트 결과를 보고합니다.

의존성 버전, 테스트 클라이언트의 `1.0.0` 식별 값, `build/` 결과물은 바꾸지 않습니다.

## 2. 커밋하고 푸시하기

`/bump`는 커밋을 만들지 않으므로 변경된 네 개 파일을 직접 커밋합니다. 이전 릴리스와 같은 메시지를 사용합니다.

```bash
git add package.json package-lock.json src/index.ts test/server.test.js
git commit -m "chore(release): 버전 업데이트"
git push origin main
```

릴리스는 `main` 브랜치에 반영된 커밋에서 만듭니다. 작업 브랜치에서 버전을 올렸다면 먼저 `main`에 병합한 뒤 `main`에서 다음 단계를 진행합니다.

## 3. 태그 만들고 푸시하기: `/new-tag`

```text
/new-tag
```

`package.json`의 `version`을 읽어 `v{version}` 형식의 태그 이름을 정합니다. 예를 들어 버전이 `0.1.1`이면 태그 이름은 `v0.1.1`입니다.

태그를 만들기 전에 다음 조건을 모두 확인합니다. 하나라도 충족하지 않으면 태그를 만들지 않고 중단합니다.

- 작업 트리가 깨끗합니다. 2단계의 커밋을 먼저 끝내야 하는 이유입니다.
- `origin` 원격 저장소가 있습니다.
- 같은 이름의 로컬 태그가 없습니다.
- 같은 이름의 원격 태그가 없습니다.

조건을 통과하면 다음 순서로 진행합니다.

1. `HEAD`에서 도달할 수 있는 가장 최근 `v*` 태그 이후의 커밋과 diff를 조사합니다. 이전 태그가 없으면 전체 기록을 조사합니다.
2. 실제 변경 사항만으로 한국어 CHANGELOG 형식의 태그 본문을 작성합니다. 첫 줄은 태그 이름이고, 그 아래에는 `## Added`, `## Changed`, `## Fixed`, `## Removed`, `## Documentation`, `## CI` 중 해당하는 섹션만 둡니다.
3. 작성한 본문을 보여주고 `git tag -a`로 현재 `HEAD`에 주석 태그를 만듭니다.
4. 푸시하기 전에 `이 태그를 origin에 푸시할까요?`라고 묻습니다. 승인하면 `git push origin "refs/tags/v{version}"`으로 해당 태그 하나만 푸시합니다. 거절하면 로컬 태그만 남기고 끝냅니다.
5. 푸시 후 원격 태그가 생겼는지 확인하고 결과를 보고합니다.

태그 본문은 다음과 같은 모양이 됩니다.

```text
v0.1.1

## Added

- 페이지 댓글을 조회하는 도구를 추가했습니다.

## Fixed

- ...
```

이 본문의 셋째 줄부터가 그대로 GitHub Release 노트가 되므로, 푸시를 승인하기 전에 내용을 꼼꼼히 확인합니다.

거절해서 로컬에만 남은 태그는 나중에 직접 푸시할 수 있습니다.

```bash
git push origin refs/tags/v0.1.1
```

## 4. 자동 릴리스: `Release` 워크플로

`.github/workflows/release.yml`은 `v*` 형식의 태그가 푸시되면 실행됩니다. 브랜치 푸시만으로는 실행되지 않습니다.

| 단계 | 내용 |
| --- | --- |
| Checkout, Node.js 24 설정, `npm ci` | 빌드 환경을 준비합니다. |
| Verify tag matches package version | 태그 이름이 `v` + `package.json`의 `version`과 다르면 실패합니다. |
| Test and build | `npm test`로 빌드와 테스트를 실행해 `build/index.js`를 만듭니다. |
| Fetch annotated tag | 주석 태그 객체를 다시 가져옵니다. |
| Extract release notes from tag | 주석 태그가 아니면 실패합니다. 태그 본문에서 첫 두 줄(태그 이름과 빈 줄)을 뺀 나머지를 릴리스 노트로 씁니다. |
| Create GitHub Release | 태그 이름을 제목으로 하고 `build/index.js`를 첨부한 GitHub Release를 만듭니다. |

진행 상황은 GitHub 저장소의 Actions 탭에서 확인할 수 있습니다. 완료되면 [GitHub Releases](https://github.com/iai6203/notion-assistant/releases)에 새 릴리스가 올라오고, 사용자는 [설치 문서](INSTALL.md)에 따라 첨부된 `index.js`를 내려받아 사용합니다.

## 문제 해결

- **워크플로가 `Tag ... does not match package version`으로 실패한 경우**: 버전을 올린 커밋이 아닌 곳에 태그를 만든 경우입니다. 로컬과 원격 태그를 지우고, 버전 커밋이 포함된 `HEAD`에서 `/new-tag`를 다시 실행합니다.

  ```bash
  git tag -d v0.1.1
  git push origin :refs/tags/v0.1.1
  ```

- **`is not an annotated tag`로 실패한 경우**: `git tag v0.1.1`처럼 가벼운 태그를 직접 만든 경우입니다. 위와 같이 태그를 지우고 `/new-tag`로 다시 만듭니다.
- **`npm test`가 실패한 경우**: 원인을 고쳐 커밋과 푸시를 한 뒤, 기존 태그를 지우고 새 `HEAD`에 `/new-tag`로 태그를 다시 만듭니다.
- **`/new-tag`가 같은 이름의 태그가 있다며 중단한 경우**: 이미 릴리스한 버전입니다. `/bump`로 버전을 올린 뒤 다시 진행합니다.
