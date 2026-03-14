import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
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

type DocRow = {
  id: string;
  user_id: string | null;
  arquivo: string;
  tipo: string;
  status: "Pendente" | "Aprovado" | "Rejeitado";
  url?: string | null;
  atualizado_em?: string | null;
  cliente_nome?: string | null;
  cliente_cpf?: string | null;
};

export default function AdminDocuments() {
  const location = useLocation();
  const { toast } = useToast();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [countPend, setCountPend] = useState<string>("—");
  const [countApr, setCountApr] = useState<string>("—");
  const [countRej, setCountRej] = useState<string>("—");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("id, user_id, nome, tipo, status, url, updated_at")
          .limit(50);
        if (!error) {
          const docs = (data || []).map((d: any) => ({
            id: d.id || "",
            user_id: d.user_id ?? null,
            arquivo: d.nome || "",
            tipo: d.tipo || "",
            status: (d.status as DocRow["status"]) || "Pendente",
            url: d.url ?? null,
            atualizado_em: d.updated_at || null,
          }));
          const ids = Array.from(new Set(docs.map((d) => d.user_id).filter(Boolean)));
          let profileMap: Record<string, { full_name: string; cpf: string }> = {};
          if (ids.length) {
            const { data: profiles } = await supabase.from("profiles").select("id, full_name, cpf").in("id", ids);
            (profiles || []).forEach((p: any) => {
              profileMap[p.id] = { full_name: p.full_name || "", cpf: p.cpf || "" };
            });
          }
          const fmtCpf = (cpf: string) => {
            const d = String(cpf || "").replace(/\D/g, "").slice(0, 11);
            if (d.length !== 11) return d || "—";
            return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
          };
          setRows(
            docs.map((d) => ({
              ...d,
              cliente_nome: d.user_id ? profileMap[d.user_id]?.full_name || null : null,
              cliente_cpf: d.user_id ? fmtCpf(profileMap[d.user_id]?.cpf || "") : null,
            }))
          );
          // Contagens por status (consultas com count: 'exact')
          const countExact = async (status: "Pendente" | "Aprovado" | "Rejeitado") => {
            try {
              const { count } = await supabase
                .from("documents")
                .select("*", { count: "exact", head: true })
                .eq("status", status);
              return String(count ?? 0);
            } catch {
              return "—";
            }
          };
          const [p, a, r] = await Promise.all([
            countExact("Pendente"),
            countExact("Aprovado"),
            countExact("Rejeitado"),
          ]);
          setCountPend(p);
          setCountApr(a);
          setCountRej(r);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const updateStatus = async (row: DocRow, status: DocRow["status"]) => {
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status } : x)));
    const { error } = await supabase.from("documents").update({ status }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: "Status atualizado" });
    }
  };

  const deleteDocument = async (row: DocRow) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir o anexo deste documento? O status será alterado para Rejeitado.");
    if (!confirmDelete) return;

    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, url: null, status: "Rejeitado" } : x)));
    
    const { error } = await supabase
      .from("documents")
      .update({ url: null, status: "Rejeitado" })
      .eq("id", row.id);

    if (error) {
      setRows(prev);
      toast({ title: "Erro ao excluir anexo", description: error.message });
    } else {
      toast({ title: "Anexo excluído e status alterado para Rejeitado" });
    }
  };

  const openUrl = (url?: string | null) => {
    if (!url) {
      toast({ title: "Sem arquivo", description: "Este documento não possui URL vinculada" });
      return;
    }
    window.open(url, "_blank");
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
        <div className="md:hidden mb-6">
          <AdminSidebarMobile />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Documentos</h1>
            <p className="mt-1 text-muted-foreground">Revise e aprove documentos dos clientes</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        {/* Status cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Documentos pendentes</p>
            <p className="mt-1 font-display text-2xl font-bold text-yellow-600">{countPend}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Documentos aprovados</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{countApr}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Documentos reprovados</p>
            <p className="mt-1 font-display text-2xl font-bold text-red-600">{countRej}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <div className="flex flex-col gap-3 p-4 border-b border-border">
            <Input placeholder="Buscar por CPF, Nome ou Tipo" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">CPF</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atualizado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(rows.filter((row) => {
                const norm = (s: string | null | undefined) => String(s || "").replace(/\D/g, "");
                const qNorm = norm(q);
                const qLower = q.toLowerCase();
                const cpfOk = !qNorm || norm(row.cliente_cpf).includes(qNorm);
                const nomeOk = !qLower || String(row.cliente_nome || "").toLowerCase().includes(qLower);
                const tipoOk = !qLower || String(row.tipo || "").toLowerCase().includes(qLower);
                return cpfOk || nomeOk || tipoOk;
              })).map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.cliente_nome || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.cliente_cpf || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Aprovado"
                        ? "bg-primary/10 text-primary"
                        : row.status === "Pendente"
                        ? "bg-yellow-500/10 text-yellow-600"
                        : "bg-secondary text-foreground"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.atualizado_em || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openUrl(row.url)} disabled={!row.url}>Ver</Button>
                      <Button variant="success" size="sm" onClick={() => updateStatus(row, "Aprovado")}>Aprovar</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteDocument(row)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    {loading ? "Carregando..." : "Nenhum documento encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
          <Input placeholder="Buscar por CPF, Nome ou Tipo" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4" />
          
          {(rows.filter((row) => {
            const norm = (s: string | null | undefined) => String(s || "").replace(/\D/g, "");
            const qNorm = norm(q);
            const qLower = q.toLowerCase();
            const cpfOk = !qNorm || norm(row.cliente_cpf).includes(qNorm);
            const nomeOk = !qLower || String(row.cliente_nome || "").toLowerCase().includes(qLower);
            const tipoOk = !qLower || String(row.tipo || "").toLowerCase().includes(qLower);
            return cpfOk || nomeOk || tipoOk;
          })).map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">{row.cliente_nome || "—"}</div>
                  <div className="text-sm text-muted-foreground">{row.cliente_cpf || "—"}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.status === "Aprovado"
                    ? "bg-primary/10 text-primary"
                    : row.status === "Pendente"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-secondary text-foreground"
                }`}>
                  {row.status}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">Tipo: {row.tipo}</div>
              <div className="text-xs text-muted-foreground">Atualizado: {row.atualizado_em || "—"}</div>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button variant="secondary" size="sm" onClick={() => openUrl(row.url)} disabled={!row.url}>Ver</Button>
                <Button variant="success" size="sm" onClick={() => updateStatus(row, "Aprovado")}>Aprovar</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteDocument(row)}>Excluir</Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && !loading && (
             <div className="text-center py-8 text-muted-foreground">Nenhum documento encontrado</div>
          )}
        </div>
      </main>
    </div>
  );
}
