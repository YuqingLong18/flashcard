import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

prisma:query SELECT 1
prisma:query SELECT "public"."User"."id", "public"."User"."role"::text, "public"."User"."email", "public"."User"."emailVerified", "public"."User"."password", "public"."User"."name", "public"."User"."image", "public"."User"."createdAt", "public"."User"."updatedAt" FROM "public"."User" WHERE ("public"."User"."email" = $1 AND 1=1) LIMIT $2 OFFSET $3
 POST /api/auth/callback/credentials 200 in 351ms (compile: 11ms, render: 339ms)
 GET /api/auth/session 200 in 10ms (compile: 1950µs, render: 8ms)
[next-auth][warn][NEXTAUTH_URL] 
https://next-auth.js.org/warnings#nextauth_url
prisma:query SELECT "public"."Deck"."id", "public"."Deck"."ownerId", "public"."Deck"."title", "public"."Deck"."description", "public"."Deck"."language", "public"."Deck"."isPublished", "public"."Deck"."createdAt", "public"."Deck"."updatedAt", COALESCE("aggr_selection_0_Card"."_aggr_count_cards", 0) AS "_aggr_count_cards" FROM "public"."Deck" LEFT JOIN (SELECT "public"."Card"."deckId", COUNT(*) AS "_aggr_count_cards" FROM "public"."Card" WHERE 1=1 GROUP BY "public"."Card"."deckId") AS "aggr_selection_0_Card" ON ("public"."Deck"."id" = "aggr_selection_0_Card"."deckId") WHERE "public"."Deck"."ownerId" = $1 ORDER BY "public"."Deck"."updatedAt" DESC OFFSET $2
 GET /dashboard 200 in 344ms (compile: 157ms, render: 187ms)
[next-auth][warn][NEXTAUTH_URL] 
https://next-auth.js.org/warnings#nextauth_url
Error: Route "/deck/[deckId]/build" used `params.deckId`. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at DeckBuildPage (src/app/(teacher)/deck/[deckId]/build/page.tsx:26:37)
  24 |   }
  25 |
> 26 |   const deckIdParam = Array.isArray(params?.deckId)
     |                                     ^
  27 |     ? params.deckId[0]
  28 |     : params?.deckId;
  29 |
 GET /deck/cmhg2b6et0003fyjmal4yvqex/build 200 in 222ms (compile: 114ms, render: 108ms)
