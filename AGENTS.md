# AGENTS.md

This repository contains the ServeMate backend service. It is a TypeScript/Express application with Prisma, Inversify DI, Zod validation, and a shared DTO workspace package.

## What to know first
- Start from [README.md](README.md) and [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for the broader architecture.
- Main runtime entry points are [main.ts](main.ts), [app.ts](app.ts), and [src/app.ts](src/app.ts).
- Business logic lives under [src/services](src/services); controllers under [src/controllers](src/controllers) should stay thin.
- Shared DTOs and validation schemas live in [dto-package/src/dto](dto-package/src/dto).

## Working conventions
- Keep the existing layered structure: controller -> service -> Prisma/DB access.
- Prefer Inversify bindings and dependency injection instead of constructing services directly.
- Use Zod schemas for request/query validation and keep shared DTO changes in the DTO package.
- Preserve the existing error handling style: use the service-level error wrapper and HTTPError for domain failures.
- Read/write caching is handled with decorators in [src/decorators](src/decorators); update invalidation when mutating data.

## Project-specific pitfalls
- Prisma dynamic `orderBy` fields must be validated before use. Avoid passing untrusted sort names directly into Prisma queries.
- When changing DTOs, update the shared package and regenerate artifacts if the repository expects them.
- Prisma generation can be fragile in pnpm-based setups; prefer the project’s Prisma generation flow when schema changes are involved.

## Useful commands
- Build: `npm run build`
- Run tests: `npm test`
- Start dev server: `npm run dev`
- Generate DTOs: `npm run generate-dto`
- Prisma generation: `pnpm exec prisma generate` when needed

## Relevant folders
- [prisma](prisma) for schema and migrations
- [src/tests](src/tests) for tests
- [src/scripts](src/scripts) for seed/data scripts
- [docker-compose.yml](docker-compose.yml) and [docker-compose.dev.yml](docker-compose.dev.yml) for local runtime setup
