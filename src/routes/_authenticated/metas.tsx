import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { brl, valorFuturo } from "@/lib/financeiro";
import { PiggyBank, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({
    meta: [
      { title: "Metas financeiras — AprendizPro" },
      { name: "description", content: "Simule juros compostos e acompanhe suas metas de dinheiro." },
      { property: "og:title", content: "Metas financeiras — AprendizPro" },
      { property: "og:description", content: "Simulador de juros compostos e acompanhamento de metas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Metas,
});

function Metas() {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [valorAtual, setValorAtual] = useState("0");
  const [aporte, setAporte] = useState("100");
  const [taxa, setTaxa] = useState("0.005");
  const [meses, setMeses] = useState("12");

  const simulado = useMemo(
    () => valorFuturo(Number(aporte), Number(taxa), Number(meses)),
    [aporte, taxa, meses],
  );
  const totalAportado = Number(aporte) * Number(meses) || 0;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["metas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("sem sessão");
      const { error } = await supabase.from("financial_goals").insert({
        user_id: uid,
        titulo: titulo.trim(),
        valor_alvo: Number(valorAlvo),
        valor_atual: Number(valorAtual) || 0,
        aporte_mensal: Number(aporte) || 0,
        taxa_juros_mensal: Number(taxa) || 0,
        meses: Number(meses),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitulo("");
      setValorAlvo("");
      toast.success("Meta criada.");
      queryClient.invalidateQueries({ queryKey: ["metas"] });
    },
    onError: () => toast.error("Não foi possível criar a meta."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["metas"] }),
    onError: () => toast.error("Não foi possível remover a meta."),
  });

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metas financeiras</h1>
        <p className="text-sm text-muted-foreground">
          Simule quanto o seu dinheiro rende guardando todo mês.
        </p>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Simulador de juros compostos</CardTitle>
          <CardDescription>
            Valor futuro = aporte × [((1 + i)ⁿ − 1) / i], com i mensal em decimal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mt-aporte">Aporte mensal (R$)</Label>
            <Input
              id="mt-aporte"
              type="number"
              min="0"
              step="0.01"
              value={aporte}
              onChange={(e) => setAporte(e.target.value)}
              aria-label="Aporte mensal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mt-taxa">Juros ao mês (decimal)</Label>
            <Input
              id="mt-taxa"
              type="number"
              min="0"
              step="0.0001"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              aria-label="Taxa de juros mensal em decimal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mt-meses">Meses</Label>
            <Input
              id="mt-meses"
              type="number"
              min="1"
              value={meses}
              onChange={(e) => setMeses(e.target.value)}
              aria-label="Número de meses"
            />
          </div>
          <div className="sm:col-span-3 rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Você teria ao final</p>
            <p className="text-2xl font-bold text-secondary">{brl(simulado)}</p>
            <p className="text-sm text-muted-foreground">
              Guardado do próprio bolso: {brl(totalAportado)} · Rendimento:{" "}
              {brl(Math.max(0, simulado - totalAportado))}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Nova meta</CardTitle>
          <CardDescription>Use os valores do simulador acima.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mt-titulo">Título</Label>
            <Input
              id="mt-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Notebook novo"
              aria-label="Título da meta"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mt-alvo">Valor desejado (R$)</Label>
            <Input
              id="mt-alvo"
              type="number"
              min="0.01"
              step="0.01"
              value={valorAlvo}
              onChange={(e) => setValorAlvo(e.target.value)}
              aria-label="Valor desejado"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mt-atual">Já guardado (R$)</Label>
            <Input
              id="mt-atual"
              type="number"
              min="0"
              step="0.01"
              value={valorAtual}
              onChange={(e) => setValorAtual(e.target.value)}
              aria-label="Valor já guardado"
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              onClick={() => {
                if (titulo.trim().length < 2) { toast.error("Informe um título."); return; }
                if (!(Number(valorAlvo) > 0))
                  { toast.error("O valor desejado precisa ser maior que zero."); return; }
                criar.mutate();
              }}
              disabled={criar.isPending}
              aria-label="Criar meta"
            >
              <PiggyBank className="size-4" aria-hidden="true" />
              Criar meta
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Não conseguimos carregar suas metas</CardTitle>
            <CardDescription>Tente novamente em instantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Tentar de novo</Button>
          </CardContent>
        </Card>
      )}

      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma meta ainda. Crie a primeira acima.
        </p>
      )}

      {data?.map((m) => {
        const alvo = Number(m.valor_alvo);
        const atual = Number(m.valor_atual);
        const pct = Math.min(100, Math.round((atual / alvo) * 100));
        const projecao =
          atual + valorFuturo(Number(m.aporte_mensal), Number(m.taxa_juros_mensal), m.meses);
        return (
          <Card key={m.id} className="shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{m.titulo}</CardTitle>
                <CardDescription>
                  {brl(atual)} de {brl(alvo)}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover meta ${m.titulo}`}
                onClick={() => remover.mutate(m.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={pct} aria-label={`Progresso da meta ${m.titulo}: ${pct}%`} />
              <p className="text-sm text-muted-foreground">
                Guardando {brl(Number(m.aporte_mensal))} por mês a {Number(m.taxa_juros_mensal) * 100}
                % ao mês, em {m.meses} meses você teria {brl(projecao)}.
              </p>
              {projecao >= alvo ? (
                <p className="text-sm text-success">Nesse ritmo, você alcança a meta.</p>
              ) : (
                <p className="text-sm text-warning">
                  Faltariam {brl(alvo - projecao)} para chegar lá nesse prazo.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </AppShell>
  );
}
