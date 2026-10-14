# Requirements Source (from confirmed questionnaire)

This file is a working copy of the confirmed answers that the
requirements-analysis stage uses to generate `requirements.md`.
It is intentionally structured so each requirement can be traced
back to the original question.

- [desc] Initial description: "vision.md i have to create this project"
- [scope] Workflow-selected scope: `poc`
- **Q1 Authentication** → A: Secure token-based authentication (JWT) with registration and login endpoints
  - => FR-01, FR-02
- **Q2 Task operations** → A: Create, view, edit, delete, mark complete, restore, per-user isolation
  - => FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09
- **Q3 Organization features** → A: priorities, due dates, categories, search, filtering, sorting, dashboard statistics
  - => FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16
- **Q4 API design** → A: RESTful API with resource-based endpoints for auth and tasks (CRUD)
  - => FR-01..FR-16, NFR-06
- **Q5 Security** → A: server-side input validation on all endpoints, secure authentication with password hashing, centralized error handling, user data isolation
  - => FR-17, NFR-01, NFR-02, NFR-03, NFR-04
- **Q6 Testing** → A: unit tests for critical backend functionality (auth, task CRUD, validation) and frontend components (task form, task list, dashboard); integration tests for API endpoints; no mandatory coverage percentage for poc scope
  - => NFR-11
- **Q7 UI/UX** → A: clean modern responsive design (desktop and mobile), task completion indicators, accessible form inputs and buttons, empty state for no tasks, visual feedback for completed tasks
  - => NFR-07, NFR-08, NFR-09, NFR-10
- **Q8 Database** → A: MongoDB with Mongoose: User model (credentials), Task model (title, description, status, priority, due date, category, timestamps), with user-task relationship enforcing data isolation
  - => FR-03..FR-16, NFR-05
- **Q9 Technology stack** → A: React + Vite + plain CSS (no framework), Node.js + Express, MongoDB + Mongoose, REST API, JavaScript, env vars for secrets/config
  - => NFR-06
- **Q10 Out of scope** → A: team collaboration/shared task lists, real-time collaboration, push notifications/reminders, third-party calendar integrations, AI-powered task recommendations
  - => confirmed out of scope
