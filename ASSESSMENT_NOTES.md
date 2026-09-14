# Assessment Notes — ProjectFlow

## 1. System Structure and Major Modules

ProjectFlow is a **pnpm monorepo** managed by Turborepo, composed of three packages:

| Package           | Role                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `apps/api`        | NestJS 11 backend — REST API, business logic, MongoDB persistence   |
| `apps/web`        | Next.js 16 (App Router) frontend — React 19, TanStack Query 5       |
| `packages/shared` | Shared TypeScript types, enums, and constants consumed by both apps |

### Backend Modules (`apps/api/src/`)

Each module follows a consistent **controller → service → Mongoose model** layering. Controllers are thin (parse params, call service, return result). Business rules live in services.

| Module                 | Responsibility                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`                 | JWT-based register/login/`GET /auth/me`. Uses `bcryptjs` for password hashing.                                                                                             |
| `users`                | `User` document CRUD. Passwords stored as `passwordHash`, excluded from default projections.                                                                               |
| `organizations`        | Organization documents. Org owners are tracked by `ownerId` field.                                                                                                         |
| `organization-members` | `OrganizationMember` join table: `organizationId + userId + role (OWNER/ADMIN/MEMBER)`.                                                                                    |
| `projects`             | Project CRUD + member management. Delegates all access decisions to `ProjectAccessService`.                                                                                |
| `project-members`      | `ProjectMember` join table: `projectId + userId + role (PROJECT_MANAGER/MEMBER)`.                                                                                          |
| `tasks`                | Task CRUD with per-project sequential numbering. Human-readable key like `ENG-1`.                                                                                          |
| `comments`             | Comments attached to tasks, paginated.                                                                                                                                     |
| `common`               | Cross-cutting: `JwtAuthGuard`, `@CurrentUser` decorator, `@Public` decorator, `AllExceptionsFilter`, `toObjectId`, `toUserSummary` utilities, shared `PaginationQueryDto`. |

### Frontend (`apps/web/src/`)

| Directory        | Role                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`           | Next.js App Router file-based routing. Routes are thin — they render feature components.                                                                                   |
| `features/`      | Domain features (`auth`, `projects`, `tasks`, `comments`). Each has `api.ts` (fetch functions), `hooks.ts` (TanStack Query hooks), and `components/`.                      |
| `lib/`           | `api-client.ts` (base URL, auth header, error parsing), `query-keys.ts` (centralized key registry), `format.ts` (dates, initials), `auth-storage.ts` (localStorage token). |
| `components/ui/` | Design system primitives using Radix UI and Phosphor Icons (Avatar, Button, Select, Dialog, etc.).                                                                         |
| `providers/`     | `QueryProvider` — wraps the app in `QueryClientProvider`.                                                                                                                  |

---

## 2. Where Business Logic Lives

Business logic lives **exclusively in services**, never in controllers.

- **`ProjectAccessService`** (`projects/project-access.service.ts`) is the single authority for "can this user touch this project?" — it is used by `TasksService`, `CommentsService`, and `ProjectsService`.
- **`TasksService`** owns task creation, update, and deletion rules (e.g., only the creator or a `canManage` user may edit a task).
- **`ProjectsService`** owns project creation (requires elevated org role), member management, and statistics aggregation.
- **`AuthService`** owns credential validation and JWT issuance.

DTOs validate shape and constraints at the HTTP boundary using `class-validator`. The global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`) rejects any extra fields.

---

## 3. How the Frontend Talks to the Backend

**Communication layer:** `lib/api-client.ts` — a single `apiRequest<T>()` function that owns:

- Base URL from `NEXT_PUBLIC_API_URL`
- Attaching the `Authorization: Bearer <token>` header from localStorage
- Building query strings
- Parsing the standard `ApiErrorBody` error shape
- Throwing `ApiError` (with `.statusCode`) on non-2xx responses

**Server state:** TanStack Query 5. All queries and mutations go through hooks in `features/*/hooks.ts`. The query key registry in `lib/query-keys.ts` keeps cache invalidation predictable across the app.

**Auth state:** The access token is stored in `localStorage` via `auth-storage.ts`. On login, the token is saved and `queryKeys.currentUser` is invalidated. On logout, the token is cleared and the query cache is wiped.

**Server Components:** Pages use Next.js App Router. Leaf components that use hooks are `"use client"` only where needed, keeping the rendering boundary minimal.

---

## 4. How Auth/Authorization Works

### Authentication

1. Client sends `POST /auth/login` → receives `{ accessToken, user }`.
2. Token is stored in `localStorage` by `auth-storage.ts`.
3. Every subsequent API request attaches `Authorization: Bearer <token>`.
4. `JwtAuthGuard` is registered as a **global guard** via `APP_GUARD`. It validates the token on every route.
5. Routes can opt out with the `@Public()` decorator (e.g., `/auth/register`, `/auth/login`).
6. The verified JWT payload `{ sub, email }` is attached to `request.user` and exposed via the `@CurrentUser()` decorator.

### Authorization

Authorization is role-based, with two layers:

**Organization level (`OrganizationRole`):**

- `OWNER` and `ADMIN` are "elevated" roles — `isElevatedOrganizationRole()` returns `true`.
- Elevated roles grant access to **every project** in that organization.

**Project level (`ProjectRole`):**

- `PROJECT_MANAGER` — can manage project config and membership.
- `MEMBER` — read/write access but not management.

**`ProjectAccessService`** resolves access in one place:

- `assertCanView()` — passes if the user has an elevated org role OR any project membership row.
- `assertCanManage()` — passes only if elevated org role OR `PROJECT_MANAGER` project role.
- The helper `canManage(context)` is exported for use in conditional checks within services.

---

## 5. How Main Entities Relate

```
User
Organization ──────────── OrganizationMember ─── User   (role: OWNER | ADMIN | MEMBER)
                │
                └── Project ─────────────────── ProjectMember ── User   (role: PROJECT_MANAGER | MEMBER)
                              │
                              └── Task ─────── Comment
                                    │
                                    └── assignee (nullable ref → User, must be ProjectMember)
                                    └── TaskActivity (to be added)
```

Key design choices:

- Memberships are stored as **separate join-table documents**, not as arrays on parent documents. This allows direct indexed queries.
- Both membership collections have a **unique compound index** on `(projectId/organizationId, userId)` — preventing duplicate rows at the DB level.
- Tasks carry a per-project `number` and a human-readable `key` (`ENG-1`) derived from the project's `key` field and a counter.

---

## 6. Observed Risks and Weaknesses

### Risk 1 — Missing Authorization on `PATCH /tasks/:taskId/status` ⚠️ HIGH

**What:** `TasksService.updateStatus()` accepts only `taskId + dto`. There is no `userId` parameter and no call to `assertCanView()` or any access check. The controller handler for `PATCH /tasks/:taskId/status` similarly does not extract `@CurrentUser`.

**Why it's a problem:** Any authenticated user who knows a valid `taskId` can change the task's status — even if they have no organization or project membership at all. This is a **confirmed security vulnerability** that violates the access control model of the entire application.

**Fix now or later?** **Fix now, immediately.** This is a security regression, not a polish item. It undermines the trust in the entire authorization layer.

---

### Risk 2 — Race Condition in Task Numbering ⚠️ MEDIUM

**What:** Task creation uses `countDocuments({ projectId }) + 1` to determine the next task number. Two concurrent requests can both read the same count and produce duplicate task numbers (e.g., two `ENG-101`s).

**Why it's a problem:** Duplicate keys violate the human-readable identifier guarantee. The `key` field (`ENG-1`, `ENG-2`) is the primary way users reference tasks (in comments, PR titles, etc.). Duplicates break communication and potentially data integrity if keys are used as lookup handles.

**Fix now or later?** **Fix now.** The assessment explicitly calls this out as a known bug. The fix (atomic `findOneAndUpdate + $inc` counter) is small and contained with no architectural impact.

---

### Risk 3 — No Pagination on Project Member Listing ⚠️ LOW

**What:** `ProjectsService.findMembers()` fetches all project members with `findByProject()` — no pagination, no limit. For projects with many members, this is an unbounded query.

**Why it's a problem:** At scale, projects with hundreds of members could produce slow queries and large JSON responses.

**Fix now or later?** **Later.** Given the assessment's time constraints, this is a known limitation worth documenting. The fix is straightforward but adds surface area beyond the current assessment scope.

---

## Code Review

### Submitted Function

```typescript
async assignTask(taskId: string, assigneeId: string, userId: string) {
  const task = await this.taskModel.findById(taskId);
  if (!task) {
    throw new NotFoundException();
  }

  const user = await this.userModel.findById(assigneeId);
  if (!user) {
    throw new NotFoundException();
  }

  task.assignee = user._id;
  await task.save();

  return task;
}
```

### Review Comments

**1. No authorization check (Security)**

The method never checks whether `userId` (the actor) is allowed to access or modify this task. Any authenticated user can call this and assign anyone to any task — regardless of project membership.

_Ask the engineer:_ Add `await this.projectAccessService.assertCanView(task.projectId, actorId)` after loading the task, and derive assignment permissions from the returned context.

---

**2. Assignee's project membership is never validated (Business Rule)**

The function confirms the assignee exists in the `users` collection, but never checks that they are a **member of this task's project**. A user can be assigned to a task in a project they've never joined.

_Ask the engineer:_ After loading the task, look up a `ProjectMember` row for `{ projectId: task.projectId, userId: assigneeId }`. If none exists, throw `BadRequestException('Assignee is not a member of this project')`.

---

**3. Role-based assignment permission is missing (Business Rule)**

The requirement is: `OWNER` / `ADMIN` / `PROJECT_MANAGER` can assign any member of the same project; they cannot assign users outside the project; a `MEMBER` can only assign themselves. This logic is entirely absent.

_Ask the engineer:_ After resolving the `ProjectAccessContext`, check: if `!canManage(context)` and the actor's project role is `MEMBER`, reject any `assigneeId !== actorId`. Self-assignment must also validate the actor has a membership row.

---

**4. `NotFoundException` thrown without a message (Maintainability)**

Both `NotFoundException()` calls are thrown with no message, so the API response body says `"Not Found"` with no context. The client cannot distinguish between "task not found" and "user not found".

_Ask the engineer:_ Use `throw new NotFoundException('Task not found')` and `throw new NotFoundException('User not found')` respectively.

---

**5. Raw document returned (Architecture)**

The method returns the raw Mongoose `TaskDocument`. The rest of the codebase consistently uses `toDetail()` to project task data into the typed `TaskDetail` shape (resolving `createdBy` to `UserSummary`, attaching the `project` sub-object, etc.). Returning the raw document bypasses this contract.

_Ask the engineer:_ Return `this.toDetail(task, access.project)` instead of `task`.

---

**6. No activity record created (Data Consistency)**

After a successful assignment, no `TaskActivity` event is recorded. The activity timeline will be incomplete.

_Ask the engineer:_ After saving, call the activity service to record the transition from the previous assignee (or `null`) to the new one.

---

**7. Sequential DB round-trips where parallel calls could be used (Performance)**

The task is fetched, then the user is fetched, then (once fixed) the membership check and actor context check each make separate DB calls. Some of these can be parallelised with `Promise.all()`.

_Ask the engineer:_ After loading the task, run `Promise.all([assertCanView(...), checkAssigneeMembership(...)])` where the two checks are independent.

---

**8. Unassignment not supported (Correctness)**

Passing `assigneeId: null` is not handled. The assessment requires unassignment to be supported and correctly recorded in the activity history as a distinct transition.

_Ask the engineer:_ Accept `assigneeId: string | null`, handle the `null` case explicitly (skip the user lookup, set `task.assignee = null`), and record it as an unassignment event.

---

## Scaling the Activity System (5,000 → 500,000 Users)

### Current State

The activity system will be a simple `task_activity` MongoDB collection. At 5,000 users, this is perfectly adequate.

### What Changes and When

**Phase 1 — Current scale (~5,000 users)**

The simplest design works. Index `{ task: 1, createdAt: -1 }` covers the primary read pattern (paginated activity feed per task). Offset pagination is acceptable.

**Phase 2 — Growth to ~50,000 users**

- **Switch to cursor-based pagination.** Offset pagination (`SKIP n`) forces the database to scan and discard preceding documents on every request — O(n) cost that grows as pages deepen. Cursor pagination (using `_id` or `createdAt` as a cursor) delivers stable O(log n) reads via the index regardless of depth. This change should happen before the dataset is large enough for the offset cost to be noticeable.

- **Compound index** `{ task: 1, createdAt: -1, _id: -1 }` added to support cursor-based queries with a stable tiebreaker.

**Phase 3 — Growth to ~500,000 users**

At this scale, activity becomes one of the largest collections. Several decisions become necessary:

- **Data retention / archiving.** Records older than 90–180 days can be archived to cold storage (a separate MongoDB collection or a cheaper tier). This keeps the hot collection bounded and indexes lean. Retention rules should be configurable per organization.

- **Async activity writes.** If activity writes become a bottleneck, the task mutation can succeed immediately and the activity record can be created as a follow-up (via a change stream listener or a lightweight in-process job queue). This prevents a slow write to the activity collection from blocking a task update response. At 500,000 users, this is worth considering. At 5,000, it adds complexity without benefit.

- **Real-time updates.** If activity timelines need to update live (without polling), WebSockets (NestJS Gateways) or Server-Sent Events are the appropriate additions. These are additive — the REST API continues to exist. Introducing them before there is a demonstrated UX demand is over-engineering.

- **Observability.** At this scale, slow query logs (MongoDB Atlas Performance Advisor or equivalent) and application-level tracing (OpenTelemetry spans around `findByTask()`) are needed to detect regressions before they become incidents.

### What Should NOT Change Unless a Concrete Problem Is Measured

- **Do not introduce Kafka, RabbitMQ, or Redis** for activity. At 500,000 users with predominantly read-heavy timelines, MongoDB with good indexes and cursor pagination handles the load. A message queue adds operational complexity (exactly-once delivery, dead-letter queues, consumer lag monitoring) that is not warranted without evidence of write saturation.

- **Do not move to microservices** for the activity system. The cost of service isolation (network calls, distributed transactions, separate deployment) is paid immediately; the benefit is speculative.

- **Do not implement event sourcing.** The activity record is already the event log. Adding a separate event sourcing layer duplicates the data model without adding capability at this scale.

---

## If I Had Two More Days

1. **Cursor-based pagination for the activity API** — The current implementation uses offset pagination. Cursor pagination would be more correct for a high-frequency, append-only collection like activity logs.

2. **Pagination on project member listing** — `GET /projects/:projectId/members` returns all members in one unbounded query. Adding `PaginationQueryDto` is low-effort and directly improves scalability.

3. **Refresh token / token rotation** — The access token is long-lived (`7d` default). A short-lived access token + refresh token pair would meaningfully improve security (smaller compromise window, revocation capability).

4. **Rate limiting on auth endpoints** — No rate limiting exists on `POST /auth/login` or `POST /auth/register`. At minimum these should be rate-limited to prevent brute-force and account enumeration.

5. **Soft delete for tasks** — `task.deleteOne()` also deletes all its comments via `commentModel.deleteMany()`. A `deletedAt` soft-delete flag would allow recovery and preserve comment history for audit purposes.

6. **Playwright e2e tests for the web app** — Backend e2e tests cover the API contract. Adding Playwright tests for the most critical frontend flows (login, assignment, activity timeline) would catch regressions that unit tests cannot.

7. **Assignee avatars on the board view** — Once `assignee` is available in `TaskSummary`, the board column cards should show the assignee avatar, making workload visible at a glance.
