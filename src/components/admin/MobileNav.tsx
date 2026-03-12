import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, BarChart3, Settings,
} from "lucide-react";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: ShoppingCart, label: "Pedidos", path: "/admin/pedidos" },
  { icon: FileText, label: "Contratos", path: "/admin/contratos" },
  { icon: CreditCard, label: "Pagamentos", path: "/admin/pagamentos" },
  { icon: Package, label: "Produtos", path: "/admin/produtos" },
  { icon: FolderOpen, label: "Docs", path: "/admin/documentos" },
  { icon: ShieldCheck, label: "Crédito", path: "/admin/credito" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
  { icon: Settings, label: "Config", path: "/admin/config" },
];

export default function AdminMobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card md:hidden">
      <div className="mx-auto max-w-screen-sm">
        <div className="flex overflow-x-auto no-scrollbar">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors min-w-[72px] ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={item.label}
              >
                <item.icon size={18} />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
