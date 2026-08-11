# TaskFlow — Team Task Manager

A full-stack task manager with role-based access control, shared team visibility, and per-task document uploads. Built with the MERN stack (MongoDB, Express, React, Node).

## Stack

- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT auth, Multer file uploads
- **Frontend**: React (Vite), Tailwind CSS, React Router, Axios

## How access control works

- **Roles**: Admin, Manager, Employee (chosen at registration).
- **Visibility**: every signed-in user can see every task, no matter who it's assigned to.
- **Creating/assigning tasks**: Admins and Managers can assign a task to anyone. Employees can only create tasks assigned to themselves.
- **Marking complete**: only the assignee (or an Admin) can change a task's status — pending / in-progress / completed. Nobody else can flip that switch, even the person who created the task.
- **Editing/deleting a task**: the task's creator or an Admin.
- **Documents**: the assignee, the creator, or an Admin can push files onto a task. Anyone with access to the task can download them.

## Project layout

```
server/   Express API + MongoDB models (User, Task)
client/   React app (Vite + Tailwind)
```

## Running it locally

Prerequisites: Node.js 18+, MongoDB running locally (or a connection string to Atlas).

```bash
# 1. install everything (server + client)
npm run install:all

# 2. start MongoDB if it isn't already running
brew services start mongodb-community   # or: mongod

# 3. run both the API and the frontend together
npm run dev
```

- API: http://localhost:5050
- App: http://localhost:5173 (proxies `/api` to the server)

Server config lives in `server/.env` (already created for local dev, pointing at `mongodb://127.0.0.1:27017/task_manager`). Change `MONGODB_URI` there if you want to point at MongoDB Atlas instead — copy `server/.env.example` for reference.

## Notes

- Uploaded files are stored on disk under `server/uploads/` (gitignored) with metadata in MongoDB; each task keeps up to 5 files at a time, 15MB max per file.
- JWT tokens are stored in `localStorage` on the client and expire after 7 days (`JWT_EXPIRES_IN` in `server/.env`).
