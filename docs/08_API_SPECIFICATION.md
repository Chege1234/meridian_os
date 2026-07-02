# Meridian OS
# API Specification

Version: 1.0.0

Status: Draft

---

# Purpose

This document defines the API architecture for Meridian OS.

The objective is to provide a predictable, secure, versioned API that can support the web application, future mobile applications, integrations, automation, and third-party services.

The API shall remain stable even if the frontend changes.

---

# API Design Principles

The API shall be:

- RESTful
- Versioned
- Secure
- Predictable
- Idempotent where appropriate
- Consistently documented
- Backward compatible whenever possible

---

# Base URL

Development

```
http://localhost:3000/api/v1
```

Production

```
https://meridian.company/api/v1
```

Every endpoint belongs to Version 1.

Future breaking changes require

```
/api/v2
```

---

# Authentication

Authentication uses Supabase JWT.

Every protected endpoint requires

```
Authorization: Bearer <token>
```

Unauthenticated requests receive

```
401 Unauthorized
```

---

# Authorization

Every endpoint checks permissions.

Example

Create Campaign

↓

Permission

campaign.create

Delete Media

↓

Permission

media.delete

Never rely on frontend authorization.

---

# Standard Request Structure

POST

```json
{
  "data": {}
}
```

---

# Standard Success Response

```json
{
  "success": true,
  "message": "Campaign created successfully.",
  "data": {},
  "meta": {}
}
```

---

# Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campaign name is required."
  }
}
```

Never expose stack traces.

---

# HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

429 Too Many Requests

500 Internal Server Error

---

# Pagination

Standard

```
?page=1&limit=20
```

Response

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

# Filtering

Example

```
?status=active
```

```
?category=marketing
```

```
?owner=123
```

Multiple filters supported.

---

# Sorting

Example

```
?sort=created_at
```

Descending

```
?sort=-created_at
```

---

# Searching

Example

```
?q=campaign
```

Global search endpoint

```
GET /search
```

---

# Validation

Every request validated using Zod.

Validation occurs before business logic.

---

# Rate Limiting

Anonymous

100 requests/hour

Authenticated

1000 requests/hour

AI endpoints

Lower limits configurable.

---

# Endpoint Groups

Authentication

Users

Campaigns

Knowledge Base

Content Studio

Media Library

Brand Center

CRM

Analytics

Prompt Library

SOP Library

AI

Settings

Search

Notifications

Activity Logs

---

# Authentication Endpoints

POST

```
/auth/login
```

POST

```
/auth/logout
```

POST

```
/auth/refresh
```

GET

```
/auth/me
```

---

# User Endpoints

GET

```
/users
```

GET

```
/users/{id}
```

POST

```
/users
```

PATCH

```
/users/{id}
```

DELETE

```
/users/{id}
```

---

# Campaign Endpoints

GET

```
/campaigns
```

GET

```
/campaigns/{id}
```

POST

```
/campaigns
```

PATCH

```
/campaigns/{id}
```

DELETE

```
/campaigns/{id}
```

POST

```
/campaigns/{id}/archive
```

POST

```
/campaigns/{id}/restore
```

---

# Content Endpoints

GET

```
/content
```

POST

```
/content
```

PATCH

```
/content/{id}
```

POST

```
/content/{id}/approve
```

POST

```
/content/{id}/publish
```

---

# Media Endpoints

GET

```
/media
```

POST

```
/media/upload
```

GET

```
/media/{id}
```

PATCH

```
/media/{id}
```

DELETE

```
/media/{id}
```

---

# Knowledge Base

GET

```
/documents
```

POST

```
/documents
```

PATCH

```
/documents/{id}
```

DELETE

```
/documents/{id}
```

POST

```
/documents/{id}/restore
```

---

# Prompt Library

GET

```
/prompts
```

POST

```
/prompts
```

PATCH

```
/prompts/{id}
```

DELETE

```
/prompts/{id}
```

---

# CRM

GET

```
/contacts
```

POST

```
/contacts
```

PATCH

```
/contacts/{id}
```

DELETE

```
/contacts/{id}
```

---

# Analytics

GET

```
/analytics/dashboard
```

GET

```
/analytics/campaigns
```

GET

```
/analytics/content
```

GET

```
/analytics/users
```

---

# AI

POST

```
/ai/chat
```

POST

```
/ai/generate
```

POST

```
/ai/rewrite
```

POST

```
/ai/summarize
```

POST

```
/ai/translate
```

GET

```
/ai/history
```

---

# Search

GET

```
/search
```

Supports

Query

Filters

Pagination

Permissions

---

# Notifications

GET

```
/notifications
```

PATCH

```
/notifications/read
```

PATCH

```
/notifications/read-all
```

---

# Activity Logs

GET

```
/activity
```

Filtering supported.

---

# API Versioning

Breaking changes require

Version Increment

Deprecated endpoints remain available for one major release.

---

# Error Codes

VALIDATION_ERROR

UNAUTHORIZED

FORBIDDEN

NOT_FOUND

CONFLICT

RATE_LIMIT

INTERNAL_ERROR

UNKNOWN_ERROR

---

# Idempotency

The following endpoints shall support idempotency keys

Create Campaign

Upload Media

Invite User

AI Billing

Exports

---

# Caching

GET endpoints may be cached.

Mutation endpoints shall never be cached.

---

# Logging

Every request logs

Timestamp

User

Endpoint

Response Time

Status Code

IP

Request ID

---

# OpenAPI

The API shall generate an OpenAPI specification automatically.

Swagger documentation generated during development.

---

# Acceptance Criteria

✓ Every endpoint documented.

✓ Authentication enforced.

✓ Validation applied.

✓ Errors standardized.

✓ Versioning supported.

✓ Logging enabled.

✓ Future expansion possible.

---

# End of API Specification