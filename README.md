# Flashrooms — Adaptive Flashcards Platform

Flashrooms is a production-grade Next.js 16 application that lets teachers craft multimedia flashcard decks, launch live practice sessions with disposable codes, and watch students progress through an adaptive mastery loop.

## Features

- **Teacher workspace**: create, edit, bulk import, publish, and analyze decks
- **AI & uploads**: generate card images via OpenRouter or upload to S3-compatible storage
- **Live runs**: short-lived join codes, player state snapshots, adaptive scheduling, and progress tracking
- **Student experience**: keyboard-first play surface with mastery tracking and celebratory finish state
- **Analytics**: per-card mastery ratios, attempts to mastery, and refresher heatmaps
- **Authentication**: username/password via NextAuth using centralized credential database

## Tech Stack

- Next.js 16 (App Router), TypeScript, React Hook Form, TailwindCSS (v4), shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth (credentials) using centralized credential database API
- AWS S3 compatible storage via AWS SDK v3
- OpenRouter image generation endpoint

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** – copy `.env.example` (create one) or add to `.env`:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/flashrooms"
   NEXTAUTH_SECRET="generated-long-secret"
   CREDENTIAL_DB_URL="http://localhost:3000"  # URL to credential database API
   OPENROUTER_API_KEY="sk-..."               # required for AI features
   CHAT_MODEL_ID="google/gemini-3-pro-preview"  # model for card suggestions (default: google/gemini-3-pro-preview)
   IMAGE_MODEL_ID="google/gemini-3-pro-image-preview"  # model for image generation (default: google/gemini-3-pro-image-preview)
   IMAGE_API_MODE="responses"                # set to "responses" for chat-style image models (e.g. Gemini)
   IMAGE_SIZE="1024x1024"                    # optional override for generated image size
   OPENROUTER_SITE_URL="http://localhost:3000" # required HTTP referer for OpenRouter
   OPENROUTER_TITLE="Flashrooms"             # label sent to OpenRouter for analytics
   STORAGE_BUCKET="flashcards"               # target bucket name
   STORAGE_PUBLIC_BASE="https://cdn.example.com" # base URL for public assets
   STORAGE_REGION="us-east-1"                # region or "auto" for R2
   STORAGE_ENDPOINT="https://s3.example.com"  # omit for AWS S3
   STORAGE_ACCESS_KEY="..."                  # omit if using IAM role
   STORAGE_SECRET_KEY="..."                  # omit if using IAM role
   STORAGE_FORCE_PATH_STYLE="true"           # set for MinIO or localstack
   STORAGE_OBJECT_ACL="public-read"          # optional per-object ACL, omit if bucket ACL already public
   RUN_CODE_TTL_MINUTES="120"
   RUN_CODE_LENGTH="6"
   ```

3. **Prisma** – generate the client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Run locally**:
   ```bash
   npm run dev
   ```
   App is served at `http://localhost:3000`.

5. **Ensure credential database is running** at the URL specified in `CREDENTIAL_DB_URL` (default: `http://localhost:3000`). Users should be added to the credential database using the tools in the `/index` project. Then sign in at `/login` with your username and password, build a deck, publish it, and launch "Play deck" to obtain a join code for students.

## Testing & Verification

- `npm run lint` – ESLint with Next.js and TypeScript rules
- `npm run build` – ensures the app compiles. In sandboxed environments without network access, the build can fail while Turbopack spawns helper processes; prefix with `TURBOPACK=0` or run in an unrestricted environment.

## Key Directories

- `src/app` – App Router routes (teacher workspace under `/(teacher)`, student join/play, auth pages)
- `src/app/api` – REST API handlers matching the product spec
- `src/components` – UI building blocks, deck management widgets, auth forms, and play surface
- `src/lib` – Prisma client, authentication helpers, storage utilities, adaptive scheduling logic
- `prisma` – Prisma schema & migrations

## Deployment Notes

- Ensure environment variables are configured in your hosting platform (Vercel, Fly.io, etc.).
- Configure `STORAGE_PUBLIC_BASE` and Next.js `images.remotePatterns` to match your CDN or storage domain if different from wildcard defaults.
- Schedule clean-up of expired deck runs if desired (e.g., nightly cron to mark `EXPIRED`).
- Add HTTPS, secret rotation, and monitoring before production launch.
- Disable public registration in production by keeping accounts admin-managed via the `npm run create-user` script.

## Roadmap / Nice-to-haves

- Cross-session spaced repetition using due dates
- Audio pronunciation / TTS utilities
- Shared deck library and Anki import
- Real-time teacher dashboard showing aggregated responses
