-- Hybrid search function: combines semantic similarity (70%) with keyword matching (30%)
create or replace function public.match_bookmarks_hybrid(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_query_text text,
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
language plpgsql
stable
as $$
declare
  keyword_weight float := 0.3;
  semantic_weight float := 0.7;
begin
  return query
  with semantic_results as (
    select
      b.id as bookmark_id,
      1 - (e.embedding <=> p_query_embedding) as semantic_score,
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
  ),
  keyword_results as (
    select
      b.id as bookmark_id,
      greatest(
        case when b.title ilike '%' || p_query_text || '%' then 1.0 else 0.0 end,
        case when b.notes ilike '%' || p_query_text || '%' then 0.8 else 0.0 end,
        case when b.content_text ilike '%' || p_query_text || '%' then 0.7 else 0.0 end,
        case when b.description ilike '%' || p_query_text || '%' then 0.6 else 0.0 end,
        case when b.url ilike '%' || p_query_text || '%' then 0.4 else 0.0 end
      ) as keyword_score,
      b.url,
      b.title,
      b.description,
      b.site_name,
      b.image_url,
      b.notes,
      b.created_at
    from public.bookmarks b
    where b.user_id = p_user_id
      and b.archived = false
      and (
        b.title ilike '%' || p_query_text || '%'
        or b.notes ilike '%' || p_query_text || '%'
        or b.content_text ilike '%' || p_query_text || '%'
        or b.description ilike '%' || p_query_text || '%'
        or b.url ilike '%' || p_query_text || '%'
      )
  ),
  combined as (
    select
      coalesce(s.bookmark_id, k.bookmark_id) as bookmark_id,
      coalesce(s.semantic_score, 0.0) * semantic_weight + coalesce(k.keyword_score, 0.0) * keyword_weight as final_score,
      coalesce(s.url, k.url) as url,
      coalesce(s.title, k.title) as title,
      coalesce(s.description, k.description) as description,
      coalesce(s.site_name, k.site_name) as site_name,
      coalesce(s.image_url, k.image_url) as image_url,
      coalesce(s.notes, k.notes) as notes,
      coalesce(s.created_at, k.created_at) as created_at
    from semantic_results s
    full outer join keyword_results k on s.bookmark_id = k.bookmark_id
  )
  select
    bookmark_id,
    final_score as score,
    url,
    title,
    description,
    site_name,
    image_url,
    notes,
    created_at
  from combined
  where final_score > 0
  order by final_score desc
  limit p_match_count;
end;
$$;
