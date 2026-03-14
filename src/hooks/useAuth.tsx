import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAdminStatus = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin, cpf")
        .eq("id", uid)
        .maybeSingle();
      
      const dbCpf = String(data?.cpf || "").replace(/\D/g, "");
      const isAdminUser = !!data?.is_admin || dbCpf === "05286558178";
      
      setIsAdmin(prev => {
        if (prev === isAdminUser) return prev;
        return isAdminUser;
      });
    } catch {
      setIsAdmin(prev => {
        if (prev === false) return prev;
        return false;
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      
      // Busca o status de admin antes de atualizar o estado para evitar re-renders múltiplos
      let isAdminUser = false;
      if (currentUser) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("is_admin, cpf")
            .eq("id", currentUser.id)
            .maybeSingle();
          const dbCpf = String(data?.cpf || "").replace(/\D/g, "");
          isAdminUser = !!data?.is_admin || dbCpf === "05286558178";
        } catch {
          isAdminUser = false;
        }
      }

      if (!mounted) return;

      // Atualiza todos os estados de uma vez para minimizar re-renders
      setUser(prev => {
        if (prev?.id === currentUser?.id) return prev;
        return currentUser;
      });
      setIsAdmin(prev => {
        if (prev === isAdminUser) return prev;
        return isAdminUser;
      });
      setLoading(prev => {
        if (prev === false) return prev;
        return false;
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const requireAuth = useCallback((_redirectPath = "/login") => {
    // Mantido para compatibilidade, mas sem ação direta
  }, []);

  const authValue = useMemo(() => ({
    user,
    isAdmin,
    loading,
    requireAuth
  }), [user, isAdmin, loading, requireAuth]);

  return authValue;
}
