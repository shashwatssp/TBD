# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies. The main project is **Vivah** — a polished Indian wedding task management mobile app built with Expo React Native.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Mobile**: Expo React Native (SDK 53+)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express REST API (port 8080)
│   └── vivah/              # Expo React Native mobile app
├── lib/
│   ├── api-spec/           # OpenAPI spec
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
└── pnpm-workspace.yaml
```

## Vivah App — Indian Wedding Coordinator

### Design
- **Palette**: Crimson red `#C0392B` + gold `#D4A017` on dark maroon backgrounds
- **Fonts**: Inter (Regular/Medium/SemiBold/Bold)
- **Aesthetic**: Indian wedding themed

### Features
1. **Phone/OTP login** → profile setup (name → role)
2. **Role-based system**: Manager (Organiser) vs Participant (Helper)
3. **Wedding events**: Managers create events → get 6-letter code → share with helpers
4. **Functions**: Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception, Engagement (auto-created)
5. **Tasks**: Create, assign to participants, set priority, track status
6. **Subtasks**: Toggle completion within tasks
7. **Dashboard**: Role-aware — Managers see all tasks/functions; Participants see assigned tasks only
8. **Notifications**: Real-time via DB; badge on tab bar
9. **Profile**: Shows team helpers (for managers), event code sharing, logout

### Architecture
- `context/AppContext.tsx` — All state, backed by REST API via `lib/api.ts`
- `lib/api.ts` — Typed fetch client targeting `EXPO_PUBLIC_DOMAIN/api`
- Only `user` and `currentEvent` persisted locally (AsyncStorage) for session continuity
- All other data fetched live from the API

### Key Screens
- `app/index.tsx` — Welcome / landing
- `app/(auth)/login.tsx`, `otp.tsx` — Phone OTP login
- `app/(auth)/profile.tsx` — Name + Role setup (2-step)
- `app/create-event.tsx` — Manager creates a wedding event
- `app/join-event.tsx` — Participant joins by 6-letter code
- `app/(tabs)/index.tsx` — Dashboard (role-aware)
- `app/(tabs)/functions.tsx` — Functions list (manager-only add)
- `app/(tabs)/notifications.tsx` — Notification centre
- `app/(tabs)/profile.tsx` — User profile, team helpers, event code
- `app/function/[id].tsx` — Function detail, tasks list, add task with participant assignment
- `app/task/[id].tsx` — Task detail, status, subtasks, reassign

## API Server (`artifacts/api-server`)

Express 5 REST API on port 8080. All routes under `/api`.

### Routes
- `POST /api/auth/users` — Upsert user by phone
- `PATCH /api/auth/users/:id` — Update name/role
- `POST /api/events` — Create event (auto-creates 6 default functions)
- `POST /api/events/join` — Join event by code
- `GET /api/events/:id` — Get event
- `GET /api/events/:id/participants` — Get all users in event
- `GET /api/functions?eventId=` — List functions for event
- `POST /api/functions` — Create function
- `GET /api/tasks?functionId=` or `?assignedTo=&eventId=` — List tasks
- `POST /api/tasks` — Create task
- `PATCH /api/tasks/:id` — Update task
- `POST /api/tasks/:id/subtasks` — Add subtask
- `PATCH /api/subtasks/:id` — Toggle subtask completion
- `GET /api/notifications?userId=` — Get notifications
- `POST /api/notifications` — Create notification
- `PATCH /api/notifications/:id/read` — Mark read

## Database Schema (`lib/db/src/schema/index.ts`)

Tables: `users`, `events`, `event_participants`, `functions`, `tasks`, `subtasks`, `notifications`

## Development

```bash
# Start all services
# API Server
pnpm --filter @workspace/api-server run dev

# Vivah App  
pnpm --filter @workspace/vivah run dev

# Push DB schema
pnpm --filter @workspace/db run push
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from the root with `pnpm run typecheck`.
