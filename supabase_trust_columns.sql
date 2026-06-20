-- Colonne opzionali per il sistema ibrido "Fiducia + Regole sospette".
-- Eseguire nel SQL editor di Supabase prima del deploy per salvare i dettagli
-- di revisione nel log timbrature. L'app contiene comunque un fallback che
-- salva la timbratura senza questi metadati se le colonne non esistono ancora.
alter table public.timbrature
  add column if not exists metodo_timbratura text,
  add column if not exists gps_lat double precision,
  add column if not exists gps_lon double precision,
  add column if not exists gps_accuracy_m integer,
  add column if not exists gps_distanza_m integer,
  add column if not exists fiducia_score integer,
  add column if not exists fiducia_stato text,
  add column if not exists fiducia_motivi text;
create index if not exists timbrature_fiducia_stato_idx
  on public.timbrature (fiducia_stato);

-- Storico delle notifiche admin controllate.
create table if not exists public.notifiche_admin (
  id text primary key,
  type text not null,
  title text not null,
  message text not null,
  target_type text not null default 'all',
  target_value text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifiche_admin_scheduled_idx
  on public.notifiche_admin (scheduled_at, created_at);