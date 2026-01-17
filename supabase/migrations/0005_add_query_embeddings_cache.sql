-- Query embeddings cache table
-- Stores embeddings for search queries to avoid regenerating them on every request
create table if not exists public.query_embeddings_cache (
  query_hash text primary key,
  query_text text not null,
  embedding vector(1536) not null,
  embedding_model text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  use_count int not null default 1
);

-- Index for cleanup queries (old/unused entries)
create index if not exists query_embeddings_cache_last_used_at_idx
on public.query_embeddings_cache (last_used_at);

-- Index for query text lookups (if needed for debugging)
create index if not exists query_embeddings_cache_query_text_idx
on public.query_embeddings_cache (query_text);

-- Vector index for similarity search (if we want to find similar queries later)
create index if not exists query_embeddings_cache_embedding_ivfflat_idx
on public.query_embeddings_cache using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- Function to update last_used_at and increment use_count
create or replace function public.touch_query_cache(p_query_hash text)
returns void
language plpgsql
as $$
begin
  update public.query_embeddings_cache
  set 
    last_used_at = now(),
    use_count = use_count + 1
  where query_hash = p_query_hash;
end;
$$;

-- Grant permissions - query embeddings are shared across all users
grant select, insert, update on public.query_embeddings_cache to authenticated;
grant execute on function public.touch_query_cache(text) to authenticated;

-- No RLS needed - query embeddings are not user-specific
-- They're shared across all users since search queries can be the same
