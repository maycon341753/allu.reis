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

export default function ClientPayments() {
  const location = useLocation();
  const [rows, setRows] = useState<Array<{ data: string; produto: string; valor: string; status: "Pago" | "Pendente" | "Em atraso" }>>([]);
  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setRows([]);
        return;
      }
      // Buscar contratos aprovados/ativos do usuário
      const { data: contratos } = await supabase
        .from("contratos")
        .select("id, produto, plano, valor, created_at, status")
        .eq("user_id", uid)
        .in("status", ["Ativo", "Aprovado"])
        .order("created_at", { ascending: true });
      const subs = (contratos || []).map((c: any) => ({
        id: Number(c.id),
        produto: c.produto || "",
        plano: String(c.plano || "12m"),
        valor: Number(c.valor ?? 0),
        created_at: c.created_at as string | null,
      }));
      if (!subs.length) {
        setRows([]);
        return;
      }
      const ids = subs.map((s) => s.id);
      const { data: pays } = await supabase
        .from("payments")
        .select("contrato_id, vencimento, status")
        .in("contrato_id", ids);
      const paidMap = new Map<string, boolean>(); // key: contratoId|YYYY-MM-DD
      (pays || []).forEach((p: any) => {
        const cid = String(p.contrato_id ?? "");
        const venc = p.vencimento ? String(p.vencimento).slice(0, 10) : "";
        const status = String(p.status || "");
        if (cid && venc && status.toLowerCase() === "pago") {
          paidMap.set(`${cid}|${venc}`, true);
        }
      });
      const monthsFromPlano = (p: string) => {
        const m = parseInt(String(p).replace(/[^\d]/g, ""), 10);
        return Number.isFinite(m) && m > 0 ? m : 12;
      };
      const addMonths = (iso: string | null, n: number) => {
        const base = iso ? new Date(iso) : new Date();
        const d = new Date(base.getTime());
        d.setMonth(d.getMonth() + n);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const fmtBRL = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
      const fmtPt = (iso: string) => {
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      };
      const today = new Date();
      const out: Array<{ data: string; produto: string; valor: string; status: "Pago" | "Pendente" | "Em atraso" }> = [];
      subs.forEach((s) => {
        const total = monthsFromPlano(s.plano);
        for (let i = 1; i <= total; i++) {
          const vencIso = addMonths(s.created_at, i);
          const paid = paidMap.get(`${s.id}|${vencIso}`) === true;
          let status: "Pago" | "Pendente" | "Em atraso" = "Pendente";
          if (paid) status = "Pago";
          else {
            const d = new Date(vencIso);
            if (d.getTime() < today.getTime()) status = "Em atraso";
          }
          out.push({
            data: fmtPt(vencIso),
            produto: s.produto,
            valor: fmtBRL(s.valor),
            status,
          });
        }
      });
      // Ordenar por data asc
      out.sort((a, b) => {
        const [ad, am, ay] = a.data.split("/").map(Number);
        const [bd, bm, by] = b.data.split("/").map(Number);
        const at = new Date(ay, am - 1, ad).getTime();
        const bt = new Date(by, bm - 1, bd).getTime();
        return at - bt;
      });
      setRows(out);
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
        <h1 className="font-display text-2xl font-bold">Pagamentos</h1>
        <p className="mt-1 text-muted-foreground">Veja cobranças, status e recibos.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Resumo</p>
            <p className="mt-1 font-display text-2xl font-bold">—</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.data}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.produto}</td>
                  <td className="px-4 py-3">{row.valor}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "Pago"
                          ? "bg-primary/10 text-primary"
                          : row.status === "Em atraso"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">
                      Recibo
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
          {rows.map((row, i) => (
            <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-foreground">{row.produto}</div>
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {row.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t border-border pt-3 mt-1">
                <div className="font-medium text-lg">{row.valor}</div>
                <div className="text-sm text-muted-foreground">{row.data}</div>
              </div>
              
              <button className="w-full rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors mt-2">
                Recibo
              </button>
            </div>
          ))}
          {rows.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado</div>
          )}
        </div>
      </main>
    </div>
  );
}
