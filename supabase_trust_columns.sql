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
