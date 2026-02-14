-- Tabella per le personalizzazioni globali del Pokedex
create table if not exists public.pokedex_overrides (
    id uuid default gen_random_uuid() primary key,
    user_id text not null, -- Useremo 'global' per la config comune
    pokemon_id integer not null,
    pokemon_name text not null,
    custom_display_name text,
    is_excluded boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Vincolo di unicità per id pokemon e nome (e user_id)
    unique(user_id, pokemon_id, pokemon_name)
);

-- Abilitazione RLS
alter table public.pokedex_overrides enable row level security;

-- Politiche di accesso
create policy "Configurazione visibile a tutti" 
on public.pokedex_overrides for select 
using (true);

create policy "Solo admin possono modificare" 
on public.pokedex_overrides for all 
using (auth.role() = 'authenticated');
