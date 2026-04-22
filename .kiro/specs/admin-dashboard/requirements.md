# Requirements Document

## Introduction

The Admin Dashboard is a secure, restricted page in the Helix Next.js application that gives the Helix owner full visibility and control over all registered users. It provides a live user registry backed by a persistent `users.json` file on the server, the ability to send emails to any user via Gmail SMTP, block/unblock users from interacting with Helix, update user plans, and view aggregate usage statistics.

Access is gated by a hardcoded admin email check on the client and a shared secret header on every backend admin endpoint. The dashboard is a separate route (`/admin`) in the Next.js app. All mutations are persisted to `users.json` on the server.

---

## Glossary

- **Admin**: The owner/creator of Helix, identified by the `ADMIN_EMAIL` environment variable.
- **Dashboard**: The Next.js page at `/admin` that renders the admin UI.
- **Server**: The Python/Express backend running on port 8000 (`server.py` / `server.js`).
- **UserRecord**: A single user entry stored in `users.json`, containing email, name, plan, timestamps, counters, and blocked status.
- **Registry**: The `users.json` file on the server that stores all UserRecords.
- **Admin_Secret**: A shared secret string stored in the `ADMIN_SECRET` server-only environment variable, injected as an `X-Admin-Secret` header by Next.js API routes on every admin backend call.
- **Blocked_User**: A user whose `blocked` field in the Registry is `true`.
- **Chat_Endpoint**: The `/api/chat` route that processes user messages.
- **SMTP**: The Gmail Simple Mail Transfer Protocol service used to send emails from the admin.
- **StatCards**: The summary metrics component at the top of the Dashboard showing aggregate user statistics.
- **UserTable**: The paginated, searchable, filterable table component listing all UserRecords.
- **EmailModal**: The compose-and-send modal component for sending emails to individual users.

---

## Requirements

### Requirement 1: User Registration and Registry Persistence

**User Story:** As the admin, I want every user who logs into Helix to be automatically recorded in the registry, so that I have a complete and up-to-date list of all accounts that have accessed the system.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via OTP or Google login, THE Server SHALL register or update the user's UserRecord in the Registry.
2. WHEN a user authenticates for the first time, THE Server SHALL create a new UserRecord with `blocked=false`, `messageCount=0`, `loginCount=1`, `signedUpAt` set to the current timestamp, and `lastActiveAt` set to the current timestamp.
3. WHEN an existing user authenticates again, THE Server SHALL increment the user's `loginCount` by 1 and update `lastActiveAt` to the current timestamp.
4. WHEN `registerOrUpdateUser` is called multiple times for the same email, THE Server SHALL maintain exactly one UserRecord for that email in the Registry.
5. WHEN a user's Google profile picture is available at login, THE Server SHALL store or update the `picture` field on the UserRecord.
6. THE Server SHALL write the updated Registry to disk after every mutation to `users.json`.

---

### Requirement 2: Admin Access Control

**User Story:** As the admin, I want the dashboard to be accessible only to me, so that no other user can view or modify user data.

#### Acceptance Criteria

1. WHEN the Dashboard page mounts, THE Dashboard SHALL read the authenticated user's email from `localStorage.helix_user_email` and compare it to `NEXT_PUBLIC_ADMIN_EMAIL`.
2. IF the authenticated user's email does not match `NEXT_PUBLIC_ADMIN_EMAIL`, THEN THE Dashboard SHALL redirect the user to `/` before rendering any dashboard content.
3. WHEN a request reaches any `/api/admin/*` endpoint on the Server without a valid `X-Admin-Secret` header, THE Server SHALL return HTTP 401 with `{ "error": "Unauthorized" }`.
4. THE Next.js API routes SHALL inject the `ADMIN_SECRET` environment variable as the `X-Admin-Secret` header on every proxied request to the Server's admin endpoints.
5. THE `ADMIN_SECRET` environment variable SHALL be a server-only variable and SHALL NOT be prefixed with `NEXT_PUBLIC_`.

---

### Requirement 3: User List Display

**User Story:** As the admin, I want to see all Gmail accounts that have logged into Helix, so that I can monitor who is using the system.

#### Acceptance Criteria

1. WHEN the admin loads the Dashboard, THE Dashboard SHALL fetch all UserRecords from the Server via `GET /api/admin/users` and display them in the UserTable.
2. THE UserTable SHALL display the following fields for each user: email, name, plan badge, sign-up date, last active date, message count, login count, and blocked status.
3. WHEN the admin types in the search field, THE UserTable SHALL display only UserRecords whose email or name contains the search query (case-insensitive).
4. WHEN the admin selects a status filter of `blocked`, THE UserTable SHALL display only UserRecords where `blocked === true`.
5. WHEN the admin selects a status filter of `active`, THE UserTable SHALL display only UserRecords where `blocked === false`.
6. WHEN the admin selects a status filter of `all`, THE UserTable SHALL display all UserRecords regardless of blocked status.
7. THE Dashboard SHALL display Blocked_Users with a visually distinct style (muted or red tint) in the UserTable.

---

### Requirement 4: Block and Unblock Users

**User Story:** As the admin, I want to block specific Gmail accounts from sending messages to Helix, and unblock them later, so that I can manage abusive or unwanted users.

#### Acceptance Criteria

1. WHEN the admin clicks the block action for a user, THE Dashboard SHALL send `POST /api/admin/block` with the user's email to the Server.
2. WHEN the Server receives a valid block request, THE Server SHALL set `blocked=true` on the matching UserRecord and write the updated Registry to disk.
3. WHEN the admin clicks the unblock action for a Blocked_User, THE Dashboard SHALL send `POST /api/admin/unblock` with the user's email to the Server.
4. WHEN the Server receives a valid unblock request, THE Server SHALL set `blocked=false` on the matching UserRecord and write the updated Registry to disk.
5. WHEN a Blocked_User sends a message to the Chat_Endpoint, THE Server SHALL return HTTP 403 with `{ "error": "Your account has been suspended." }` without processing the message.
6. WHEN an unblocked user sends a message to the Chat_Endpoint, THE Server SHALL process the request normally and return a chat response.
7. IF the admin attempts to block or unblock an email that does not exist in the Registry, THEN THE Server SHALL return HTTP 404 with `{ "error": "User not found" }`.
8. WHEN a block or unblock action completes successfully, THE Dashboard SHALL update the UserTable to reflect the new blocked status without requiring a full page reload.

---

### Requirement 5: Send Email to Users

**User Story:** As the admin, I want to send emails to specific users directly from the dashboard, so that I can communicate with them about their accounts or usage.

#### Acceptance Criteria

1. WHEN the admin clicks the send email action for a user, THE Dashboard SHALL open the EmailModal pre-populated with the selected user's email address.
2. WHEN the admin submits the EmailModal with a subject and body, THE Dashboard SHALL send `POST /api/admin/send-email` with `{ to, subject, body }` to the Server.
3. WHEN the Server receives a valid send-email request, THE Server SHALL deliver the email via Gmail SMTP using the configured `GMAIL_USER` and `GMAIL_APP_PASSWORD` credentials.
4. WHEN the email is sent successfully, THE Server SHALL return `{ "success": true }` and THE Dashboard SHALL display a success confirmation and close the EmailModal.
5. IF the Gmail SMTP service fails, THEN THE Server SHALL return HTTP 500 with the SMTP error detail, and THE Dashboard SHALL display an inline error message in the EmailModal without closing it.
6. WHEN `sendAdminEmail` is called, THE Server SHALL NOT modify any UserRecord in the Registry.
7. THE EmailModal SHALL display a loading state while the email send request is in progress.

---

### Requirement 6: Dashboard Statistics

**User Story:** As the admin, I want to see aggregate statistics about all users at a glance, so that I can quickly understand the overall health and usage of Helix.

#### Acceptance Criteria

1. THE StatCards component SHALL display the following aggregate metrics: total registered users, total blocked users, users active today (last active within the past 24 hours), and total messages sent across all users.
2. WHEN the Dashboard fetches the user list, THE StatCards SHALL compute and display the metrics derived from the fetched UserRecords.
3. WHEN the user list changes due to a block, unblock, or plan update action, THE StatCards SHALL reflect the updated metrics.

---

### Requirement 7: User Plan Management

**User Story:** As the admin, I want to update a user's subscription plan from the dashboard, so that I can manually manage plan assignments without requiring the user to go through the payment flow.

#### Acceptance Criteria

1. WHEN the admin selects a new plan for a user in the UserTable, THE Dashboard SHALL send `POST /api/admin/update-plan` with `{ email, plan }` to the Server.
2. WHEN the Server receives a valid update-plan request, THE Server SHALL update the `plan` field on the matching UserRecord to one of `free`, `pro`, `proplus`, or `ultra`, and write the updated Registry to disk.
3. IF the admin provides an invalid plan value, THEN THE Server SHALL return HTTP 400 with `{ "error": "Invalid plan" }`.
4. WHEN the plan update completes successfully, THE Dashboard SHALL update the plan badge for that user in the UserTable without requiring a full page reload.

---

### Requirement 8: Registry Security and Data Integrity

**User Story:** As the admin, I want the user registry to be secure and not publicly accessible, so that user data is protected from unauthorized access.

#### Acceptance Criteria

1. THE Server SHALL NOT serve `users.json` as a static file via the Express static middleware.
2. WHEN the Registry file cannot be read from disk, THE Server SHALL return HTTP 500 and log the error, without exposing raw file system error details to the client.
3. WHEN the Registry file cannot be written to disk after a mutation, THE Server SHALL return HTTP 500 and log the error.
4. THE Server SHALL load the Registry into memory on startup and keep it as a module-level variable for in-memory reads, flushing to disk on every write mutation.
5. WHEN the admin dashboard is accessed, THE Dashboard SHALL NOT expose the `ADMIN_SECRET` value to the browser at any point.
