-- Adiciona coluna de imagem aos produtos
alter table public.products add column if not exists image_url text;

-- Opcional: atualizar alguns itens com imagem inicial (substitua pelas URLs reais)
update public.products
set image_url = null
where image_url is null;
