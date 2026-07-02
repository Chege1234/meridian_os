# Meridian OS
# Database Design Specification

Version: 1.0.0

Status: Draft

---

# Purpose

This document defines the logical database architecture for Meridian OS.

It specifies every entity, relationship, naming convention, indexing strategy, security rule, migration guideline, and scalability consideration.

This document is the single source of truth for the database.

---

# Database Technology

Database

PostgreSQL (Supabase)

ORM

Drizzle ORM

Migration Tool

Drizzle Kit

Authentication

Supabase Auth

Storage

Supabase Storage

Realtime

Supabase Realtime

---

# Database Design Principles

The database shall follow these principles.

- Normalized
- Secure
- Extensible
- Performant
- Auditable
- Versioned
- Soft Delete by Default
- UUID Primary Keys

---

# Naming Conventions

Tables

snake_case

Example

users

campaigns

documents

media_assets

---

Columns

snake_case

Example

created_at

updated_at

created_by

is_archived

---

Primary Keys

id UUID

Every table.

---

Foreign Keys

table_id

Examples

campaign_id

user_id

media_id

---

Booleans

Prefix

is_

has_

Examples

is_active

is_deleted

has_thumbnail

---

Timestamps

Every table shall include

created_at

updated_at

---

Soft Delete

Every major table shall include

deleted_at

deleted_by

Rows are never permanently deleted unless explicitly requested.

---

# Core Entities

Version 1 includes

Users

Roles

Permissions

Documents

Campaigns

Content

Media

Prompts

Analytics

Contacts

SOPs

Notifications

Tags

Categories

Comments

Activity Logs

Settings

AI Conversations

Tasks

Templates

Brand Assets

---

# Users

Purpose

Store authenticated users.

Fields

id

email

full_name

username

avatar

role_id

status

created_at

updated_at

last_login

Relationships

One Role

Many Documents

Many Campaigns

Many Comments

Many Tasks

Many Activity Logs

---

# Roles

Fields

id

name

description

is_system

created_at

Relationships

Many Users

Many Permissions

---

# Permissions

Fields

id

name

description

module

Relationships

Many Roles

---

# Documents

Purpose

Knowledge Base.

Fields

id

title

slug

content

summary

category_id

author_id

status

version

created_at

updated_at

deleted_at

Relationships

Many Comments

Many Tags

Many Attachments

---

# Campaigns

Fields

id

name

description

status

objective

budget

start_date

end_date

owner_id

Relationships

Many Content Items

Many Assets

Many Tasks

Many Analytics

---

# Content

Fields

id

campaign_id

platform

type

caption

status

publish_date

author_id

Relationships

Many Media

Many Versions

---

# Media Assets

Fields

id

filename

storage_path

mime_type

size

uploaded_by

checksum

width

height

duration

created_at

Relationships

Used by many modules.

---

# Prompt Library

Fields

id

title

description

prompt

variables

provider

version

status

usage_count

created_by

Relationships

Many AI Conversations

---

# CRM Contacts

Fields

id

name

organization

email

phone

status

notes

created_at

Relationships

Many Interactions

Many Tasks

---

# SOPs

Fields

id

title

content

category

difficulty

estimated_time

status

version

Relationships

Many Attachments

Many Comments

---

# Activity Logs

Fields

id

user_id

action

module

entity

entity_id

metadata

ip_address

created_at

Purpose

Immutable audit history.

---

# Notifications

Fields

id

user_id

title

body

type

read_at

created_at

---

# Tags

Fields

id

name

color

---

# Categories

Fields

id

name

parent_id

icon

description

---

# Comments

Fields

id

user_id

entity

entity_id

content

parent_id

created_at

Supports threaded comments.

---

# AI Conversations

Fields

id

user_id

provider

model

prompt_id

input

response

token_usage

estimated_cost

created_at

---

# Tasks

Fields

id

title

description

priority

status

due_date

assigned_to

created_by

completed_at

---

# Templates

Fields

id

title

category

content

variables

version

status

---

# Brand Assets

Fields

id

name

type

media_id

version

description

---

# Settings

Fields

id

key

value

type

description

editable

Settings shall be key-value based.

---

# Relationship Rules

Users

↓

Create

Documents

Campaigns

Content

Media

Tasks

Comments

Prompts

Activity Logs

Campaigns

↓

Contain

Content

Tasks

Analytics

Assets

Knowledge

↓

Contains

Documents

Comments

Tags

Attachments

Media

↓

Referenced

Never duplicated.

---

# Indexing Strategy

Create indexes for

email

slug

created_at

updated_at

status

category_id

user_id

campaign_id

provider

checksum

Frequently searched fields shall always be indexed.

---

# Constraints

Emails unique.

Usernames unique.

Slugs unique.

Foreign Keys enforced.

Required fields NOT NULL.

UUID generated automatically.

---

# Transactions

Use transactions for

Campaign Creation

Content Publishing

User Invitation

Role Assignment

AI Billing

Media Upload Registration

---

# Audit Rules

Every update records

Who

When

What Changed

Old Value

New Value

No critical table shall bypass auditing.

---

# Versioning

Version the following

Documents

Prompts

Templates

Brand Assets

SOPs

Content

Campaigns

Never overwrite important business data.

---

# Backup Strategy

Daily Backups

Point-in-Time Recovery

Restore Testing Monthly

---

# Row Level Security

Enable RLS on every table.

Every query must respect authentication.

Policies shall follow least privilege.

---

# Future Tables

Reserved for Version 2

Teams

Projects

Workflow Engine

Automation Rules

API Keys

Marketplace Integrations

Plugins

Webhooks

Invoices

Feature Flags

---

# Acceptance Criteria

✓ UUID primary keys everywhere.

✓ RLS enabled.

✓ Foreign keys enforced.

✓ Soft deletes supported.

✓ Version history supported.

✓ Audit logs immutable.

✓ Database normalized.

✓ Performance indexes created.

✓ Future expansion supported.

---

# End of Database Design