import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function readDotEnvLocal(cwd) {
  const envPath = path.join(cwd, '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function mask(value) {
  if (!value) return '(empty)';
  if (value.length <= 10) return `${value.slice(0, 2)}…`;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

async function main() {
  const cwd = process.cwd();
  const env = readDotEnvLocal(cwd);

  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing Supabase env. Fill .env.local with:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  console.log('Supabase config:');
  console.log(`- url: ${url}`);
  console.log(`- key: ${mask(key)}`);

  // Node smoke client (no localStorage persistence here).
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const email = `smoke-${ts}@example.com`;
  const password = `Smoke!${Math.random().toString(16).slice(2)}A`;

  console.log('\n1) Signing up a test user...');
  const signUpRes = await supabase.auth.signUp({ email, password });
  if (signUpRes.error) {
    console.error('Sign up failed:', signUpRes.error.message);
    process.exit(1);
  }

  if (!signUpRes.data.session) {
    console.log('Sign up succeeded, but no session was returned.');
    console.log('This usually means "Confirm email" is enabled in Supabase Authentication settings.');
    console.log('Either disable Confirm email or click the verification email, then try logging in.');
    console.log(`Test user created: ${email}`);
    process.exit(2);
  }

  // Ensure session is applied
  await supabase.auth.setSession({
    access_token: signUpRes.data.session.access_token,
    refresh_token: signUpRes.data.session.refresh_token,
  });

  const userId = signUpRes.data.user?.id ?? null;
  if (!userId) {
    console.error('Could not read user id from signUp response.');
    process.exit(1);
  }
  console.log(`Signed in as user_id=${userId}`);

  console.log('\n2) Writing a row to active_hunts...');
  const insertRes = await supabase
    .from('active_hunts')
    .insert({
      user_id: userId,
      pokemon_id: 25,
      pokemon_name: 'Pikachu',
      method: 'gen8-random',
      counter: 1,
      has_shiny_charm: false,
      increment_amount: 1,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertRes.error) {
    console.error('Insert failed:', insertRes.error.message);
    process.exit(1);
  }

  console.log(`Insert OK, row id=${insertRes.data.id}`);

  console.log('\n2b) Writing a row to caught_shinies...');
  const insertShinyRes = await supabase
    .from('caught_shinies')
    .insert({
        user_id: userId,
        pokemon_id: 6,
        pokemon_name: 'Charizard',
        sprite_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/6.png',
        attempts: 400,
        method: 'gen8-random',
        caught_date: new Date().toISOString().split('T')[0],
        game: 'sword',
        has_shiny_charm: true
    })
    .select('id')
    .single();

    if (insertShinyRes.error) {
        console.error('Insert shiny failed:', insertShinyRes.error.message);
        // Do not exit, just log, so we can see if active_hunts worked but this failed
    } else {
        console.log(`Insert Shiny OK, row id=${insertShinyRes.data.id}`);

        console.log('\n2c) Reading back caught_shinies...');
        const readShinyRes = await supabase
            .from('caught_shinies')
            .select('*')
            .eq('user_id', userId);
        
        if (readShinyRes.error) {
            console.error('Read shiny failed:', readShinyRes.error.message);
        } else {
            console.log(`Read Shiny OK. Count: ${readShinyRes.data.length}`);
            console.log(readShinyRes.data[0]);
        }
    }

  console.log('\n3) Reading back the latest active_hunts row...');
  const readRes = await supabase
    .from('active_hunts')
    .select('id, pokemon_name, counter, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readRes.error) {
    console.error('Read failed:', readRes.error.message);
    process.exit(1);
  }

  console.log('Read OK:', readRes.data);

  console.log('\n✅ Supabase auth + DB RLS looks good.');
  console.log('Now you can log in from the app and your data should persist in the cloud.');
  console.log(`Test credentials (optional): ${email} / ${password}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

