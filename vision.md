# Project Vision: Todo App


## 1. Project Overview
Build a modern, responsive, full-stack Todo application that helps users manage their daily tasks securely. The application will use React for the frontend, Node.js and Express for the backend, and MongoDB for persistent storage.

## 2. Problem Statement
Users need a simple way to record tasks, track their completion status, and manage pending work without unnecessary complexity.

## 3. Project Goals
- Create tasks quickly.
- View all pending and completed tasks.
- Mark tasks as completed.
- Edit and delete tasks.
- Filter tasks by status.
- Provide a clean, responsive user interface.

## 4. Target Users
Individuals who want to organize their daily personal or study tasks.

## 5. Core Features
- User registration and login.
- Create, view, edit, and delete tasks.
- Mark tasks as completed or active.
- Restore completed tasks to active status.
- Set task priority: Low, Medium, High.
- Assign due dates and categories to tasks.
- Search tasks by title.
- Filter tasks by status, priority, and category.
- Sort tasks by creation date and due date.
- Display task statistics on a dashboard.
- Ensure each user can access only their own tasks.

## 6. Technology Stack
- Frontend: React
- Build tool: Vite
- Styling: Plain CSS
- Backend: Node.js and Express.js
- Database: MongoDB with Mongoose
- API: REST API
- Authentication: Secure session/token-based authentication
- Language: JavaScript

## 7. UI Requirements
- Clean and modern design.
- Responsive layout for desktop and mobile.
- Clear task completion indicators.
- Accessible buttons and form inputs.
- Useful empty state when there are no tasks.
- Visual feedback for completed tasks.

## 8. Out of Scope
- Team collaboration and shared task lists.
- Real-time collaboration.
- Push notifications and reminders.
- Third-party calendar integrations.
- AI-powered task recommendations.

## 9. Success Criteria
- Users can register, log in, and securely access their accounts.
- Users can create, view, edit, complete, restore, and delete their tasks.
- Each user can access only their own tasks.
- Priority, due dates, categories, search, filters, and sorting work correctly.
- Tasks persist in MongoDB after page refreshes and across sessions.
- API inputs are validated and errors are handled appropriately.
- The application works on desktop and mobile screens.
- Relevant frontend and backend tests pass.
- No critical console or server errors occur during normal use.

## 10. Constraints
- Keep the application beginner-friendly and maintainable.
- Use reusable React components.
- Use plain CSS without a CSS framework.
- Use a modular Express backend.
- Validate requests on the server.
- Protect authenticated routes and user-specific task data.
- Use environment variables for secrets and configuration.
- Avoid unnecessary dependencies.
