-- 1. Remove restrições antigas (nome em inglês ou português)
DO $$
BEGIN
    -- Tenta remover a restrição com o nome relatado no erro
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_categoria_permitida') THEN
        ALTER TABLE public.products DROP CONSTRAINT "produtos_categoria_permitida";
    END IF;

    -- Tenta remover a restrição com o nome padrão do projeto
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_categoria_allowed') THEN
        ALTER TABLE public.products DROP CONSTRAINT "products_categoria_allowed";
    END IF;
    
    -- Tenta remover a restrição padrão products_categoria_chk se existir
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_categoria_chk') THEN
        ALTER TABLE public.products DROP CONSTRAINT "products_categoria_chk";
    END IF;
END $$;

-- 2. Normaliza os nomes das categorias (Corrige 'Smartwhats' para 'Smartwatch')
UPDATE public.products 
SET categoria = 'Smartwatch' 
WHERE categoria = 'Smartwhats';

-- 3. Limpa URLs de imagem inválidas (remove crases e vírgulas extras no final)
UPDATE public.products
SET image_url = regexp_replace(replace(image_url, '`', ''), ',$', '')
WHERE image_url LIKE '%`%' OR image_url LIKE '%,';

-- 4. Reaplica a restrição com a lista correta de categorias
ALTER TABLE public.products
ADD CONSTRAINT "products_categoria_allowed"
CHECK (categoria IN ('Smartwatch', 'Celular', 'Iphone', 'Tablets', 'Notebooks', 'Wearable', 'Outros'));

-- 5. Verifica se a coluna image_url existe e garante que seja texto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url text;
    END IF;
END $$;
