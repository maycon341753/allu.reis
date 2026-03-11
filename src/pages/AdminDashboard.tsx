import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut,
} from "lucide-react";

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

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col surface-dark md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold text-surface-dark-foreground">
            Admin
          </span>
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

      {/* Main */}
      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da plataforma</p>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Clientes ativos", value: "1.247" },
            { label: "Contratos ativos", value: "2.089" },
            { label: "Receita mensal", value: "R$623K" },
            { label: "Análises pendentes", value: "14" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">Pedidos recentes</h2>
          <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cliente: "Maria Silva", produto: "iPhone 15 Pro", plano: "24m", status: "Ativo" },
                  { cliente: "João Santos", produto: "MacBook Air M3", plano: "36m", status: "Pendente" },
                  { cliente: "Ana Costa", produto: "Apple Watch S9", plano: "12m", status: "Em análise" },
                  { cliente: "Pedro Lima", produto: "iPad Pro M2", plano: "24m", status: "Ativo" },
                ].map((order, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{order.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.produto}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.plano}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "Ativo" ? "bg-primary/10 text-primary" :
                        order.status === "Pendente" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
