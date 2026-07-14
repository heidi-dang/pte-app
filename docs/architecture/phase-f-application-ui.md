# Phase F — Application UI and Design System

## Scope

Phase F delivers the authenticated, responsive web application user interface. It introduces a shared design-system package and builds login, registration, dashboard, and landing pages on Next.js 15 App Router.

## Packages

- `@pte-app/design-system` — reusable, theme-aware React components and CSS tokens.
- `@pte-app/web` — Next.js 15 application with server-side session handling.

## Design System

The design system provides CSS custom properties and components used by the web application.

| Component   | Purpose                                |
| ----------- | -------------------------------------- |
| `Button`    | Primary, secondary, and danger actions |
| `Input`     | Form text inputs                       |
| `Label`     | Accessible form labels                 |
| `Card`      | Contained content panels               |
| `Alert`     | Error and status messages              |
| `Container` | Responsive centred layout container    |
| `Header`    | Top navigation shell                   |

CSS variables support light/dark mode via `prefers-color-scheme` and are consumed by both the design-system stylesheet and application pages.

## Authentication Flow

1. **Registration** (`/register`) — client form submits to `registerAccount` server action, which calls the API and sets an HTTP-only session cookie.
2. **Login** (`/login`) — same flow via `loginAccount`.
3. **Session cookie** — `SESSION_COOKIE_NAME` from environment; forwarded to API on subsequent requests.
4. **Protection** — Next.js middleware redirects unauthenticated users away from `/dashboard` and authenticated users away from `/login` and `/register`.
5. **Dashboard** (`/dashboard`) — server component fetches current user from API and renders account details with logout.

## Local Development

Ensure the API service and PostgreSQL are running, then start the web app:

```bash
npm run dev --workspace @pte-app/web
```

The application is available at `http://localhost:3000` by default.

## Testing

- Unit tests cover the existing health helper library.
- Integration tests start the built Next.js application and assert on the rendered HTML, including authentication links and service status.
