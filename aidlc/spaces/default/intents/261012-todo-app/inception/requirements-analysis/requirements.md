# Requirements Analysis: Todo App

**Stage**: Inception > Requirements Analysis (2.3)
**Scope**: `poc` (lightweight proof-of-concept)
**Project type**: Greenfield
**Date**: 2026-10-12

This document records the requirements confirmed during the requirements-analysis stage. It reuses the confirmed answers from the intent-capture questionnaire and decomposes them into functional requirements (FR), non-functional requirements (NFR), and a requirement traceability matrix (RTM). Every requirement carries a checkable acceptance criterion.

**Confirming agent**: AI-DLC conductor
**Write timestamp**: 2026-10-12T18:55:00+05:30
**Summary confirmation recorded**: 2026-10-12 (human: "Looks correct")

---

## 0. Inputs & Sources

| Source | Detail |
|--------|--------|
| [desc] | Initial description: "vision.md i have to create this project" |
| [scope] | Workflow-selected scope: `poc` |
| [Q1] | Authentication: A — secure token-based authentication (JWT) with registration and login endpoints |
| [Q2] | Task operations: A — create, view, edit, delete, mark complete, restore, with per-user isolation |
| [Q3] | Organization features: A — priorities, due dates, categories, search, filtering (status/priority/category), sorting (creation/due date), dashboard statistics |
| [Q4] | API: A — RESTful API with resource-based endpoints for auth (register/login) and tasks (CRUD) |
| [Q5] | Security: A — server-side input validation on all endpoints, secure authentication with password hashing, centralized error handling, and user data isolation |
| [Q6] | Testing: A — unit tests for critical backend functionality (auth, task CRUD, validation) and frontend components (task form, task list, dashboard); integration tests for API endpoints; no mandatory coverage percentage for poc scope |
| [Q7] | UI/UX: A — clean modern responsive design (desktop and mobile), task completion indicators, accessible form inputs and buttons, empty state for no tasks, visual feedback for completed tasks |
| [Q8] | Database: A — MongoDB with Mongoose: User model (credentials), Task model (title, description, status, priority, due date, category, timestamps), with user-task relationship enforcing data isolation |
| [Q9] | Technology stack: A — React + Vite + plain CSS (no framework), Node.js + Express, MongoDB + Mongoose, REST API, JavaScript, env vars for secrets/config |
| [Q10] | Out of scope: A — team collaboration/shared task lists, real-time collaboration, push notifications/reminders, third-party calendar integrations, AI-powered task recommendations |

---

## 1. Functional Requirements

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| FR-01 | **Secure authentication** — user registration and login | When a new user submits a registration request with a unique email and password, the server hashes the password and stores the user record. When the user submits login credentials, the server returns an issued JWT access token on success and a 401 on failure. |
| FR-02 | **Token-based auth enforcement** | A request to any task endpoint without a valid JWT is rejected with 401 Unauthorized. A request with an expired or tampered token is rejected with 401. |
| FR-03 | **Task creation** | An authenticated user can POST a task with a title (required, non-empty), and optional description, priority, due date, and category. The server creates the task and associates it with the authenticated user's account. On success returns 201 with the task payload. |
| FR-04 | **Task retrieval** | An authenticated user can GET the full list of tasks. The list only contains tasks owned by that user (no cross-user access). |
| FR-05 | **Task retrieval by ID** | An authenticated user can GET a single task by ID. If the task belongs to another user, returns 404. |
| FR-06 | **Task update** | An authenticated user can PATCH a task they own (title, description, priority, due date, category, status). Non-owners get 404. |
| FR-07 | **Task deletion** | An authenticated user can DELETE a task they own. The task is removed from the user's task collection. Non-owners get 404. |
| FR-08 | **Task completion** | An authenticated user can mark their own task as completed (e.g., PATCH status to "completed"). Non-owners get 404. |
| FR-09 | **Task restoration** | An authenticated user can restore a previously completed task back to "pending" state. Non-owners get 404. |
| FR-10 | **Priority management** | The application supports at least three priority levels (Low / Medium / High) on tasks, validated server-side. |
| FR-11 | **Due date management** | The application supports an optional due date on tasks, stored and returned in ISO 8601 format. |
| FR-12 | **Category management** | The application supports an optional free-form category on tasks, stored and returned server-side. |
| FR-13 | **Search by title** | An authenticated user can search tasks by a substring of the title. The result set is limited to the authenticated user's tasks. |
| FR-14 | **Filtering by status / priority / category** | An authenticated user can filter their task list by status, priority, and/or category query parameters. |
| FR-15 | **Sorting** | An authenticated user can sort their task list by creation date and/or due date, in ascending or descending order. |
| FR-16 | **Dashboard statistics** | An authenticated user can request dashboard statistics: total task count, completed count, pending count, overdue count, and tasks by priority (or similar aggregates) scoped to their own tasks. |
| FR-17 | **Centralized error handling** | All API errors are returned in a consistent JSON shape (`{ "error": { "code": "...", "message": "..." } }`) with appropriate HTTP status codes. |

---

## 2. Non-Functional Requirements

| ID | Category | Requirement | Acceptance Criterion |
|----|----------|-------------|----------------------|
| NFR-01 | Security | Passwords must be hashed | User passwords are stored only as salted hashes (e.g., bcrypt/scrypt/argon2); plain-text passwords are never persisted. |
| NFR-02 | Security | Secrets configured via env vars | Database connection strings, JWT signing secrets, and other secrets are read from environment variables at runtime, not hard-coded. |
| NFR-03 | Reliability | Server-side validation on all endpoints | Every request payload is validated on the server; invalid input returns a 400 with field-level error details. |
| NFR-04 | Isolation | User data isolation | A user can only create, read, update, and delete their own tasks; cross-user queries return only the caller's data. |
| NFR-05 | Data persistence | MongoDB with Mongoose | Task and user documents are persisted in MongoDB through a Mongoose ODM and survive server restarts. |
| NFR-06 | Compatibility | Frontend/backend separation | The React+Vite frontend communicates with the Node+Express backend over HTTP(S) (the REST API) and does not share module scope with it. |
| NFR-07 | Responsive UI | Layout works on mobile and desktop | The application renders and remains usable on viewports from approximately 320px to 1920px wide, at device-pixel-ratio 1x and 2x. |
| NFR-08 | Accessibility | Form inputs and buttons are accessible | Form inputs have associated labels, buttons are keyboard-focusable and operable, and focus order is logical. |
| NFR-09 | Visibility | Visual feedback on interaction | Completing a task, saving, deleting, or logging in/out triggers visible UI feedback (e.g., task strikethrough, success/error messages, loading state). |
| NFR-10 | Empty state | Empty state displayed | When a user has no tasks, the UI shows an empty state message rather than a blank or broken page. |
| NFR-11 | Test coverage (poc) | Unit + integration tests exist | Backend: unit tests for auth, task CRUD, and validation paths. Frontend: unit tests for task form, task list, and dashboard components. API integration tests for the task endpoints. No mandatory coverage percentage for poc scope. |

---

## 3. Requirement Traceability Matrix

| RTM ID | Requirement | Source Q | Functional? | Non-Functional? | Derived Artifact |
|--------|-------------|----------|-------------|-----------------|------------------|
| RTM-01 | JWT registration & login | Q1 | FR-01 | FR-02 | API routes: POST /auth/register, POST /auth/login |
| RTM-02 | Task CRUD with per-user isolation | Q2 | FR-03..FR-09 | NFR-04 | REST routes: /tasks CRUD |
| RTM-03 | Priorities, due dates, categories | Q3 | FR-10, FR-11, FR-12 | NFR-03 | Task model fields + validation |
| RTM-04 | Search | Q3 | FR-13 | NFR-04 | GET /tasks?search= |
| RTM-05 | Filter & sort | Q3 | FR-14, FR-15 | NFR-04 | GET /tasks query params |
| RTM-06 | Dashboard statistics | Q3 | FR-16 | — | GET /tasks/dashboard |
| RTM-07 | Centralized error handling | Q5 | FR-17 | NFR-03, NFR-07 | Global error middleware |
| RTM-08 | Password hashing & secure auth | Q5 | FR-01 | NFR-01, NFR-02 | Auth service, middleware |
| RTM-09 | MongoDB + Mongoose | Q8 | FR-03..FR-16 | NFR-05 | Task & User Mongoose models |
| RTM-10 | React + Vite + plain CSS | Q9 | FR-01..FR-16 | NFR-06 | Frontend app, API client |
| RTM-11 | Responsive + accessible UI | Q7 | FR-01..FR-16 | NFR-07, NFR-08, NFR-09, NFR-10 | Task list, forms, dashboard views |
| RTM-12 | Unit + integration tests | Q6 | FR-01..FR-17 | NFR-11 | test suites: backend, frontend, API |

---

## 4. Constraints & Assumptions

- **Scope constraint**: This is a single-user POC. Team collaboration, shared lists, real-time sync, push/reminders, calendar integrations, and AI recommendations are explicitly out of scope.
- **Technology constraints**: JavaScript (no TypeScript), React + Vite + plain CSS, Node.js + Express, MongoDB + Mongoose.
- **Performance target**: POC scope — no SLA or throughput target defined beyond "relevant tests pass with no critical errors".

---

## 5. Out of Scope (Confirmed)

- Team collaboration / shared task lists
- Real-time collaboration
- Push notifications / reminders
- Third-party calendar integrations
- AI-powered task recommendations

---

*End of requirements-analysis deliverable. This document is the unique, validated source of the requirements that the downstream code-generation stage must implement.*
