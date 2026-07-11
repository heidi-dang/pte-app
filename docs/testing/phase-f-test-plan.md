# Phase F Test Plan — Design System and Application Shell

## Scope

This plan covers validation of the Phase F deliverables:

- CSS design token system (`globals.css`)
- Application shell components (Sidebar, Header, portal layout)
- Public landing page redesign
- Student portal preview pages (Dashboard, Profile, Onboarding)
- Architecture Decision Record 0007

## Test Layers

### 1. TypeScript Compilation

**Command:** `npx tsc --noEmit` inside `apps/web`

Verifies all new `.tsx` files compile without type errors. All React components, event handlers, and prop interfaces must pass strict TypeScript checking.

### 2. Linting

**Command:** `npm run lint --workspace=apps/web` (or `turbo run lint`)

Verifies ESLint compliance for all new files, including:

- No unused imports
- Correct React hook dependency arrays
- No `any` escape hatches

### 3. Production Build

**Command:** `npm run build` (via Turbo)

Verifies Next.js can produce a complete production build with no errors or warnings. The App Router nested layout must bundle without issues.

### 4. Unit Tests (existing — must still pass)

**Command:** `npm run test:unit`

- `health.unit.test.ts`: Verifies `getHealthConfig`, `checkService`, and `getHealthUrl` utilities.

### 5. Integration Tests (updated for Phase F)

**Command:** `npm run test:integration`

The `health.integration.test.ts` suite spawns the Next.js production server and asserts:

| Test               | Assertion                             |
| ------------------ | ------------------------------------- |
| HTTP status        | Returns 200                           |
| Product heading    | HTML includes `PTE Academic Platform` |
| Development notice | HTML includes `Development`           |
| Phase B notice     | HTML includes `Phase B`               |
| Retry control      | HTML includes `Retry`                 |
| API reference      | HTML includes `API`                   |

### 6. Mobile Viewport Requirements

Manual verification checklist (or future Playwright test):

| Check                                             | Target              |
| ------------------------------------------------- | ------------------- |
| 375 px viewport renders without horizontal scroll | All pages           |
| Sidebar toggle visible and functional on mobile   | Portal pages        |
| Touch targets ≥ 44 × 44 px                        | Nav links, buttons  |
| Form inputs display correct keyboard types        | Profile, Onboarding |

## Acceptance Criteria

All automated test commands exit with code 0. No TypeScript errors. No ESLint violations. Production build succeeds.
