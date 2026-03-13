import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, CreditCard, FileText, Headphones, UserCircle, LogOut, Upload, Eye, Download } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/cliente" },
  { icon: Package, label: "Meus Aluguéis", path: "/cliente/alugueis" },
  { icon: CreditCard, label: "Pagamentos", path: "/cliente/pagamentos" },
  { icon: FileText, label: "Documentos", path: "/cliente/documentos" },
  { icon: Headphones, label: "Suporte", path: "/cliente/suporte" },
  { icon: UserCircle, label: "Perfil", path: "/cliente/perfil" },
];

export default function ClientDocuments() {
  const location = useLocation();
  const [uid, setUid] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<{ doc: string; tipo: string; status: string; updated: string; url?: string | null }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [approved, setApproved] = useState(0);
  const [pending, setPending] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("—");
  const docTypes = [
    { doc: "RG ou CNH (frente)", tipo: "rg_frente" },
    { doc: "RG ou CNH (verso)", tipo: "rg_verso" },
    { doc: "Selfie com documento", tipo: "selfie_documento" },
    { doc: "Comprovante de residência", tipo: "comprovante_residencia" },
    { doc: "Carteira de trabalho (para assinatura Boleto)", tipo: "carteira_trabalho" },
  ];

  useEffect(() => {
    const run = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;
      setUid(userId);
      let docs: any[] = [];
      if (userId) {
        const { data } = await supabase
          .from("documents")
          .select("id, tipo, status, url, updated_at")
          .eq("user_id", userId)
          .limit(50);
        docs = data || [];
      }
      const byTipo: Record<string, any> = {};
      docs.forEach((d) => (byTipo[d.tipo] = d));
      const fmt = (v?: string | null) => {
        if (!v) return "—";
        try {
          const dt = new Date(v);
          const dd = String(dt.getDate()).padStart(2, "0");
          const mm = String(dt.getMonth() + 1).padStart(2, "0");
          const yy = dt.getFullYear();
          const hh = String(dt.getHours()).padStart(2, "0");
          const min = String(dt.getMinutes()).padStart(2, "0");
          return `${dd}/${mm}/${yy} ${hh}:${min}`;
        } catch {
          return v;
        }
      };
      setRows(
        docTypes.map((t) => ({
          doc: t.doc,
          tipo: t.tipo,
          status: byTipo[t.tipo]?.status || "Pendente",
          updated: fmt(byTipo[t.tipo]?.updated_at),
          url: byTipo[t.tipo]?.url ?? null,
        })),
      );
      const allUpdates = docs.map((d) => d.updated_at).filter(Boolean);
      const latest = allUpdates.length ? new Date(Math.max(...allUpdates.map((v: any) => new Date(v).getTime()))) : null;
      const dd = latest ? String(latest.getDate()).padStart(2, "0") : "";
      const mm = latest ? String(latest.getMonth() + 1).padStart(2, "0") : "";
      const yy = latest ? latest.getFullYear() : "";
      const hh = latest ? String(latest.getHours()).padStart(2, "0") : "";
      const min = latest ? String(latest.getMinutes()).padStart(2, "0") : "";
      setLastUpdate(latest ? `${dd}/${mm}/${yy} ${hh}:${min}` : "—");
      setApproved(docs.filter((d) => d.status === "Aprovado").length);
      setPending(docTypes.length - docs.filter((d) => d.status === "Aprovado").length);
    };
    run();
  }, []);

  const handleChoose = (tipo: string) => {
    if (!fileInputRef.current) return;
    (fileInputRef.current as any).dataset.tipo = tipo;
    fileInputRef.current.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const tipo = (e.target as any).dataset?.tipo;
    if (!file || !uid || !tipo) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${uid}/${tipo}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (upErr) {
      alert("Falha no upload: " + upErr.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl || null;
    await supabase
      .from("documents")
      .upsert({ user_id: uid, tipo, nome: file.name, status: "Pendente", url: publicUrl }, { onConflict: "user_id,tipo" });
    setRows((r) =>
      r.map((row) => (row.tipo === tipo ? { ...row, status: "Pendente", updated: new Date().toISOString(), url: publicUrl } : row)),
    );
    e.target.value = "";
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
        <h1 className="font-display text-2xl font-bold">Documentos</h1>
        <p className="mt-1 text-muted-foreground">Envie e acompanhe seus documentos de verificação.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Documentos aprovados</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{approved}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Documentos pendentes</p>
            <p className="mt-1 font-display text-2xl font-bold text-yellow-600">{pending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Última atualização</p>
            <p className="mt-1 font-display text-2xl font-bold">{lastUpdate}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Documento</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atualizado em</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.doc}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "Aprovado"
                          ? "bg-primary/10 text-primary"
                          : row.status === "Rejeitado"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.updated}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleChoose(row.tipo)}>
                        <Upload className="mr-1 h-4 w-4" /> Enviar
                      </Button>
                      <Button variant="secondary" size="sm" disabled={!row.url} onClick={() => row.url && window.open(row.url, "_blank")}>
                        <Eye className="mr-1 h-4 w-4" /> Ver
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!row.url}
                        onClick={() => row.url && window.open(row.url, "_blank")}
                        title="Baixar"
                      >
                        <Download className="mr-1 h-4 w-4" /> Baixar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
          {rows.map((row, i) => (
            <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-foreground">{row.doc}</div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.status === "Aprovado" ? "bg-primary/10 text-primary" :
                  row.status === "Rejeitado" ? "bg-red-500/10 text-red-600" :
                  "bg-yellow-500/10 text-yellow-600"
                }`}>
                  {row.status}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">Atualizado: {row.updated}</div>
              
              <div className="flex gap-2 mt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleChoose(row.tipo)}>
                  <Upload className="mr-1 h-3 w-3" /> Enviar
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" disabled={!row.url} onClick={() => row.url && window.open(row.url, "_blank")}>
                  <Eye className="mr-1 h-3 w-3" /> Ver
                </Button>
              </div>
            </div>
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      </main>
    </div>
  );
}
