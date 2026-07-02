# Meridian OS
# UI / UX Specification

Version: 1.0.0

Status: Draft

---

# Purpose

This document defines the visual language, user experience principles, interaction patterns, design system, layouts, navigation, and interface behavior of Meridian OS.

Every screen in the application must follow this specification.

Consistency is considered a feature.

---

# Design Philosophy

Meridian OS should feel like professional software.

The interface should immediately communicate:

- Speed
- Precision
- Confidence
- Simplicity
- Modernity

Users should never feel overwhelmed.

Every interface element must have a purpose.

If removing an element improves clarity, remove it.

---

# Design Inspiration

The UI should draw inspiration from:

- Linear
- Notion
- Vercel Dashboard
- Stripe Dashboard
- Raycast
- GitHub
- Arc Browser

Avoid copying.

Instead, combine the strongest ideas from each.

---

# Design Keywords

Elegant

Minimal

Fast

Premium

Modern

Clean

Professional

Focused

Confident

---

# Color Palette

Primary Green

Used for

- Primary buttons
- Active navigation
- Success highlights
- Progress indicators

Primary Purple

Used for

- Secondary actions
- AI Features
- Highlights

Neutral White

Backgrounds

Neutral Gray

Cards

Borders

Tables

Dark Gray

Primary text

Light Gray

Secondary text

Danger Red

Errors

Orange

Warnings

Blue

Information

Colors must come from design tokens.

Never hardcode colors.

---

# Theme Support

The application supports

Light Mode

Dark Mode

System Theme

Every component must support both themes.

---

# Typography

Primary Font

Inter

Fallback

System UI

Typography Scale

Display

48px

Heading 1

36px

Heading 2

30px

Heading 3

24px

Heading 4

20px

Body Large

18px

Body

16px

Small

14px

Caption

12px

Code

JetBrains Mono

---

# Spacing System

Use an 8-point spacing system.

Allowed spacing values

4

8

12

16

24

32

40

48

64

80

96

Avoid arbitrary spacing.

---

# Border Radius

Small

8px

Medium

12px

Large

16px

Extra Large

24px

Cards use

16px

Buttons use

12px

Inputs use

12px

---

# Shadows

Small

Interactive elements

Medium

Cards

Large

Dialogs

Extra Large

Modals

Avoid excessive shadows.

---

# Icons

Use Lucide Icons.

Every icon size

16

20

24

32

Maintain consistency.

---

# Grid System

Desktop

12 Columns

Tablet

8 Columns

Mobile

4 Columns

Maximum Content Width

1440px

Content centered.

---

# Layout Structure

Application Layout

Top Navigation

↓

Sidebar

↓

Main Content

↓

Footer (Optional)

---

# Sidebar

Fixed width

280px

Collapsible

Yes

Resizable

Future Version

---

Sidebar contains

Dashboard

Knowledge Base

Campaign Center

Content Studio

Media Library

Brand Center

CRM

Analytics

Prompt Library

SOP Library

Settings

Future modules appear automatically.

---

Sidebar Behavior

Collapse

Expand

Highlight Active Page

Remember User Preference

Support Keyboard Navigation

---

# Top Navigation

Contains

Global Search

Notifications

AI Assistant

Quick Create

Theme Toggle

Profile Menu

---

# Global Search

Centered

Keyboard Shortcut

Ctrl + K

Instant Results

Supports

Documents

Campaigns

Media

CRM

Prompts

Settings

Users

---

# Dashboard Layout

Default Widgets

Recent Activity

Analytics

Tasks

Calendar

Quick Actions

AI Assistant

Recent Documents

Campaign Performance

Users may

Resize

Move

Hide

Restore

---

# Cards

Every card contains

Title

Description

Actions

Optional Footer

Cards should never exceed necessary height.

---

# Tables

Support

Sorting

Filtering

Pagination

Column Resize

Column Visibility

Bulk Actions

Keyboard Navigation

Sticky Headers

---

# Forms

Every form includes

Labels

Descriptions

Validation

Helper Text

Inline Errors

Loading State

Success State

Cancel Button

Submit Button

---

# Buttons

Variants

Primary

Secondary

Outline

Ghost

Danger

Link

States

Default

Hover

Focus

Disabled

Loading

Pressed

---

# Inputs

Support

Text

Textarea

Password

Email

Phone

Search

URL

Date

Time

Select

Multi Select

Checkbox

Radio

Switch

File Upload

Rich Text

---

# Dialogs

Dialog Types

Confirmation

Alert

Delete

Settings

Information

Dialogs should trap keyboard focus.

ESC closes dialogs unless destructive.

---

# Notifications

Toast Position

Top Right

Maximum Visible

Three

Auto Dismiss

Five Seconds

Danger messages remain until dismissed.

---

# Loading States

Every screen requires

Skeleton Loader

Spinner

Progress Bar

Never show blank pages.

---

# Empty States

Every module includes

Illustration

Headline

Description

Primary Action

Example

"No campaigns yet."

Button

Create Campaign

---

# Error States

Friendly language.

Provide

Explanation

Suggested Fix

Retry Button

Never expose technical errors.

---

# Search Experience

Instant search

Debounced

Highlighted matches

Recent searches

Keyboard navigation

---

# AI Interface

Floating assistant panel.

Supports

Streaming

Markdown

Code Blocks

File References

Conversation History

Suggested Prompts

Copy Response

Regenerate

---

# Animations

Duration

150ms

250ms

350ms

Use animations only when meaningful.

Support reduced motion.

---

# Accessibility

Keyboard navigation.

Visible focus indicators.

ARIA labels.

Screen reader support.

Contrast ratio WCAG AA.

---

# Responsive Breakpoints

Mobile

<640px

Tablet

640px–1024px

Laptop

1024px–1280px

Desktop

1280px–1536px

Large Desktop

>1536px

---

# Mobile Behavior

Sidebar becomes drawer.

Tables become cards.

Dialogs become fullscreen.

Navigation optimized for touch.

---

# Page Template

Every page follows the same hierarchy.

Page Title

↓

Description

↓

Primary Actions

↓

Filters

↓

Content

↓

Pagination

---

# Breadcrumbs

Every page except Dashboard includes breadcrumbs.

Example

Dashboard

>

Campaigns

>

Freshers Week

---

# Command Palette

Shortcut

Ctrl + K

Supports

Navigate Pages

Create Objects

Run AI Commands

Search Everything

Open Settings

---

# Quick Create Menu

Accessible from top navigation.

Supports

New Campaign

New Document

New SOP

New Prompt

New Contact

New Content

Upload Media

---

# Data Visualization

Charts use consistent colors.

Support

Line Charts

Bar Charts

Area Charts

Pie Charts

KPI Cards

Heatmaps (Future)

---

# Component States

Every interactive component supports

Default

Hover

Focused

Pressed

Loading

Disabled

Error

Success

---

# Microinteractions

Hover feedback.

Smooth transitions.

Animated checkmarks.

Button ripple optional.

Progress animations.

---

# Design Tokens

All values centralized.

Typography

Spacing

Colors

Radius

Borders

Shadows

Animations

Opacity

Never hardcode UI values.

---

# Acceptance Criteria

✓ Entire UI follows one design language.

✓ Components reusable.

✓ Dark mode complete.

✓ Mobile responsive.

✓ Accessible.

✓ Consistent spacing.

✓ Premium appearance.

✓ Fast interactions.

✓ Design tokens used throughout.

---

# End of UI / UX Specification