import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, CreditCard, FileText, 
  Headphones, UserCircle, LogOut 
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/cliente" },
  { icon: Package, label: "Meus Aluguéis", path: "/cliente/alugueis" },
  { icon: CreditCard, label: "Pagamentos", path: "/cliente/pagamentos" },
  { icon: FileText, label: "Documentos", path: "/cliente/documentos" },
  { icon: Headphones, label: "Suporte", path: "/cliente/suporte" },
  { icon: UserCircle, label: "Perfil", path: "/cliente/perfil" },
];

export default function ClientDashboard() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
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
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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

      {/* Main */}
      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Bem-vindo de volta, João!</p>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Produtos ativos", value: "2", color: "text-primary" },
            { label: "Próxima cobrança", value: "R$528", color: "text-foreground" },
            { label: "Meses restantes", value: "18", color: "text-foreground" },
            { label: "Pagamentos em dia", value: "✓", color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Active rentals */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">Produtos alugados</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { nome: "iPhone 15 Pro 128GB", plano: "24 meses", valor: "R$289/mês", restante: "18 meses" },
              { nome: "Apple Watch Series 9", plano: "24 meses", valor: "R$149/mês", restante: "18 meses" },
            ].map((rental) => (
              <div key={rental.nome} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-semibold">{rental.nome}</h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Plano: {rental.plano}</p>
                  <p>Valor: {rental.valor}</p>
                  <p>Tempo restante: {rental.restante}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors">Suporte</button>
                  <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors">Trocar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
