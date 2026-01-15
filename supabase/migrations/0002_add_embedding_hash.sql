-- Add semantic_source_hash column to bookmark_embeddings for hash-based invalidation
alter table public.bookmark_embeddings
add column if not exists semantic_source_hash text;

create index if not exists bookmark_embeddings_hash_idx
on public.bookmark_embeddings (semantic_source_hash);
