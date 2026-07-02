# Meridian OS
# System Architecture

Version: 1.0.0

Status: Draft

---

# Purpose

This document defines the software architecture of Meridian OS.

It specifies how every component of the application should be organized, communicate, scale, and evolve.

This document exists to ensure every engineer and every AI coding assistant follows the same architectural rules.

No implementation should violate this architecture without updating this document first.

---

# Architecture Goals

The architecture must satisfy the following objectives.

- Scalable
- Modular
- Maintainable
- Testable
- Secure
- Performant
- AI-Friendly
- Developer Friendly

---

# Architectural Principles

## 1. Feature First

The application is organized around business features.

NOT around file types.

Avoid structures like

/components

/pages

/hooks

for every feature.

Instead

features/

dashboard/

crm/

campaigns/

analytics/

Each feature owns everything it needs.

---

## 2. Separation of Concerns

Presentation

↓

Business Logic

↓

Services

↓

Database

No component should directly access the database.

---

## 3. Composition over Inheritance

Favor reusable components.

Avoid deep inheritance.

---

## 4. Configuration over Hardcoding

Anything likely to change belongs in configuration.

Examples

Sidebar

Dashboard Widgets

AI Models

Prompt Templates

Categories

Tags

Themes

Roles

Notification Types

Never hardcode business data.

---

## 5. Server First

Use Next.js Server Components whenever possible.

Client Components should only exist when necessary.

Examples

Forms

Animations

Drag & Drop

Rich Text Editors

---

## 6. API Isolation

No UI component should know how Supabase works.

Every database interaction goes through Services.

---

# Technology Stack

## Frontend

Next.js 15

React

TypeScript

TailwindCSS

shadcn/ui

Framer Motion

TanStack Query

React Hook Form

Zod

---

## Backend

Supabase

PostgreSQL

Supabase Auth

Supabase Storage

Supabase Realtime

---

## Deployment

Vercel

GitHub

GitHub Actions

---

## AI

OpenAI

Claude

Gemini

---

# High Level Architecture

Browser

↓

Next.js

↓

Application Layer

↓

Feature Layer

↓

Service Layer

↓

Supabase

↓

Database

↓

Storage

↓

Realtime

↓

AI Providers

Every request follows this pipeline.

---

# Application Layers

## Presentation Layer

Contains

Pages

Layouts

Components

Forms

Dialogs

Animations

Responsibilities

Display information.

Collect user input.

Nothing else.

---

## Feature Layer

Contains

Dashboard

CRM

Analytics

Campaigns

Knowledge Base

Media Library

Content Studio

Responsibilities

Business workflows.

State coordination.

Feature-specific logic.

---

## Service Layer

Contains

Business services.

Every feature communicates with the database only through services.

Example

CampaignService

MediaService

AnalyticsService

CRMService

---

## Infrastructure Layer

Responsible for

Supabase

Storage

Authentication

Realtime

AI Providers

Email

External APIs

---

# Folder Structure

app/

components/

features/

services/

lib/

hooks/

providers/

stores/

schemas/

types/

utils/

config/

styles/

public/

tests/

docs/

scripts/

middleware.ts

---

# Feature Structure

Every feature follows the same architecture.

Example

features/

campaigns/

components/

hooks/

services/

schemas/

types/

utils/

pages/

Every feature owns itself.

Avoid shared logic unless truly reusable.

---

# Shared Components

Shared components belong only if reused by multiple features.

Examples

Button

Modal

Table

Input

Card

Dropdown

Avatar

Breadcrumb

Toast

Everything else stays inside its feature.

---

# State Management

Local State

useState

UI only.

---

Server State

TanStack Query.

---

Global State

Zustand.

Only for

Theme

Sidebar

Current User

Preferences

Avoid putting business data into global state.

---

# Routing

Use App Router.

Every feature owns its routes.

Example

/dashboard

/campaigns

/content

/media

/crm

/settings

---

# Data Flow

User

↓

UI

↓

Validation

↓

Service

↓

Database

↓

Response

↓

UI

No shortcuts.

---

# Validation

Every request must be validated.

Client validation.

Server validation.

Database validation.

Never trust client input.

---

# Error Handling

Every service returns

Success

or

Error

Never throw raw database errors into UI.

Use consistent error responses.

---

# Logging

Log

Authentication

CRUD Operations

AI Requests

Configuration Changes

Permission Changes

Errors

Uploads

Exports

---

# Authentication

Supabase Auth

Protected Routes

Middleware

Session Refresh

Role Checking

Permission Checking

Every route requiring authentication must use middleware.

---

# Authorization

Every action requires permission.

Permissions checked

Server Side.

Never trust the frontend.

---

# Storage

All uploads stored in Supabase Storage.

Folders

brand/

campaigns/

media/

documents/

avatars/

exports/

Uploads never stored locally.

---

# AI Architecture

Every AI request flows through

AI Gateway

↓

Provider Router

↓

Prompt Engine

↓

Context Builder

↓

Model

↓

Response

The frontend never communicates directly with providers.

---

# Prompt Engine

All prompts stored in Prompt Library.

No hardcoded prompts.

Every prompt versioned.

---

# Search

One Global Search.

Every feature indexed.

Future semantic search supported.

---

# Notifications

Notification Service

↓

In App

↓

Toast

↓

Future Email

↓

Future Push

---

# Background Jobs

Support

AI Generation

Image Processing

Report Generation

Future Queue Workers

Architecture must support asynchronous processing.

---

# Security

Use HTTPS.

Validate every request.

Sanitize every input.

Protect against

XSS

CSRF

SQL Injection

Rate Limiting

Session Hijacking

---

# Performance

Server Components first.

Lazy Loading.

Code Splitting.

Image Optimization.

Streaming.

Pagination.

Virtual Lists.

Caching.

---

# Testing Strategy

Every feature requires

Unit Tests

Integration Tests

End-to-End Tests

Accessibility Tests

Performance Tests

---

# Coding Standards

TypeScript Strict Mode.

No "any".

Small Components.

Reusable Services.

Consistent Naming.

Meaningful Commits.

No dead code.

No duplicated logic.

---

# Architectural Decision Records

Every major architectural decision receives an ADR.

Example

ADR-001

Why Next.js

ADR-002

Why Supabase

ADR-003

Why Feature First

ADR-004

Why Drizzle ORM

Future developers should understand every decision without asking.

---

# Acceptance Criteria

The architecture is complete when

✓ Every feature follows Feature First Architecture.

✓ No component accesses the database directly.

✓ Every request passes validation.

✓ Every module follows identical structure.

✓ Services are reusable.

✓ Architecture supports future expansion.

✓ AI providers can be swapped without changing business logic.

✓ Every feature can be developed independently.

---

# End of System Architecture