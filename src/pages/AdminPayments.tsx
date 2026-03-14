import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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

type PaymentRow = {
  id: string;
  cliente: string;
  contrato_id?: string | null;
  produto: string;
  valor: string;
  vencimento: string;
  status: "Pago" | "Em atraso" | "Pendente";
};

export default function AdminPayments() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, requireAuth } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [subs, setSubs] = useState<
    Array<{ id: string; cliente: string; produto: string; plano: string; valor: string; created_at: string | null }>
  >([]);
  const [paidMap, setPaidMap] = useState<Record<string, number>>({});
  // Filtros - Assinaturas
  const [sCliente, setSCliente] = useState("");
  const [sProduto, setSProduto] = useState("");
  const [sPlano, setSPlano] = useState("");
  // Filtros - Pagamentos
  const [qCliente, setQCliente] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qMetodo, setQMetodo] = useState("");
  const [qProduto, setQProduto] = useState("");
  const [qVenc, setQVenc] = useState("");
  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };
  const monthsFromPlano = (p: string) => {
    const m = parseInt(String(p).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(m) && m > 0 ? m : 12;
  };
  const addMonths = (iso: string | null, n: number) => {
    const base = iso ? new Date(iso) : new Date();
    const d = new Date(base.getTime());
    d.setMonth(d.getMonth() + n);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const run = async () => {
      if (authLoading) return;

      if (!user) {
        navigate("/login");
        return;
      }

      if (isAdmin === null) return;

      if (isAdmin === false) {
        navigate("/cliente");
        return;
      }

      setLoading(true);
      try {
        // Assinaturas aprovadas (contratos ativos/aprovados)
        const { data: contratos } = await supabase
          .from("contratos")
          .select("id, cliente, produto, plano, valor, status, created_at")
          .in("status", ["Ativo", "Aprovado"])
          .order("id", { descending: true })
          .limit(200);
        const subRows =
          (contratos || []).map((c: any) => ({
            id: String(c.id),
            cliente: c.cliente || "",
            produto: c.produto || "",
            plano: c.plano || "",
            valor: c.valor != null ? String(c.valor) : "",
            created_at: c.created_at || null,
          })) ?? [];
        setSubs(subRows);
        if (subRows.length) {
          const ids = subRows.map((s) => Number(s.id)).filter((x) => Number.isFinite(x));
          const { data: pays } = await supabase
            .from("payments")
            .select("id, contrato_id, status")
            .in("contrato_id", ids);
          const map: Record<string, number> = {};
          (pays || []).forEach((p: any) => {
            const key = String(p.contrato_id);
            if (!map[key]) map[key] = 0;
            if ((p.status || "").toLowerCase() === "pago") map[key] += 1;
          });
          setPaidMap(map);
        } else {
          setPaidMap({});
        }

        const { data, error } = await supabase
          .from("payments")
          .select("id, cliente, contrato_id, produto, valor, vencimento, status, metodo")
          .limit(100);
        if (!error) {
          setRows(
            (data || []).map((d: any) => ({
              id: d.id || "",
              cliente: d.cliente || "",
              contrato_id: d.contrato_id ?? null,
              produto: d.produto || "",
              valor: d.valor != null ? String(d.valor) : "",
              vencimento: d.vencimento || "",
              status: (d.status as PaymentRow["status"]) || "Pendente",
              metodo: d.metodo || "Pix",
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, authLoading, isAdmin]);

  const marcarPago = async (row: PaymentRow) => {
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: "Pago" } : x)));
    const { error } = await supabase.from("payments").update({ status: "Pago" }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: "Pagamento marcado como pago" });
    }
  };

  const cobrar = async (row: PaymentRow) => {
    toast({ title: "Cobrança enviada", description: `Cliente: ${row.cliente}` });
  };

  const marcarParcelaPaga = async (sub: { id: string; cliente: string; produto: string; valor: string; plano: string; created_at: string | null }) => {
    const total = monthsFromPlano(sub.plano);
    const pagos = paidMap[sub.id] || 0;
    if (pagos >= total) {
      toast({ title: "Todas as parcelas já foram pagas" });
      return;
    }
    const proximoVenc = addMonths(sub.created_at, pagos + 1);
    const { error } = await supabase.from("payments").insert({
      cliente: sub.cliente,
      contrato_id: Number(sub.id),
      produto: sub.produto,
      valor: sub.valor,
      vencimento: proximoVenc,
      status: "Pago",
      metodo: "manual",
    });
    if (error) {
      toast({ title: "Erro ao registrar parcela", description: error.message });
      return;
    }
    setPaidMap((m) => ({ ...m, [sub.id]: (m[sub.id] || 0) + 1 }));
    toast({ title: "Parcela registrada como paga" });
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
            <h1 className="font-display text-2xl font-bold">Pagamentos</h1>
            <p className="mt-1 text-muted-foreground">Gerencie cobranças e status</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        {/* Filtros - Assinaturas aprovadas */}
        <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Input placeholder="Buscar cliente (assinaturas)" value={sCliente} onChange={(e) => setSCliente(e.target.value)} />
          <Input placeholder="Produto (assinaturas)" value={sProduto} onChange={(e) => setSProduto(e.target.value)} />
          <Input placeholder="Plano (ex.: 12m)" value={sPlano} onChange={(e) => setSPlano(e.target.value)} />
        </div>

        {/* Assinaturas aprovadas */}
        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor mensal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pagas/Total</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Próximo venc.</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subs
                .filter((s) => {
                  const cOk = !sCliente || s.cliente.toLowerCase().includes(sCliente.toLowerCase());
                  const pOk = !sProduto || s.produto.toLowerCase().includes(sProduto.toLowerCase());
                  const plOk = !sPlano || s.plano.toLowerCase().includes(sPlano.toLowerCase());
                  return cOk && pOk && plOk;
                })
                .map((s) => {
                const total = monthsFromPlano(s.plano);
                const pagos = paidMap[s.id] || 0;
                const proximo = pagos < total ? addMonths(s.created_at, pagos + 1) : "—";
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{s.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.produto}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.plano}</td>
                    <td className="px-4 py-3">{formatBRL(s.valor)}</td>
                    <td className="px-4 py-3">{pagos}/{total}</td>
                    <td className="px-4 py-3">{proximo}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => marcarParcelaPaga(s)} disabled={pagos >= total}>
                          Marcar parcela paga
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                    Nenhuma assinatura aprovada encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Filtros - Pagamentos individuais */}
        <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-5">
          <Input placeholder="Cliente" value={qCliente} onChange={(e) => setQCliente(e.target.value)} />
          <Input placeholder="Status" value={qStatus} onChange={(e) => setQStatus(e.target.value)} />
          <Input placeholder="Método" value={qMetodo} onChange={(e) => setQMetodo(e.target.value)} />
          <Input placeholder="Produto" value={qProduto} onChange={(e) => setQProduto(e.target.value)} />
          <Input placeholder="Vencimento (aaaa-mm ou data)" value={qVenc} onChange={(e) => setQVenc(e.target.value)} />
        </div>

        {/* Tabela de pagamentos individuais */}
        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contrato</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Método</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => {
                  const cOk = !qCliente || r.cliente.toLowerCase().includes(qCliente.toLowerCase());
                  const sOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
                  const mOk = !qMetodo || (String((r as any).metodo || "")).toLowerCase().includes(qMetodo.toLowerCase());
                  const pOk = !qProduto || r.produto.toLowerCase().includes(qProduto.toLowerCase());
                  const vOk = !qVenc || (r.vencimento || "").toLowerCase().includes(qVenc.toLowerCase());
                  return cOk && sOk && mOk && pOk && vOk;
                })
                .map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.contrato_id || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.produto}</td>
                  <td className="px-4 py-3">{formatBRL(row.valor)}</td>
                  <td className="px-4 py-3 text-muted-foreground uppercase">{(row as any).metodo || "Pix"}</td>
                  <td className="px-4 py-3">{row.vencimento}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Pago"
                        ? "bg-primary/10 text-primary"
                        : row.status === "Em atraso"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="success" size="sm" onClick={() => marcarPago(row)}>Marcar pago</Button>
                      <Button variant="outline" size="sm" onClick={() => cobrar(row)}>Cobrar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                    {loading ? "Carregando..." : "Nenhum pagamento encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">{row.cliente}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Contrato: {row.contrato_id || "—"}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.status === "Pago"
                    ? "bg-primary/10 text-primary"
                    : row.status === "Em atraso"
                    ? "bg-red-500/10 text-red-600"
                    : "bg-yellow-500/10 text-yellow-600"
                }`}>
                  {row.status}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">{row.produto}</div>
              
              <div className="flex justify-between items-center mt-1 border-t border-border pt-3">
                <div className="font-medium text-lg">{formatBRL(row.valor)}</div>
                <div className="text-sm text-muted-foreground">Venc: {row.vencimento}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="success" size="sm" onClick={() => marcarPago(row)}>Marcar pago</Button>
                <Button variant="outline" size="sm" onClick={() => cobrar(row)}>Cobrar</Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && !loading && (
             <div className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado</div>
          )}
        </div>
      </main>
    </div>
  );
}