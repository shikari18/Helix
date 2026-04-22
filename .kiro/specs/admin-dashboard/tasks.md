# Implementation Plan: Admin Dashboard

## Overview

Implement the Admin Dashboard feature incrementally: start with the server-side user registry and backend admin endpoints, then wire in the block/chat enforcement, then build the Next.js admin UI components, and finally connect everything end-to-end.

## Tasks

- [x] 1. Set up user registry and `registerOrUpdateUser` in the backend
  - Create `users.json` at the server root (if it doesn't exist) and add a module-level in-memory registry variable to `server.py`
  - Implement `load_users()` / `save_users()` helpers that read/write `users.json` using Python's `json` module
  - Implement `register_or_update_user(email, name, picture=None)` following the design pseudocode: create new record with `blocked=False`, `messageCount=0`, `loginCount=1`, `signedUpAt=now`, `lastActiveAt=now` on first login; increment `loginCount` and update `lastActiveAt` on subsequent logins
  - Call `register_or_update_user` from the existing `/api/auth/verify-otp` and Google login handlers in `server.py`
  - Ensure `users.json` is excluded from Express static middleware in `server.js` (add explicit exclusion or move static serving before the file is reachable)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.4_

  - [ ]* 1.1 Write property test for `registerOrUpdateUser` — deduplication invariant
    - **Property 2: Registration deduplication invariant**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 1.2 Write property test for `registerOrUpdateUser` — new users never blocked
    - **Property 1: New users are never blocked by default**
    - **Validates: Requirements 1.2, 4.1**

- [x] 2. Implement backend admin endpoints in `server.py`
  - Add `ADMIN_SECRET` env var check middleware/decorator: any request to `/api/admin/*` without a matching `X-Admin-Secret` header returns HTTP 401 `{ "error": "Unauthorized" }`
  - Implement `GET /api/admin/users` — returns `{ "users": [...] }` from in-memory registry
  - Implement `POST /api/admin/block` — sets `blocked=True` for the given email, saves to disk; returns 404 if not found
  - Implement `POST /api/admin/unblock` — sets `blocked=False` for the given email, saves to disk; returns 404 if not found
  - Implement `POST /api/admin/update-plan` — validates plan value (`free|pro|proplus|ultra`), updates record, saves to disk; returns 400 for invalid plan, 404 if not found
  - Implement `POST /api/admin/send-email` — calls existing `send_email()` helper with `to`, `subject`, `body`; returns `{ "success": true }` or HTTP 500 on SMTP failure; does NOT mutate registry
  - Handle disk read/write errors with HTTP 500 and server-side logging (no raw fs error details in response)
  - _Requirements: 2.3, 4.2, 4.4, 4.7, 5.3, 5.4, 5.5, 5.6, 7.2, 7.3, 8.2, 8.3_

  - [ ]* 2.1 Write property test for admin secret gate
    - **Property 6: Admin secret gate on all admin endpoints**
    - **Validates: Requirements 2.3**

  - [ ]* 2.2 Write property test for block/unblock round-trip
    - **Property 3: Block/unblock round-trip**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 2.3 Write property test for user list completeness
    - **Property 7: User list completeness**
    - **Validates: Requirements 3.1**

  - [ ]* 2.4 Write property test for email send does not mutate registry
    - **Property 10: Email send does not mutate the Registry**
    - **Validates: Requirements 5.6**

  - [ ]* 2.5 Write property test for plan update reflected in registry
    - **Property 12: Plan update is reflected in the Registry**
    - **Validates: Requirements 7.2**

- [x] 3. Enforce block check in the Chat Endpoint
  - Add `check_blocked(email)` helper in `server.py`: returns `True` if a UserRecord with that email exists and `blocked === True`, `False` otherwise (no mutations)
  - At the top of the `/api/chat` handler (both `server.py` and `server.js` if applicable), read `email` from the request body and call `check_blocked`; if blocked, return HTTP 403 `{ "error": "Your account has been suspended." }` before any processing
  - _Requirements: 4.5, 4.6_

  - [ ]* 3.1 Write property test for blocked users rejected at Chat Endpoint
    - **Property 4: Blocked users are rejected at the Chat Endpoint**
    - **Validates: Requirements 4.5**

  - [ ]* 3.2 Write property test for unblocked users not rejected at Chat Endpoint
    - **Property 5: Unblocked users are not rejected at the Chat Endpoint**
    - **Validates: Requirements 4.6**

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Next.js API proxy routes for admin endpoints
  - Create `helix-app/app/api/admin/users/route.ts` — proxies `GET` to `server.py :8000/api/admin/users`, injecting `X-Admin-Secret` from `ADMIN_SECRET` env var
  - Create `helix-app/app/api/admin/block/route.ts` — proxies `POST` with body forwarding and secret header
  - Create `helix-app/app/api/admin/unblock/route.ts` — proxies `POST` with body forwarding and secret header
  - Create `helix-app/app/api/admin/send-email/route.ts` — proxies `POST` with body forwarding and secret header
  - Create `helix-app/app/api/admin/update-plan/route.ts` — proxies `POST` with body forwarding and secret header
  - All routes must forward error status codes from the backend unchanged
  - `ADMIN_SECRET` must never be included in any `NEXT_PUBLIC_` variable or sent to the browser
  - _Requirements: 2.3, 2.4, 2.5, 8.5_

- [x] 6. Build `UserRecord` types and shared interfaces
  - Create `helix-app/app/admin/types.ts` with `UserRecord`, `AdminState`, `GetUsersResponse`, `BlockRequest`, `BlockResponse`, `UnblockRequest`, `UnblockResponse`, `SendEmailRequest`, `SendEmailResponse`, `UpdatePlanRequest`, `UpdatePlanResponse` interfaces as defined in the design document
  - _Requirements: 3.2_

- [x] 7. Implement `StatCards` component
  - Create `helix-app/app/admin/components/StatCards.tsx` accepting `StatCardsProps` (`totalUsers`, `blockedUsers`, `activeToday`, `totalMessages`)
  - Compute `activeToday` as users whose `lastActiveAt` is within the past 24 hours
  - Render four metric cards with labels and values
  - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 7.1 Write property test for stats derived correctly from user list
    - **Property 11: Stats are derived correctly from the user list**
    - **Validates: Requirements 6.1, 6.2**

- [x] 8. Implement `UserTable` component
  - Create `helix-app/app/admin/components/UserTable.tsx` accepting `UserTableProps` as defined in the design
  - Render each user row with: avatar initial, email, name, plan badge, sign-up date, last active, message count, login count, blocked status indicator, block/unblock button, send email button, plan selector dropdown
  - Apply client-side filtering: search query (case-insensitive match on email or name) and status filter (`all` / `active` / `blocked`)
  - Apply a visually distinct style (muted/red tint) to rows where `blocked === true`
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 8.1 Write property test for search filter correctness
    - **Property 8: Search filter correctness**
    - **Validates: Requirements 3.3**

  - [ ]* 8.2 Write property test for status filter correctness
    - **Property 9: Status filter correctness**
    - **Validates: Requirements 3.4, 3.5**

- [x] 9. Implement `EmailModal` component
  - Create `helix-app/app/admin/components/EmailModal.tsx` accepting `EmailModalProps` as defined in the design
  - Render a controlled form with subject and body fields
  - Show a loading state while the send request is in progress
  - On success: display confirmation and close modal
  - On failure: display inline error message, keep modal open
  - _Requirements: 5.1, 5.4, 5.5, 5.7_

- [x] 10. Implement the `/admin` page and wire all components together
  - Create `helix-app/app/admin/page.tsx` as a client component
  - On mount: read `localStorage.helix_user_email`, compare to `process.env.NEXT_PUBLIC_ADMIN_EMAIL`; if mismatch, call `router.push('/')` immediately before rendering any content
  - Fetch user list from `/api/admin/users` on mount and store in state
  - Render `StatCards` with metrics derived from the fetched user list
  - Render search input and status filter controls
  - Render `UserTable` passing users, search query, filter, and action handlers
  - Implement `handleBlock(email)` — calls `/api/admin/block`, updates local state optimistically
  - Implement `handleUnblock(email)` — calls `/api/admin/unblock`, updates local state optimistically
  - Implement `handleUpdatePlan(email, plan)` — calls `/api/admin/update-plan`, updates local state
  - Implement `handleSendEmail(to, subject, body)` — calls `/api/admin/send-email`
  - Open `EmailModal` pre-populated with selected user's email when send email action is triggered
  - Show toast/inline error on 404 (user not found) and re-fetch user list
  - _Requirements: 2.1, 2.2, 3.1, 4.1, 4.3, 4.8, 5.1, 5.2, 6.3, 7.1, 7.4, 8.5_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` (already configured in the project via Jest)
- Each property test task references a specific property from the design's "Correctness Properties" section
- The `ADMIN_SECRET` env var must be added to both the server environment and the Next.js server-side environment (not `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_ADMIN_EMAIL` must be added to `helix-app/.env.local` for the client-side auth guard
- `users.json` must not be reachable via Express static file serving — verify the `app.use(express.static(__dirname))` line in `server.js`
