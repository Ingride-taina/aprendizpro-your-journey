import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { garantirPerfil } from "@/lib/perfil";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Meu painel — AprendizPro" },
      { name: "description", content: "Seu painel do AprendizPro: turmas, perfil e atalhos." },
      { property: "og:title", content: "Meu painel — AprendizPro" },
      { property: "og:description", content: "Seu painel do AprendizPro." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["painel-inicial"],
    queryFn: async () => {
      const perfil = await garantirPerfil();
      const { data: membros, error } = await supabase
        .from("turma_membros")
        .select("papel_na_turma, turmas(id, nome, periodo, ano, status)");
      if (error) throw error;
      return { perfil, membros: membros ?? [] };
    },
  });

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-6 text-primary" aria-hidden="true" />
            <span className="font-bold tracking-tight">AprendizPro</span>
          </div>
          <Button variant="outline" onClick={sair} aria-label="Sair da conta">
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Olá{data?.perfil?.nome ? `, ${data.perfil.nome.split(" ")[0]}` : ""}!
        </h1>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
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
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Minhas turmas</CardTitle>
              <CardDescription>Turmas em que você está matriculado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.membros.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Você ainda não está em nenhuma turma. Peça o código à sua instituição.
                </p>
              )}
              {data.membros.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border bg-background p-4"
                >
                  <div>
                    <p className="font-medium">{m.turmas?.nome}</p>
                    <p className="text-sm text-muted-foreground">
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
        )}
      </main>
    </div>
  );
}
