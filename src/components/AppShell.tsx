import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarDays,
  Target,
  Wallet,
  PiggyBank,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/plano", label: "Plano", icon: Target },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/metas", label: "Metas", icon: PiggyBank },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <aside
        className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-background md:flex"
        aria-label="Navegação principal"
      >
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <GraduationCap className="size-6 text-primary" aria-hidden="true" />
          <span className="font-bold tracking-tight">AprendizPro</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/10" }}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button variant="outline" className="w-full" onClick={sair} aria-label="Sair da conta">
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" aria-hidden="true" />
          <span className="font-bold tracking-tight">AprendizPro</span>
        </div>
        <Button variant="ghost" size="sm" onClick={sair} aria-label="Sair da conta">
          <LogOut className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <main className="px-4 pb-24 pt-6 md:ml-60 md:px-8 md:pb-10">
        <div className="mx-auto max-w-5xl space-y-6">{children}</div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t bg-background md:hidden"
        aria-label="Navegação inferior"
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
