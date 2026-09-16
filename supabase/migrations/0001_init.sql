-- 고양이의 별 : 초기 스키마
-- Supabase Dashboard > SQL Editor 에 전체를 붙여넣고 실행하세요.
-- 실행 전에 Authentication > Providers > Anonymous Sign-ins 를 켜두세요.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- cat_profiles : 사용자(익명 세션)당 고양이 프로필 1개
-- ---------------------------------------------------------------------------
create table if not exists public.cat_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '루루',
  guardian_name text not null default '',
  met_date date,
  birthday date,
  description text not null default '',
  portrait_path text,
  portrait_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cat_profiles enable row level security;

create policy "cat_profiles_select_own" on public.cat_profiles
  for select using (owner_id = auth.uid());
create policy "cat_profiles_insert_own" on public.cat_profiles
  for insert with check (owner_id = auth.uid());
create policy "cat_profiles_update_own" on public.cat_profiles
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "cat_profiles_delete_own" on public.cat_profiles
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- memory_stars : 기억별
--   row_id   = 내부 기본키 (photos 외래키용)
--   public_id = 프론트에 노출되는 id.
--               mock 별(1~20)을 채울 때는 그 슬롯 번호("5" 등) 문자열을 그대로 쓰고,
--               새로 만든 별은 UUID 문자열을 쓴다.
--               사용자별로만 유일하면 되므로 (owner_id, public_id) unique로 둔다.
-- ---------------------------------------------------------------------------
create table if not exists public.memory_stars (
  row_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  public_id text not null,
  status text not null default 'filled' check (status in ('empty', 'filled', 'archived')),
  name text not null,
  memory_date date,
  activity text,
  note text not null default '',
  cover_photo_id uuid,
  position jsonb not null default '{}',
  visual jsonb not null default '{}',
  source jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  filled_at timestamptz,
  deleted_at timestamptz,
  unique (owner_id, public_id)
);

create index if not exists memory_stars_owner_idx on public.memory_stars (owner_id);

alter table public.memory_stars enable row level security;

create policy "memory_stars_select_own" on public.memory_stars
  for select using (owner_id = auth.uid());
create policy "memory_stars_insert_own" on public.memory_stars
  for insert with check (owner_id = auth.uid());
create policy "memory_stars_update_own" on public.memory_stars
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "memory_stars_delete_own" on public.memory_stars
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- memory_photos : 별 하나에 사진 여러 장 (1:N)
-- ---------------------------------------------------------------------------
create table if not exists public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_star_row_id uuid not null references public.memory_stars(row_id) on delete cascade,
  storage_path text not null,
  public_url text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  taken_at timestamptz,
  uploaded_at timestamptz not null default now(),
  sort_order integer not null default 0,
  alt text,
  dominant_color text,
  blur_data_url text,
  metadata jsonb not null default '{}'
);

create index if not exists memory_photos_star_idx on public.memory_photos (memory_star_row_id);
create index if not exists memory_photos_owner_idx on public.memory_photos (owner_id);

alter table public.memory_photos enable row level security;

create policy "memory_photos_select_own" on public.memory_photos
  for select using (owner_id = auth.uid());
create policy "memory_photos_insert_own" on public.memory_photos
  for insert with check (owner_id = auth.uid());
create policy "memory_photos_update_own" on public.memory_photos
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "memory_photos_delete_own" on public.memory_photos
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- updated_at 자동 갱신
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cat_profiles_set_updated_at on public.cat_profiles;
create trigger cat_profiles_set_updated_at
  before update on public.cat_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists memory_stars_set_updated_at on public.memory_stars;
create trigger memory_stars_set_updated_at
  before update on public.memory_stars
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage : 기억 사진 버킷
--   경로 규칙: {owner_id}/{public_id}/{photoId}-{filename}
--   public bucket 이라 URL을 아는 사람은 볼 수 있지만 경로가 uuid라 추측이 불가능하다.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', true)
on conflict (id) do nothing;

create policy "memory_photos_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "memory_photos_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "memory_photos_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
