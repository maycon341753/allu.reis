import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, CreditCard, FileText, Headphones, UserCircle, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/cliente" },
  { icon: Package, label: "Meus Aluguéis", path: "/cliente/alugueis" },
  { icon: CreditCard, label: "Pagamentos", path: "/cliente/pagamentos" },
  { icon: FileText, label: "Documentos", path: "/cliente/documentos" },
  { icon: Headphones, label: "Suporte", path: "/cliente/suporte" },
  { icon: UserCircle, label: "Perfil", path: "/cliente/perfil" },
];

export default function ClientSupport() {
  const location = useLocation();
  const [rows, setRows] = useState<Array<{ id: string; assunto: string; status: string; updated: string }>>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [resolvedCount, setResolvedCount] = useState<number>(0);
  const [avgResponse, setAvgResponse] = useState<string>("—");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [product, setProduct] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTicketId, setViewTicketId] = useState<string | null>(null);
  const [viewMessages, setViewMessages] = useState<Array<{ id: string; sender: string; text: string; at: string }>>([]);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, status, updated_at, created_at")
        .eq("user_id", uid)
        .order("updated_at", { descending: true })
        .limit(50);
      if (error || !data) {
        setRows([]);
        setOpenCount(0);
        setResolvedCount(0);
        setAvgResponse("—");
        return;
      }
      const fmt = (v?: string | null) => {
        if (!v) return "—";
        try {
          const d = new Date(v);
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const mi = String(d.getMinutes()).padStart(2, "0");
          return `${dd}/${mm} ${hh}:${mi}`;
        } catch {
          return v;
        }
      };
      setRows(
        (data || []).map((d: any) => ({
          id: d.id || "",
          assunto: d.subject || "",
          status: d.status || "Aberto",
          updated: fmt(d.updated_at),
        })),
      );
      const open = (data || []).filter((d: any) => d.status === "Aberto").length;
      const resolved = (data || []).filter((d: any) => d.status === "Resolvido");
      setOpenCount(open);
      setResolvedCount(resolved.length);
      if (resolved.length) {
        const ms = resolved
          .map((d: any) => {
            try {
              const c = new Date(d.created_at).getTime();
              const u = new Date(d.updated_at).getTime();
              if (isNaN(c) || isNaN(u)) return null;
              return Math.max(0, u - c);
            } catch {
              return null;
            }
          })
          .filter((x: number | null) => x != null) as number[];
        if (ms.length) {
          const avgMs = ms.reduce((a, b) => a + b, 0) / ms.length;
          const totalMin = Math.round(avgMs / 60000);
          const h = Math.floor(totalMin / 60);
          const m = totalMin % 60;
          setAvgResponse(`${h}h ${m}m`);
        } else {
          setAvgResponse("—");
        }
      } else {
        setAvgResponse("—");
      }
    };
    run();
  }, []);

  const makeCode = () => {
    const n = Math.floor(1000 + Math.random() * 9000);
    return `SUP-${n}`;
  };
  const handleSubmit = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;
    if (!subject || !category || !message) {
      alert("Preencha assunto, categoria e descrição.");
      return;
    }
    const code = makeCode();
    let attachmentUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${uid}/${code}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("support").upload(path, file, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("support").getPublicUrl(path);
        attachmentUrl = urlData?.publicUrl || null;
      }
    }
    const { error } = await supabase.from("support_tickets").insert({
      user_id: uid,
      subject,
      message,
      status: "Aberto",
      code,
      category,
      attachment_url: attachmentUrl,
      contract_id: null,
    });
    if (error) {
      alert("Erro ao enviar chamado: " + error.message);
      return;
    }
    setSubject("");
    setCategory("");
    setProduct("");
    setMessage("");
    setFile(null);
    // reload list and counters
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, status, updated_at, created_at")
      .eq("user_id", uid)
      .order("updated_at", { descending: true })
      .limit(50);
    const fmt = (v?: string | null) => {
      if (!v) return "—";
      try {
        const d = new Date(v);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${dd}/${mm} ${hh}:${mi}`;
      } catch {
        return v;
      }
    };
    setRows(
      (data || []).map((d: any) => ({
        id: d.id || "",
        assunto: d.subject || "",
        status: d.status || "Aberto",
        updated: fmt(d.updated_at),
      })),
    );
    const open = (data || []).filter((d: any) => d.status === "Aberto").length;
    const resolved = (data || []).filter((d: any) => d.status === "Resolvido");
    setOpenCount(open);
    setResolvedCount(resolved.length);
  };
  const openView = async (ticketId: string) => {
    setViewOpen(true);
    setViewTicketId(ticketId);
    const { data } = await supabase
      .from("support_messages")
      .select("id, sender, message, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(100);
    const fmt = (v?: string | null) => {
      if (!v) return "—";
      try {
        const d = new Date(v);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${dd}/${mm} ${hh}:${mi}`;
      } catch {
        return v;
      }
    };
    setViewMessages(
      (data || []).map((m: any) => ({
        id: m.id || "",
        sender: m.sender || "suporte",
        text: m.message || "",
        at: fmt(m.created_at),
      })),
    );
  };
  const sendReply = async () => {
    if (!viewTicketId || !replyText.trim()) return;
    setSending(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    let attachmentUrl: string | null = null;
    if (replyFile && uid) {
      const ext = replyFile.name.split(".").pop() || "bin";
      const path = `${uid}/${viewTicketId}-reply-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("support").upload(path, replyFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("support").getPublicUrl(path);
        attachmentUrl = urlData?.publicUrl || null;
      }
    }
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: viewTicketId,
      sender: "cliente",
      message: replyText,
      attachment_url: attachmentUrl,
    });
    setSending(false);
    if (error) {
      alert("Erro ao enviar resposta: " + error.message);
      return;
    }
    setReplyText("");
    setReplyFile(null);
    await openView(viewTicketId);
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold">
            allu<span className="text-primary">.reis</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
            <LogOut size={18} /> Sair
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Suporte</h1>
        <p className="mt-1 text-muted-foreground">Abra solicitações e acompanhe o atendimento.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Chamados abertos</p>
            <p className="mt-1 font-display text-2xl font-bold text-yellow-600">{openCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Chamados resolvidos</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{resolvedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Tempo médio de resposta</p>
            <p className="mt-1 font-display text-2xl font-bold">{avgResponse}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Abrir novo chamado</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="subject">Assunto</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex.: Problema com cobrança" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="order">Produto relacionado (opcional)</Label>
              <Input id="order" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Ex.: iPhone 15 Pro" className="mt-1" />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Categoria do problema</Label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione</option>
                <option value="Problema com pagamento">Problema com pagamento</option>
                <option value="Problema com produto">Problema com produto</option>
                <option value="Entrega / frete">Entrega / frete</option>
                <option value="Troca de aparelho">Troca de aparelho</option>
                <option value="Cancelamento">Cancelamento</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <Label htmlFor="attachment">Anexar arquivos</Label>
              <input id="attachment" type="file" className="mt-1 block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="message">Mensagem</Label>
            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={4} placeholder="Descreva o problema" />
          </div>
          <div className="mt-4">
            <Button onClick={handleSubmit}>Enviar chamado</Button>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assunto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atualizado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{row.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.assunto}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "Resolvido"
                            ? "bg-primary/10 text-primary"
                            : row.status === "Fechado"
                            ? "bg-secondary text-foreground"
                            : "bg-yellow-500/10 text-yellow-600"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.updated}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors" onClick={() => openView(row.id)}>Ver</button>
                        <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors" onClick={() => openView(row.id)}>Responder</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                    Nenhum chamado encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respostas do chamado</DialogTitle>
              <DialogDescription>Conversa entre você e o suporte</DialogDescription>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-auto space-y-3">
              {viewMessages.length ? (
                viewMessages.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.sender}</span>
                      <span>{m.at}</span>
                    </div>
                    <div className="mt-2 text-sm">{m.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Nenhuma resposta ainda</div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Escreva sua resposta"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <input type="file" className="block w-full text-sm" onChange={(e) => setReplyFile(e.target.files?.[0] || null)} />
              <div className="flex justify-end">
                <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                  {sending ? "Enviando..." : "Enviar resposta"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
