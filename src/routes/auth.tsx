import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish — Task Manager" },
      { name: "description", content: "Vazifalaringizni boshqarish uchun tizimga kiring." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Hisob yaratildi! Endi kirishingiz mumkin.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Xush kelibsiz!");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "var(--gradient-subtle)" }}>
      <Card className="w-full max-w-md p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-hero)" }}>
            <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Tizimga kirish" : "Hisob yaratish"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vazifalaringizni boshqaring
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kiring"}
        </button>
        <Link to="/" className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground">
          ← Bosh sahifa
        </Link>
      </Card>
    </div>
  );
}
