# notion-assistant

> [!WARNING]
> **이 프로젝트는 더 이상 관리하지 않습니다.**
>
> 공식 Notion MCP를 쓰면 사용자 계정이 접근할 수 있는 모든 문서에 LLM도 접근할 수 있습니다. 이를 막으려고 MCP를 직접 구현해 사용했습니다.
>
> 그런데 운영해 보니 Notion의 모든 기능을 다루는 도구를 계속 관리하기가 어려웠습니다. 도구를 추가할 때마다 토큰 사용량을 줄이는 방법도 함께 고민해야 해서 부담이 더 컸습니다.
>
> 그래서 이 프로젝트 대신 LLM이 쓸 문서를 Notion의 별도 워크스페이스에서 관리하는 방식으로 옮겼습니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [설치](docs/INSTALL.md) | 릴리스된 `index.js`를 내려받아 Claude Code에 MCP 서버로 등록하는 방법 |
| [릴리스](docs/RELEASE.md) | `/bump`로 버전 업데이트, `/new-tag`로 태그 생성, `Release` 워크플로로 GitHub Release 자동 생성 |
