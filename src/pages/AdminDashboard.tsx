import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebarMobile from "@/components/responsive/AdminSidebarMobile";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut,
} from "lucide-react";

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

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<Array<{ cliente: string; produto: string; plano: string; status: string; data?: string | null }>>([]);
  const [payments, setPayments] = useState<Array<{ cliente: string; valor: string; status: string; metodo: string; data: string | null }>>([]);
  const [finance, setFinance] = useState<{ recebidoMes: string; pendentes: string }>({ recebidoMes: "R$ 0,00", pendentes: "0" });
  const [stats, setStats] = useState<{
    users: string;
    products: string;
    pedidos: string;
    contratos: string;
    pagamentos: string;
    documentos: string;
  }>({
    users: "0",
    products: "0",
    pedidos: "0",
    contratos: "0",
    pagamentos: "0",
    documentos: "0",
  });
  const runningRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user || isAdmin !== true) return;
      
      if (runningRef.current) return;
      runningRef.current = true;

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("cliente, produto, plano, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (orderError) console.error("Erro ao carregar pedidos:", orderError);
        
        setOrders(
          (orderData || []).map((d: any) => ({
            cliente: d.cliente || "",
            produto: d.produto || "",
            plano: d.plano || "",
            status: d.status || "",
            data: d.created_at ? new Date(d.created_at).toLocaleDateString("pt-BR") + " " + new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : null,
          })),
        );

        const countExact = async (table: string, eq?: { col: string; val: any }) => {
          try {
            let q = supabase.from(table).select("id", { count: "exact", head: true });
            if (eq) q = q.eq(eq.col, eq.val);
            const { count, error: cErr } = await q;
            if (cErr) {
              console.error(`Erro contagem ${table}:`, cErr);
              return "—";
            }
            return String(count ?? 0);
          } catch (e) {
            console.error(`Exceção contagem ${table}:`, e);
            return "—";
          }
        };

        const [users, products, pedidos, contratos, pagamentos, documentos] = await Promise.all([
          countExact("profiles"),
          countExact("products", { col: "status", val: "Ativo" }),
          countExact("orders", { col: "status", val: "Em análise" }),
          countExact("contratos", { col: "status", val: "Em análise" }),
          countExact("payments", { col: "status", val: "Pendente" }),
          countExact("documents", { col: "status", val: "Pendente" }),
        ]);

        setStats({ users, products, pedidos, contratos, pagamentos, documentos });

        const { data: pays, error: payError } = await supabase
          .from("payments")
          .select("cliente_nome, valor, status, metodo, created_at")
          .order("created_at", { descending: true })
          .limit(100);
        
        if (payError) console.error("Erro ao carregar pagamentos:", payError);

        const allPayRows = (pays || []).map((p: any) => ({
          cliente: p.cliente_nome || "",
          valor: String(p.valor ?? ""),
          status: p.status || "",
          metodo: p.metodo || "",
          data: p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : null,
        }));

        setPayments(allPayRows.filter(p => p.status === "Pago").slice(0, 5));

        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        const currentYear = now.getFullYear();

        const recebido = allPayRows
          .filter((r) => r.status === "Pago" && r.data?.includes(`/${currentMonth}/${currentYear}`))
          .reduce((sum, r) => {
            const val = Number(String(r.valor).replace(/[^\d,.-]/g, "").replace(",", "."));
            return sum + (isNaN(val) ? 0 : val);
          }, 0);
        
        const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(recebido);
        setFinance({ recebidoMes: fmt, pendentes: pagamentos });

      } catch (globalErr) {
        console.error("Erro global no dashboard:", globalErr);
      } finally {
        runningRef.current = false;
      }
    };

    run();
    
    // Se não for admin, redirecionar
    if (!authLoading && user && isAdmin === false) {
      navigate("/cliente");
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col surface-dark md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold text-surface-dark-foreground">
            Admin
          </span>
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
            onClick={() => logout("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 pb-16">
        <div className="md:hidden mb-6">
          <AdminSidebarMobile />
        </div>
        <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da plataforma</p>

        {/* Modules */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Usuários</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.users}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Produtos ativos</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.products}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Pedidos em análise</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.pedidos}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Pagamentos pendentes</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.pagamentos}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Financeiro</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Recebido no mês</p>
                <p className="mt-1 font-display text-xl font-bold">{finance.recebidoMes}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Pagamentos pendentes</p>
                <p className="mt-1 font-display text-xl font-bold">{finance.pendentes}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 overflow-x-auto">
            <p className="text-sm text-muted-foreground">Últimos pagamentos</p>
            <table className="mt-3 w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Valor</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Método</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{p.cliente || "—"}</td>
                    <td className="px-3 py-2">{p.valor || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.status === "Pago" ? "bg-primary/10 text-primary" :
                        p.status === "Pendente" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-secondary text-foreground"
                      }`}>
                        {p.status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{p.metodo || "—"}</td>
                    <td className="px-3 py-2">{p.data || "—"}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>Sem pagamentos recentes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent orders */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">Pedidos recentes</h2>
          <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{order.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.produto}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.plano}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "Ativo" ? "bg-primary/10 text-primary" :
                        order.status === "Pendente" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.data || "—"}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:hidden">
            {orders.map((order, i) => (
              <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-foreground">{order.cliente}</div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === "Ativo" ? "bg-primary/10 text-primary" :
                    order.status === "Pendente" ? "bg-yellow-500/10 text-yellow-600" :
                    "bg-blue-500/10 text-blue-600"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{order.produto}</div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{order.plano}</span>
                  <span>{order.data}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum pedido encontrado
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
