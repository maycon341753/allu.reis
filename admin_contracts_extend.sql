alter table public.contracts add column if not exists cpf text;
alter table public.contracts add column if not exists email text;
alter table public.contracts add column if not exists telefone text;
alter table public.contracts add column if not exists endereco text;
alter table public.contracts add column if not exists nascimento text;
alter table public.contracts add column if not exists cupom text;
alter table public.contracts add column if not exists total_mensal numeric(10,2);
