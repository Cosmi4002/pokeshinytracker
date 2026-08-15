create table if not exists public.theme_preset_overrides (
  preset_id text primary key,
  name text not null,
  theme_color text not null,
  background_color text not null,
  ui_style text not null,
  background_style text not null,
  background_color2 text not null default '',
  background_color3 text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.theme_preset_overrides enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'theme_preset_overrides'
      and policyname = 'Theme presets are viewable by everyone'
  ) then
    execute 'create policy "Theme presets are viewable by everyone" on public.theme_preset_overrides for select using (true);';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'theme_preset_overrides'
      and policyname = 'Theme manager can insert presets'
  ) then
    execute 'create policy "Theme manager can insert presets" on public.theme_preset_overrides for insert with check ((auth.jwt() ->> ''email'') = ''chritel04@gmail.com'');';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'theme_preset_overrides'
      and policyname = 'Theme manager can update presets'
  ) then
    execute 'create policy "Theme manager can update presets" on public.theme_preset_overrides for update using ((auth.jwt() ->> ''email'') = ''chritel04@gmail.com'') with check ((auth.jwt() ->> ''email'') = ''chritel04@gmail.com'');';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'theme_preset_overrides'
      and policyname = 'Theme manager can delete presets'
  ) then
    execute 'create policy "Theme manager can delete presets" on public.theme_preset_overrides for delete using ((auth.jwt() ->> ''email'') = ''chritel04@gmail.com'');';
  end if;
end $$;
