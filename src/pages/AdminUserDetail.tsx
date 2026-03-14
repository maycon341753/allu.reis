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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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

export default function AdminUserDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [docs, setDocs] = useState<Array<any>>([]);
  const [contracts, setContracts] = useState<Array<any>>([]);
  const [payments, setPayments] = useState<Array<any>>([]);
  const [logs, setLogs] = useState<Array<any>>([]);

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user || !id || isAdmin !== true) return;

      setLoading(true);
      try {
        const { data: p } = await supabase.from("profiles").select("id, full_name, email, cpf, phone, status, created_at").eq("id", id).maybeSingle();
        let merged = p || null;
        setStatus(p?.status || "Ativo");
        const { data: d } = await supabase.from("documents").select("id, tipo, status, url, updated_at").eq("user_id", id).limit(100);
        setDocs(d || []);
        const { data: c } = await supabase.from("contratos").select("id, produto, plano, valor, status").eq("user_id", id).limit(50);
        setContracts(c || []);
        const cpfDigits = String(p?.cpf || "").replace(/\D/g, "");
        // Fallback: se o e-mail do perfil estiver vazio, tenta pegar do último pagamento
        if (merged && !merged.email && cpfDigits) {
          const { data: lastPay } = await supabase
            .from("payments")
            .select("cliente_email")
            .eq("cliente_cpf", cpfDigits)
            .order("created_at", { descending: true })
            .limit(1)
            .maybeSingle();
          if (lastPay?.cliente_email) {
            merged = { ...merged, email: lastPay.cliente_email };
          }
        }
        // Fallback 2: tenta pegar do último pedido (orders) do usuário
        if (merged && !merged.email) {
          const { data: lastOrder } = await supabase
            .from("orders")
            .select("email")
            .eq("user_id", id)
            .order("id", { descending: true })
            .limit(1)
            .maybeSingle();
          if (lastOrder?.email) {
            merged = { ...merged, email: lastOrder.email };
          }
        }
        setProfile(merged);
        const { data: pay } = await supabase.from("payments").select("id, vencimento, valor, status, forma").eq("cliente_cpf", cpfDigits).limit(50);
        setPayments(pay || []);
        const { data: lg } = await supabase.from("user_logs").select("id, acao, data, descricao").eq("user_id", id).order("data", { descending: true }).limit(100);
        setLogs(lg || []);
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

  const updateStatus = async () => {
    if (!id) return;
    const prev = profile?.status;
    setProfile((p: any) => ({ ...p, status }));
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) {
      setProfile((p: any) => ({ ...p, status: prev }));
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: "Status atualizado" });
    }
  };

  const approveDoc = async (docId: string) => {
    const prev = docs.slice();
    setDocs((r) => r.map((x) => (x.id === docId ? { ...x, status: "Aprovado" } : x)));
    const { error } = await supabase.from("documents").update({ status: "Aprovado" }).eq("id", docId);
    if (error) setDocs(prev);
  };
  const rejectDoc = async (docId: string) => {
    const prev = docs.slice();
    setDocs((r) => r.map((x) => (x.id === docId ? { ...x, status: "Rejeitado" } : x)));
    const { error } = await supabase.from("documents").update({ status: "Rejeitado" }).eq("id", docId);
    if (error) setDocs(prev);
  };
  const addNote = async () => {
    if (!id || !notes.trim()) return;
    const { error } = await supabase.from("user_logs").insert({ user_id: id, acao: "nota", descricao: notes, data: new Date().toISOString() });
    if (!error) {
      setNotes("");
      const { data: lg } = await supabase.from("user_logs").select("id, acao, data, descricao").eq("user_id", id).order("data", { descending: true }).limit(100);
      setLogs(lg || []);
    }
  };

  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };
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
            <h1 className="font-display text-2xl font-bold">Usuário</h1>
            <p className="mt-1 text-muted-foreground">Detalhes do cliente</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Dados pessoais</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{profile?.full_name || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{profile?.email || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">CPF</span><span className="font-medium">{profile?.cpf || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Telefone</span><span className="font-medium">{profile?.phone || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Cadastro</span><span className="font-medium">{fmtDate(profile?.created_at)}</span></div>
            </div>
            <div className="mt-4">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <Button className="mt-3" onClick={updateStatus}>Atualizar status</Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <p className="text-sm text-muted-foreground">Documentos</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[560px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{d.tipo}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          d.status === "Aprovado" ? "bg-primary/10 text-primary" :
                          d.status === "Rejeitado" ? "bg-red-500/10 text-red-600" :
                          "bg-yellow-500/10 text-yellow-600"
                        }`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" disabled={!d.url} onClick={() => d.url && window.open(d.url, "_blank")}>Ver</Button>
                          <Button variant="success" size="sm" onClick={() => approveDoc(d.id)}>Aprovar</Button>
                          <Button variant="destructive" size="sm" onClick={() => rejectDoc(d.id)}>Reprovar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {docs.length === 0 && (
                    <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={3}>Nenhum documento enviado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Assinaturas</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[480px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{c.produto}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.plano}</td>
                      <td className="px-4 py-3">{formatBRL(c.valor)}</td>
                      <td className="px-4 py-3">{c.status}</td>
                    </tr>
                  ))}
                  {contracts.length === 0 && (
                    <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>Nenhum contrato</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Pagamentos</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Forma</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{fmtDate(p.vencimento)}</td>
                      <td className="px-4 py-3">{formatBRL(p.valor)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.forma || "—"}</td>
                      <td className="px-4 py-3">{p.status}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>Nenhum pagamento</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Notas internas</p>
            <div className="mt-3">
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Adicionar observação" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button className="mt-3" onClick={addNote}>Salvar nota</Button>
            </div>
            <div className="mt-4 space-y-2 max-h-[240px] overflow-auto">
              {logs.map((l) => (
                <div key={l.id} className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">{fmtDate(l.data)} · {l.acao}</div>
                  <div className="mt-1 text-sm">{l.descricao || ""}</div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-sm text-muted-foreground">Sem notas</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}