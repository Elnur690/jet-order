# Jet Print — Order Management

A small monorepo for Jet Print order management consisting of a NestJS backend and a React + Vite frontend.

## Table of contents

- Overview
- Architecture
- Prerequisites
- Local development
  - Backend
  - Frontend
- Environment variables
- Database (Prisma)
- Docker (optional)
- Troubleshooting
- Contributing
- License

## Overview

This repository contains two main projects:

- `jetprint-backend` — NestJS-based API server (TypeScript), Prisma ORM, WebSockets for real-time notifications.
- `jetprint-frontend` — React + Vite frontend (TypeScript) used by operators and admins to view and manage orders.

## Architecture

- Backend: NestJS modules under `src/` (auth, orders, stage-claims, users, notifications, prisma). Prisma schema in `prisma/schema.prisma`.
- Frontend: Vite + React with pages under `src/pages` and shared components under `src/components`.

## Prerequisites

- Node.js 18+ (recommended)
- npm or yarn
- PostgreSQL (or the DB configured in `prisma/schema.prisma`)
- Git

## Local development

Start the backend and frontend locally. These quickstart steps assume you'll run them in two terminals.

### Backend

1. cd into the backend:

   ```bash
   cd jetprint-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file (see `jetprint-backend/.env.example` if available) and set your database URL and JWT secrets.

4. Run Prisma migrations and seed (if needed):

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. Start the dev server:

   ```bash
   npm run start:dev
   ```

The backend runs on the port configured in the project (check `src/main.ts` or `.env`).

### Frontend

1. cd into the frontend:

   ```bash
   cd jetprint-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

Open the app at the URL printed by Vite (usually http://localhost:5173).

## Environment variables

Add `.env` files to `jetprint-backend` with JWT secrets and DB connection. Do not commit secrets to git.

## Database (Prisma)

Prisma is used for schema and migrations. The Prisma schema is in `jetprint-backend/prisma/schema.prisma`.

- Generate the client when you change the schema:

  ```bash
  npx prisma generate
  ```

- Apply migrations:

  ```bash
  npx prisma migrate dev
  ```

## Docker (optional)

There is a `docker-compose.yml` file in `jetprint-backend/` that can be used to run the backend and DB in containers. Inspect and customize it before using.

## Troubleshooting

- If `npm run start:dev` exits, check logs for port-in-use, missing env vars, or DB connectivity.
- If frontend fails to start, remove `node_modules` and reinstall.

## Contributing

If you'd like to contribute, please open issues or PRs against the `main` branch.

## License

This project does not include a license file in the repository. Add one if you want to publish this code.
# jet-order