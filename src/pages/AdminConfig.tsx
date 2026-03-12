import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

type SettingsRow = {
  id: string;
  company_name: string;
  company_cnpj: string;
  support_email: string;
  require_email_confirmation: boolean;
  contract_base: string;
};

export default function AdminConfig() {
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [s, setS] = useState<SettingsRow>({
    id: "global",
    company_name: "allu.reis",
    company_cnpj: "39.433.448/0001-34",
    support_email: "suporte@allu.reis",
    require_email_confirmation: false,
    contract_base:
      "Base de contrato padrão da allu.reis. Ajuste cláusulas conforme necessidade e legislação aplicável.",
  });

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", "global").maybeSingle();
      if (!error && data) {
        setS({
          id: data.id ?? "global",
          company_name: data.company_name ?? s.company_name,
          company_cnpj: data.company_cnpj ?? s.company_cnpj,
          support_email: data.support_email ?? s.support_email,
          require_email_confirmation: !!data.require_email_confirmation,
          contract_base: data.contract_base ?? s.contract_base,
        });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("settings")
      .upsert({
        id: s.id,
        company_name: s.company_name,
        company_cnpj: s.company_cnpj,
        support_email: s.support_email,
        require_email_confirmation: s.require_email_confirmation,
        contract_base: s.contract_base,
      });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message });
    } else {
      toast({ title: "Configurações salvas" });
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
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <LogOut size={18} /> Sair
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Configurações</h1>
            <p className="mt-1 text-muted-foreground">Definições da plataforma e contratos</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={save}>Salvar</Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Empresa</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="company_name">Nome</Label>
                <Input id="company_name" value={s.company_name} onChange={(e) => setS({ ...s, company_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="company_cnpj">CNPJ</Label>
                <Input id="company_cnpj" value={s.company_cnpj} onChange={(e) => setS({ ...s, company_cnpj: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="support_email">E‑mail de suporte</Label>
                <Input id="support_email" value={s.support_email} onChange={(e) => setS({ ...s, support_email: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Exigir confirmação de e‑mail</p>
                  <p className="text-xs text-muted-foreground">Quando ativo, novos cadastros precisam confirmar e‑mail</p>
                </div>
                <Switch checked={s.require_email_confirmation} onCheckedChange={(v) => setS({ ...s, require_email_confirmation: v })} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Contrato base</h2>
            <div className="mt-4">
              <Textarea rows={10} value={s.contract_base} onChange={(e) => setS({ ...s, contract_base: e.target.value })} />
            </div>
            <div className="mt-3">
              <Button onClick={save} disabled={loading}>Salvar contrato base</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
