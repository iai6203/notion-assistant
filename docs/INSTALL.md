# 설치

## 준비 사항

- Claude Code
- Node.js 24 이상

## Claude Code에 MCP 추가

1. [GitHub Releases](https://github.com/iai6203/notion-assistant/releases)에서 사용할 릴리스를 열고 `index.js` 파일을 다운로드합니다.
2. 다운로드한 파일의 절대 경로를 확인합니다.
3. 다음 명령어를 실행합니다.

```bash
claude mcp add --scope user --transport stdio <이름> node <index.js 파일의 절대 경로>
```

- `<이름>`: Claude Code에 등록할 MCP 서버 이름입니다. 예: `notion-assistant`
- `<index.js 파일의 절대 경로>`: 다운로드한 `index.js` 파일의 절대 경로입니다.

예를 들어 MCP 서버 이름이 `notion-assistant`이고 파일 경로가 `/Users/me/Downloads/index.js`라면 다음과 같이 실행합니다.

```bash
claude mcp add --scope user --transport stdio notion-assistant node /Users/me/Downloads/index.js
```

경로에 공백이 포함되어 있다면 경로를 따옴표로 감쌉니다.

```bash
claude mcp add --scope user --transport stdio notion-assistant node "/Users/me/My Downloads/index.js"
```

`--scope user`로 등록하므로 현재 사용자 계정의 모든 프로젝트에서 이 MCP 서버를 사용할 수 있습니다.

Claude Code는 등록된 경로의 `index.js`를 실행하므로, 등록 후 파일을 이동하거나 삭제하지 마세요.

## Claude Code에서 MCP 삭제

등록할 때 사용한 이름으로 다음 명령어를 실행합니다.

```bash
claude mcp remove --scope user <이름>
```

예를 들어 `notion-assistant`라는 이름으로 등록했다면 다음과 같이 삭제합니다.

```bash
claude mcp remove --scope user notion-assistant
```