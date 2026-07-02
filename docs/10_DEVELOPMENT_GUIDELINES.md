# Meridian OS
# Development Guidelines

Version: 1.0.0

Status: Approved

---

# Purpose

This document defines the engineering standards for Meridian OS.

Every developer, contributor, and AI coding assistant must follow these guidelines.

Code consistency is more important than individual preference.

---

# Engineering Philosophy

The goal is not simply to write working code.

The goal is to write software that is:

- Easy to understand
- Easy to test
- Easy to extend
- Easy to maintain
- Easy to replace

Future developers should thank the original developers instead of cursing their names.

---

# Core Principles

## Readability First

Code is read more often than it is written.

Optimize for readability.

---

## Simplicity

Prefer the simplest solution.

Avoid unnecessary abstractions.

---

## Small Components

Components should have one responsibility.

If a component feels difficult to explain, split it.

---

## Small Functions

Functions should perform one task.

Preferred maximum:

40 lines

Hard maximum:

80 lines

---

## Explicit Code

Prefer

```ts
const campaignOwner = campaign.owner;
```

instead of

```ts
const c = x.o;
```

Names should explain intent.

---

## DRY

Avoid duplicated business logic.

Do not create "generic" abstractions too early.

Duplicate twice.

Abstract the third time.

---

## SOLID

Apply SOLID principles where appropriate.

Do not overengineer.

---

# TypeScript Standards

Strict Mode enabled.

Never disable strict mode.

---

## Forbidden

```ts
any
```

Use

unknown

Generics

Discriminated unions

Interfaces

Types

instead.

---

## Prefer

Readonly objects.

Immutable data.

Typed enums.

Literal types.

---

## Null Safety

Always handle

undefined

null

optional values

Never assume data exists.

---

# React Standards

Prefer Server Components.

Only use Client Components when necessary.

Examples

Forms

Animations

Browser APIs

---

## Component Rules

One responsibility.

One export.

Predictable props.

Strong typing.

Minimal logic.

---

## Props

Prefer

```ts
interface CampaignCardProps {}
```

Avoid

```ts
props: any
```

---

## Hooks

Hooks begin with

use

Examples

useCampaign

useMedia

useSearch

Never call hooks conditionally.

---

## State

Local UI

useState

Server

TanStack Query

Global

Zustand

Never duplicate state.

---

# Next.js Standards

Use App Router.

Prefer Server Actions where appropriate.

Avoid unnecessary API routes.

Use Server Components first.

---

# Clean Architecture

UI

↓

Application

↓

Domain

↓

Infrastructure

Never violate this order.

---

# Business Logic

Business logic never belongs in

React Components

Pages

Layouts

Dialogs

Move it into Use Cases.

---

# Repository Pattern

Repositories only perform

Create

Read

Update

Delete

Nothing else.

Business decisions belong elsewhere.

---

# Validation

Every request validated using Zod.

Never trust frontend validation.

---

# Error Handling

Never expose raw errors.

Return consistent error objects.

Log unexpected errors.

---

# Logging

Log

Authentication

AI

CRUD

Configuration

Permission Changes

Imports

Exports

---

# Naming Standards

Components

PascalCase

Hooks

camelCase

Folders

kebab-case

Files

camelCase unless component.

Database

snake_case

Environment

UPPER_CASE

---

# Imports

Always use aliases.

Correct

```ts
@/features/campaigns
```

Never

```ts
../../../../../
```

---

# Comments

Explain

Why

Never explain

What

---

# TODO

Avoid TODO.

Create GitHub Issues instead.

---

# Styling

TailwindCSS only.

No inline styles.

No CSS duplication.

All colors come from design tokens.

---

# Accessibility

Every feature must support

Keyboard navigation

Screen readers

Focus indicators

ARIA labels

WCAG AA

Accessibility is not optional.

---

# Performance

Lazy load heavy components.

Paginate large datasets.

Virtualize long lists.

Memoize expensive calculations.

Avoid unnecessary renders.

---

# Database

Never access Supabase directly from UI.

Always use repositories.

Never perform business validation in repositories.

---

# Security

Never expose

API Keys

Secrets

Tokens

Database credentials

Never trust client input.

---

# Testing

Every feature requires

Unit Tests

Integration Tests

End-to-End Tests

Critical business rules require automated tests.

---

# Code Coverage

Minimum

80%

Business Rules

95%

---

# Git Workflow

Branches

main

develop

feature/*

bugfix/*

hotfix/*

release/*

---

# Commit Format

feat:

fix:

docs:

refactor:

perf:

test:

build:

ci:

style:

chore:

---

# Pull Requests

Every PR includes

Summary

Screenshots

Testing

Issue Reference

Checklist

---

# Documentation

Every feature updates

README

Architecture

Business Rules

API

Database

when necessary.

Documentation is part of the feature.

---

# Refactoring

Refactor only when

Improves readability

Improves maintainability

Improves performance

Do not refactor for personal preference.

---

# Technical Debt

Technical debt must be

Documented

Tracked

Prioritized

Never hidden.

---

# AI Coding Rules

Cursor must never

- Invent database columns
- Ignore architecture
- Hardcode business values
- Skip validation
- Skip permissions
- Skip testing
- Mix business logic with UI
- Create duplicate components
- Create duplicate utilities
- Generate unused code
- Ignore accessibility
- Use `any`
- Bypass repositories

Cursor should

- Reuse existing components
- Search before creating files
- Respect folder structure
- Respect naming conventions
- Generate tests
- Generate documentation
- Follow Clean Architecture
- Prefer composition
- Produce small files

---

# Definition of Done

A feature is complete only if

✓ Functional

✓ Responsive

✓ Accessible

✓ Tested

✓ Documented

✓ Secure

✓ Permission Aware

✓ Logged

✓ Searchable

✓ Versioned

✓ Uses Design Tokens

✓ No TypeScript errors

✓ No ESLint errors

✓ No Console Errors

✓ No Dead Code

✓ Reviewed

---

# Engineering Motto

Build software as if someone far more intelligent than you will maintain it in five years.

Because they probably will.

---

# End of Development Guidelines