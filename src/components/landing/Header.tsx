import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, ShoppingBag, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
    setIsAdmin(!!data?.is_admin);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold">
            allu<span className="text-primary">.reis</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/produtos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Produtos
          </Link>
          <Link to="/#como-funciona" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Como funciona
          </Link>
          <Link to="/#beneficios" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Benefícios
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to={isAdmin ? "/admin" : "/cliente"} 
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <LayoutDashboard size={16} /> Painel
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut size={16} /> Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Entrar
              </Link>
              <Button asChild size="sm">
                <Link to="/cadastro">Assinar agora</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="flex h-10 w-10 items-center justify-center rounded-md md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4">
            <Link to="/produtos" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Produtos
            </Link>
            <Link to="/#como-funciona" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Como funciona
            </Link>
            <Link to="/#beneficios" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Benefícios
            </Link>
            <div className="h-px bg-border my-2" />
            {user ? (
              <>
                <Link 
                  to={isAdmin ? "/admin" : "/cliente"} 
                  className="flex items-center gap-2 text-sm font-medium text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard size={18} /> Acessar Painel
                </Link>
                {!isAdmin && (
                  <>
                    <Link 
                      to="/cliente/alugueis" 
                      className="flex items-center gap-2 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingBag size={18} /> Meus Aluguéis
                    </Link>
                    <Link 
                      to="/cliente/pagamentos" 
                      className="flex items-center gap-2 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <CreditCard size={18} /> Pagamentos
                    </Link>
                  </>
                )}
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-destructive mt-2"
                >
                  <LogOut size={18} /> Sair da conta
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Entrar
                </Link>
                <Button asChild className="w-full">
                  <Link to="/cadastro" onClick={() => setIsMenuOpen(false)}>Assinar agora</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
