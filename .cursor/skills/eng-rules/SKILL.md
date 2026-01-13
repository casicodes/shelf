---
name: eng-rules
description: These are the set of rules for llm to follow best eng practices
---

# Overview

# Cursor Rules — Principal-leaning React / Next.js / Tailwind

## North Star

Build change-friendly systems: clear boundaries, predictable data flow, minimal coupling.
Optimize for: readability, testability, and evolution over time.

---

## 1) Architecture boundaries (non-negotiable)

Keep these layers separate. Dependencies only point inward:

1. **UI (components)**: rendering + interaction only
2. **App (use-cases)**: orchestration of user actions (submit, save, load, etc.)
3. **Domain (business logic)**: pure rules, calculations, validation, invariants
4. **Data (adapters)**: API clients, persistence, 3rd-party SDK wrappers

Rules:

- UI must NOT import from Data directly. UI talks to App/use-cases.
- Domain must be framework-agnostic: no React, no Next, no fetch, no localStorage.
- All 3rd-party libs (auth, analytics, payments, CMS) must be wrapped in adapters.

---

## 2) Folder structure (default)

Use a feature-based structure with shared foundations:

/src
/app (Next.js routes)
/features
/<feature-name>
/ui (components, styles)
/app (hooks/controllers/use-cases)
/domain (types, pure logic, invariants)
/data (api adapters, queries, mappers)
index.ts (public exports only)
/shared
/ui (design-system primitives)
/domain (shared types/utils that are truly universal)
/data (http client, caching, common adapters)
/lib (small generic helpers)
/config (env, constants)

Rules:

- Each feature exposes a small public API via `features/<x>/index.ts`.
- Avoid deep cross-feature imports. Prefer composition at route/page level.

---

## 3) React / Next.js (App Router)

- Prefer Server Components by default; add `"use client"` only for interactivity.
- Server Components handle data fetch + mapping -> pass clean props down.
- Client Components are small: state + events + UI only.
- No “god components” that fetch + transform + render + manage complex state.

---

## 4) State + effects (predictability rules)

- Prefer derived state over duplicated state.
- Avoid `useEffect` for derivations; use it for:
  - subscriptions
  - imperative integrations (analytics, non-react libs)
  - syncing URL/state when necessary
- No effect-chains (effect triggers state triggers effect). Refactor into explicit events.

Async UI states:

- Represent async as a discriminated union:
  - { status: 'idle' | 'loading' | 'success' | 'error', data?, error? }
- Handle loading/empty/error via early return (no nested condition soup).

---

## 5) Data access (system design basics)

- Centralize network access in a single `httpClient` wrapper.
- All API responses are mapped into domain-friendly shapes (no leaking raw API DTOs).
- Each feature owns its queries/mutations in `/data`.
- Add caching intentionally (SWR/React Query/Next fetch cache) with clear invalidation rules.

Error handling:

- Don’t swallow errors.
- Provide typed, actionable errors at boundaries (data layer -> app layer).
- UI shows user-safe messages; logs keep developer context.

---

## 6) Naming + module hygiene

- Names must reveal intent; avoid: data, info, util, helper, manager, thing, tmp.
- Boolean names start with is/has/can/should.
- Avoid default exports for shared modules (named exports improve refactors).
- Keep functions small (5–20 lines) and single-purpose.
- Avoid boolean flag parameters; split functions.

Public surface rule:

- Each folder exposes only what’s meant to be imported via `index.ts`.
- Internal modules should not be imported from outside the feature.

---

## 7) Tailwind rules (maintainable styling)

- Prefer component extraction over huge `className` strings.
- Use a `cn()` helper for conditional classes.
- If className exceeds ~8-10 utilities repeatedly, extract to a component or variant.
- Use Tailwind config tokens (colors/spacing) instead of random arbitrary values.

---

## 8) Testing (minimum bar that feels “senior”)

- Test pure domain logic (fast unit tests).
- For UI, test behaviors (user interactions + important states), not implementation.
- One test = one behavior. Avoid snapshot-only tests for non-trivial UI.
- Mock boundaries (network/adapters), not internal functions.

---

## 9) “Principal engineer finish checklist” for any change

Before finalizing code, ensure:

- Boundaries respected (UI not calling Data directly).
- Domain logic is pure + isolated.
- Data mapping happens once (DTO -> domain) near the boundary.
- State model is explicit and handles failure cases.
- The change is easy to extend (new field, new API response, new UI state).
- Public exports are intentional (index.ts).

---

## 10) Cursor behavior contract (how the AI must work)

When writing or changing code, Cursor must behave like a careful principal engineer:

### A) Default approach

- Start with the **smallest clean solution** that meets the requirement.
- Prefer **composition** over inheritance and over “framework cleverness.”
- Prefer **explicit code** over magic and implicit behavior.

### B) Refactoring discipline

- Make refactors in **small, safe steps**.
- Preserve behavior unless explicitly asked to change it.
- If touching logic, **add/adjust tests** at the domain or boundary level.
- Don’t “improve everything” — keep scope tight to the requested change.

### C) Abstraction rules (avoid premature architecture)

Introduce a new abstraction only if at least one is true:

- The same logic exists in **2+ places** (real duplication).
- A boundary is required (3rd-party lib, network, storage, analytics).
- The concept has a stable name in the domain (“Invoice”, “Appointment”, “Plan”).

Avoid abstractions that:

- add indirection without reducing complexity
- generalize before concrete use cases exist
- create “utility soup”

### D) Boundaries enforcement

- UI must not import Data adapters or raw DTOs.
- All 3rd-party SDK usage must be behind `/data/adapters/*`.
- Domain code must remain pure (no React/Next imports; no fetch/localStorage).

If Cursor finds a boundary violation, it must:

1. propose a minimal fix, and
2. implement it without expanding scope.

### E) Code review voice (short + useful)

When outputting changes, Cursor should include:

- **What changed** (1–3 bullets)
- **Why** (1–2 bullets focused on trade-offs)
  No long essays.

---

## 11) ADR — Architecture Decision Record (tiny template)

Create an ADR for any decision that affects structure, boundaries, or long-term approach.
Store in: `/docs/adr/ADR-YYYYMMDD-<short-title>.md`

### ADR Template

# ADR: <Title>

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Superseded  
**Context**

- What problem are we solving?
- What constraints matter? (speed, reliability, team skill, time)

**Decision**

- What we decided (1–3 sentences).

**Options considered**

1. Option A — pros/cons
2. Option B — pros/cons
3. Option C — pros/cons (optional)

**Consequences**

- Positive: what becomes easier?
- Negative: what becomes harder / what we must watch for?

**Follow-ups**

- Tests to add
- Migration steps
- Telemetry / monitoring (if relevant)

---

## 12) “System thinking” prompts Cursor must consider (quietly)

Before finalizing an implementation, sanity-check:

- What happens when the network is slow or fails?
- What happens with stale cache or partial data?
- Is the data model resilient to API change?
- Where should this logic live so it’s easiest to change later?
- Is there an obvious boundary for third-party dependencies?
- Are we trading simplicity now for flexibility later (and is it worth it)?
