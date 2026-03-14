import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

type TicketRow = {
  id: string;
  code: string;
  subject: string;
  category?: string;
  status: "Aberto" | "Em atendimento" | "Aguardando cliente" | "Resolvido" | "Fechado";
  updated_at?: string;
  user_id?: string;
};

export default function AdminSupport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, requireAuth } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [qBusca, setQBusca] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qCategoria, setQCategoria] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTicketId, setViewTicketId] = useState<string | null>(null);
  const [viewMessages, setViewMessages] = useState<Array<{ id: string; sender: string; text: string; at: string }>>([]);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const fmtDateTime = (v?: string | null) => {
    if (!v) return "—";
    try {
      const d = new Date(v);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm} ${hh}:${mi}`;
    } catch {
      return String(v);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, user, requireAuth]);

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
        .from("support_tickets")
        .select("id, code, subject, category, status, updated_at, user_id")
        .order("updated_at", { descending: true })
        .limit(200);
      if (error || !data) {
        setRows([]);
        setOpenCount(0);
        setResolvedCount(0);
        setClosedCount(0);
      } else {
        const rs = (data || []).map((t: any) => ({
          id: t.id || "",
          code: t.code || "",
          subject: t.subject || "",
          category: t.category || "",
          status: (t.status as TicketRow["status"]) || "Aberto",
          updated_at: fmtDateTime(t.updated_at),
          user_id: t.user_id || "",
        }));
        setRows(rs);
        setOpenCount(rs.filter((r) => r.status === "Aberto" || r.status === "Em atendimento" || r.status === "Aguardando cliente").length);
        setResolvedCount(rs.filter((r) => r.status === "Resolvido").length);
        setClosedCount(rs.filter((r) => r.status === "Fechado").length);
      }
      setLoading(false);
    };
    run();
  }, [user, authLoading, navigate]);

  const openView = async (ticketId: string) => {
    setViewOpen(true);
    setViewTicketId(ticketId);
    const { data } = await supabase
      .from("support_messages")
      .select("id, sender, message, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(200);
    setViewMessages(
      (data || []).map((m: any) => ({
        id: m.id || "",
        sender: m.sender || "suporte",
        text: m.message || "",
        at: fmtDateTime(m.created_at),
      })),
    );
  };

  const sendReply = async () => {
    if (!viewTicketId || !replyText.trim()) return;
    setSending(true);
    let attachmentUrl: string | null = null;
    if (replyFile) {
      const ext = replyFile.name.split(".").pop() || "bin";
      const path = `${viewTicketId}/admin-reply-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("support").upload(path, replyFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("support").getPublicUrl(path);
        attachmentUrl = urlData?.publicUrl || null;
      }
    }
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: viewTicketId,
      sender: "admin",
      message: replyText,
      attachment_url: attachmentUrl,
    });
    setSending(false);
    if (error) {
      toast({ title: "Erro ao enviar resposta", description: error.message });
      return;
    }
    setReplyText("");
    setReplyFile(null);
    await openView(viewTicketId);
  };

  const setStatus = async (row: TicketRow, status: TicketRow["status"]) => {
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status } : x)));
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: "Status atualizado" });
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
            <h1 className="font-display text-2xl font-bold">Suporte</h1>
            <p className="mt-1 text-muted-foreground">Atenda chamados e responda clientes</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Abertos/Em atendimento</p>
            <p className="mt-1 font-display text-2xl font-bold text-yellow-600">{openCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Resolvidos</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{resolvedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Fechados</p>
            <p className="mt-1 font-display text-2xl font-bold">{closedCount}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Input placeholder="Buscar por assunto/código" value={qBusca} onChange={(e) => setQBusca(e.target.value)} />
          <Input placeholder="Filtrar status" value={qStatus} onChange={(e) => setQStatus(e.target.value)} />
          <Input placeholder="Filtrar categoria" value={qCategoria} onChange={(e) => setQCategoria(e.target.value)} />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assunto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atualizado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => {
                  const buscaOk =
                    !qBusca ||
                    r.subject.toLowerCase().includes(qBusca.toLowerCase()) ||
                    r.code.toLowerCase().includes(qBusca.toLowerCase());
                  const statusOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
                  const catOk = !qCategoria || (r.category || "").toLowerCase().includes(qCategoria.toLowerCase());
                  return buscaOk && statusOk && catOk;
                })
                .map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{row.code}</td>
                    <td className="px-4 py-3">{row.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.category || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "Resolvido"
                          ? "bg-primary/10 text-primary"
                          : row.status === "Em atendimento"
                          ? "bg-blue-500/10 text-blue-600"
                          : row.status === "Aguardando cliente"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : row.status === "Fechado"
                          ? "bg-secondary text-foreground"
                          : "bg-secondary text-foreground"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.updated_at || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openView(row.id)}>Ver</Button>
                        <Button variant="outline" size="sm" onClick={() => setStatus(row, "Em atendimento")}>Em atendimento</Button>
                        <Button variant="success" size="sm" onClick={() => setStatus(row, "Resolvido")}>Resolver</Button>
                        <Button variant="destructive" size="sm" onClick={() => setStatus(row, "Fechado")}>Fechar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    {loading ? "Carregando..." : "Nenhum chamado encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Chat List */}
        <div className="mt-6 flex flex-col md:hidden border-t border-border">
            {rows
                .filter((r) => {
                    const buscaOk =
                    !qBusca ||
                    r.subject.toLowerCase().includes(qBusca.toLowerCase()) ||
                    r.code.toLowerCase().includes(qBusca.toLowerCase());
                    const statusOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
                    const catOk = !qCategoria || (r.category || "").toLowerCase().includes(qCategoria.toLowerCase());
                    return buscaOk && statusOk && catOk;
                })
                .map((row) => (
                <div 
                    key={row.id} 
                    className="flex gap-3 p-4 border-b border-border bg-card hover:bg-secondary/20 active:bg-secondary/40 transition-colors cursor-pointer" 
                    onClick={() => openView(row.id)}
                >
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {row.subject.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold truncate text-sm text-foreground">{row.subject}</h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{row.updated_at}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            #{row.code} • {row.category || "Geral"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                row.status === "Resolvido"
                                ? "bg-primary/10 text-primary"
                                : row.status === "Em atendimento"
                                ? "bg-blue-500/10 text-blue-600"
                                : row.status === "Aguardando cliente"
                                ? "bg-yellow-500/10 text-yellow-600"
                                : "bg-secondary text-foreground"
                            }`}>
                                {row.status}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            {rows.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">Nenhum chamado encontrado</div>
            )}
        </div>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conversa do chamado</DialogTitle>
              <DialogDescription>Mensagens entre cliente e suporte</DialogDescription>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-auto space-y-3">
              {viewMessages.length ? (
                viewMessages.map((m) => (
                  <div key={m.id} className={`rounded-lg border border-border p-3 ${m.sender === "admin" ? "bg-secondary/40" : "bg-secondary/20"}`}>
                    <div className="text-xs text-muted-foreground">{m.sender} · {m.at}</div>
                    <div className="mt-1 text-sm">{m.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Sem mensagens</div>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="reply">Responder</Label>
                <Input id="reply" value={replyText} onChange={(e) => setReplyText(e.target.value)} className="mt-1" placeholder="Digite sua resposta" />
              </div>
              <div>
                <Label htmlFor="reply_file">Anexo</Label>
                <input id="reply_file" type="file" onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)} className="mt-1" />
              </div>
            </div>
            <div className="mt-3">
              <Button onClick={sendReply} disabled={sending || !replyText.trim()}>Enviar resposta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}