import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function DashboardRouter() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session?.user?.id) {
        toast({ title: "Faça login para continuar" });
        navigate("/login");
        return;
      }
      const uid = session.user.id;
      let isAdmin = false;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", uid)
        .maybeSingle();
      if (!error && profile && typeof profile.is_admin === "boolean") {
        isAdmin = profile.is_admin;
      }
      navigate(isAdmin ? "/admin" : "/cliente", { replace: true });
    };
    run();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 pt-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md py-20 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Carregando seu painel…</p>
        </div>
      </main>
    </div>
  );
}
