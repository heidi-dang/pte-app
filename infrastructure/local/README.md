# Local Infrastructure

## Services

- **PostgreSQL** — Database, port 5432
- **Redis** — Cache, port 6379

## Environment variables

See `.env.example` at the project root.

## Start

docker compose up -d

## Stop

docker compose down

## Reset (data loss)

docker compose down -v

## Health

docker compose exec postgres pg_isready
docker compose exec redis redis-cli ping

## Data-loss warning

Running `docker compose down -v` deletes all database and cache data.
