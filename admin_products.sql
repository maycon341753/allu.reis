-- Tabela de produtos para /admin/produtos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  preco_mensal numeric(10,2) not null,
  estoque integer not null default 0,
  status text not null check (status in ('Ativo','Indisponível')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false)
$$;

drop policy if exists products_select_admin on public.products;
create policy products_select_admin
on public.products
for select
using (public.is_admin(auth.uid()));

drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin
on public.products
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists products_update_admin on public.products;
create policy products_update_admin
on public.products
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin
on public.products
for delete
using (public.is_admin(auth.uid()));

insert into public.products (nome, categoria, preco_mensal, estoque, status)
values
('iPhone 15 Pro 128GB', 'Celular', 289.00, 12, 'Ativo'),
('MacBook Air M3 8/256', 'Notebook', 449.00, 5, 'Ativo'),
('Apple Watch Series 9', 'Wearable', 149.00, 0, 'Indisponível')
on conflict do nothing;
