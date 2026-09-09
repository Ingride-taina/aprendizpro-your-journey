import { supabase } from "@/integrations/supabase/client";

/**
 * Garante que o perfil do usuário logado existe e que ele está vinculado
 * à turma informada no cadastro. Roda depois da confirmação de e-mail.
 */
export async function garantirPerfil() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const { data: existente } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let perfil = existente;

  if (!perfil) {
    const { data: criado, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        nome: (meta["nome"] as string) ?? user.email?.split("@")[0] ?? "",
        data_nascimento: (meta["data_nascimento"] as string) ?? null,
        consentimento_responsavel: Boolean(meta["consentimento_responsavel"]),
      })
      .select("*")
      .single();
    if (error) throw error;
    perfil = criado;
  }

  const codigo = (meta["codigo_turma"] as string | undefined)?.trim();
  if (codigo) {
    const { data: turma } = await supabase
      .from("turmas")
      .select("id, status")
      .ilike("codigo", codigo)
      .maybeSingle();
    if (turma && turma.status === "em_andamento") {
      await supabase
        .from("turma_membros")
        .insert({ turma_id: turma.id, user_id: user.id, papel_na_turma: "aluno" as const });
    }
  }

  return perfil;
}
