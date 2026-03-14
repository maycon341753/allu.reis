import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebarMobile from "@/components/responsive/AdminSidebarMobile";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: Package, label: "Produtos", path: "/admin/produtos" },
  { icon: ShoppingCart, label: "Pedidos", path: "/admin/pedidos" },
  { icon: FileText, label: "Contratos", path: "/admin/contratos" },
  { icon: CreditCard, label: "Pagamentos", path: "/admin/pagamentos" },
  { icon: FolderOpen, label: "Documentos", path: "/admin/documentos" },
  { icon: ShieldCheck, label: "Análise de Crédito", path: "/admin/credito" },
  { icon: Headphones, label: "Suporte", path: "/admin/suporte" },
  { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
  { icon: Settings, label: "Configurações", path: "/admin/config" },
];

type ProfileRow = {
  id: string;
  full_name: string | null;
  cpf: string | null;
  email?: string | null;
  status?: string | null;
  created_at?: string | null;
  is_admin: boolean;
};

export default function AdminUsers() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, requireAuth } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [qNome, setQNome] = useState("");
  const [qCpf, setQCpf] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [qStatus, setQStatus] = useState("");

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user) return;
      
      // Verificar se é admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        navigate("/cliente");
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, cpf, is_admin, email, status, created_at")
        .order("full_name", { nulls: "last" })
        .limit(50);
      if (error) {
        setRows([
          { id: "demo-1", full_name: "Maria Silva", cpf: "05286558178", is_admin: false },
          { id: "demo-2", full_name: "Maycon Borges", cpf: "12345678901", is_admin: true },
        ]);
      } else {
        setRows((data || []).map((d: any) => ({
          id: d.id,
          full_name: d.full_name,
          cpf: d.cpf,
          email: d.email ?? null,
          status: d.status ?? null,
          created_at: d.created_at ?? null,
          is_admin: !!d.is_admin,
        })));
      }
      setLoading(false);
    };
    run();
  }, []);

  const toggleAdmin = async (row: ProfileRow) => {
    const next = !row.is_admin;
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_admin: next } : x)));
    const { error } = await supabase.from("profiles").update({ is_admin: next }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: next ? "Concedido acesso admin" : "Removido acesso admin" });
    }
  };
  const norm = (s: string | null | undefined) => String(s || "").replace(/\D/g, "");
  const fmtDate = (s?: string | null) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    } catch {
      return String(s);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 flex-col surface-dark md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold text-surface-dark-foreground">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 pb-16">
        <div className="md:hidden mb-6">
          <AdminSidebarMobile />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Usuários</h1>
            <p className="mt-1 text-muted-foreground">Gerencie acessos e perfis</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Input placeholder="Buscar por nome" value={qNome} onChange={(e) => setQNome(e.target.value)} />
          <Input placeholder="Buscar por CPF" value={qCpf} onChange={(e) => setQCpf(e.target.value)} />
          <Input placeholder="Buscar por email" value={qEmail} onChange={(e) => setQEmail(e.target.value)} />
          <Input placeholder="Filtrar status" value={qStatus} onChange={(e) => setQStatus(e.target.value)} />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[800px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">CPF</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cadastro</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => {
                  const nomeOk = !qNome || String(r.full_name || "").toLowerCase().includes(qNome.toLowerCase());
                  const cpfOk = !qCpf || norm(r.cpf).includes(norm(qCpf));
                  const emailOk = !qEmail || String(r.email || "").toLowerCase().includes(qEmail.toLowerCase());
                  const statusOk = !qStatus || String(r.status || "").toLowerCase().includes(qStatus.toLowerCase());
                  return nomeOk && cpfOk && emailOk && statusOk;
                })
                .map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.cpf || "—"}</td>
                  <td className="px-4 py-3">{row.status || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.is_admin ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
                    }`}>
                      {row.is_admin ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/usuarios/${row.id}`} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">Ver perfil</Link>
                      <Button variant="outline" size="sm" onClick={() => toggleAdmin(row)}>{row.is_admin ? "Remover admin" : "Conceder admin"}</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                    {loading ? "Carregando..." : "Nenhum usuário encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
          {rows
            .filter((r) => {
              const nomeOk = !qNome || String(r.full_name || "").toLowerCase().includes(qNome.toLowerCase());
              const cpfOk = !qCpf || norm(r.cpf).includes(norm(qCpf));
              const emailOk = !qEmail || String(r.email || "").toLowerCase().includes(qEmail.toLowerCase());
              const statusOk = !qStatus || String(r.status || "").toLowerCase().includes(qStatus.toLowerCase());
              return nomeOk && cpfOk && emailOk && statusOk;
            })
            .map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">{row.full_name || "Sem nome"}</div>
                  <div className="text-sm text-muted-foreground">{row.email || "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{row.cpf || "—"}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.is_admin ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
                }`}>
                  {row.is_admin ? "Admin" : "User"}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">Status: {row.status || "—"}</span>
                <span className="text-muted-foreground">{fmtDate(row.created_at)}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Link 
                  to={`/admin/usuarios/${row.id}`} 
                  className="flex-1 flex items-center justify-center rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  Ver perfil
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => toggleAdmin(row)}
                >
                  {row.is_admin ? "Remover admin" : "Conceder admin"}
                </Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && !loading && (
             <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</div>
          )}
        </div>
      </main>
    </div>
  );
}
