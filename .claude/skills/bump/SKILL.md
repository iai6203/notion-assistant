---
name: bump
description: Bump the package and MCP server versions together by a major, minor, or patch increment.
argument-hint: "[major|minor|patch]"
disable-model-invocation: true
---

# Bump version

Requested increment: `$ARGUMENTS`

1. Before modifying files, require the requested increment to be exactly one lowercase argument: `major`, `minor`, or `patch`. For a missing or invalid argument, stop and print `Usage: /bump [major|minor|patch]`.
2. Read the current versions from `package.json`, the top-level and root-package entries in `package-lock.json`, `SERVER_VERSION` in `src/index.ts`, and the server-version assertion in `test/server.test.js`. Require all five values to match; if they do not, stop without changing files and report the mismatches.
3. From `${CLAUDE_PROJECT_DIR}`, run `npm version <validated-increment> --no-git-tag-version`. This must update `package.json` and both application-version entries in `package-lock.json` without creating a commit or tag.
4. Read the new version from `package.json`. Update `SERVER_VERSION` in `src/index.ts` and the expected server version in `test/server.test.js` to that exact value.
5. Do not change dependency versions, the test client's `1.0.0` identity, or generated `build/` output.
6. Run `npm test`.
7. Confirm the five version sources from step 2 now equal the new version. Report the old and new versions and the test result.
