CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_docente_da_turma(_user_id UUID, _turma_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.turma_membros
    WHERE user_id = _user_id AND turma_id = _turma_id AND papel_na_turma IN ('docente','admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.compartilha_turma_como_docente(_docente UUID, _aluno UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.turma_membros d
    JOIN public.turma_membros a ON a.turma_id = d.turma_id
    WHERE d.user_id = _docente AND d.papel_na_turma IN ('docente','admin') AND a.user_id = _aluno
  );
$$;

CREATE OR REPLACE FUNCTION private.is_membro_da_turma(_user_id UUID, _turma_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.turma_membros WHERE user_id = _user_id AND turma_id = _turma_id);
$$;

CREATE OR REPLACE FUNCTION private.turma_ativa(_turma_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.turmas WHERE id = _turma_id AND status = 'em_andamento');
$$;

CREATE OR REPLACE FUNCTION private.protege_tipo_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tipo IS DISTINCT FROM OLD.tipo AND NOT private.has_role(auth.uid(), 'admin') THEN
    NEW.tipo := OLD.tipo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.cria_papel_padrao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'aluno')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protege_tipo_profile ON public.profiles;
DROP TRIGGER IF EXISTS trg_cria_papel_padrao ON public.profiles;
CREATE TRIGGER trg_protege_tipo_profile BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.protege_tipo_profile();
CREATE TRIGGER trg_cria_papel_padrao AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.cria_papel_padrao();

DROP POLICY "profiles_select_docente_da_turma" ON public.profiles;
DROP POLICY "user_roles_select_own" ON public.user_roles;
DROP POLICY "turmas_insert_docente_admin" ON public.turmas;
DROP POLICY "turmas_update_docente_vinculado_ou_admin" ON public.turmas;
DROP POLICY "turma_membros_select" ON public.turma_membros;
DROP POLICY "turma_membros_delete" ON public.turma_membros;

CREATE POLICY "profiles_select_docente_da_turma" ON public.profiles FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR private.compartilha_turma_como_docente(auth.uid(), id));
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "turmas_insert_docente_admin" ON public.turmas FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(),'docente') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "turmas_update_docente_vinculado_ou_admin" ON public.turmas FOR UPDATE TO authenticated
USING (private.is_docente_da_turma(auth.uid(), id) OR private.has_role(auth.uid(),'admin'))
WITH CHECK (private.is_docente_da_turma(auth.uid(), id) OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "turma_membros_select" ON public.turma_membros FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_docente_da_turma(auth.uid(), turma_id) OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "turma_membros_delete" ON public.turma_membros FOR DELETE TO authenticated
USING (user_id = auth.uid() OR private.is_docente_da_turma(auth.uid(), turma_id) OR private.has_role(auth.uid(),'admin'));

GRANT INSERT ON public.turma_membros TO authenticated;
CREATE POLICY "turma_membros_insert_proprio" ON public.turma_membros FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND papel_na_turma = 'aluno' AND private.turma_ativa(turma_id))
  OR private.is_docente_da_turma(auth.uid(), turma_id)
  OR private.has_role(auth.uid(),'admin')
);

DROP FUNCTION IF EXISTS public.entrar_na_turma(TEXT);
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);
DROP FUNCTION IF EXISTS public.is_docente_da_turma(UUID, UUID);
DROP FUNCTION IF EXISTS public.compartilha_turma_como_docente(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_membro_da_turma(UUID, UUID);
DROP FUNCTION IF EXISTS public.protege_tipo_profile();
DROP FUNCTION IF EXISTS public.cria_papel_padrao();