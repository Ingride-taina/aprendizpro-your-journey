import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { garantirPerfil } from "@/lib/perfil";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { brl, inicioDoMes, isoData } from "@/lib/financeiro";
import { CalendarPlus, CircleDollarSign, NotebookPen, LifeBuoy, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Meu painel — AprendizPro" },
      { name: "description", content: "Seu dia, suas finanças do mês e sua meta de estudo." },
      { property: "og:title", content: "Meu painel — AprendizPro" },
      { property: "og:description", content: "Seu dia, suas finanças do mês e sua meta de estudo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString();
  const mesIso = isoData(inicioDoMes(hoje));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["painel", mesIso],
    queryFn: async () => {
      const perfil = await garantirPerfil();
      const [eventos, tarefas, transacoes, plano, turmas] = await Promise.all([
        supabase
          .from("events")
          .select("id, titulo, inicio, dia_inteiro")
          .gte("inicio", inicioDia)
          .lt("inicio", fimDia)
          .order("inicio"),
        supabase.from("tasks").select("id, titulo, prazo, concluida").eq("concluida", false).order("prazo"),
        supabase.from("transactions").select("tipo, valor, categoria").gte("data", mesIso),
        supabase
          .from("study_plans")
          .select("id, titulo, meta_horas_semana, study_plan_steps(id, concluida)")
          .eq("status", "ativo")
          .order("created_at")
          .limit(1),
        supabase.from("turma_membros").select("papel_na_turma, turmas(nome, periodo, ano, status)"),
      ]);
      const erro =
        eventos.error || tarefas.error || transacoes.error || plano.error || turmas.error;
      if (erro) throw erro;

      const lista = transacoes.data ?? [];
      const entradas = lista
        .filter((t) => t.tipo === "entrada")
        .reduce((s, t) => s + Number(t.valor), 0);
      const saidas = lista
        .filter((t) => t.tipo === "saida")
        .reduce((s, t) => s + Number(t.valor), 0);

      return {
        perfil,
        eventos: eventos.data ?? [],
        tarefas: tarefas.data ?? [],
        entradas,
        saidas,
        plano: plano.data?.[0] ?? null,
        turmas: turmas.data ?? [],
      };
    },
  });

  const atalhos = [
    { label: "Adicionar gasto", to: "/financeiro" as const, icon: CircleDollarSign },
    { label: "Criar evento", to: "/agenda" as const, icon: CalendarPlus },
    { label: "Nova etapa do plano", to: "/plano" as const, icon: NotebookPen },
  ];

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá{data?.perfil?.nome ? `, ${data.perfil.nome.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {atalhos.map(({ label, to, icon: Icon }) => (
          <Button key={label} asChild variant="outline" aria-label={label}>
            <Link to={to}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </Button>
        ))}
        <Button
          variant="outline"
          aria-label="Falar com suporte"
          onClick={() => toast.info("O suporte chega em breve, no próximo bloco do AprendizPro.")}
        >
          <LifeBuoy className="size-4" aria-hidden="true" />
          Falar com suporte
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      )}

      {isError && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Não conseguimos carregar seus dados</CardTitle>
            <CardDescription>Verifique sua conexão e tente novamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Tentar de novo</Button>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Hoje</CardTitle>
              <CardDescription>Compromissos e tarefas em aberto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.eventos.length === 0 && data.tarefas.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Nada marcado para hoje.</p>
                  <Button asChild size="sm">
                    <Link to="/agenda">Criar meu primeiro compromisso</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {data.eventos.map((e) => (
                    <div key={e.id} className="rounded-md border bg-background p-3 text-sm">
                      <p className="font-medium">{e.titulo}</p>
                      <p className="text-muted-foreground">
                        {e.dia_inteiro
                          ? "Dia inteiro"
                          : new Date(e.inicio).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </p>
                    </div>
                  ))}
                  {data.tarefas.slice(0, 4).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span>{t.titulo}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Resumo do mês</CardTitle>
              <CardDescription>Entradas, saídas e saldo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entradas</span>
                <span className="font-medium text-success">{brl(data.entradas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saídas</span>
                <span className="font-medium text-destructive">{brl(data.saidas)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Saldo</span>
                <span className="font-bold">{brl(data.entradas - data.saidas)}</span>
              </div>
              {data.entradas === 0 && data.saidas === 0 && (
                <Button asChild size="sm" className="mt-2">
                  <Link to="/financeiro">Registrar primeiro lançamento</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Meta de estudo semanal</CardTitle>
              <CardDescription>Do seu plano de desenvolvimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.plano ? (
                <>
                  <p className="font-medium">{data.plano.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    Meta: {Number(data.plano.meta_horas_semana)} h por semana
                  </p>
                  {(() => {
                    const etapas = data.plano.study_plan_steps ?? [];
                    const feitas = etapas.filter((s) => s.concluida).length;
                    const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0;
                    return (
                      <>
                        <Progress value={pct} aria-label={`Progresso do plano: ${pct}%`} />
                        <p className="text-sm text-muted-foreground">
                          {feitas} de {etapas.length} etapas concluídas
                        </p>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Você ainda não tem um plano ativo.</p>
                  <Button asChild size="sm">
                    <Link to="/plano">Criar plano de estudo</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Minhas turmas</CardTitle>
              <CardDescription>Turmas em que você participa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.turmas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Você ainda não está em nenhuma turma. Peça o código à sua instituição.
                </p>
              )}
              {data.turmas.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border bg-background p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{m.turmas?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.turmas?.periodo} · {m.turmas?.ano} · {m.papel_na_turma}
                    </p>
                  </div>
                  <Badge variant={m.turmas?.status === "encerrada" ? "secondary" : "default"}>
                    {m.turmas?.status === "encerrada" ? "Encerrada" : "Em andamento"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
