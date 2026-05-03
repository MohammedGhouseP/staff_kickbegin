# TaskFlow Frontend

React + Vite frontend for TaskFlow. Talks to the [TaskFlow Backend](../../teskManager-backend).

## Setup

```bash
npm install
cp .env.example .env   # if .env is missing
npm run dev
```

The dev server runs at <http://localhost:5173>. The app reads `VITE_API_URL` from `.env` (default `http://localhost:4000/api`), so the backend must be running first.

## Configuration

`.env`:
```
VITE_API_URL=http://localhost:4000/api
```

## Architecture

```
src/
├─ App.jsx                    # root: auth, data loading, action wiring
├─ styles.js                  # exports the CSS-in-JS string
├─ index.css                  # minimal reset
├─ lib/
│  ├─ api.js                  # single fetch wrapper + grouped endpoints
│  ├─ constants.js            # STATUS_CONFIG, PRIORITY, AVATAR_COLORS, DAY_LABELS
│  ├─ dates.js                # today, addDays, getWeekDates, fmtRelative
│  └─ sound.js                # notification sound
└─ components/
   ├─ LoginScreen.jsx
   ├─ Sidebar.jsx
   ├─ OwnerApp.jsx            # owner shell: dashboard, tasks, team, settings
   ├─ EmployeeApp.jsx         # employee shell: day/week task views
   ├─ TaskList.jsx            # owner task rows
   ├─ EmpRow.jsx              # employee task row with status buttons + remarks toggle
   ├─ TaskModal.jsx           # create/edit task; tabs: details / remarks / activity
   ├─ UserModal.jsx           # create/edit employee
   ├─ RemarkThread.jsx        # remark list + add box (used by TaskModal and EmpRow)
   ├─ ActivityFeed.jsx        # task activity log
   ├─ Modal.jsx               # generic modal + ConfirmDialog (DRY)
   ├─ Notification.jsx        # task assigned modal
   └─ Toast.jsx               # error/info toast
```

### DRY contracts
- **Single API client** (`lib/api.js`) with one `request()` wrapper and a single `ApiError` class. All calls grouped by resource: `api.tasks.list()`, `api.remarks.add()`, etc.
- **Single token store** in `lib/api.js` (`getToken` / `setToken`) backed by `localStorage`.
- **Single Modal + ConfirmDialog** used everywhere a dialog is needed.
- **One action map** in `App.jsx` — every mutation is wrapped once with toast-on-error so individual components don't repeat try/catch.
- **Constants** (status, priority, avatar colors, day labels) live in one file and are imported where needed.

### Data flow
1. On mount, `App.jsx` reads the JWT from `localStorage` and calls `/auth/me`.
2. If valid, it loads users (owner only), tasks, and settings in parallel.
3. Each mutation (`actions.createTask`, `actions.updateUser`, …) calls the API, then patches local state with the response. Errors become toasts.

## Login

| Role | Username | Password |
| --- | --- | --- |
| Owner | `owner@123.com` | `password123` |
| Employee | `alex` / `sara` / `mike` / `priya` | `password123` |

(Seeded by the backend — see backend README to change.)

## Build

```bash
npm run build      # production bundle into dist/
npm run preview    # serve the build locally
```
