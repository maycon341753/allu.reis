-- SQL para corrigir o erro "Database error saving new user"
-- Copie e cole todo este código no Editor SQL do seu projeto Supabase

-- 1. Relaxar restrições para permitir criação inicial do perfil pelo trigger
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN cpf DROP NOT NULL;

-- 2. Ajustar validação de CPF para aceitar NULL (caso ainda não tenha sido preenchido)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cpf_digits_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_cpf_digits_check;
    END IF;
END $$;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_cpf_digits_check
    CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');

-- 3. Ajustar índice único de CPF para ignorar NULLs (evita erro ao ter vários perfis sem CPF inicial)
DROP INDEX IF EXISTS profiles_cpf_unique;
CREATE UNIQUE INDEX profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL;

-- 4. Garantir que o trigger de criação de usuário seja robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta pegar dados dos metadados se existirem, senão insere NULL
  INSERT INTO public.profiles (id, full_name, phone, cpf)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Recriar o trigger para garantir que está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Garantir permissões de RLS para que o usuário possa atualizar seu próprio perfil depois
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
