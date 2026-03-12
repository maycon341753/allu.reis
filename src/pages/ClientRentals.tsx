import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Package, CreditCard, FileText, Headphones, UserCircle, LogOut } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/cliente" },
  { icon: Package, label: "Meus Aluguéis", path: "/cliente/alugueis" },
  { icon: CreditCard, label: "Pagamentos", path: "/cliente/pagamentos" },
  { icon: FileText, label: "Documentos", path: "/cliente/documentos" },
  { icon: Headphones, label: "Suporte", path: "/cliente/suporte" },
  { icon: UserCircle, label: "Perfil", path: "/cliente/perfil" },
];

export default function ClientRentals() {
  const location = useLocation();
  const [rows, setRows] = useState<Array<{ produto: string; plano: string; valor: string; status: string }>>([]);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("produto, plano, valor, status")
        .order("created_at", { descending: true })
        .limit(20);
      if (!error && data) {
        setRows(
          data.map((d: any) => ({
            produto: d.produto || "",
            plano: d.plano || "",
            valor: d.valor != null ? String(d.valor) : "",
            status: d.status || "",
          })),
        );
      } else {
        setRows([]);
      }
    };
    run();
  }, []);

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
        <h1 className="font-display text-2xl font-bold">Meus Aluguéis</h1>
        <p className="mt-1 text-muted-foreground">Acompanhe seus produtos alugados e status.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.length > 0 ? (
            rows.map((rental, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-semibold">{rental.produto}</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{rental.status}</span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Plano: {rental.plano || "—"}</p>
                  <p>Valor: {rental.valor ? `R$ ${rental.valor}/mês` : "—"}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors">Suporte</button>
                  <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">Ver contrato</button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Nenhum aluguel encontrado. Assim que seu contrato for aprovado, os aluguéis aparecerão aqui.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
