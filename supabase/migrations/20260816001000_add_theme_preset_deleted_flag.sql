alter table public.theme_preset_overrides
add column if not exists is_deleted boolean not null default false;
