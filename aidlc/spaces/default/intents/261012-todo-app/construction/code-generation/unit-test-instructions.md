# Unit Test Instructions — Todo App

**Stage**: Construction > Code Generation
**Scope**: poc (lightweight proof-of-concept)
**Date**: 2026-10-13

## Run this unit's tests

Backend tests:

```bash
cd server && npm test
```

Frontend tests:

```bash
cd frontend && npm test
```

## Test framework setup

- Backend: Node test runner (`node:test`) with supertest for the Express API.
- Frontend: Vitest with jsdom.

## Mocking / stubbing

- Auth middleware and DB calls are mocked at the service layer.
- API client runs against an in-memory fake for the frontend integration test.

## Expected coverage

- 1 test per requirement (backend): auth register/login, task CRUD, validation, per-user isolation.
- Frontend unit tests for the task form, task list, and dashboard.
- API integration tests for the task endpoints.

## Test data management

- Each test uses a fresh in-memory DB (backend) or in-memory stub (frontend); no fixtures are shared across tests.

## What NOT to run

- Do NOT run `npm test` from the repo root — run the unit-scoped commands above instead.
- Do NOT run the full frontend+backend suite together; each unit's command covers its own tree.
