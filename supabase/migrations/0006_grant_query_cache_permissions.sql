-- Grant permissions on query_embeddings_cache table
grant select, insert, update on public.query_embeddings_cache to authenticated;
grant execute on function public.touch_query_cache(text) to authenticated;
