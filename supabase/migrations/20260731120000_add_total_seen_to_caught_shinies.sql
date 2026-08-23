alter table public.caught_shinies
  add column if not exists show_total_seen boolean not null default false,
  add column if not exists total_seen_count integer;

alter table public.caught_shinies
  drop constraint if exists caught_shinies_total_seen_count_nonnegative;

alter table public.caught_shinies
  add constraint caught_shinies_total_seen_count_nonnegative
  check (total_seen_count is null or total_seen_count >= 0);
