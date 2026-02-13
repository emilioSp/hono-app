# Playground Hono App

A lightweight HTTP API built with Hono framework for managing people records.

## What it does

This application provides a REST API to:
- Create people with name, surname, and optional age
- List all people ordered by creation date
- Health check endpoint

## Prerequisites

- Node.js 24 (LTS)
- PostgreSQL 18
- Docker & Docker Compose (for local development)
- npm

## Local development setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hono_app
```

3. Start PostgreSQL (using Docker):
```bash
docker compose up -d
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:3000`

## API Examples

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK"
}
```

### Create a PersonSchema
```bash
curl -X POST http://localhost:3000/person \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "surname": "Doe",
    "age": 30
  }'
```

Response (201 Created):
```json
{
  "data": {
    "id": "01956789-abcd-7000-8000-123456789abc",
    "name": "John",
    "surname": "Doe",
    "age": 30,
    "createdAt": "2026-02-10T12:34:56.789Z"
  }
}
```

### Create a PersonSchema without age
```bash
curl -X POST http://localhost:3000/person \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane",
    "surname": "Smith"
  }'
```

Response (201 Created):
```json
{
  "data": {
    "id": "01956789-abcd-7000-8000-123456789def",
    "name": "Jane",
    "surname": "Smith",
    "age": null,
    "createdAt": "2026-02-10T12:35:00.123Z"
  }
}
```

### List All People
```bash
curl http://localhost:3000/people
```

Response:
```json
{
  "data": [
    {
      "id": "01956789-abcd-7000-8000-123456789def",
      "name": "Jane",
      "surname": "Smith",
      "age": null,
      "createdAt": "2026-02-10T12:35:00.123Z"
    },
    {
      "id": "01956789-abcd-7000-8000-123456789abc",
      "name": "John",
      "surname": "Doe",
      "age": 30,
      "createdAt": "2026-02-10T12:34:56.789Z"
    }
  ]
}
```

### Error Example - Invalid Input
```bash
curl -X POST http://localhost:3000/person \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "surname": "Doe"
  }'
```

Response (400 Bad Request):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid person payload"
  }
}
```

## Local testing

Run tests with coverage:
```bash
docker compose up -d
npm run migrate
npm test
```

Run linter:
```bash
npm run lint
```

Run type checking:
```bash
npm run build
```

## Database Management

Create a new migration:
```bash
npm run new:migration <migration_name>
```

Run migrations:
```bash
npm run migrate
```
