import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, GraduationCap, PiggyBank, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AprendizPro — organize tempo, finanças e comunidade" },
      {
        name: "description",
        content:
          "Plataforma para jovens aprendizes de 14 a 24 anos organizarem agenda, estudos, finanças e comunidade em um só lugar.",
      },
      { property: "og:title", content: "AprendizPro — organize tempo, finanças e comunidade" },
      {
        property: "og:description",
        content: "Agenda, metas de estudo, controle financeiro e fórum para jovens aprendizes.",
      },
    ],
  }),
  component: Index,
});

const destaques = [
  { icon: CalendarDays, titulo: "Organização", texto: "Agenda, notas e metas semanais de estudo." },
  { icon: PiggyBank, titulo: "Financeiro", texto: "Gastos, orçamentos e metas com simulador." },
  { icon: Users, titulo: "Comunidade", texto: "Fórum de dúvidas, dicas e suporte da turma." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-6 text-primary" aria-hidden="true" />
            <span className="font-bold tracking-tight">AprendizPro</span>
          </div>
          <Button asChild>
            <Link to="/auth" aria-label="Entrar ou criar conta">
              Entrar
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Sua vida de aprendiz, organizada em um só lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tempo, dinheiro e comunidade para jovens aprendizes de 14 a 24 anos. Comece com o código
            da sua turma.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Criar minha conta</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {destaques.map(({ icon: Icon, titulo, texto }) => (
            <Card key={titulo} className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <Icon className="size-6 text-secondary" aria-hidden="true" />
                <CardTitle className="mt-2">{titulo}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{texto}</CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
