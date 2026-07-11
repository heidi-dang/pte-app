# ADR 0007 — Design System and Application Shell

## Status

Accepted

## Context

Phase F introduces the first user-facing layer of the platform. A coherent, maintainable design system must be established so every subsequent phase (courses, practice engine, assessment, reports) inherits consistent tokens, spacing, and interaction patterns without per-feature ad-hoc styles.

The key constraints are:

- The platform targets students on a wide range of devices (mobile-first, 375 px minimum).
- All interactive elements must meet WCAG 2.1 AA touch-target requirements (minimum 44 × 44 px).
- The design must feel premium and commercial-quality from the first impression.
- No third-party CSS frameworks (e.g., Tailwind, Bootstrap) are introduced; vanilla CSS with custom properties is the chosen approach per the project styling guidelines.

## Decision

### 1. CSS Custom Properties Design Token System

All visual values (colours, spacing, elevation, blur, transition curves) are defined as CSS custom properties on `:root` and overridden for `[data-theme="dark"]`. This enables:

- Theme switching without a JS re-render cycle.
- Consistent token reuse across every component.
- Easy future extension (e.g., high-contrast theme, brand refresh).

### 2. Next.js App Router Nested Layout

A nested `apps/web/src/app/app/layout.tsx` renders the authenticated student portal shell (Sidebar + Header + content area). The root `layout.tsx` stays minimal, serving the public marketing pages without the portal chrome. This separation ensures:

- Public routes (landing, marketing) are fully independent of the portal shell.
- Portal routes inherit the shell automatically without per-page boilerplate.

### 3. Glassmorphism + Elevation System

Cards and overlay surfaces use `backdrop-filter: blur()` with semi-transparent backgrounds to achieve a modern glassmorphic aesthetic, falling back gracefully on browsers without support.

### 4. Sidebar Responsive Strategy

- Desktop (≥ 1024 px): persistent left sidebar column via CSS grid.
- Mobile (< 1024 px): sidebar hidden by default, shown as an overlay when toggled by the Header burger button. Controlled via React state in the portal layout.

### 5. Collapsible Developer Console on Landing Page

The Phase B developer health-check utility is preserved as a collapsible footer section on the public landing page. This satisfies the existing integration test suite (which asserts on strings present in the rendered HTML) while keeping the marketing page clean by default.

## Consequences

- All phase G–Z components must import from `globals.css` tokens rather than defining bespoke colour values.
- Integration tests that assert on rendered HTML strings remain valid (Phase B compatibility preserved).
- The portal shell layout must be kept lightweight (no blocking data fetches) to maintain fast time-to-interactive for authenticated students.
