import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  FolderOpen,
  ShieldCheck,
  Headphones,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

type OrderRow = {
  id: string;
  cliente: string;
  produto: string;
  plano: string;
  forma_pagamento?: string | null;
  status: "Em análise" | "Aprovado" | "Enviado" | "Cancelado" | string;
  data?: string | null;
};

export default function AdminOrders() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [qCliente, setQCliente] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qPagamento, setQPagamento] = useState("");
  const [qProduto, setQProduto] = useState("");
  const [qData, setQData] = useState("");

  const [shipOpen, setShipOpen] = useState(false);
  const [transportadora, setTransportadora] = useState("");
  const [codigo, setCodigo] = useState("");
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);

  const statusBadgeClass = (s: string) => {
    const k = (s || "").toLowerCase().trim();
    if (k === "aprovado" || k === "ativo") return "bg-primary/10 text-primary";
    if (k === "em análise" || k === "em analise" || k === "pendente" || k === "aguardando aprovação")
      return "bg-yellow-500/10 text-yellow-600";
    if (k === "enviado" || k === "em envio" || k === "postado") return "bg-blue-500/10 text-blue-600";
    if (k === "cancelado" || k === "recusado") return "bg-red-500/10 text-red-600";
    return "bg-secondary text-foreground";
  };

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user || isAdmin !== true) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, cliente, produto, plano, forma_pagamento, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100);
        if (!error) {
          const fmt = (s?: string | null) => {
            if (!s) return null;
            try {
              const d = new Date(s);
              const dd = String(d.getDate()).padStart(2, "0");
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const yy = d.getFullYear();
              const hh = String(d.getHours()).padStart(2, "0");
              const min = String(d.getMinutes()).padStart(2, "0");
              return `${dd}/${mm}/${yy} ${hh}:${min}`;
            } catch {
              return s || null;
            }
          };
          setRows(
            (data || []).map((d: any) => ({
              id: d.id || "",
              cliente: d.cliente || "",
              produto: d.produto || "",
              plano: d.plano || "",
              forma_pagamento: d.forma_pagamento ?? null,
              status: d.status || "Em análise",
              data: fmt(d.created_at),
            })),
          );
        }
      } finally {
        setLoading(false);
      }
    };
    run();

    if (!authLoading && user && isAdmin === false) {
      navigate("/cliente");
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, isAdmin, navigate]);

  const updateStatus = async (row: OrderRow, status: string) => {
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status } : x)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: "Status atualizado" });
    }
  };

  const openShipment = (orderId: string) => {
    setShipOrderId(orderId);
    setTransportadora("");
    setCodigo("");
    setShipOpen(true);
  };

  const sendShipment = async () => {
    if (!shipOrderId || !transportadora || !codigo) {
      toast({ title: "Informe transportadora e código de rastreio" });
      return;
    }
    const { error } = await supabase
      .from("order_shipping")
      .upsert(
        { order_id: shipOrderId, transportadora, codigo_rastreio: codigo, status: "Enviado" },
        { onConflict: "order_id" },
      );
    if (error) {
      toast({ title: "Erro ao salvar envio", description: error.message });
      return;
    }
    const row = rows.find((r) => r.id === shipOrderId);
    if (row) await updateStatus(row, "Enviado");
    setShipOpen(false);
    toast({ title: "Envio registrado" });
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
            onClick={() => logout("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-16">
        <div className="flex items-center gap-4 mb-6">
          <AdminSidebarMobile />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Pedidos</h1>
              <p className="mt-1 text-sm text-muted-foreground">Analise e aprove solicitações</p>
            </div>
            <Button variant="outline" size="sm" disabled={loading} onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Buscar cliente" value={qCliente} onChange={(e) => setQCliente(e.target.value)} />
          <Input placeholder="Status" value={qStatus} onChange={(e) => setQStatus(e.target.value)} />
          <Input placeholder="Pagamento" value={qPagamento} onChange={(e) => setQPagamento(e.target.value)} />
          <Input placeholder="Produto" value={qProduto} onChange={(e) => setQProduto(e.target.value)} />
          <Input placeholder="Data (dd/mm/aaaa)" value={qData} onChange={(e) => setQData(e.target.value)} />
        </div>

        <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pagamento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => {
                  const clienteOk = !qCliente || r.cliente.toLowerCase().includes(qCliente.toLowerCase());
                  const statusOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
                  const payOk =
                    !qPagamento || (r.forma_pagamento || "").toLowerCase().includes(qPagamento.toLowerCase());
                  const prodOk = !qProduto || r.produto.toLowerCase().includes(qProduto.toLowerCase());
                  const dataOk = !qData || (r.data || "").includes(qData);
                  return clienteOk && statusOk && payOk && prodOk && dataOk;
                })
                .map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.produto}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.plano}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.forma_pagamento || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.data || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/pedidos/${row.id}`}>
                          <Button variant="secondary" size="sm">Ver</Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => openShipment(row.id)}>Enviar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                    {loading ? "Carregando..." : "Nenhum pedido encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {rows
            .filter((r) => {
              const clienteOk = !qCliente || r.cliente.toLowerCase().includes(qCliente.toLowerCase());
              const statusOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
              const payOk = !qPagamento || (r.forma_pagamento || "").toLowerCase().includes(qPagamento.toLowerCase());
              const prodOk = !qProduto || r.produto.toLowerCase().includes(qProduto.toLowerCase());
              const dataOk = !qData || (r.data || "").includes(qData);
              return clienteOk && statusOk && payOk && prodOk && dataOk;
            })
            .map((row) => (
              <div key={row.id} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-base">{row.cliente}</h3>
                    <p className="text-sm text-muted-foreground">{row.produto}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}>
                    {row.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                  <div>
                    <span className="text-xs text-muted-foreground block">Plano</span>
                    {row.plano}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Data</span>
                    {row.data || "—"}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Pagamento</span>
                    {row.forma_pagamento || "—"}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button className="flex-1" variant="outline" asChild>
                    <Link to={`/admin/pedidos/${row.id}`}>Detalhes</Link>
                  </Button>
                  {row.status === "Em análise" && (
                    <Button className="flex-1" variant="default" onClick={() => updateStatus(row, "Aprovado")}>
                      Aprovar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          {!loading && rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</div>
          )}
        </div>
      </main>

      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Enviado</DialogTitle>
            <DialogDescription>Informe os dados de envio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="transportadora">Transportadora</Label>
              <Input
                id="transportadora"
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="codigo">Código de rastreio</Label>
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={sendShipment}>Salvar</Button>
            <Button variant="outline" onClick={() => setShipOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}