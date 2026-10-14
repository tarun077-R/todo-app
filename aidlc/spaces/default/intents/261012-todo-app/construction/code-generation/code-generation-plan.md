# Code Generation Plan — Todo App

**Stage**: Construction > Code Generation
**Scope**: poc (lightweight proof-of-concept)
**Project type**: Greenfield
**Date**: 2026-10-13

## Summary

- **Builds**: Full-stack React + Vite + plain CSS frontend and Node.js/Express + MongoDB/Mongoose backend for the todo app, with JWT auth and per-user task isolation.
- **Touches**: Workspace root — frontend (`src/`), backend (`server/`), shared types, Mongoose models, tests, config.
- **Tests**: ~11 backend tests (auth + task CRUD) + frontend unit tests for the task form, list, and dashboard; API integration tests for the task endpoints.

---

## Implementation Steps

### Step 1 — Backend scaffold

- [x] Create `server/` with `app.js`, `server.js`, `config/db.js`, `routes/`, `controllers/`, `middleware/`, `models/`.
- [x] Install: `express`, `mongoose`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`.
- [x] Write `server.js` (app bootstrap, JSON body parsing, global error handler).
- [x] Write `config/db.js` ( Mongoose connection with env-driven URI).

**Traceability**: NFR-02, NFR-05, FR-01, FR-03.

### Step 2 — User model + auth routes

- [x] Write `models/User.js` (email, passwordHash, timestamps; no plain-text password).
- [x] Write `controllers/auth.js` — register, login, getMe.
- [x] Write `routes/auth.js` — POST /auth/register, POST /auth/login, GET /auth/me.
- [x] Write `middleware/auth.js` — JWT verify + req.user population.
- [x] Write `middleware/error.js` — centralized error handler.

**Traceability**: FR-01, FR-02, NFR-01, NFR-02, NFR-03.

### Step 3 — Task model

- [x] Write `models/Task.js` (title, description, status, priority, dueDate, category, owner, timestamps).
- [x] Add indexes (owner + status + dueDate) for queries/filtering.

**Traceability**: FR-03..FR-16, NFR-04, NFR-05.

### Step 4 — Task routes + controllers

- [x] Write `routes/tasks.js` — CRUD + dashboard.
- [x] Write `controllers/tasks.js` — create, list, get one, update, remove, complete, restore, search, filter, sort, dashboard stats.
- [x] All routes guard with `auth` middleware.

**Traceability**: FR-03..FR-17, NFR-03, NFR-04.

### Step 5 — Server-side validation

- [x] Write `middleware/validate.js` — schema-based request validation returning 400 with field-level errors.
- [x] Apply to auth and task routes.

**Traceability**: NFR-03, FR-03.

### Step 6 — Frontend scaffold

- [x] Vite + React app with plain CSS.
- [x] `src/main.jsx`, `src/App.jsx`, `src/api/client.js`, `src/components/`, `src/pages/`, `src/styles/`.

**Traceability**: NFR-06, FR-01..FR-17.

### Step 7 — Frontend auth pages

- [x] `Login.jsx` + `Register.jsx` (form, validation UI, loading/error states, redirects per route).
- [x] `App.jsx` guards private routes with auth context + redirect to /login.

**Traceability**: FR-01, FR-02.

### Step 8 — Frontend task pages

- [x] `TaskList.jsx` (table, search, filter, sort, dashboard stats, empty state).
- [x] `TaskForm.jsx` (create + edit).
- [x] `TaskDetail.jsx` (view + complete + restore).
- [x] `Dashboard.jsx` (stats cards).

**Traceability**: FR-03..FR-16, NFR-07, NFR-08, NFR-09, NFR-10.

### Step 9 — Frontend tests

- [x] Vitest config + test setup with jsdom; a11y/component test helpers.
- [x] `src/components/__tests__/TaskForm.test.jsx`
- [x] `src/components/__tests__/TaskList.test.jsx`
- [x] `src/components/__tests__/Dashboard.test.jsx`
- [x] API client test with mocked `client.js`.

**Traceability**: NFR-11, FR-01..FR-17.

### Step 10 — Test configuration + README

- [x] `vitest.config.js` (frontend) + `jest.config.js`/`server` test script.
- [x] Root `package.json` scripts (install, dev, build, test, dev:server).
- [x] Minimal README (run + test commands).

**Traceability**: NFR-11.

---

## Testing Contract

From the active Testing Contract (poc / minimal, test-after): test files are mandatory in the plan; unit tests are the default per component; the existing suite remains green; the project-wide `npm test` command is not acceptable for a unit — each unit command is scoped.

---

## Completion Artifacts

- `code-summary.md` — files created/modified, key decisions, test coverage summary, deviations.
- `traceability.json` — every AC + NFR + FR mapped to workspace-relative implementation/test files.
