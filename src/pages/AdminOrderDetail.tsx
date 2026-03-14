import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

interface Order {
  id: string;
  cliente: string;
  email: string;
  cpf: string;
  telefone: string;
  user_id?: string;
  produto: string;
  plano: string;
  valor_mensal: string;
  forma_pagamento: string;
  status: string;
  created_at: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export default function AdminOrderDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<{ transportadora?: string; codigo_rastreio?: string; status?: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; status: string; observacao?: string; created_at: string }>>([]);
  const [shipOpen, setShipOpen] = useState(false);
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
  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user || !id || isAdmin !== true) return;

      setLoading(true);
      try {
        const { data: ord } = await supabase
          .from("orders")
          .select("id, cliente, email, cpf, telefone, user_id, produto, plano, valor_mensal, forma_pagamento, status, created_at, cep, logradouro, numero, complemento, bairro, cidade, estado")
          .eq("id", id)
          .maybeSingle();
        let merged = ord || null;

        if (merged) {
          if (!merged.email || !merged.cpf || !merged.telefone || !merged.valor_mensal || !merged.forma_pagamento || !merged.cep || !merged.logradouro || !merged.bairro || !merged.cidade || !merged.estado) {
            const { data: pay } = await supabase
              .from("payments")
              .select("cliente_email, cliente_cpf, cliente_telefone, valor, billing_type, metodo, entrega_endereco, residencial_endereco, cep, complemento, bairro, cidade, estado")
              .eq("cliente", merged.cliente)
              .eq("produto", merged.produto)
              .order("created_at", { descending: true })
              .limit(1)
              .maybeSingle();
            if (pay) {
              const forma = merged.forma_pagamento || pay.billing_type || (pay.metodo === "pix" ? "PIX" : pay.metodo === "cartao" ? "CREDIT_CARD" : "");
              merged = {
                ...merged,
                email: merged.email || pay.cliente_email || "",
                cpf: merged.cpf || pay.cliente_cpf || "",
                telefone: merged.telefone || pay.cliente_telefone || "",
                valor_mensal: merged.valor_mensal || (pay.valor != null ? String(pay.valor) : ""),
                forma_pagamento: forma || "",
                cep: merged.cep || pay.cep || "",
                logradouro: merged.logradouro || pay.entrega_endereco || pay.residencial_endereco || "",
                complemento: merged.complemento || pay.complemento || "",
                bairro: merged.bairro || pay.bairro || "",
                cidade: merged.cidade || pay.cidade || "",
                estado: merged.estado || pay.estado || "",
              };
            }
          }
          if ((!merged.email || !merged.cpf || !merged.telefone) && merged.user_id) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("email, cpf, phone, full_name")
              .eq("id", merged.user_id)
              .maybeSingle();
            if (prof) {
              merged = {
                ...merged,
                email: merged.email || prof.email || "",
                cpf: merged.cpf || String(prof.cpf || ""),
                telefone: merged.telefone || prof.phone || "",
                cliente: merged.cliente || prof.full_name || "",
              };
            }
          }
        }
        setOrder(merged);

        const { data: ship } = await supabase
          .from("order_shipping")
          .select("transportadora, codigo_rastreio, status")
          .eq("order_id", id)
          .maybeSingle();
        setShipping(ship || null);

        const { data: hist } = await supabase
          .from("order_status_history")
          .select("id, status, observacao, created_at")
          .eq("order_id", id)
          .order("created_at", { descending: true });
        setHistory((hist || []).map((h: any) => ({ id: h.id, status: h.status, observacao: h.observacao, created_at: h.created_at })));
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
  }, [id, user, authLoading, isAdmin, navigate]);

  const updateStatus = async (status: string, observacao?: string) => {
    if (!id) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Não foi possível atualizar", description: error.message });
      return;
    }
    await supabase.from("order_status_history").insert({ order_id: id, status, observacao });
    setOrder((o) => (o ? { ...o, status } : o));
    setHistory((h) => [{ id: crypto.randomUUID?.() || String(Date.now()), status, observacao, created_at: new Date().toISOString() }, ...h]);
    toast({ title: "Status atualizado" });
  };

  const saveShipment = async () => {
    if (!id || !transportadora || !codigo) {
      toast({ title: "Preencha transportadora e código" });
      return;
    }
    const { error: insErr } = await supabase
      .from("order_shipping")
      .upsert({ order_id: id, transportadora, codigo_rastreio: codigo, status: "Enviado" }, { onConflict: "order_id" });
    if (insErr) {
      toast({ title: "Falha ao salvar envio", description: insErr.message });
      return;
    }
    await updateStatus("Enviado");
    setShipping({ transportadora, codigo_rastreio: codigo, status: "Enviado" });
    setShipOpen(false);
    setTransportadora("");
    setCodigo("");
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

      <main className="flex-1 p-6 md:p-8 pb-16">
        <div className="md:hidden mb-6">
          <AdminSidebarMobile />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Pedido</h1>
            <p className="mt-1 text-muted-foreground">Detalhes e ações</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Cliente</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{order?.cliente || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{order?.email || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">CPF</span><span className="font-medium">{order?.cpf || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Telefone</span><span className="font-medium">{order?.telefone || "—"}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Produto</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Nome do produto</span><span className="font-medium">{order?.produto || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Plano</span><span className="font-medium">{order?.plano || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Valor mensal</span><span className="font-medium">{formatBRL(order?.valor_mensal)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Forma de pagamento</span><span className="font-medium">{order?.forma_pagamento || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{order?.status || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Criado em</span><span className="font-medium">{fmtDate(order?.created_at)}</span></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button className="w-full" variant="outline" onClick={() => updateStatus("Em análise")}>Em análise</Button>
              <Button className="w-full" variant="success" onClick={() => updateStatus("Aprovado")}>Aprovar</Button>
              <Button className="w-full" variant="destructive" onClick={() => updateStatus("Recusado")}>Recusar</Button>
              <Button className="w-full" variant="destructive" onClick={() => updateStatus("Cancelado")}>Cancelar</Button>
              <Button className="w-full col-span-2 sm:col-span-3" variant="outline" onClick={() => setShipOpen(true)}>Marcar como Enviado</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Logradouro</span><span className="font-medium">{order?.logradouro || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Número</span><span className="font-medium">{order?.numero || "S/N"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Complemento</span><span className="font-medium">{order?.complemento || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Bairro</span><span className="font-medium">{order?.bairro || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Cidade/UF</span><span className="font-medium">{order?.cidade || "—"} / {order?.estado || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">CEP</span><span className="font-medium">{order?.cep || "—"}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Envio</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Transportadora</span><span className="font-medium">{shipping?.transportadora || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Código de rastreio</span><span className="font-medium">{shipping?.codigo_rastreio || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{shipping?.status || "—"}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Histórico do pedido</p>
          <div className="mt-3 space-y-2 max-h-[280px] overflow-auto">
            {history.map((l) => (
              <div key={l.id} className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{fmtDate(l.created_at)} · {l.status}</div>
                <div className="mt-1 text-sm">{l.observacao || ""}</div>
              </div>
            ))}
            {history.length === 0 && <div className="text-sm text-muted-foreground">Sem histórico</div>}
          </div>
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
              <Input id="transportadora" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="codigo">Código de rastreio</Label>
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={saveShipment}>Salvar</Button>
            <Button variant="outline" onClick={() => setShipOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}