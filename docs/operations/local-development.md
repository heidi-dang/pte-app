# Local Development

## Prerequisites

- Node.js >=24
- npm
- Docker and Docker Compose

## Setup

```bash
npm ci
npm run setup:local
```

`setup:local` creates `.env.local` from `.env.example` (existing files are preserved).

## Start

```bash
npm run local:up
```

This starts PostgreSQL, Redis, API, Scoring, Worker, and Web services.

## Stop

```bash
npm run local:down
```

Volumes are preserved. To reset completely:

```bash
docker compose down -v
rm -f .env.local
```

## Health

| Service       | URL                                                 |
| ------------- | --------------------------------------------------- |
| Web           | http://localhost:${WEB_PORT:-3000}                  |
| API live      | http://localhost:${API_PORT:-4000}/health/live      |
| API ready     | http://localhost:${API_PORT:-4000}/health/ready     |
| Scoring live  | http://localhost:${SCORING_PORT:-5000}/health/live  |
| Scoring ready | http://localhost:${SCORING_PORT:-5000}/health/ready |

## Doctor

```bash
npm run doctor
```

Checks Node.js, npm, Docker, containers, and environment configuration.

## Troubleshooting

### Port conflicts

Change the port in `.env.local` and restart.

### Docker unavailable

Install Docker Desktop or Docker Engine.

### Container unhealthy

Check logs:

```bash
docker compose logs postgres
docker compose logs redis
```

### Clean reinstall

```bash
rm -rf node_modules
npm ci
```

### Interrupted startup

Run `npm run local:down` first, then `npm run local:up` again.
