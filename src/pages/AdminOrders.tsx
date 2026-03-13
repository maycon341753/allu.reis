import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import AdminMobileNav from "@/components/admin/MobileNav";

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
  forma_pagamento?: string;
  data?: string;
  status: "Novo" | "Em análise" | "Aprovado" | "Recusado" | "Cancelado" | "Enviado";
};

export default function AdminOrders() {
  const location = useLocation();
  const { toast } = useToast();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [qCliente, setQCliente] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qPagamento, setQPagamento] = useState("");
  const [qProduto, setQProduto] = useState("");
  const [qData, setQData] = useState("");
  const [shipOpen, setShipOpen] = useState(false);
  const [shipId, setShipId] = useState<string | null>(null);
  const [transportadora, setTransportadora] = useState("");
  const [codigo, setCodigo] = useState("");

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

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, cliente, produto, plano, forma_pagamento, status, created_at")
          .limit(50);
        if (!error) {
          setRows(
            (data || []).map((d: any) => ({
              id: d.id || "",
              cliente: d.cliente || "",
              produto: d.produto || "",
              plano: d.plano || "",
              forma_pagamento: d.forma_pagamento || "",
              data: fmtDate(d.created_at),
              status: (d.status as OrderRow["status"]) || "Em análise",
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const updateStatus = async (row: OrderRow, status: OrderRow["status"]) => {
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

  const openShip = (row: OrderRow) => {
    setShipId(row.id);
    setTransportadora("");
    setCodigo("");
    setShipOpen(true);
  };

  const sendShipment = async () => {
    if (!shipId || !transportadora || !codigo) {
      toast({ title: "Preencha transportadora e código" });
      return;
    }
    const { error: insErr } = await supabase
      .from("order_shipping")
      .upsert({ order_id: shipId, transportadora, codigo_rastreio: codigo, status: "Enviado" }, { onConflict: "order_id" });
    if (insErr) {
      toast({ title: "Falha ao salvar envio", description: insErr.message });
      return;
    }
    const { error: updErr } = await supabase.from("orders").update({ status: "Enviado" }).eq("id", shipId);
    if (updErr) {
      toast({ title: "Envio salvo, mas status não atualizado", description: updErr.message });
    } else {
      setRows((r) => r.map((x) => (x.id === shipId ? { ...x, status: "Enviado" } : x)));
      toast({ title: "Produto marcado como enviado" });
    }
    setShipOpen(false);
    setShipId(null);
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
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <LogOut size={18} /> Sair
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Pedidos</h1>
            <p className="mt-1 text-muted-foreground">Analise e aprove solicitações</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          <Input placeholder="Buscar cliente" value={qCliente} onChange={(e) => setQCliente(e.target.value)} />
          <Input placeholder="Filtrar status" value={qStatus} onChange={(e) => setQStatus(e.target.value)} />
          <Input placeholder="Forma de pagamento" value={qPagamento} onChange={(e) => setQPagamento(e.target.value)} />
          <Input placeholder="Filtrar produto" value={qProduto} onChange={(e) => setQProduto(e.target.value)} />
          <Input placeholder="Filtrar data (dd/mm/aaaa)" value={qData} onChange={(e) => setQData(e.target.value)} />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto">
          <table className="min-w-[820px] w-full text-sm">
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
                  const payOk = !qPagamento || (r.forma_pagamento || "").toLowerCase().includes(qPagamento.toLowerCase());
                  const prodOk = !qProduto || r.produto.toLowerCase().includes(qProduto.toLowerCase());
                  const dataOk = !qData || (r.data || "").includes(qData);
                  return clienteOk && statusOk && payOk && prodOk && dataOk;
                })
                .map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.produto}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.plano}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.forma_pagamento || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Aprovado"
                        ? "bg-primary/10 text-primary"
                        : row.status === "Em análise"
                        ? "bg-yellow-500/10 text-yellow-600"
                        : row.status === "Enviado"
                        ? "bg-blue-500/10 text-blue-600"
                        : row.status === "Cancelado"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-secondary text-foreground"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.data || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">Ver</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Pedido {row.id}</DialogTitle>
                            <DialogDescription>Detalhes do pedido selecionado</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Cliente</span>
                              <span className="font-medium">{row.cliente}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Produto</span>
                              <span className="font-medium">{row.produto}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Plano</span>
                              <span className="font-medium">{row.plano}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Pagamento</span>
                              <span className="font-medium">{row.forma_pagamento || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <span className="font-medium">{row.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Data</span>
                              <span className="font-medium">{row.data || "—"}</span>
                            </div>
                          </div>
                          <DialogFooter>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => updateStatus(row, "Em análise")}>Em análise</Button>
                              <Button variant="success" onClick={() => updateStatus(row, "Aprovado")}>Aprovar</Button>
                              <Button variant="destructive" onClick={() => updateStatus(row, "Recusado")}>Recusar</Button>
                              <Button variant="destructive" onClick={() => updateStatus(row, "Cancelado")}>Cancelar</Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Link to={`/admin/pedidos/${row.id}`} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">Detalhes</Link>
                      <Button variant="success" size="sm" onClick={() => updateStatus(row, "Aprovado")}>Aprovar</Button>
                      <Button variant="destructive" size="sm" onClick={() => updateStatus(row, "Recusado")}>Recusar</Button>
                      <Button variant="outline" size="sm" onClick={() => openShip(row)}>Enviar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                    {loading ? "Carregando..." : "Nenhum pedido encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <AdminMobileNav />
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Enviado</DialogTitle>
            <DialogDescription>Informe os dados de envio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="transportadora">Transportadora</Label>
              <Input id="transportadora" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} className="mt-1" />
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
