# AGENTS.md — Production Flashcards Platform (Teachers & Students)

> Goal: Ship a production‑ready, minimal, modern web app where teachers **build & share** flashcard decks and students **practice** via an adaptive loop (“I know!” / “I need a refresher…”). This spec is written for Codex (CLI/agent runner) to scaffold, wire, and enforce behaviors end‑to‑end.

---

## 0) Product Summary
- **Teacher Build Mode**: Create decks; add cards with **front** (prompt/term) and **back** (answer). Optionally **attach an image** by:
  1) generating via **OpenRouter image model**, or
  2) uploading manually, or
  3) leaving blank.
- **Classroom Play**: Teacher clicks **“Play this deck”** → server generates a **deck code** (short‑lived). Students land on `/join`, enter code → redirected to a **live practice session**.
- **Student Practice UI**: Shows **front** + (optional) image, then buttons **“I know!”** and **“I need a refresher…”**.
- **Adaptive Logic**: Cards start uniformly random; each **“I know!”** reduces its likelihood; **“I need a refresher…”** increases it. A card is “mastered” when it receives **≥ 3 “I know!”** during the session. The session completes when **all cards mastered**.
- **Analytics**: Persist per‑student responses for review.
- **Design**: Minimalist, modern UI, keyboard‑first where possible.

---

## 1) Recommended Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, React Server Actions, TailwindCSS, shadcn/ui.
- **Backend**: Next.js Route Handlers (API), Edge‑safe where feasible.
- **Auth**: NextAuth (Email/Pass or OAuth). Teachers require auth; student **code join** flow is pseudonymous.
- **DB**: **PostgreSQL (self‑managed)** using Prisma.
- **Storage**: S3‑compatible (e.g., MinIO or any S3) for teacher‑uploaded images.
- **Image Gen**: OpenRouter API → selected image model (configurable).
- **Observability**: Simple request logging + Vercel/Node logs.

---

## 2) Data Model (Prisma Schema — simplified)
```prisma
// Use PostgreSQL with UUIDs. Enable pgcrypto extension for gen_random_uuid if desired.

datasource db { provider = "postgresql" url = env("DATABASE_URL") }

generator client { provider = "prisma-client-js" }

model User {
  id        String   @id @default(cuid())
  role      Role     @default(TEACHER)
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  decks     Deck[]   @relation("DeckOwner")
}

enum Role { TEACHER ADMIN }

model Deck {
  id          String    @id @default(cuid())
  ownerId     String
  owner       User      @relation("DeckOwner", fields: [ownerId], references: [id])
  title       String
  description String?
  language    String?
  isPublished Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  cards       Card[]
}

model Card {
  id        String   @id @default(cuid())
  deckId    String
  deck      Deck     @relation(fields: [deckId], references: [id])
  front     String
  back      String
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model DeckRun {
  id        String    @id @default(cuid())
  deckId    String
  deck      Deck      @relation(fields: [deckId], references: [id])
  code      String    @unique
  status    RunStatus @default(ACTIVE)
  expiresAt DateTime
  // Snapshot card IDs to keep runs stable even if the deck changes later
  snapshotCardIds String[]
  createdAt DateTime @default(now())
  players   Player[]
}

enum RunStatus { ACTIVE ENDED EXPIRED }

model Player {
  id        String   @id @default(cuid())
  runId     String
  run       DeckRun  @relation(fields: [runId], references: [id])
  nickname  String?
  joinedAt  DateTime @default(now())
  states    PlayerCardState[]
}

model PlayerCardState {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id])
  cardId          String
  card            Card     @relation(fields: [cardId], references: [id])
  knowCount       Int      @default(0)
  refresherCount  Int      @default(0)
  weight          Float    @default(1.0) // adaptive sampling weight
  mastered        Boolean  @default(false)
  updatedAt       DateTime @updatedAt
  @@unique([playerId, cardId])
}
```prisma
model User {
  id           String   @id @default(cuid())
  role         Role     @default(TEACHER)
  email        String   @unique
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  decks        Deck[]   @relation("DeckOwner")
}

enum Role { TEACHER ADMIN }

model Deck {
  id           String       @id @default(cuid())
  ownerId      String
  owner        User         @relation("DeckOwner", fields: [ownerId], references: [id])
  title        String
  description  String?
  language     String?      // e.g. "en", "zh"
  isPublished  Boolean      @default(false)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  cards        Card[]
}

model Card {
  id           String    @id @default(cuid())
  deckId       String
  deck         Deck      @relation(fields: [deckId], references: [id])
  front        String    // question / term (can be bilingual)
  back         String    // answer / definition / translation
  imageUrl     String?   // teacher upload or AI generated
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model DeckRun { // a playable session instance created by teacher
  id           String    @id @default(cuid())
  deckId       String
  deck         Deck      @relation(fields: [deckId], references: [id])
  code         String    @unique // short code shown to students
  status       RunStatus @default(ACTIVE)
  expiresAt    DateTime  // short‑lived (e.g., 2 hours)
  createdAt    DateTime  @default(now())
}

enum RunStatus { ACTIVE ENDED EXPIRED }

model Player { // a student in a run (pseudonymous)
  id           String    @id @default(cuid())
  runId        String
  run          DeckRun   @relation(fields: [runId], references: [id])
  nickname     String?
  joinedAt     DateTime  @default(now())
  responses    Response[]
}

model Response { // per card click
  id           String    @id @default(cuid())
  playerId     String
  player       Player    @relation(fields: [playerId], references: [id])
  cardId       String
  card         Card      @relation(fields: [cardId], references: [id])
  label        Click     // KNOW or REFRESHER
  createdAt    DateTime  @default(now())
}

enum Click { KNOW REFRESHER }

model Mastery { // per session per card counters for fast lookup
  id           String   @id @default(cuid())
  playerId     String
  cardId       String
  knowCount    Int      @default(0)
  refresherCount Int    @default(0)
  updatedAt    DateTime @updatedAt
  @@unique([playerId, cardId])
}
```

**Indexes**: `@@index([code])` on `DeckRun.code`; consider `@@index([playerId, mastered])` on `PlayerCardState`.

---

## 3) API Contract (Next.js Route Handlers)
All JSON responses: `{ ok: boolean, data?, error? }`.

### Teacher Build
- `POST /api/decks` → create deck `{ title, description?, language? }`
- `GET /api/decks` → list my decks
- `GET /api/decks/:deckId` → deck with cards
- `PATCH /api/decks/:deckId` → update metadata
- `DELETE /api/decks/:deckId`
- `POST /api/decks/:deckId/cards` → add card `{ front, back, imageUrl? }`
- `PATCH /api/cards/:cardId` → edit card
- `DELETE /api/cards/:cardId`
- `POST /api/decks/:deckId/publish` → toggle publish

### Image Generation / Upload
- `POST /api/image/generate` → body `{ prompt, modelId? }` → returns `{ imageUrl }` (stores to S3/R2 and returns public URL)
- `POST /api/upload` (signed URL init) → returns `{ uploadUrl, publicUrl }`

### Classroom Play
- `POST /api/decks/:deckId/run` → create **DeckRun**, returns `{ code, expiresAt, runId }` and stores `snapshotCardIds`.
- `POST /api/run/join` → `{ code, nickname? }` → returns `{ runId, playerId }` and **initializes PlayerCardState rows** for all `snapshotCardIds`.
- `GET /api/run/:runId/next?playerId=...` → returns **next card** `{ card: {id, front, imageUrl}, stats: {knowCount, refresherCount} }` using weights from `PlayerCardState`.
- `POST /api/run/:runId/answer` → `{ playerId, cardId, label: "KNOW"|"REFRESHER" }` → updates counts/weight/mastered; returns `{ mastered, progress }`.
- `GET /api/run/:runId/progress?playerId=...` → `{ masteredCount, total, finished }`
- `POST /api/run/:runId/end` (teacher)

### Admin/Analytics (optional)
- `GET /api/decks/:deckId/analytics` → aggregates from `PlayerCardState` (e.g., average attempts to mastery by card).

---

## 4) Adaptive Scheduling Algorithm (DB‑only, no Redis)
Maintain one row per **(player, card)** in `PlayerCardState`. Initialize `{ weight=1.0, knowCount=0, refresherCount=0, mastered=false }` when a player joins a run.

- On **KNOW**: `knowCount += 1`, `weight = GREATEST(0.2, weight * 0.5)`; if `knowCount >= 3` then `mastered = true`.
- On **REFRESHER**: `refresherCount += 1`, `weight = LEAST(5.0, weight + 0.75)`.
- **Sampling** (`/next`): select unmastered states, load `{cardId, weight}` and do weighted random on the server. (Small/medium decks: fetch into memory and sample. For very large decks, approximate with stratified random or SQL table sampling.)
- **Finish**: when all `mastered=true` for the player.

This removes the Redis dependency and keeps all adaptive state inside PostgreSQL.

---

## 5) Agent Roster (for Codex)

### 5.1 Agent: **DeckBuilder**
**Purpose**: CRUD decks/cards; assist with content scaffolding.
- **Inputs**: Title/description; card rows (CSV/TSV/JSON) with `{front, back}`; optional language.
- **Tools**: DB client (Prisma), Storage (signed URLs), Markdown parser for bulk import.
- **Outputs**: Deck + cards; validation report.
- **Errors**: Duplicate titles (warn), invalid rows (skip + report).

**Prompt Template (system)**:
> You are DeckBuilder. Ingest teacher input to create or update decks and cards. Validate fields, strip HTML, and normalize whitespace. Never expose secrets.

**Actions**:
1. `createDeck(title, description?, language?)`
2. `addCard(deckId, front, back, imageUrl?)`
3. `bulkImport(deckId, rows[])`

---

### 5.2 Agent: **ImageGen**
**Purpose**: Generate **relevant** images for a given front/back concept using OpenRouter.
- **Inputs**: `{ front, back, style? }`
- **Tools**: `POST https://openrouter.ai/api/v1/images` with model configured in ENV.
- **Output**: `imageUrl` (stored to S3/R2).
- **Errors**: rate limits, NSFW filtering; fall back to placeholder.

**Server Action (pseudo‑code)**:
```ts
async function genImage({ prompt }: { prompt: string }) {
  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: process.env.IMAGE_MODEL_ID ?? 'stability/sdxl',
      size: '1024x1024',
      n: 1
    })
  })
  // handle bytes/base64 → upload to storage → return public URL
}
```

**Prompting guidance**: auto‑craft a clean, school‑safe prompt from card front (e.g., `"Vocabulary: apple (fruit). Minimal vector icon, flat, high contrast."`).

---

### 5.3 Agent: **RunManager**
**Purpose**: Create deck runs (codes), manage expiry, let students join.
- **Inputs**: `deckId` (teacher), `code` (student), `nickname?`.
- **Tools**: DB (DeckRun, Player), short code generator.
- **Output**: `{ runId, code, expiresAt }`, `{ playerId }`.
- **Errors**: deck not published; code expired/invalid.

**Short Code**: base32 (Crockford) length 6 (no ambiguous chars). TTL default 2h.

---

### 5.4 Agent: **Scheduler**
**Purpose**: Serve next card, record response, update weights and mastery, compute progress.
- **Inputs**: `{ runId, playerId }` + `label`.
- **Tools**: **PostgreSQL only** (`PlayerCardState` table) and RNG in app.
- **Output**: `{ card }`, `{ mastered, finished, progress }`.
- **Errors**: run expired; invalid player; deck mutated mid‑run (prevented by `snapshotCardIds`).

---

### 5.5 Agent: **AnalyticsReporter**
**Purpose**: Aggregate session & deck performance for teachers.
- **Metrics**: correctness ratio per card, average attempts to mastery, heatmap of "refresher" clicks.
- **Deliverables**: downloadable CSV.

---

## 6) UI Contract (Minimalist, modern)

### Teacher
- `/dashboard` – list decks (cards count, last edited, publish status). CTA: **New Deck**.
- `/deck/:id/build` – two‑pane editor:
  - Left: deck meta; bulk import textarea (CSV with `front,back`), **Generate image** button per card, **Upload** button, image preview.
  - Right: card list (virtualized), inline edit, keyboard shortcuts.
  - Top bar: **Publish/Unpublish**, **Play this deck**.
- `/deck/:id/analytics` – table with counts from `PlayerCardState`.

### Student
- `/join` – enter **code** (and optional nickname). Validates & redirects.
- `/play/:runId` – centered card:
  - **Front** text + optional image above it.
  - Buttons: **I know!** (primary) / **I need a refresher…** (secondary).
  - Keyboard: `K` = know, `R` = refresher, `Space` = flip to show **back** (on demand).
  - Progress bar: mastered/total. Confetti on finish.

**Design tokens**: neutral palette, 12‑14 pt base, large buttons, ample whitespace, rounded corners (xl), subtle shadows.

---

## 7) Security & Privacy
- Teachers authenticated; only owners can edit/publish.
- DeckRun codes are **scoped** to a snapshot of card IDs.
- Student sessions store pseudonymous `playerId` only; no PII required.
- Signed uploads; server‑side image moderation (optional).
- Rate limiting on image generation and join attempts.
- Rotate & vault secrets; strict CORS; HTTPS only.
- Principle of least privilege for DB user; schema‑level RLS not required (server protects access).

---

## 8) Environment Variables
```
DATABASE_URL=
NEXTAUTH_SECRET=
OPENROUTER_API_KEY=
IMAGE_MODEL_ID=stability/sdxl // example
STORAGE_BUCKET=flashcards
STORAGE_PUBLIC_BASE=https://cdn.example.com
RUN_CODE_TTL_MINUTES=120
RUN_CODE_LENGTH=6
```

---

## 9) Server Logic Details
- **Create Run**: snapshot `cardIds[]` into `DeckRun.snapshotCardIds`.
- **Join**: upsert `Player` then **bulk insert** `PlayerCardState` for all snapshot cards (skip if exists).
- **/next**: query unmastered `PlayerCardState` rows; weighted sample in app; return card front + imageUrl and current counts.
- **/answer**: single transaction to increment counts, recompute weight, toggle mastered if `knowCount >= 3`.
- **Idempotency**: Accept repeated clicks via `clientEventId` column (optional) or debounce client‑side.

---

## 10) Testing Plan
- **Unit**: sampling math, mastery transitions, code generator (collision tests), image prompt sanitizer.
- **Integration**: build → publish → run → join → next/answer loop.
- **E2E (Playwright)**: full teacher flow + student flow on preview deploy.
- **Load**: 100 concurrent students in one run; ensure Redis + DB are healthy.

---

## 11) Deployment
- **App hosting**: Vercel or any Node host.
- **Database**: Your **self‑managed PostgreSQL** (Docker or native). Create schema via Prisma migrations.
- **Storage**: Any S3‑compatible (MinIO/Wasabi/R2) or local in dev.
- **Domain**: Custom domain; enforce HTTPS.

---

## 12) Analytics & Events
- `deck_created`, `card_added`, `run_created`, `run_joined`, `card_served`, `answer_submitted`, `session_finished`.
- Compute aggregates from `PlayerCardState` (no per‑click table).

---

## 13) Acceptance Criteria Checklist
- [ ] Teachers can create decks and add/edit/delete cards.
- [ ] Card supports optional image from AI or upload.
- [ ] Teacher can publish and generate a **deck code**.
- [ ] Students can join via code and practice.
- [ ] Adaptive scheduling functions as specified; mastery = 3 KNOWs per card.
- [ ] Progress and completion visible; data recorded in DB.
- [ ] Minimalist modern UI; keyboard shortcuts work.
- [ ] Secrets/env configured; rate limits in place; tests pass.

---

## 14) Nice‑to‑Have (Post‑MVP)
- Spaced repetition across days (SM‑2 light) using due dates.
- Audio TTS for fronts/backs (language learning).
- Deck sharing library; import from CSV/Anki.
- Teacher live dashboard: watch aggregated responses in real‑time.

---

## 15) Sample Wire Prompts (for Codex scaffolding)
- **Scaffold**: "Create Next.js 15 app with Prisma + NextAuth + Tailwind + shadcn; add Postgres models as specified; generate CRUD routes matching section 3."
- **Implement**: "Add `/api/image/generate` server action that calls OpenRouter with sanitized prompt and uploads result to storage; return `imageUrl`."
- **Adaptive**: "Create Redis helper storing per‑(runId,playerId) weights; implement weighted sampling with masteries per section 4."
- **UI**: "Build `/deck/[id]/build` two‑pane editor with inline rows and image preview; build `/join` and `/play/[runId]` as per section 6."

