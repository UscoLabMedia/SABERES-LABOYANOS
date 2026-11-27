-- Saberes de Laboyos: cuentas y partidas (Supabase). Pégalo completo en SQL Editor y pulsa Run.

-- Cada partida pertenece a un usuario (auth.users) y se borra si se borra el usuario.
create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  datos jsonb not null default '{}'::jsonb,
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now()
);
create index if not exists partidas_user on public.partidas (user_id, actualizada desc);
alter table public.partidas enable row level security;

-- Permisos de la tabla para quien inició sesión. Sin esto, los proyectos nuevos de Supabase
-- responden "permission denied for table partidas". Las reglas de abajo limitan a cada quien a lo suyo.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.partidas to authenticated;

-- Cada quien solo ve, crea, cambia y borra SUS partidas.
drop policy if exists "ver mis partidas" on public.partidas;
drop policy if exists "crear mis partidas" on public.partidas;
drop policy if exists "cambiar mis partidas" on public.partidas;
drop policy if exists "borrar mis partidas" on public.partidas;
create policy "ver mis partidas" on public.partidas for select to authenticated using (user_id = auth.uid());
create policy "crear mis partidas" on public.partidas for insert to authenticated with check (user_id = auth.uid());
create policy "cambiar mis partidas" on public.partidas for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "borrar mis partidas" on public.partidas for delete to authenticated using (user_id = auth.uid());

-- Permite que el estudiante borre su propia cuenta.
create or replace function public.borrar_mi_cuenta() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
