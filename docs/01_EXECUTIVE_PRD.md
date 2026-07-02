# Meridian OS
## Executive Product Requirements Document (PRD)

**Version:** 1.0.0  
**Status:** Draft  
**Author:** Lewis Chege  
**Project:** Meridian OS  
**Repository:** meridian-os  
**Last Updated:** July 2026

---

# Executive Summary

Meridian OS is the internal operating system built exclusively to power the operations of Campus Marketplace.

It is **not** the public marketplace used by students.

Instead, Meridian OS serves as the central headquarters where every internal business operation is managed. It consolidates knowledge, marketing, AI, analytics, documentation, campaigns, brand assets, customer relationships, media, workflows, and operational processes into a single unified platform.

Rather than relying on multiple disconnected tools such as Notion, Trello, Google Drive, Google Docs, ChatGPT history, spreadsheets, and scattered folders, Meridian OS provides one cohesive environment where the business can operate efficiently.

The long-term objective is simple:

> Every internal business activity should begin and end inside Meridian OS.

---

# Vision

To build the world's most efficient operating system for managing and scaling digital businesses, beginning with Campus Marketplace.

Meridian OS should empower a small team to perform the work traditionally requiring multiple departments through intelligent automation, AI assistance, standardized workflows, and centralized information.

---

# Mission

Create a beautiful, AI-first operating system that becomes the single source of truth for every aspect of Campus Marketplace.

The platform should reduce operational friction, eliminate duplicated work, preserve institutional knowledge, and provide complete visibility into the business.

---

# Problem Statement

As companies grow, information becomes fragmented.

Marketing assets are stored in one platform.

Documents exist somewhere else.

Analytics are scattered across dashboards.

Prompts disappear inside AI chat history.

Campaigns are tracked in spreadsheets.

Knowledge lives inside employees' heads.

The result is:

- duplicated work
- inconsistent processes
- poor documentation
- lost knowledge
- slower decision making
- unnecessary software costs

Meridian OS exists to eliminate this fragmentation.

---

# Objectives

Meridian OS must enable Campus Marketplace to:

- Manage all marketing activities.
- Store and organize company knowledge.
- Build and manage campaigns.
- Manage AI prompts.
- Generate content using AI.
- Store media assets.
- Track analytics.
- Manage contacts and relationships.
- Maintain SOPs.
- Organize documents.
- Manage projects.
- Centralize operational data.

Everything should exist in one ecosystem.

---

# Non-Goals

Meridian OS is **not** intended to become:

- The public marketplace
- An online shopping platform
- A payment processor
- An ERP
- Accounting software
- HR software
- A university portal

These systems may integrate with Meridian OS but should remain separate products.

---

# Target Users

### Primary Users

- Founder
- Administrators
- Marketing Team
- Operations Team

### Secondary Users

Future employees.

Future contractors.

Future interns.

Future agencies.

---

# Success Criteria

Meridian OS will be considered successful when it achieves the following:

- Every internal document is stored inside Meridian OS.
- Every campaign is planned inside Meridian OS.
- Every marketing asset is managed inside Meridian OS.
- Every AI prompt is centrally stored.
- Every SOP is documented.
- Every business process is searchable.
- Team members rarely need external productivity software.

---

# Product Philosophy

Meridian OS follows six core philosophies.

## 1. Everything Editable

Business owners should never modify source code to change business logic.

If something is likely to change over time, it should be configurable through the interface.

Examples include:

- AI prompts
- Branding
- Themes
- Forms
- Dashboard layouts
- Sidebar navigation
- Widgets
- Templates
- Categories
- Tags
- Workflows

---

## 2. Everything Searchable

Every important object inside Meridian OS must be searchable.

Including:

- Documents
- Images
- Videos
- Campaigns
- Contacts
- Prompts
- SOPs
- Templates
- Notes
- Comments

Search should become the fastest way to find information.

---

## 3. Everything Versioned

Important resources must maintain complete version history.

Supported objects include:

- Documents
- Templates
- Prompts
- Brand Assets
- Campaigns
- SOPs
- Settings

Users should always be able to restore previous versions.

---

## 4. AI First

Every module should expose AI functionality wherever appropriate.

Examples include:

- Generate
- Rewrite
- Summarize
- Brainstorm
- Analyze
- Translate
- Improve
- Explain

AI should function as an assistant rather than replacing user control.

---

## 5. Modular Architecture

Every feature should exist as an independent module.

Modules must communicate through clearly defined interfaces while remaining loosely coupled.

This allows future expansion without major rewrites.

---

## 6. Beautiful by Default

Meridian OS should feel like premium software.

Design inspiration includes:

- Linear
- Notion
- Vercel
- Stripe Dashboard
- Raycast
- Arc Browser

The interface should emphasize:

- simplicity
- speed
- whitespace
- consistency
- clarity

---

# Core Principles

Every engineering decision should follow these principles.

## Single Source of Truth

Information should exist only once.

No duplicated documentation.

No duplicated prompts.

No duplicated assets.

---

## Standardization

Every recurring process should eventually become an SOP.

---

## Automation

If a repetitive task can be automated safely, it should be.

---

## Simplicity

Avoid unnecessary complexity.

Simple systems scale better.

---

## Scalability

Every architectural decision should support future expansion.

Avoid shortcuts that create technical debt.

---

## Security

Security should never be an afterthought.

Every module must respect authentication, authorization, audit logs, backups, and permissions.

---

# Initial Modules

Version 1 of Meridian OS includes:

- Dashboard
- Knowledge Base
- Content Studio
- Campaign Center
- Brand Center
- Media Library
- Prompt Library
- CRM
- Analytics
- SOP Library
- AI Assistant
- Settings

Each module will receive its own detailed specification document.

---

# Approved Technology Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Supabase Realtime

## Validation

- Zod

## ORM

- Drizzle ORM

## Deployment

- Vercel

## Repository

- GitHub

## AI Providers

The architecture must support multiple providers.

Initial support includes:

- OpenAI
- Anthropic Claude
- Google Gemini

Additional providers should be pluggable.

---

# Definition of Done

A feature is considered complete only when:

- Functional
- Responsive
- Accessible
- Tested
- Documented
- Versioned
- Searchable
- Permission-aware
- Audit logged
- AI-enabled where appropriate

---

# Guiding Principle

Meridian OS is not simply another dashboard.

It is the operational brain of Campus Marketplace.

Every design decision, architectural choice, and feature implementation should move the platform closer to becoming the single source of truth for the business.

When faced with multiple implementation options, choose the solution that maximizes maintainability, extensibility, clarity, and long-term scalability.

---

**End of Document**