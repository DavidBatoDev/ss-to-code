-- Pixel2Code: profiles + saved generations, protected by Row Level Security.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  model text not null,
  stack text not null,
  label text not null default 'First draft',
  code text not null,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_created_idx on public.generations (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.generations enable row level security;

-- profiles: users see and edit only their own row
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id);

-- generations: full CRUD on own rows only
drop policy if exists "own generations read" on public.generations;
create policy "own generations read" on public.generations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own generations insert" on public.generations;
create policy "own generations insert" on public.generations for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "own generations delete" on public.generations;
create policy "own generations delete" on public.generations for delete to authenticated using ((select auth.uid()) = user_id);

-- auto-create a profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
