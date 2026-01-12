-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "citext";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  preferences jsonb not null default '{}'::jsonb
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Bookmarks
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  normalized_url text not null,
  title text,
  description text,
  site_name text,
  image_url text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_visited_at timestamptz
);

create unique index if not exists bookmarks_user_normalized_url_unique
on public.bookmarks (user_id, normalized_url);

create index if not exists bookmarks_user_created_at_idx
on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own"
on public.bookmarks
for select
to authenticated
using (user_id = auth.uid());

create policy "bookmarks_insert_own"
on public.bookmarks
for insert
to authenticated
with check (user_id = auth.uid());

create policy "bookmarks_update_own"
on public.bookmarks
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "bookmarks_delete_own"
on public.bookmarks
for delete
to authenticated
using (user_id = auth.uid());

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bookmarks_updated_at on public.bookmarks;
create trigger set_bookmarks_updated_at
before update on public.bookmarks
for each row
execute function public.set_updated_at();

-- Tags
create table if not exists public.bookmark_tags (
  bookmark_id uuid not null references public.bookmarks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tag citext not null,
  created_at timestamptz not null default now(),
  primary key (bookmark_id, tag)
);

create index if not exists bookmark_tags_user_tag_idx
on public.bookmark_tags (user_id, tag);

alter table public.bookmark_tags enable row level security;

create policy "bookmark_tags_select_own"
on public.bookmark_tags
for select
to authenticated
using (user_id = auth.uid());

create policy "bookmark_tags_insert_own"
on public.bookmark_tags
for insert
to authenticated
with check (user_id = auth.uid());

create policy "bookmark_tags_delete_own"
on public.bookmark_tags
for delete
to authenticated
using (user_id = auth.uid());

-- Embeddings
create table if not exists public.bookmark_embeddings (
  bookmark_id uuid primary key references public.bookmarks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_for_embedding text not null,
  embedding vector(1536) not null,
  embedding_version text not null default 'v1',
  updated_at timestamptz not null default now()
);

create index if not exists bookmark_embeddings_user_idx
on public.bookmark_embeddings (user_id);

-- Vector index for similarity search
create index if not exists bookmark_embeddings_embedding_ivfflat_idx
on public.bookmark_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.bookmark_embeddings enable row level security;

create policy "bookmark_embeddings_select_own"
on public.bookmark_embeddings
for select
to authenticated
using (user_id = auth.uid());

create policy "bookmark_embeddings_insert_own"
on public.bookmark_embeddings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "bookmark_embeddings_update_own"
on public.bookmark_embeddings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Similarity search RPC
create or replace function public.match_bookmarks(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 50
)
returns table (
  bookmark_id uuid,
  score float,
  url text,
  title text,
  description text,
  site_name text,
  image_url text,
  notes text,
  created_at timestamptz
)
language sql
stable
as $$
  select
    b.id as bookmark_id,
    1 - (e.embedding <=> p_query_embedding) as score,
    b.url,
    b.title,
    b.description,
    b.site_name,
    b.image_url,
    b.notes,
    b.created_at
  from public.bookmark_embeddings e
  join public.bookmarks b on b.id = e.bookmark_id
  where e.user_id = p_user_id
    and b.user_id = p_user_id
    and b.archived = false
  order by e.embedding <=> p_query_embedding
  limit p_match_count;
$$;

