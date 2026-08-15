do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Public profiles are discoverable'
  ) then
    execute 'create policy "Public profiles are discoverable" on public.profiles for select using (username is not null and btrim(username) <> '''');';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'caught_shinies'
      and policyname = 'Public caught shinies are viewable'
  ) then
    execute 'create policy "Public caught shinies are viewable" on public.caught_shinies for select using (true);';
  end if;
end $$;
