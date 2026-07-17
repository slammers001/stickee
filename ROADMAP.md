# Stickee Feature Roadmap

Stickee is a sticky-note application built with React, Tauri, and Supabase. In this roadmap, a **feature** is a major named capability comparable to StickeeList or Speak-to-Text.

## Status Key

| Status | Meaning |
| --- | --- |
| Planned | Proposed for future development |
| In progress | Currently being developed |

## Existing Features

- **StickeeList** — Checklists
- **Speak-to-Text** — Voice input
- **StickeeAuth** — Authentication
- **StickeeFonts** — Font customization
- **StickeeTheme** — Theme customization
- **StickeeArchive** — Note archiving
- **StickeeExport** — Data export
- **StickeeReactions** — Note reactions
- **StickeeSearch** — Note search
- **StickeeQuick** — Quick notes
- **StickeeDrag** — Drag-and-drop ordering
- **StickeeIssue** — Issue reporting

## Roadmap Overview

| Priority | Feature | Status | Estimate |
| ---: | --- | --- | ---: |
| 1 | StickeeAI | Planned | 4–5 weeks |
| 2 | StickeeBoard | In progress | 3–4 weeks |
| 3 | StickeeShare | Planned | 3–4 weeks |
| 4 | StickeeMobile | Planned | 8–10 weeks |
| 5 | StickeeRemind | Planned | 2–3 weeks |
| 6 | StickeeConnect | Planned | 5–6 weeks |
| 7 | StickeeCanvas | Planned | 5–6 weeks |
| 8 | StickeeClip | Planned | 3–4 weeks |
| 9 | StickeePages | Planned | 3–4 weeks |
| 10 | StickeeOffline | Planned | 4–5 weeks |
| 11 | StickeeLock | Planned | 3–4 weeks |
| 12 | StickeeWidget | Planned | 2–3 weeks |
| 13 | StickeeTemplates | In progress | 2–3 weeks |
| 14 | StickeeCal | Planned | 2–3 weeks |
| 15 | StickeeFlow | Planned | 3–4 weeks |

## Top 10 Features

### 1. StickeeAI

**Status:** Planned

**Estimate:** 4–5 weeks

An AI assistant integrated into every note. It would:

- Summarize long notes automatically
- Suggest tags
- Rewrite and improve text
- Expand bullet points into paragraphs
- Answer questions about your notes
- Stream responses inline using the OpenAI API or a local LLM

### 2. StickeeBoard

**Status:** In progress

**Estimate:** 3–4 weeks

A Kanban board that organizes notes into **To-Do**, **Doing**, **Done**, and **Backlog** columns.

- Drag notes between columns to change their status
- Build on the existing drag-and-drop infrastructure
- Toggle between grid and board views

### 3. StickeeShare

**Status:** Planned

**Estimate:** 3–4 weeks

Share notes through a public read-only link or invite specific users by email for collaborative editing.

- Live cursors and real-time changes through Supabase Realtime
- View, comment, and edit permission levels

### 4. StickeeMobile

**Status:** Planned

**Estimate:** 8–10 weeks

Native iOS and Android applications built with React Native and Expo.

- Share the Supabase backend, type definitions, and business logic
- Provide touch-optimized sticky-note interactions
- Support swipe-to-archive and haptic feedback

### 5. StickeeRemind

**Status:** Planned

**Estimate:** 2–3 weeks

Date and time reminders for any note.

- Desktop notifications through Tauri
- Web notifications through the Notification API
- Optional email and SMS reminders through Supabase Edge Functions and Twilio or Resend
- Snooze and recurring reminder options

### 6. StickeeConnect

**Status:** Planned

**Estimate:** 5–6 weeks

Third-party integrations with per-user OAuth connections.

- Slack: post notes to channels and create notes from messages
- Discord: webhook support
- Todoist and TickTick: two-way synchronization
- Notion: note export
- Google Calendar: create events from notes

### 7. StickeeCanvas

**Status:** Planned

**Estimate:** 5–6 weeks

An infinite canvas and whiteboard where notes can be freely positioned, connected, zoomed, and panned.

Useful for mind maps, brainstorming, and visual planning. Potential foundations include tldraw or Fabric.js.

### 8. StickeeClip

**Status:** Planned

**Estimate:** 3–4 weeks

A Chrome and Firefox extension for clipping content into Stickee notes.

- Selected text
- Full articles
- Screenshots
- Entire pages
- Right-click context menu and toolbar action
- Tauri deep links or direct Supabase API integration

### 9. StickeePages

**Status:** Planned

**Estimate:** 3–4 weeks

Wiki-style linked notes using `[[wiki links]]`.

- Backlinks in a sidebar
- A browsable graph of connected notes
- Built on the existing Markdown and `react-markdown` infrastructure

### 10. StickeeOffline

**Status:** Planned

**Estimate:** 4–5 weeks

Full offline support for unreliable or unavailable network connections.

- Cache notes in IndexedDB through Dexie.js
- Queue writes and synchronize when connectivity returns
- Resolve conflicts with last-write-wins or an interactive merge
- Add a service worker for the web build

## Additional Features

### 11. StickeeLock

**Status:** Planned

**Estimate:** 3–4 weeks

Proper end-to-end encryption with the Web Crypto API and AES-256-GCM.

- User-defined passphrase
- Separate vault for sensitive notes
- Biometric unlock on mobile
- Replace the current base64 obfuscation with real cryptography

### 12. StickeeWidget

**Status:** Planned

**Estimate:** 2–3 weeks

Desktop and home-screen widgets for Windows, macOS, Android, and iOS.

- Display pinned notes
- Show reminders due today
- Provide a quick-add action
- Use Tauri plugins and native widget APIs

### 13. StickeeTemplates

**Status:** In progress

**Estimate:** 2–3 weeks

Templates for common note-taking workflows.

- Meeting notes
- Project plans
- Daily journals
- Weekly reviews
- Bullet journals
- Gratitude logs
- Habit trackers
- User-created and saved templates

### 14. StickeeCal

**Status:** Planned

**Estimate:** 2–3 weeks

A calendar that surfaces notes by creation date, reminder due date, or a custom note date.

- Drag notes onto dates
- Month, week, and day views
- Google Calendar export

### 15. StickeeFlow

**Status:** Planned

**Estimate:** 3–4 weeks

A visual trigger-and-action automation engine.

Example automations:

- Archive a completed note after seven days
- Add notes tagged `shopping` to Todoist

Automations would run through Supabase Edge Functions and scheduled jobs.

## Planning Notes

- Estimates assume one senior full-stack developer.
- StickeeAI and StickeeOffline have the highest expected user impact.
- StickeeBoard is the quickest high-value opportunity because it builds on existing code.
- StickeeMobile requires the most time but unlocks the largest new audience.
- StickeeConnect and StickeeFlow can share integration infrastructure.
