# Social Feed API — Local Setup

## Prerequisites
- Node.js 20+
- MySQL 8

## Setup
```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — point at your MySQL instance
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
- `CORS_ORIGIN` — the frontend's URL (default frontend runs on `http://localhost:3000`, see frontend setup)

```bash
npx prisma migrate dev --name init
npm run prisma:seed      # optional — creates a demo admin + user
npm run start:dev
```

## Verify it's running
- API: http://localhost:5000/api/v1
- Swagger docs: http://localhost:5000/docs

Seeded login (if you ran the seed): `kawsar@socialfeed.dev` / `User@12345`