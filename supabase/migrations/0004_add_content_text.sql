-- Add content_text column to bookmarks for storing extracted readable text
alter table public.bookmarks
add column if not exists content_text text;
