# URL Shortener — PoC (TypeScript + Fastify)

A URL shortener with a simple REST API.

## Stack
- **Fastify** (Node.js, TypeScript)
- **PostgreSQL** (persistent storage)
- **Docker Compose** (Postgres/Redis infra)
- **Zod** (input validation)
- **nanoid** (short code generation)

## Features (current)
- `POST /shorten` → create a short URL (random or custom code)
- `GET /:code` → 302 redirect to the original URL
- Health checks: `/health`, `/db-health`, `/redis-health`
- Basic click counting (async, DB-backed)

## Getting Started

### 1) Install & run infra
```bash
cp .env.example .env
docker compose up -d
psql "$DATABASE_URL" -f sql/schema.sql
```

### 2) Run the app
```bash
npm i
npm run dev
```

### 3) Quick Test
```bash
# create
curl -s -X POST http://localhost:3000/shorten \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com/hello"}'

# use the returned code below:
curl -i http://localhost:3000/<CODE>
# expect: HTTP/1.1 302 Found + Location: https://example.com/hello
```

## Next
- Add Redis cache (cache-aside) for faster redirects
- Add rate limiting middleware (per IP or per user)
- Custom domains, analytics endpoints, tests, CI/CD