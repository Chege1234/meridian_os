# Meridian OS
# Repository Structure Specification

Version: 1.0.0

Status: Draft

---

# Purpose

This document defines the physical structure of the Meridian OS codebase.

Every developer and AI coding assistant must follow this structure.

The objective is to ensure that the repository remains scalable, maintainable, predictable, and easy to navigate regardless of project size.

No feature should introduce its own folder structure.

Consistency is mandatory.

---

# Repository Root

```
meridian-os/
├── app/
├── features/
├── shared/
├── infrastructure/
├── application/
├── domain/
├── config/
├── public/
├── styles/
├── docs/
├── tests/
├── scripts/
├── types/
├── middleware.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

# Root Directory Responsibilities

## app/

Contains routing only.

Never place business logic here.

Contains:

- Routes
- Layouts
- Loading UI
- Error UI
- Metadata

---

## features/

Contains every business feature.

Each feature owns:

- UI
- Use Cases
- Repository Interfaces
- Components
- Validation
- Types
- Hooks

No feature should depend directly on another feature.

Communication happens through Application Services.

---

## domain/

Contains business models.

Contains

- Entities
- Value Objects
- Business Rules
- Interfaces

Domain must never depend on React.

Domain must never depend on Next.js.

Domain must never depend on Supabase.

---

## application/

Contains application logic.

Contains

- Use Cases
- Commands
- Queries
- DTOs
- Application Services

Business workflows belong here.

---

## infrastructure/

Contains external implementations.

Examples

Supabase

Authentication

Storage

AI Providers

Logging

Analytics

Email

Repositories

Infrastructure depends on Domain.

Never the reverse.

---

## shared/

Contains reusable code.

Examples

Buttons

Cards

Tables

Dialogs

Inputs

Hooks

Utilities

Constants

Validators

Never place feature-specific code here.

---

## config/

Application configuration.

Examples

Navigation

Feature Flags

Theme

Environment

Constants

Role Definitions

Permission Definitions

---

## public/

Static assets.

Examples

Images

Fonts

Favicons

Robots.txt

Manifest

---

## styles/

Global styles.

Tailwind layers.

CSS variables.

Animations.

Typography.

---

## docs/

Engineering documentation.

Never place user documentation here.

---

## tests/

Application tests.

Contains

Unit

Integration

End-to-End

Performance

Accessibility

---

## scripts/

Development scripts.

Examples

Seed Database

Generate Types

Backup Database

Import Data

Export Data

---

## types/

Global TypeScript types.

Only truly shared types belong here.

---

# App Router Structure

```
app/

(layout)

dashboard/

campaigns/

knowledge/

content/

media/

crm/

analytics/

settings/

login/

api/
```

Each route remains extremely thin.

Business logic belongs elsewhere.

---

# Feature Structure

Every feature follows exactly the same layout.

Example

```
features/

campaigns/

components/

hooks/

application/

domain/

infrastructure/

schemas/

types/

constants/

utils/

tests/

index.ts
```

---

# Components

Components are divided into three levels.

## Level 1

Shared Components

```
shared/components/
```

Examples

Button

Modal

Dialog

Input

Avatar

Card

---

## Level 2

Feature Components

```
features/campaigns/components/
```

Examples

CampaignCard

CampaignTable

CampaignStats

CampaignTimeline

---

## Level 3

Page Components

Small components used only once.

Remain inside page folders.

---

# Hooks

Global Hooks

```
shared/hooks/
```

Feature Hooks

```
features/campaigns/hooks/
```

Never mix them.

---

# Utilities

Shared

```
shared/utils/
```

Feature

```
features/campaigns/utils/
```

---

# Validation

Every feature owns validation.

```
schemas/

createCampaign.ts

updateCampaign.ts

publishCampaign.ts
```

Validation uses Zod.

---

# Types

Shared types remain minimal.

Feature types stay inside the feature.

Avoid gigantic global type files.

---

# Application Layer

Every feature contains Use Cases.

Example

```
application/

CreateCampaign.ts

UpdateCampaign.ts

DeleteCampaign.ts

ArchiveCampaign.ts

PublishCampaign.ts
```

Each file performs one business action.

---

# Domain Layer

Contains

Entities

Interfaces

Business Rules

Example

```
Campaign.ts

CampaignRepository.ts

CampaignRules.ts
```

---

# Infrastructure Layer

Contains implementation details.

Example

```
SupabaseCampaignRepository.ts
```

Replaceable without changing business logic.

---

# Import Rules

Always import downward.

Allowed

```
UI

↓

Application

↓

Domain

↓

Infrastructure
```

Forbidden

Infrastructure importing UI.

Domain importing React.

Application importing Next.js components.

---

# Absolute Imports

Always use aliases.

Examples

```
@/features

@/shared

@/application

@/domain

@/config

@/types
```

Never use long relative paths.

Bad

```
../../../../../components
```

Good

```
@/shared/components
```

---

# Naming Conventions

Folders

kebab-case

Examples

content-studio

media-library

---

React Components

PascalCase

CampaignCard.tsx

---

Hooks

camelCase

useCampaign.ts

---

Utilities

camelCase

formatDate.ts

---

Types

PascalCase

Campaign.ts

CampaignStatus.ts

---

Constants

UPPER_CASE

DEFAULT_PAGE_SIZE

---

Environment Variables

UPPER_CASE

NEXT_PUBLIC_SUPABASE_URL

---

# Barrel Files

Every folder exposes an

index.ts

Example

```
components/

CampaignCard.tsx

CampaignTable.tsx

index.ts
```

Avoid deep imports.

---

# Testing

Every feature owns tests.

```
tests/

unit/

integration/

e2e/
```

Tests remain beside the feature.

---

# Documentation

Every feature eventually contains

README.md

Purpose

Architecture

Dependencies

Public API

Known Limitations

Future Work

---

# Dependency Rules

Allowed

Feature

↓

Application

↓

Domain

↓

Infrastructure

Forbidden

Feature

↓

Another Feature Database

---

# Circular Dependencies

Strictly prohibited.

---

# Maximum File Size

React Components

300 lines preferred

500 maximum

Application Use Cases

250 lines preferred

Repositories

400 maximum

Utilities

150 maximum

If exceeded

Split the file.

---

# Maximum Function Size

40 lines preferred

80 maximum

---

# Comments

Explain

Why

Never explain

What

Good

```ts
// Prevent duplicate campaign names because analytics rely on uniqueness.
```

Bad

```ts
// Increment i
i++;
```

---

# Git Branch Strategy

main

Production

develop

Integration

feature/*

New Features

bugfix/*

Bug Fixes

hotfix/*

Production Fixes

release/*

Release Preparation

---

# Commit Convention

feat:

fix:

refactor:

docs:

style:

test:

perf:

build:

ci:

chore:

Examples

```
feat: add campaign analytics

fix: resolve media upload validation

docs: update repository structure
```

---

# Pull Request Rules

Every PR shall include

- Summary
- Screenshots (if UI)
- Testing Notes
- Related Issue
- Checklist

---

# Code Review Checklist

Reviewer verifies

- Architecture followed
- Naming conventions
- Tests added
- Accessibility maintained
- Performance considered
- No duplicated logic
- No hardcoded business data
- Documentation updated

---

# Definition of Repository Health

A healthy repository has:

- Consistent folder structure
- Zero circular dependencies
- Small reusable components
- Feature isolation
- Strong typing
- Minimal duplication
- Clear documentation
- Reliable tests

---

# Acceptance Criteria

✓ Every feature follows identical structure.

✓ Imports use aliases.

✓ No business logic in UI.

✓ Infrastructure isolated.

✓ Feature boundaries respected.

✓ Repository remains predictable.

✓ New developers understand the project within one hour.

---

# End of Repository Structure Specification