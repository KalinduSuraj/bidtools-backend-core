# API Documentation — bidtools-backend-core

This document lists the HTTP API endpoints implemented in this repository, grouped by resource. For each endpoint you'll find: method, path, summary, request body (when applicable), response shape, required auth, and the source files to inspect.

Notes
- Base API path: / (root). Many controllers are mounted directly (e.g. `/items`, `/payments`, `/notification`, `/email`, etc.).
- Authentication: endpoints marked `Auth` require a valid JWT (Cognito) and use guards (see `auth/`). Prefer deriving the current user from the JWT instead of passing user IDs in the request body for security.
- DynamoDB single-table: many modules use the `common/dynomodb` service and store items using single-table patterns (PK/SK). See `src/common/dynomodb/dynomodb.service.ts`.
- File uploads: use multipart form field name `file` to upload files (controller: `src/files/files.controller.ts`).
- Emails: this project uses the `EmailsService` which was migrated to Resend; ensure `RESEND_API_KEY` is provided in the runtime environment.

Contents
- Notifications (/notification)
- Emails (/email)
- Files (/files)
- Items (/items)
- Jobs (/jobs)
- Bidding (/bid)
- Payments (/payments)
- Profiles (/profiles, /contractors, /suppliers, /admins)
- Users (/users)
- Auth (/auth)
- Rentals (/rental)
- Test DB (/test-db)

---

## Notifications
Controller: `src/notifications/notification.controller.ts`
Service: `src/notifications/notifications.service.ts`
Repository: `src/notifications/notifications.repository.ts`

- POST /notification
  - Summary: Create a notification for a user (user-scoped item)
  - Body (CreateUserNotificationDto):
    - user_id: string (required)
    - type: string (required)
    - message: string (required)
    - is_read?: boolean
  - Response: Partial Notification { PK, SK, type, message, is_read }
  - Auth: none by default (recommend deriving user from JWT in production)

- GET /notification/:userId/unread-count
  - Summary: Return the unread notification count for a user
  - Response: number (count)
  - Auth: none by default (recommend protected)

- GET /notification/:userId
  - Summary: List notifications for the user (most recent first)
  - Response: Notification[] (see entity below)
  - Auth: none by default (recommend protected)

- PATCH /notification/:userId/:sk/read
  - Summary: Mark a notification (by SK) as read for the given user
  - Response: { success: true }
  - Implementation note: Repository currently uses a PutCommand that overwrites the item; recommended change: use UpdateCommand to set `is_read = true` and `updated_at` while preserving other attributes.

Entity shape: `src/notifications/entities/notification.entity.ts`
- notification_id: string
- user_id: string
- message: string
- is_read: boolean
- created_at: string (ISO)
- type?: string
- PK?: string
- SK?: string

---

## Emails
Controller: `src/emails/emails.controller.ts`
Service: `src/emails/emails.service.ts`
DTO: `src/emails/dto/create-email.dto.ts`

- POST /email
  - Summary: Send an email (uses `EmailsService` which integrates with Resend)
  - Body (CreateEmailDto): typically includes `to`, `subject`, `body` (see DTO file)
  - Response: persisted email record or provider response (implementation-specific)
  - Auth: none by default; secure as needed
  - Note: Ensure `RESEND_API_KEY` is set in environment for Resend client to work.

---

## Files
Controller: `src/files/files.controller.ts`
Service: `src/files/files.service.ts`

- POST /files
  - Summary: Upload a single file to S3 (or provider)
  - Request: multipart/form-data with field `file` (Express.Multer.File)
  - Response: metadata including object key
  - Auth: optional (depends on service)

- GET /files/:key
  - Summary: Get a presigned URL or download for the file identified by `key`
  - Response: URL (string)

---

## Items
Controller: `src/item/item.controller.ts`
Service: `src/item/item.service.ts`

- POST /items
  - Create an item for the authenticated supplier
  - Auth: JWT required (JwtAuthGuard)
  - Body: `CreateItemDto` (see `src/item/dto`)

- GET /items
  - List items; optional query `status`

- GET /items/supplier/:supplierId
  - List items for a supplier

- GET /items/supplier/:supplierId/:itemId
  - Get a supplier's specific item

- PUT /items/supplier/:supplierId/:itemId
  - Update item (JWT required)

- PATCH /items/supplier/:supplierId/:itemId/status
  - Change availability status (JWT required)

- DELETE /items/supplier/:supplierId/:itemId
  - Soft-delete an item (JWT required, supplier)

- GET /items/:itemId
  - Public item lookup by itemId (GSI)

---

## Jobs
Controller: `src/job/job.controller.ts`

- POST /jobs
  - Create a job (contractor identity from JWT)
  - Auth: JWT required

- GET /jobs/contractor
  - List jobs for authenticated contractor (JWT required)

- GET /jobs/:jobId
  - Get job by ID

- GET /jobs/nearby?latitude=&longitude=&radiusKm=
  - Get nearest jobs; query params required

---

## Bidding
Controller: `src/bid/bid.controller.ts`

- POST /bid/auction
  - Create an auction (JWT required)

- POST /bid/place
  - Place a bid (JWT required)

- GET /bid/stream/:jobId
  - SSE stream proxy for auction updates

- POST /bid/webhook/:tenantId
  - Webhook receiver for bidding microservice events (no JWT)

- Legacy proxy endpoints exist under `/bid` for backwards compatibility.

---

## Payments
Controller: `src/payment/payment.controller.ts`

- POST /payments
  - Place a payment (returns HTML or redirect)

- POST /payments/notify
  - Webhook/notification endpoint for external payment provider

- GET /payments/success and /payments/cancel
  - Short informational pages

- GET /payments
  - List payments

- GET /payments/:id
  - Get payment by UUID

- PUT /payments/:id
  - Update payment details

- DELETE /payments/:id
  - Delete payment

---

## Profiles
Controller: `src/profiles/profiles.controller.ts`

- GET /profiles
  - List profiles (JWT required)

- GET /profiles/user/:userId
  - Get profile for a user

- POST /profiles
  - Create profile (JWT required)

- GET /profiles/:id, PUT /profiles/:id, DELETE /profiles/:id
  - CRUD for profiles (JWT required)

- PATCH /profiles/:profileId/verification-status
  - Admin-only verification status update

- GET /contractors/:id, /suppliers/:id, /admins/:id
  - Convenience endpoints for role-specific profiles

- POST /profiles/:userId/business-license/upload-url
- GET /profiles/:userId/business-license/download-url
  - S3 pre-signed URL helpers

---

## Users
Controller: `src/users/users.controller.ts`

- GET /users
  - Admin-only list (supports role/status filters and pagination)

- GET /users/:id
  - Get user by id (JWT required)

- POST /users
  - Admin-only create user

- PUT /users/:id
  - Update a user (JWT required)

- DELETE /users/:id
  - Admin-only delete

---

## Auth
Controller: `src/auth/auth.controller.ts`

- POST /auth/register
- POST /auth/login
- POST /auth/verify
- POST /auth/verify/resend
- POST /auth/admin/confirm
- POST /auth/logout
- POST /auth/token/refresh
- POST /auth/password/reset/request
- POST /auth/password/reset/confirm

Notes: Uses JWTs and supports refresh/password flows. See `src/auth` for DTOs and guards.

---

## Rentals
Controller: `src/rental/rental.controller.ts`

- POST /rental
  - Create a rental

- GET /rental/contractor?contractorId=
 - GET /rental/supplier?supplierId=
  - Queries by contractor/supplier

- GET /rental/:rentalId
  - Get rental details

---

## Test DB
Controller: `src/test-db/test-db.controller.ts`

- GET /test-db
  - Returns a simple string indicating DynamoDB availability

- POST /test-db
  - Inserts a test item into DynamoDB (used for local/dev testing)

---

## How to run & test
- Install dependencies: `npm install`
- Typecheck: `npx tsc -p tsconfig.build.json --noEmit`
- Build: `npm run build`
- Start (dev): `npm run start:dev`
- Tests: `npm test`

---

If you'd like, I can:
- Emit this file into the repository (I can add `API_DOCUMENTATION.md`).
- Generate a small OpenAPI/Swagger YAML snippet or improve Swagger decorators across controllers.
- Add examples for request/response bodies for key endpoints.

Requested next action: confirm whether you want this document saved into the repo (I can add it now), and whether you want OpenAPI/Swagger JSON generated from code decorators.
