# Prepwise

Interview preparation, simplified. A minimalistic SaaS app to help you prepare for interviews with a question bank, timed practice sessions, and progress tracking.

## Features

- **Auth** — signup / login with hashed passwords and JWT httpOnly cookies
- **Question bank** — browse by category (behavioral, technical, system-design), filtered by difficulty
- **Practice mode** — timed sessions with notes, self-scoring, and sample answers
- **Dashboard** — total sessions, completed sessions, average score
- **Progress** — session history with scores

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS 4
- Prisma 7 + SQLite (via `@prisma/adapter-libsql`)
- bcryptjs, jsonwebtoken

## Getting Started

```bash
npm install
npx prisma db push
npm run dev
```

Then seed the question bank once:

```bash
curl -X POST http://localhost:3000/api/seed
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy the values from `.env` (already present locally):

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-here"
```

## Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start the dev server            |
| `npm run build`   | Production build                |
| `npm run start`   | Start the production server     |
| `npm run lint`    | Run ESLint                      |
