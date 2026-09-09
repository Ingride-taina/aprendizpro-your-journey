import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Definir nova senha — AprendizPro" },
      { name: "description", content: "Crie uma nova senha para sua conta no AprendizPro." },
      { property: "og:title", content: "Definir nova senha — AprendizPro" },
      { property: "og:description", content: "Crie uma nova senha para sua conta no AprendizPro." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) { toast.error("A senha precisa ter ao menos 8 caracteres."); return; }
    if (senha !== confirma) { toast.error("As senhas não coincidem."); return; }
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) { toast.error("Não foi possível atualizar a senha. O link pode ter expirado."); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Definir nova senha</CardTitle>
          <CardDescription>O link de recuperação vale por 1 hora.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" aria-label="Formulário de nova senha">
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                aria-label="Nova senha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirma">Confirmar senha</Label>
              <Input
                id="confirma"
                type="password"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                required
                aria-label="Confirmar nova senha"
              />
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
