import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({
    meta: [
      { title: "Plano de desenvolvimento — AprendizPro" },
      { name: "description", content: "Metas semanais de estudo, etapas e prazos." },
      { property: "og:title", content: "Plano de desenvolvimento — AprendizPro" },
      { property: "og:description", content: "Defina metas de estudo e acompanhe suas etapas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Plano,
});

function Plano() {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [horas, setHoras] = useState("5");
  const [prazo, setPrazo] = useState("");
  const [novaEtapa, setNovaEtapa] = useState<Record<string, string>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["planos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*, study_plan_steps(id, titulo, prazo, concluida)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const criarPlano = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("sem sessão");
      const { error } = await supabase.from("study_plans").insert({
        user_id: uid,
        titulo: titulo.trim(),
        meta_horas_semana: Number(horas),
        prazo: prazo || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano criado.");
      setTitulo("");
      setPrazo("");
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível criar o plano."),
  });

  const criarEtapa = useMutation({
    mutationFn: async (planId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("sem sessão");
      const { error } = await supabase.from("study_plan_steps").insert({
        plan_id: planId,
        user_id: uid,
        titulo: (novaEtapa[planId] ?? "").trim(),
      });
      if (error) throw error;
    },
    onSuccess: (_d, planId) => {
      setNovaEtapa((s) => ({ ...s, [planId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível adicionar a etapa."),
  });

  const alternarEtapa = useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const { error } = await supabase.from("study_plan_steps").update({ concluida }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível atualizar a etapa."),
  });

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano de desenvolvimento</h1>
        <p className="text-sm text-muted-foreground">Metas semanais de estudo, etapas e prazos.</p>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Novo plano</CardTitle>
          <CardDescription>Defina uma meta de horas de estudo por semana.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="pl-titulo">Título</Label>
            <Input
              id="pl-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Excel avançado"
              aria-label="Título do plano"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-horas">Horas por semana</Label>
            <Input
              id="pl-horas"
              type="number"
              min={1}
              step="0.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              aria-label="Meta de horas por semana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-prazo">Prazo</Label>
            <Input
              id="pl-prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              aria-label="Prazo do plano"
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              onClick={() => {
                if (titulo.trim().length < 2) return toast.error("Informe um título.");
                if (Number(horas) <= 0) return toast.error("A meta precisa ser maior que zero.");
                criarPlano.mutate();
              }}
              disabled={criarPlano.isPending}
              aria-label="Criar plano"
            >
              <Target className="size-4" aria-hidden="true" />
              Criar plano
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Não conseguimos carregar seus planos</CardTitle>
            <CardDescription>Tente novamente em instantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Tentar de novo</Button>
          </CardContent>
        </Card>
      )}

      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum plano ainda. Crie o primeiro acima para acompanhar sua meta semanal.
        </p>
      )}

      {data?.map((p) => {
        const etapas = p.study_plan_steps ?? [];
        const feitas = etapas.filter((e) => e.concluida).length;
        const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0;
        return (
          <Card key={p.id} className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>{p.titulo}</CardTitle>
              <CardDescription>
                Meta de {Number(p.meta_horas_semana)} h por semana
                {p.prazo ? ` · prazo ${new Date(p.prazo + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={pct} aria-label={`Progresso do plano ${p.titulo}: ${pct}%`} />
              <p className="text-sm text-muted-foreground">
                {feitas} de {etapas.length} etapas concluídas
              </p>
              <div className="space-y-2">
                {etapas.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`etapa-${e.id}`}
                      checked={e.concluida}
                      onCheckedChange={(v) =>
                        alternarEtapa.mutate({ id: e.id, concluida: v === true })
                      }
                      aria-label={`Marcar etapa ${e.titulo}`}
                    />
                    <Label
                      htmlFor={`etapa-${e.id}`}
                      className={`text-sm font-normal ${e.concluida ? "text-muted-foreground line-through" : ""}`}
                    >
                      {e.titulo}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={novaEtapa[p.id] ?? ""}
                  onChange={(ev) => setNovaEtapa((s) => ({ ...s, [p.id]: ev.target.value }))}
                  placeholder="Nova etapa"
                  aria-label={`Nova etapa do plano ${p.titulo}`}
                />
                <Button
                  variant="outline"
                  aria-label="Adicionar etapa"
                  onClick={() => {
                    if ((novaEtapa[p.id] ?? "").trim().length < 2)
                      return toast.error("Descreva a etapa.");
                    criarEtapa.mutate(p.id);
                  }}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </AppShell>
  );
}
