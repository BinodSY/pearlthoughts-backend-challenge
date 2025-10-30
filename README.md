# 🧠 PearlThoughts Backend Sync Challenge

An **offline-first task management backend** built with **Node.js, Express, TypeScript, and SQLite**, designed to support **bi-directional data synchronization** between local storage and a remote server.

---

## 🚀 Project Overview

This backend simulates how modern apps (like Notion, Todoist, or Linear) handle offline operations and sync changes once back online.  
It includes a **sync queue**, **batch processing**, **retry logic**, and **conflict resolution** based on the *Last Write Wins (LWW)* model.

---

## ⚙️ Tech Stack

- **Node.js** + **Express** – REST API framework  
- **TypeScript** – Strong typing & structure  
- **SQLite3** – Lightweight local database  
- **Axios** – HTTP client for sync requests  
- **Vitest** – Unit testing framework  
- **Nodemon / TSX** – Dev server tools  

---

## 🏗️ Architecture Overview

```
Client (UI)
  └─ Offline actions (CRUD)
      └─ API Routes (/api/tasks, /api/sync)
          └─ Service Layer (TaskService + SyncService)
              └─ SQLite Database (tasks + sync_queue tables)
```

---

## 🧩 Key Features

### ✅ CRUD Operations
- Create, update, delete, and view tasks
- Soft delete behavior for safe removals
- Automatic sync queue entry creation on change

### 🔁 Sync Engine
- Batch sync with configurable batch size
- Retry mechanism with capped attempts
- Conflict resolution using **Last Write Wins**
- Safe error handling and consistent sync states

### 🧠 Conflict Handling
- Compares `updated_at` timestamps
- If timestamps match, prefers `delete` > `update` > `create`
- Ensures no data corruption between client and server

---

## 📡 API Endpoints

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| GET    | `/api/tasks`        | Fetch all non-deleted tasks    |
| GET    | `/api/tasks/:id`    | Get a specific task            |
| POST   | `/api/tasks`        | Create a new task              |
| PUT    | `/api/tasks/:id`    | Update an existing task        |
| DELETE | `/api/tasks/:id`    | Soft delete a task             |
| POST   | `/api/sync`         | Trigger manual sync            |
| GET    | `/api/sync/status`  | Get sync summary               |
| GET    | `/api/sync/health`  | Check connectivity             |

---

## 🧾 Error Response Format

All endpoints follow a consistent error response:

```json
{
  "error": "Error message",
  "timestamp": "2025-10-29T10:00:00Z",
  "path": "/api/endpoint"
}
```

---

## 🧪 Running Locally

1. Clone the repository
```bash
git clone https://github.com/BinodSY/pearlthoughts-backend-challenge
cd pearlthoughts-backend-challenge
```

2. Install dependencies
```bash
npm install
```

3. Configure environment

Create a `.env` file with the following example values:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/tasks.sqlite3
SYNC_BATCH_SIZE=50
SYNC_RETRY_ATTEMPTS=3
API_BASE_URL=http://localhost:3000/api
```

4. Run the server (development)
```bash
npm run dev
```

Access the app at:
http://localhost:3000/api/tasks

---

## 🧪 Running Tests

Run:
```bash
npm test
```

Expected output:
```
✓ tests/syncService.test.ts (6 tests)
✓ tests/integration.test.ts (3 tests)
✓ tests/taskService.test.ts (8 tests)
✓ 17 tests passed (100%)
```

---

## ☁️ Deployment

The app is deployed on Railway for public review.

Live API Base URL:
https://pearlthoughts-backend-challenge-production.up.railway.app/api/health

You can test live endpoints:
/tasks  
/sync  
/sync/status  
/sync/health

---

## 🧩 Challenge Constraints Awareness

While the base challenge tests are complete and all 17 tests pass ✅, the project author has also studied advanced constraints under `utils/challengeConstraints.ts` including:

- Chronological-per-task sync ordering  
- Conflict priority (delete > update > create)  
- Dead-letter queue for failed syncs  
- Batch checksum integrity  
- Extended sync states (pending, in-progress, synced, error, failed)

These are not enforced in the current test suite but can be added in a future v2 extension branch.

---

## 💬 Declaration

This project was completed as part of the PearlThoughts Backend Sync Challenge.

AI & Resources Used:
- ChatGPT & copilot(for syntax help, debugging, and architectural clarity)
- Official Node.js, Express, and SQLite documentation
- Vitest testing docs

All code was written, understood, and tested by the author. AI was used strictly for learning and problem-solving support.

Challenges faced:
- Managing ESM/CommonJS module conflicts
- Designing sync queue with consistent state transitions
- Debugging SQLite schema changes for test compatibility

Trade-offs considered:
- Focused on passing functional tests before implementing extended constraints
- Chose SQLite for simplicity over persistent cloud DBs
- Deferred dead-letter queue and checksum verification for a later version

---

## 👨‍💻 Author

Binod Biswal (Piku)

- GitHub: https://github.com/Binodsy
- LinkedIn: https://linkedin.com/in/binod-biswal
- Email: Biswalbinod94@gmail.com

---

## 🏁 Final Submission Checklist

| Requirement                     | Status |
|---------------------------------|--------|
| All tests passing               | ✅     |
| Repo updated & pushed           | ✅     |
| Reviewer invited (PearlThoughtsHR)| ✅   |
| Video with face uploaded        | ✅     |
| API publicly hosted             | ✅     |
| README documented               | ✅     |