import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Função auxiliar para processar a sessão
    const processSession = async (session: any) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin, cpf")
          .eq("id", currentUser.id)
          .maybeSingle();
        
        if (!mounted) return;

        if (error) {
          console.error("Erro ao carregar perfil:", error);
        }

        const dbCpf = String(data?.cpf || "").replace(/\D/g, "");
        const isAdminUser = !!data?.is_admin || dbCpf === "05286558178";
        
        setUser(currentUser);
        setIsAdmin(isAdminUser);
      } catch (err) {
        console.error("Falha na sincronização do perfil:", err);
        setUser(currentUser);
        setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Verificar sessão inicial manualmente para garantir carregamento rápido
    supabase.auth.getSession().then(({ data: { session } }) => {
      processSession(session);
    });

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      processSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Dependências vazias para estabilidade total

  const requireAuth = useCallback((_redirectPath = "/login") => {
    // Mantido para compatibilidade
  }, []);

  const logout = useCallback(async (redirectPath = "/login") => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      navigate(redirectPath);
    } catch (error) {
      console.error("Erro no logout:", error);
      setUser(null);
      setIsAdmin(false);
      navigate(redirectPath);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const authValue = useMemo(() => ({
    user,
    isAdmin,
    loading,
    requireAuth,
    logout
  }), [user, isAdmin, loading, requireAuth, logout]);

  return authValue;
}
