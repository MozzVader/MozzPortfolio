-- ============================================
-- MOZZ PORTFOLIO — Supabase Setup
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================

-- 1. Crear tabla de proyectos
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  tags text[] default '{}',
  image_url text,
  demo_url text,
  repo_url text,
  sort_order integer default 0,
  visible boolean default true,
  created_at timestamptz default now()
);

-- 2. Habilitar Row Level Security
alter table public.projects enable row level security;

-- 3. Políticas RLS

-- Cualquiera puede leer proyectos visibles
create policy "Public read visible projects" on public.projects
  for select to anon, authenticated
  using (visible = true);

-- Solo autenticados (admin) pueden insertar
create policy "Admin insert" on public.projects
  for insert to authenticated
  with check (true);

-- Solo autenticados (admin) pueden actualizar
create policy "Admin update" on public.projects
  for update to authenticated
  using (true) with check (true);

-- Solo autenticados (admin) pueden eliminar
create policy "Admin delete" on public.projects
  for delete to authenticated
  using (true);

-- 4. Crear bucket para imágenes
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

-- 5. Políticas de Storage

-- Lectura pública de imágenes
create policy "Public read images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio-images');

-- Admin puede subir imágenes
create policy "Admin upload images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-images');

-- Admin puede actualizar imágenes
create policy "Admin update images" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-images');

-- Admin puede eliminar imágenes
create policy "Admin delete images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-images');
