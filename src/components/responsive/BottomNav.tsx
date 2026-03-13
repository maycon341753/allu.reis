import { Link, useLocation } from "react-router-dom";
import { Home, Package, ShoppingBag, CreditCard, User } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  // Só mostrar em rotas de cliente ou públicas principais
  // Evitar mostrar em login, cadastro, admin, checkout
  if (path.startsWith("/admin") || path.startsWith("/checkout") || path === "/login" || path === "/cadastro") {
    return null;
  }

  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Package, label: "Produtos", href: "/produtos" },
    { icon: ShoppingBag, label: "Aluguéis", href: "/cliente/alugueis" },
    { icon: CreditCard, label: "Pagamentos", href: "/cliente/pagamentos" },
    { icon: User, label: "Perfil", href: "/cliente/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg tb:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
