# Shelf

Minimal bookmarking app with Supabase auth and semantic search.

## What you get
- Email/password auth: sign up, sign in, forgot password, reset password
- Add bookmarks by pasting a URL
- Metadata enrichment via Supabase Edge Function
- Semantic search via `pgvector` + embeddings

## Setup
1. Create a Supabase project.
2. In Supabase SQL editor, run:
   - `supabase/migrations/0001_init.sql`
   - `supabase/seed.sql`
3. Deploy Edge Functions:
   - `supabase/functions/metadata_fetch`
   - `supabase/functions/embedding_upsert`
4. Add env vars (copy `env.example` to your env system):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_EMBEDDING_MODEL`
5. Install and run:

```bash
npm install
npm run dev
```

## Notes
- The service role key is only used server-side and in Supabase Edge Functions. Never expose it to the browser.

