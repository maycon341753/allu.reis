import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
  nome: string;
  tipo: string;
  status: "Pendente" | "Aprovado" | "Rejeitado";
  url?: string | null;
  atualizado_em?: string | null;
};

export default function AdminDocuments() {
  const location = useLocation();
  const { toast } = useToast();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const demo: DocRow[] = [
        { id: "#D-5001", user_id: null, nome: "Maria Silva", tipo: "RG frente", status: "Aprovado", url: null, atualizado_em: "11/03 14:22" },
        { id: "#D-5002", user_id: null, nome: "Maria Silva", tipo: "RG verso", status: "Aprovado", url: null, atualizado_em: "11/03 14:24" },
        { id: "#D-5003", user_id: null, nome: "Maria Silva", tipo: "Selfie com documento", status: "Aprovado", url: null, atualizado_em: "11/03 14:30" },
        { id: "#D-5004", user_id: null, nome: "Maria Silva", tipo: "Comprovante de residência", status: "Pendente", url: null, atualizado_em: null },
      ];
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("id, user_id, nome, tipo, status, url, updated_at")
          .limit(50);
        if (error || !data) {
          setRows(demo);
        } else {
          setRows(
            data.map((d: any) => ({
              id: d.id || "",
              user_id: d.user_id ?? null,
              nome: d.nome || "",
              tipo: d.tipo || "",
              status: (d.status as DocRow["status"]) || "Pendente",
              url: d.url ?? null,
              atualizado_em: d.updated_at || null,
            }))
          );
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

      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Documentos</h1>
            <p className="mt-1 text-muted-foreground">Revise e aprove documentos dos clientes</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atualizado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.id}</td>
                  <td className="px-4 py-3">{row.nome}</td>
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
                      <Button variant="secondary" size="sm" onClick={() => openUrl(row.url)}>Ver</Button>
                      <Button variant="success" size="sm" onClick={() => updateStatus(row, "Aprovado")}>Aprovar</Button>
                      <Button variant="destructive" size="sm" onClick={() => updateStatus(row, "Rejeitado")}>Rejeitar</Button>
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
      </main>
    </div>
  );
}
