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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, CATEGORIAS, inicioDoMes, isoData } from "@/lib/financeiro";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — AprendizPro" },
      { name: "description", content: "Entradas, saídas e orçamento por categoria do mês." },
      { property: "og:title", content: "Financeiro — AprendizPro" },
      { property: "og:description", content: "Controle suas entradas, saídas e orçamentos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  const queryClient = useQueryClient();
  const mesIso = isoData(inicioDoMes());

  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(isoData(new Date()));

  const [orcCategoria, setOrcCategoria] = useState<string>(CATEGORIAS[0]);
  const [orcValor, setOrcValor] = useState("");

  const consulta = useQuery({
    queryKey: ["financeiro", mesIso],
    queryFn: async () => {
      const [tx, orc] = await Promise.all([
        supabase.from("transactions").select("*").gte("data", mesIso).order("data", { ascending: false }),
        supabase.from("budgets").select("*").eq("mes_referencia", mesIso),
      ]);
      if (tx.error) throw tx.error;
      if (orc.error) throw orc.error;
      return { transacoes: tx.data ?? [], orcamentos: orc.data ?? [] };
    },
  });

  const criarTransacao = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("sem sessão");
      const { error } = await supabase.from("transactions").insert({
        user_id: uid,
        tipo,
        valor: Number(valor),
        categoria,
        descricao: descricao.trim() || null,
        data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setValor("");
      setDescricao("");
      toast.success("Lançamento registrado.");
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível registrar o lançamento."),
  });

  const removerTransacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  const salvarOrcamento = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("sem sessão");
      const { error } = await supabase
        .from("budgets")
        .upsert(
          {
            user_id: uid,
            categoria: orcCategoria,
            valor_limite: Number(orcValor),
            mes_referencia: mesIso,
          },
          { onConflict: "user_id,categoria,mes_referencia" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      setOrcValor("");
      toast.success("Orçamento salvo.");
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
    },
    onError: () => toast.error("Não foi possível salvar o orçamento."),
  });

  const transacoes = consulta.data?.transacoes ?? [];
  const entradas = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
  const saidas = transacoes.filter((t) => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Lançamentos e orçamento do mês atual.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardDescription>Entradas</CardDescription>
            <CardTitle className="text-success">{brl(entradas)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardDescription>Saídas</CardDescription>
            <CardTitle className="text-destructive">{brl(saidas)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardDescription>Saldo</CardDescription>
            <CardTitle>{brl(entradas - saidas)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Novo lançamento</CardTitle>
          <CardDescription>O valor é sempre positivo; o sinal vem do tipo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="tx-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "entrada" | "saida")}>
              <SelectTrigger id="tx-tipo" aria-label="Tipo do lançamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-valor">Valor</Label>
            <Input
              id="tx-valor"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-label="Valor do lançamento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-cat">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger id="tx-cat" aria-label="Categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-data">Data</Label>
            <Input
              id="tx-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              aria-label="Data do lançamento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-desc">Descrição</Label>
            <Input
              id="tx-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              aria-label="Descrição do lançamento"
            />
          </div>
          <div className="sm:col-span-5">
            <Button
              onClick={() => {
                const v = Number(valor);
                if (!(v > 0)) return toast.error("Informe um valor maior que zero.");
                if (!categoria) return toast.error("A categoria é obrigatória.");
                criarTransacao.mutate();
              }}
              disabled={criarTransacao.isPending}
              aria-label="Salvar lançamento"
            >
              {criarTransacao.isPending ? "Salvando..." : "Salvar lançamento"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Orçamento por categoria</CardTitle>
          <CardDescription>Avisamos quando você atingir 80% do limite.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="orc-cat">Categoria</Label>
              <Select value={orcCategoria} onValueChange={setOrcCategoria}>
                <SelectTrigger id="orc-cat" aria-label="Categoria do orçamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orc-valor">Limite do mês</Label>
              <Input
                id="orc-valor"
                type="number"
                min="0.01"
                step="0.01"
                value={orcValor}
                onChange={(e) => setOrcValor(e.target.value)}
                aria-label="Limite do orçamento"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (!(Number(orcValor) > 0))
                    return toast.error("O orçamento precisa ser maior que zero.");
                  salvarOrcamento.mutate();
                }}
                disabled={salvarOrcamento.isPending}
                aria-label="Salvar orçamento"
              >
                Salvar orçamento
              </Button>
            </div>
          </div>

          {(consulta.data?.orcamentos ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum orçamento definido para este mês.
            </p>
          )}
          {(consulta.data?.orcamentos ?? []).map((o) => {
            const gasto = transacoes
              .filter((t) => t.tipo === "saida" && t.categoria === o.categoria)
              .reduce((s, t) => s + Number(t.valor), 0);
            const limite = Number(o.valor_limite);
            const pct = Math.min(100, Math.round((gasto / limite) * 100));
            const alerta = gasto / limite >= 0.8;
            return (
              <div key={o.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{o.categoria}</span>
                  <span className={alerta ? "text-warning" : "text-muted-foreground"}>
                    {brl(gasto)} de {brl(limite)}
                  </span>
                </div>
                <Progress value={pct} aria-label={`Orçamento de ${o.categoria}: ${pct}% usado`} />
                {alerta && (
                  <p className="text-xs text-warning">
                    Atenção: você já usou {pct}% do orçamento de {o.categoria}.
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {consulta.isLoading && <Skeleton className="h-40 w-full" />}

      {consulta.isError && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Não conseguimos carregar seus dados</CardTitle>
            <CardDescription>Tente novamente em instantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => consulta.refetch()}>Tentar de novo</Button>
          </CardContent>
        </Card>
      )}

      {consulta.data && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Lançamentos do mês</CardTitle>
            <CardDescription>Do mais recente para o mais antigo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {transacoes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento neste mês. Registre o primeiro acima.
              </p>
            )}
            {transacoes.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
              >
                <div>
                  <p className="text-sm font-medium">{t.descricao || t.categoria}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} · {t.categoria}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={t.tipo === "entrada" ? "default" : "secondary"}>
                    {t.tipo === "entrada" ? "+" : "−"} {brl(Number(t.valor))}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover lançamento ${t.descricao || t.categoria}`}
                    onClick={() => removerTransacao.mutate(t.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
