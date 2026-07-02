# Meridian OS Blueprint

Version: 1.0.0

---

# Mission

Meridian OS is the internal operating system that powers all current and future products owned by the company.

Version 1 focuses on Campus Marketplace.

Future modules such as Smart Queue, CRM, Finance, HR, Inventory, Projects, Automation and AI Agents will be added without changing the core architecture.

Meridian OS must remain modular, scalable and maintainable for the next 10+ years.

---

# Engineering Philosophy

Always optimise for:

- Simplicity
- Maintainability
- Security
- Performance
- Scalability
- Developer Experience

Readable code is more important than clever code.

---

# Technology Stack

Framework:
Next.js 15

Language:
TypeScript

Styling:
Tailwind CSS

UI:
shadcn/ui

Backend:
Supabase

Database:
PostgreSQL

ORM:
Drizzle ORM

Authentication:
Supabase Auth

State:
Zustand

Server State:
TanStack Query

Validation:
Zod

Animation:
Framer Motion

Icons:
Lucide

Charts:
Recharts

Testing:
Vitest
Playwright

Deployment:
Vercel

---

# Architecture

The application follows Clean Architecture.

UI

↓

Application

↓

Domain

↓

Infrastructure

Business logic never belongs inside React components.

Database access only occurs inside repositories.

---

# Repository Rules

Every feature must be isolated.

Each feature owns its:

- Components
- Hooks
- Use Cases
- Repository
- Types
- Validation
- Tests

Never place feature-specific code in shared.

---

# Development Rules

Always:

- Search before creating files.
- Reuse existing components.
- Reuse existing utilities.
- Use strict TypeScript.
- Generate tests.
- Follow documented architecture.

Never:

- Use any.
- Hardcode business values.
- Duplicate code.
- Mix UI and business logic.
- Ignore accessibility.
- Ignore security.

---

# UI Philosophy

Inspired by:

- Linear
- Vercel
- Stripe
- Notion
- Raycast

The interface should feel:

- Fast
- Minimal
- Premium
- Professional

---

# Design Rules

Use design tokens.

Never hardcode:

- Colours
- Font sizes
- Border radius
- Shadows
- Spacing

Dark mode required.

Mobile responsive.

WCAG AA compliant.

---

# Security Rules

Validate every request.

Use Row Level Security.

Never expose secrets.

Never trust frontend input.

Always validate server-side.

---

# AI Rules

Before generating code:

1. Read the documentation.
2. Understand the feature.
3. Search existing code.
4. Reuse patterns.
5. Keep files small.
6. Generate tests.
7. Update documentation.

Never invent architecture.

---

# Goal

Meridian OS should become a world-class internal operating system capable of supporting multiple businesses without requiring major architectural rewrites.