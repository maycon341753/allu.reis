import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [rows, setRows] = useState<Array<{ id: string; produto: string; plano: string; valor: string; restante: string; status: string; image_url?: string }>>([]);
  const [pending, setPending] = useState<Array<{ id: string; produto: string; plano: string; valor: string; status: string; image_url?: string }>>([]);
  const formatBRL = (v: any) =>
    v != null
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(String(v).replace(",", ".")))
      : "—";
  const calcRestante = (plano: string, createdAt?: string | null) => {
    if (!plano || !createdAt) return "—";
    const total = parseInt(String(plano).replace("m", "")) || 0;
    const start = new Date(createdAt);
    const today = new Date();
    const diff =
      (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    const rest = Math.max(0, total - diff);
    return `${rest} meses`;
  };

  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setRows([]);
        setPending([]);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("full_name, cpf").eq("id", uid).maybeSingle();
      const userName = profile?.full_name;
      const userCpf = profile?.cpf ? String(profile.cpf).replace(/\D/g, "") : null;

      let query = supabase
        .from("contratos")
        .select("id, produto, plano, valor, status, created_at, user_id, cliente, cliente_cpf, image_url")
        .order("created_at", { descending: true });

      // Busca robusta: por ID, por CPF ou por Nome
      const filters = [`user_id.eq.${uid}`];
      if (userCpf) filters.push(`cliente_cpf.eq.${userCpf}`);
      if (userName) filters.push(`cliente.eq."${userName}"`);
      
      query = query.or(filters.join(","));
      
      const { data, error } = await query;
      if (!error && data) {
        const approved = data.filter((d: any) => d.status?.toLowerCase() === "aprovado" || d.status?.toLowerCase() === "ativo");
        const pend = data.filter((d: any) => 
          d.status?.toLowerCase() === "em análise" || 
          d.status?.toLowerCase() === "em analise" || 
          d.status?.toLowerCase() === "pendente" ||
          d.status?.toLowerCase() === "aguardando aprovação"
        );
        setRows(
          approved.map((d: any) => ({
            id: d.id || "",
            produto: d.produto || "",
            plano: d.plano || "",
            valor: d.valor,
            restante: calcRestante(d.plano, d.created_at),
            status: d.status || "Aprovado",
            image_url: d.image_url,
          })),
        );
        setPending(
          pend.map((d: any) => ({
            id: d.id || "",
            produto: d.produto || "",
            plano: d.plano || "",
            valor: d.valor,
            status: d.status || "Em análise",
            image_url: d.image_url,
          })),
        );
      } else {
        setRows([]);
        setPending([]);
      }
    };
    run();
  }, []);
  const abrirSuporte = () => navigate("/cliente/suporte");
  const solicitarTroca = () => navigate("/cliente/suporte");

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

        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold">Contratos pendentes de aprovação</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {pending.length > 0 ? (
              pending.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-display font-semibold">{item.produto}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === "Pendente" ? "bg-yellow-500/10 text-yellow-600" : "bg-primary/10 text-primary"}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>Plano: {item.plano || "—"}</p>
                        <p>Valor mensal: {formatBRL(item.valor)}</p>
                      </div>
                    </div>
                    {item.image_url && (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <img 
                          src={item.image_url} 
                          alt={item.produto} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Nenhum contrato pendente no momento.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold">Aluguéis ativos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {rows.length > 0 ? (
              rows.map((rental) => (
                <div key={rental.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-display font-semibold">{rental.produto}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rental.status.toLowerCase() === "ativo" || rental.status.toLowerCase() === "aprovado" ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-600"}`}>
                          {rental.status}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>Plano: {rental.plano || "—"}</p>
                        <p>Valor mensal: {formatBRL(rental.valor)}</p>
                        <p>Tempo restante: {rental.restante}</p>
                      </div>
                    </div>
                    {rental.image_url && (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <img 
                          src={rental.image_url} 
                          alt={rental.produto} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors" onClick={abrirSuporte}>Abrir suporte</button>
                    <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors" onClick={solicitarTroca}>Solicitar troca</button>
                    <button className="rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-colors" onClick={() => navigate("/cliente/suporte")}>Cancelar contrato</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Nenhum aluguel encontrado. Assim que seu contrato for aprovado, os aluguéis aparecerão aqui.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
