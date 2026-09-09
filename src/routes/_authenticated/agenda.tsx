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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarPlus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — AprendizPro" },
      { name: "description", content: "Seus compromissos por dia, semana e mês, com lembretes." },
      { property: "og:title", content: "Agenda — AprendizPro" },
      { property: "og:description", content: "Compromissos, repetições e lembretes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Agenda,
});

type Visao = "dia" | "semana" | "mes";

const RECORRENCIA_LABEL: Record<string, string> = {
  nenhuma: "Uma vez",
  diaria: "Todo dia",
  semanal: "Toda semana",
  mensal: "Todo mês",
};

function intervalo(visao: Visao) {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fim = new Date(inicio);
  if (visao === "dia") fim.setDate(fim.getDate() + 1);
  if (visao === "semana") fim.setDate(fim.getDate() + 7);
  if (visao === "mes") fim.setMonth(fim.getMonth() + 1);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

function Agenda() {
  const queryClient = useQueryClient();
  const [visao, setVisao] = useState<Visao>("semana");
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("");
  const [recorrencia, setRecorrencia] = useState("nenhuma");
  const [lembrete, setLembrete] = useState("30");

  const { inicio: de, fim: ate } = intervalo(visao);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["eventos", visao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("inicio", de)
        .lt("inicio", ate)
        .order("inicio");
      if (error) throw error;
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("sem sessão");
      const { error } = await supabase.from("events").insert({
        user_id: uid,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        inicio: new Date(inicio).toISOString(),
        recorrencia: recorrencia as "nenhuma" | "diaria" | "semanal" | "mensal",
        lembrete_minutos: lembrete ? Number(lembrete) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compromisso criado.");
      setAberto(false);
      setTitulo("");
      setDescricao("");
      setInicio("");
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível salvar o compromisso."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compromisso removido.");
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Organize compromissos e lembretes.</p>
        </div>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button aria-label="Criar compromisso">
              <CalendarPlus className="size-4" aria-hidden="true" />
              Novo compromisso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo compromisso</DialogTitle>
              <DialogDescription>Preencha os dados do seu compromisso.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ev-titulo">Título</Label>
                <Input
                  id="ev-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  aria-label="Título do compromisso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-inicio">Data e hora</Label>
                <Input
                  id="ev-inicio"
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  aria-label="Data e hora do compromisso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-rec">Repetição</Label>
                <Select value={recorrencia} onValueChange={setRecorrencia}>
                  <SelectTrigger id="ev-rec" aria-label="Repetição">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECORRENCIA_LABEL).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-lembrete">Lembrete (minutos antes)</Label>
                <Input
                  id="ev-lembrete"
                  type="number"
                  min={0}
                  value={lembrete}
                  onChange={(e) => setLembrete(e.target.value)}
                  aria-label="Lembrete em minutos antes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-desc">Descrição</Label>
                <Textarea
                  id="ev-desc"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  aria-label="Descrição do compromisso"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (titulo.trim().length < 2) { toast.error("Informe um título."); return; }
                  if (!inicio) { toast.error("Informe a data e a hora."); return; }
                  criar.mutate();
                }}
                disabled={criar.isPending}
              >
                {criar.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={visao} onValueChange={(v) => setVisao(v as Visao)}>
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Não conseguimos carregar sua agenda</CardTitle>
            <CardDescription>Tente novamente em instantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Tentar de novo</Button>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Compromissos</CardTitle>
            <CardDescription>
              {visao === "dia" ? "Hoje" : visao === "semana" ? "Próximos 7 dias" : "Próximo mês"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso neste período. Que tal criar o primeiro?
              </p>
            )}
            {data.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3"
              >
                <div>
                  <p className="font-medium">{e.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.inicio).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {e.lembrete_minutos ? ` · lembrete ${e.lembrete_minutos} min antes` : ""}
                  </p>
                  {e.descricao && <p className="mt-1 text-sm">{e.descricao}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{RECORRENCIA_LABEL[e.recorrencia]}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover compromisso ${e.titulo}`}
                    onClick={() => remover.mutate(e.id)}
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
