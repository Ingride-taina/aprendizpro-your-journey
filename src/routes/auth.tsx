import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ehMenorDeIdade } from "@/lib/idade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — AprendizPro" },
      {
        name: "description",
        content:
          "Acesse o AprendizPro para organizar tempo, finanças e comunidade do seu programa de aprendizagem.",
      },
      { property: "og:title", content: "Entrar ou criar conta — AprendizPro" },
      {
        property: "og:description",
        content: "Acesse o AprendizPro e organize seus estudos, agenda e finanças.",
      },
    ],
  }),
  component: AuthPage,
});

const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres").max(72),
  dataNascimento: z.string().min(1, "Informe sua data de nascimento"),
  codigoTurma: z.string().trim().min(3, "Informe o código da turma").max(40),
});

function AuthPage() {
  const navigate = useNavigate();

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [entrando, setEntrando] = useState(false);

  // cadastro
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [codigoTurma, setCodigoTurma] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const menor = dataNascimento ? ehMenorDeIdade(dataNascimento) : false;

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginSenha,
    });
    setEntrando(false);
    if (error) { toast.error("E-mail ou senha inválidos"); return; }
    navigate({ to: "/dashboard" });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = cadastroSchema.safeParse({ nome, email, senha, dataNascimento, codigoTurma });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    if (menor && !consentimento) {
      { toast.error("É necessário o consentimento do responsável legal."); return; }
    }

    setCadastrando(true);
    const { data: turma } = await supabase
      .from("turmas")
      .select("id, status")
      .ilike("codigo", codigoTurma.trim())
      .maybeSingle();

    if (!turma) {
      setCadastrando(false);
      { toast.error("Código de turma inválido."); return; }
    }
    if (turma.status === "encerrada") {
      setCadastrando(false);
      { toast.error("Esta turma foi encerrada. Novas interações não são permitidas."); return; }
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          nome: nome.trim(),
          data_nascimento: dataNascimento,
          codigo_turma: codigoTurma.trim(),
          consentimento_responsavel: menor ? consentimento : false,
        },
      },
    });
    setCadastrando(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("registered")
          ? "Não foi possível concluir o cadastro com esses dados."
          : "Não foi possível concluir o cadastro. Tente novamente.",
      );
      return;
    }
    setEnviado(true);
    toast.success("Confirme seu e-mail para liberar o acesso.");
  }

  async function recuperarSenha() {
    const alvo = (loginEmail || email).trim();
    if (!alvo) { toast.error("Informe seu e-mail para receber o link."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(alvo, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { toast.error("Não foi possível enviar o link agora."); return; }
    toast.success("Se o e-mail existir, enviamos um link válido por 1 hora.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <GraduationCap className="size-7 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight">AprendizPro</span>
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>Entre na sua conta ou crie uma com o código da sua turma.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={entrar} className="space-y-4" aria-label="Formulário de login">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      aria-label="E-mail"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-senha">Senha</Label>
                    <Input
                      id="login-senha"
                      type="password"
                      autoComplete="current-password"
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      required
                      aria-label="Senha"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={entrando}>
                    {entrando ? "Entrando..." : "Entrar"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={recuperarSenha}
                    aria-label="Recuperar senha por e-mail"
                  >
                    Esqueci minha senha
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="cadastro">
                {enviado ? (
                  <div className="space-y-3 py-4 text-center" role="status">
                    <h2 className="text-lg font-semibold">Confirme seu e-mail</h2>
                    <p className="text-sm text-muted-foreground">
                      Enviamos um link de confirmação para <strong>{email}</strong>. O acesso é
                      liberado depois da confirmação.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={cadastrar} className="space-y-4" aria-label="Formulário de cadastro">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        aria-label="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-label="E-mail"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha</Label>
                      <Input
                        id="senha"
                        type="password"
                        autoComplete="new-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        aria-label="Senha"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nascimento">Data de nascimento</Label>
                      <Input
                        id="nascimento"
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        required
                        aria-label="Data de nascimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="turma">Código da turma</Label>
                      <Input
                        id="turma"
                        value={codigoTurma}
                        onChange={(e) => setCodigoTurma(e.target.value)}
                        placeholder="Ex.: APRENDIZ2026"
                        required
                        aria-label="Código da turma"
                      />
                    </div>

                    {menor && (
                      <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3">
                        <Checkbox
                          id="consentimento"
                          checked={consentimento}
                          onCheckedChange={(v) => setConsentimento(v === true)}
                          aria-label="Consentimento do responsável legal"
                        />
                        <Label htmlFor="consentimento" className="text-sm leading-relaxed font-normal">
                          Declaro que sou menor de 18 anos e que meu responsável legal tem ciência e
                          autoriza a criação desta conta e o tratamento dos meus dados no AprendizPro.
                        </Label>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={cadastrando}>
                      {cadastrando ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">
            Voltar para a página inicial
          </Link>
        </p>
      </div>
    </main>
  );
}
