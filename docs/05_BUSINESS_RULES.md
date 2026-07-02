# Meridian OS
# Business Rules Specification

Version: 1.0.0

Status: Draft

---

# Purpose

This document defines the business rules governing Meridian OS.

Business Rules describe how the application behaves regardless of user interface or database implementation.

These rules are mandatory.

Neither developers nor AI assistants should violate these rules without updating this document.

---

# Core Principles

Business rules always take precedence over implementation.

The UI may change.

The database may change.

The framework may change.

The business rules remain the same.

---

# Rule Categories

Business Rules are grouped into:

- Authentication
- Authorization
- Documents
- Campaigns
- Content
- Media
- Prompt Library
- CRM
- AI
- Notifications
- Search
- Versioning
- Auditing
- System Settings

---

# Authentication Rules

## BR-001

Every user must authenticate before accessing Meridian OS.

---

## BR-002

Only active accounts may sign in.

---

## BR-003

Archived users cannot authenticate.

---

## BR-004

Suspended users lose access immediately.

---

## BR-005

Every login creates an audit log.

---

# Authorization Rules

## BR-100

Every action requires permission.

---

## BR-101

Permissions are evaluated server-side.

---

## BR-102

The UI must never be considered a security boundary.

---

## BR-103

Only the Owner can delete the workspace.

---

## BR-104

Administrators cannot modify Owner accounts.

---

## BR-105

Editors cannot manage users.

---

## BR-106

Viewers cannot modify data.

---

# Dashboard Rules

## BR-200

Dashboard layouts are stored per user.

---

## BR-201

Changing dashboard layout affects only that user.

---

## BR-202

Removing a widget never deletes its data.

---

# Knowledge Base Rules

## BR-300

Documents are never permanently deleted.

---

## BR-301

Deleting a document archives it.

---

## BR-302

Archived documents remain searchable by administrators.

---

## BR-303

Every save creates a version.

---

## BR-304

Restoring a previous version creates another version.

Never overwrite history.

---

## BR-305

Only approved documents may be marked official.

---

## BR-306

Comments remain attached after document edits.

---

# Campaign Rules

## BR-400

Campaign names must be unique.

---

## BR-401

Campaigns cannot overlap if explicitly marked as exclusive.

---

## BR-402

Archived campaigns cannot be edited.

---

## BR-403

Deleting a campaign archives it.

---

## BR-404

Campaign assets remain in Media Library.

Campaign deletion never deletes media.

---

## BR-405

Campaign analytics are immutable.

Historical data cannot be modified.

---

# Content Rules

## BR-500

Every content item belongs to one campaign.

---

## BR-501

Content status flow

Draft

↓

Review

↓

Approved

↓

Scheduled

↓

Published

↓

Archived

Backward transitions require permission.

---

## BR-502

Published content cannot return to Draft.

Instead create a new version.

---

## BR-503

Every publish action creates an audit record.

---

## BR-504

Deleting content archives it.

---

# Media Rules

## BR-600

Media exists independently.

---

## BR-601

Media referenced elsewhere cannot be permanently deleted.

---

## BR-602

Attempting deletion shows every dependency.

---

## BR-603

Replacing media creates a new version.

---

## BR-604

Folders do not own files.

Moving folders never breaks references.

---

## BR-605

Duplicate detection uses file checksum.

---

# Prompt Library Rules

## BR-700

AI prompts are never hardcoded.

---

## BR-701

Prompts cannot be deleted while referenced by active AI workflows.

---

## BR-702

Editing prompts creates versions.

---

## BR-703

Deprecated prompts remain searchable.

---

## BR-704

Only one active version of a prompt exists.

---

# CRM Rules

## BR-800

Duplicate contacts detected automatically.

---

## BR-801

Interaction history is immutable.

---

## BR-802

Deleting contacts archives them.

---

## BR-803

Tasks remain after contact archival.

---

# AI Rules

## BR-900

AI never performs destructive actions without confirmation.

---

## BR-901

Every AI request references Prompt Library.

---

## BR-902

AI responses remain editable.

---

## BR-903

AI never silently changes business data.

---

## BR-904

Every AI interaction is logged.

---

## BR-905

Users may regenerate responses.

Previous responses remain available.

---

## BR-906

AI costs are recorded.

---

# Search Rules

## BR-1000

Search indexes every supported module.

---

## BR-1001

Archived objects appear only when permitted.

---

## BR-1002

Search never returns unauthorized data.

---

# Version Rules

## BR-1100

Version history is immutable.

---

## BR-1101

Restoring versions creates new versions.

---

## BR-1102

Every version stores

Author

Timestamp

Summary

---

# Audit Rules

## BR-1200

Audit logs cannot be edited.

---

## BR-1201

Audit logs cannot be deleted.

---

## BR-1202

Every critical operation creates an audit record.

Examples

Login

Delete

Archive

Publish

Permission Change

AI Request

Configuration Change

---

# Settings Rules

## BR-1300

Workspace settings affect every user.

---

## BR-1301

User settings affect only that user.

---

## BR-1302

Changing branding updates every module automatically.

---

## BR-1303

Changing themes never requires deployment.

---

# Global Rules

## BR-1400

Soft delete is the default.

---

## BR-1401

Hard delete requires explicit Owner confirmation.

---

## BR-1402

Every important object supports

Search

Tags

Comments

Permissions

Activity

Version History

unless explicitly exempt.

---

## BR-1403

Every API request validates input.

---

## BR-1404

Business validation occurs before database operations.

---

## BR-1405

No module communicates directly with another module's database tables.

Communication occurs through application services.

---

## BR-1406

Every asynchronous operation provides progress feedback.

---

## BR-1407

Long-running jobs execute in the background.

---

## BR-1408

Failures never leave partial business state.

Transactions must rollback.

---

## BR-1409

System configuration must never require source code modification.

---

## BR-1410

Business logic must never exist inside React components.

---

# State Machines

## Campaign

Planning

↓

Active

↓

Completed

↓

Archived

Allowed

Planning → Active

Active → Completed

Completed → Archived

---

## Content

Draft

↓

Review

↓

Approved

↓

Scheduled

↓

Published

↓

Archived

---

## Document

Draft

↓

Published

↓

Archived

---

## Task

Todo

↓

In Progress

↓

Blocked

↓

Completed

↓

Archived

---

# Business Invariants

The following must always remain true.

- Every user has one role.
- Every campaign has one owner.
- Every content item belongs to one campaign.
- Every audit log is immutable.
- Every version has an author.
- Every uploaded file belongs to Media Library.
- Every AI request references a prompt.
- Every setting has one authoritative value.

Violation of these invariants indicates a system defect.

---

# Acceptance Criteria

✓ No business rule is enforced solely by the UI.

✓ Business rules are testable.

✓ Business rules remain independent of framework.

✓ State transitions are validated.

✓ Invalid transitions are rejected.

✓ Rules are documented before implementation.

---

# End of Business Rules