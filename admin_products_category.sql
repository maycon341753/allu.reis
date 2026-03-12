-- Categoria com valores permitidos
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'products_categoria_allowed'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products drop constraint products_categoria_allowed;
  end if;
end $$;

alter table public.products
  add constraint products_categoria_allowed
  check (categoria in ('Smartwhats','Celular','Iphone','Tablets','Notebooks'));

-- Opcional: criar índice para filtros
create index if not exists idx_products_categoria on public.products (categoria);
