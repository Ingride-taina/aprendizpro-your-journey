CREATE TYPE public.app_role AS ENUM ('aluno','docente','admin');
CREATE TYPE public.turma_status AS ENUM ('em_andamento','encerrada');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  tipo public.app_role NOT NULL DEFAULT 'aluno',
  data_nascimento DATE,
  avatar_url TEXT,
  consentimento_responsavel BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  periodo TEXT,
  codigo TEXT NOT NULL UNIQUE,
  status public.turma_status NOT NULL DEFAULT 'em_andamento',
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.turma_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel_na_turma public.app_role NOT NULL DEFAULT 'aluno',
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (turma_id, user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.turmas TO authenticated;
GRANT SELECT ON public.turmas TO anon;
GRANT ALL ON public.turmas TO service_role;
GRANT SELECT, DELETE ON public.turma_membros TO authenticated;
GRANT ALL ON public.turma_membros TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_docente_da_turma(_user_id UUID, _turma_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.turma_membros
    WHERE user_id = _user_id AND turma_id = _turma_id AND papel_na_turma IN ('docente','admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.compartilha_turma_como_docente(_docente UUID, _aluno UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.turma_membros d
    JOIN public.turma_membros a ON a.turma_id = d.turma_id
    WHERE d.user_id = _docente AND d.papel_na_turma IN ('docente','admin') AND a.user_id = _aluno
  );
$$;

CREATE OR REPLACE FUNCTION public.is_membro_da_turma(_user_id UUID, _turma_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.turma_membros WHERE user_id = _user_id AND turma_id = _turma_id);
$$;

-- impede escalonamento de privilégio via profiles.tipo
CREATE OR REPLACE FUNCTION public.protege_tipo_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tipo IS DISTINCT FROM OLD.tipo AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.tipo := OLD.tipo;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_protege_tipo_profile BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protege_tipo_profile();

-- papel padrão 'aluno' ao criar o perfil
CREATE OR REPLACE FUNCTION public.cria_papel_padrao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'aluno')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_cria_papel_padrao AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.cria_papel_padrao();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());
CREATE POLICY "profiles_select_docente_da_turma" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.compartilha_turma_como_docente(auth.uid(), id));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "turmas_select_publico" ON public.turmas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "turmas_insert_docente_admin" ON public.turmas FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'docente') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "turmas_update_docente_vinculado_ou_admin" ON public.turmas FOR UPDATE TO authenticated
USING (public.is_docente_da_turma(auth.uid(), id) OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.is_docente_da_turma(auth.uid(), id) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "turma_membros_select" ON public.turma_membros FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_docente_da_turma(auth.uid(), turma_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "turma_membros_delete" ON public.turma_membros FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_docente_da_turma(auth.uid(), turma_id) OR public.has_role(auth.uid(),'admin'));

-- entrada em turma por código (evita expor a tabela para insert direto)
CREATE OR REPLACE FUNCTION public.entrar_na_turma(_codigo TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _turma public.turmas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'nao autenticado'; END IF;
  SELECT * INTO _turma FROM public.turmas WHERE upper(codigo) = upper(trim(_codigo));
  IF NOT FOUND THEN RAISE EXCEPTION 'Código de turma inválido'; END IF;
  IF _turma.status = 'encerrada' THEN
    RAISE EXCEPTION 'Esta turma foi encerrada. Novas interações não são permitidas.';
  END IF;
  INSERT INTO public.turma_membros (turma_id, user_id, papel_na_turma)
  VALUES (_turma.id, auth.uid(), 'aluno')
  ON CONFLICT (turma_id, user_id) DO NOTHING;
  RETURN _turma.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.entrar_na_turma(TEXT) TO authenticated;

INSERT INTO public.turmas (nome, descricao, ano, periodo, codigo)
VALUES ('Aprendiz Administrativo 2026', 'Turma demonstrativa para testes do AprendizPro', 2026, 'Manhã', 'APRENDIZ2026');