alter table public.products add column if not exists specs jsonb default '[]'::jsonb;
create index if not exists idx_products_specs_gin on public.products using gin (specs);
