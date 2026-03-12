create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  produto text not null,
  categoria text,
  plano text,
  total_mensal numeric(10,2),
  status text not null default 'Pendente' check (status in ('Pendente','Pago','Falhou')),
  metodo text,
  cliente_nome text,
  cliente_cpf text,
  cliente_email text,
  cliente_telefone text,
  entrega_endereco text,
  residencial_endereco text,
  cep text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

drop policy if exists payments_select_public on public.payments;
create policy payments_select_public on public.payments for select to authenticated using (true);

drop policy if exists payments_insert_authenticated on public.payments;
create policy payments_insert_authenticated on public.payments for insert to authenticated with check (true);
