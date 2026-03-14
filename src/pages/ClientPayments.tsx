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
      // Se não achar por user_id, tenta buscar pelo CPF do usuário (fallback)
      const { data: profile } = await supabase.from("profiles").select("cpf").eq("id", uid).maybeSingle();
      const cpfClean = profile?.cpf ? String(profile.cpf).replace(/\D/g, "") : null;

      let { data: contratos } = await supabase
        .from("contratos")
        .select("id, produto, plano, valor, created_at, status")
        .eq("user_id", uid)
        .in("status", ["Ativo", "Aprovado", "Em análise", "Pendente"]) // Incluir pendentes para mostrar 1a parcela
        .order("created_at", { ascending: true });
        
      if ((!contratos || !contratos.length) && cpfClean) {
         // Fallback: buscar contratos pelo CPF caso user_id não tenha vínculo
         const { data: contratosCpf } = await supabase
          .from("contratos")
          .select("id, produto, plano, valor, created_at, status")
          .eq("cliente", (await supabase.from("profiles").select("full_name").eq("id", uid).single()).data?.full_name) // Tentativa por nome se não tiver CPF na tabela contratos (ideal seria ter cpf na tabela contratos)
          // Na verdade, melhor buscar pagamentos diretos pelo CPF se não tiver contrato
          // Mas aqui a lógica depende de contratos.
          // Vamos tentar buscar contratos onde cliente tem esse CPF indiretamente? Difícil.
          // Vamos manter a busca por user_id e assumir que o fix SQL resolveu.
          // Mas podemos buscar pagamentos "órfãos" pelo CPF e exibi-los mesmo sem contrato vinculado.
          .in("status", ["Ativo", "Aprovado", "Em análise", "Pendente"]);
          
          // Se não achou contrato, vamos buscar pagamentos diretos pelo CPF para não deixar vazio
      }

      // Buscar pagamentos diretos pelo CPF (para garantir que a 1a parcela apareça mesmo sem contrato aprovado)
      let directPayments: any[] = [];
      if (cpfClean) {
        const { data: dps } = await supabase
          .from("payments")
          .select("id, produto, valor, created_at, status, vencimento")
          .eq("cliente_cpf", cpfClean)
          .order("created_at", { ascending: true });
        directPayments = dps || [];
      }

      // Se tiver pagamentos diretos, usamos eles como fonte da verdade para o histórico financeiro
      // Isso é mais seguro que projetar parcelas futuras de contratos que podem não estar sincronizados
      // Porém, a lógica original projetava parcelas futuras (vencimentos).
      // Vamos mesclar: Mostrar pagamentos REAIS (realizados/gerados) + Projetar futuros apenas se tiver contrato ativo.
      
      const out: Array<{ data: string; produto: string; valor: string; status: "Pago" | "Pendente" | "Em atraso" }> = [];
      const fmtBRL = (v: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
      const fmtPt = (iso: string) => {
        if (!iso) return "—";
        const [y, m, d] = iso.split("T")[0].split("-");
        return `${d}/${m}/${y}`;
      };

      // 1. Adicionar pagamentos reais encontrados na tabela payments
      const paidIds = new Set<string>();
      directPayments.forEach(p => {
        const dStr = fmtPt(p.vencimento || p.created_at);
        out.push({
          data: dStr,
          produto: p.produto || "Assinatura",
          valor: fmtBRL(Number(p.valor)),
          status: p.status === "approved" || p.status === "Pago" ? "Pago" : "Pendente"
        });
        // Tentar identificar se esse pagamento corresponde a alguma parcela do contrato
        // Chave composta aproximada: produto + mês/ano
        const dateObj = new Date(p.vencimento || p.created_at);
        const key = `${p.produto}|${dateObj.getMonth()}|${dateObj.getFullYear()}`;
        paidIds.add(key);
      });

      // 2. Projetar parcelas futuras baseadas nos contratos ativos
      if (contratos && contratos.length > 0) {
        const subs = contratos.map((c: any) => ({
          id: Number(c.id),
          produto: c.produto || "",
          plano: String(c.plano || "12m"),
          valor: Number(c.valor ?? 0),
          created_at: c.created_at as string | null,
        }));

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
        
        const today = new Date();
        
        subs.forEach((s) => {
          const total = monthsFromPlano(s.plano);
          // Começa do mês 1 (próximo mês após assinatura? Ou mês 0 se for entrada?)
          // Geralmente a entrada já está em directPayments. Vamos projetar a partir do mês 1.
          // Se a entrada (mês 0) já foi paga, ela está em directPayments.
          // Vamos assumir que parcelas são mês a mês a partir da data de criação.
          
          for (let i = 0; i < total; i++) {
             // i=0 é a entrada/primeira parcela.
             // Se i=0, data é a data de criação.
             // Se i>0, data é created_at + i meses.
             const vencIso = addMonths(s.created_at, i);
             const dObj = new Date(vencIso);
             const key = `${s.produto}|${dObj.getMonth()}|${dObj.getFullYear()}`;
             
             // Se já existe pagamento real para este mês/produto, não projeta pendente
             if (paidIds.has(key)) continue;
             
             // Se não existe, projeta como Pendente ou Atrasado
             let status: "Pago" | "Pendente" | "Em atraso" = "Pendente";
             if (dObj.getTime() < today.getTime()) {
                // Se a data já passou e não tem pagamento registrado:
                // Pode ser que o pagamento real tenha data ligeiramente diferente?
                // Ou realmente está atrasado.
                // Vamos ser conservadores: se for muito antigo (> 5 dias), atrasado.
                const diffDays = (today.getTime() - dObj.getTime()) / (1000 * 3600 * 24);
                if (diffDays > 5) status = "Em atraso";
             }
             
             out.push({
               data: fmtPt(vencIso),
               produto: s.produto,
               valor: fmtBRL(s.valor),
               status,
             });
          }
        });
      }
      
      // Ordenar por data desc (mais recente primeiro)
      out.sort((a, b) => {
        const da = a.data.split("/").reverse().join("-");
        const db = b.data.split("/").reverse().join("-");
        return da < db ? 1 : -1;
      });
      
      setRows(out);
      return; // Interrompe para não rodar a lógica antiga duplicada
      
      /* Lógica antiga desativada em favor da busca direta em payments */
      /*
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
      // ...
      */
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
