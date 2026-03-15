import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, CreditCard, FileText, Headphones, UserCircle, LogOut, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [rows, setRows] = useState<Array<{ id: string; data: string; produto: string; valor: string; status: "Pago" | "Pendente" | "Em atraso"; metodo: string; raw: any }>>([]);
  const [stats, setStats] = useState({ pagas: 0, pendentes: 0, total: 0 });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user) {
        setRows([]);
        return;
      }
      
      const uid = user.id;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile(prof);
      const userName = prof?.full_name;
      const cpfClean = prof?.cpf ? String(prof.cpf).replace(/\D/g, "") : null;

      // 1. Buscar pagamentos reais encontrados na tabela payments
      let directPayments: any[] = [];
      if (uid || cpfClean || userName) {
        let q = supabase
          .from("payments")
          .select("*");
        
        const filters = [];
        if (cpfClean) filters.push(`cliente_cpf.eq.${cpfClean}`);
        if (userName) filters.push(`cliente.eq."${userName}"`);
        
        if (filters.length > 0) {
          q = q.or(filters.join(","));
        } else {
          setRows([]);
          return;
        }

        const { data: dps } = await q.order("vencimento", { ascending: true });
        directPayments = dps || [];
      }

      const formatBRL = (v: any) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

      // 2. Mapear os pagamentos encontrados
      const out = directPayments.map((p: any) => ({
        id: p.id,
        data: p.vencimento ? new Date(p.vencimento).toLocaleDateString("pt-BR") : new Date(p.created_at).toLocaleDateString("pt-BR"),
        produto: p.produto || "Mensalidade",
        valor: formatBRL(p.valor),
        status: (p.status === "approved" || p.status === "Pago" ? "Pago" : p.status) as "Pago" | "Pendente" | "Em atraso",
        metodo: p.metodo || "Pix",
        raw: p
      }));

      // Ordenar por data asc (próximas a vencer em cima)
      out.sort((a, b) => {
        const da = new Date(a.data.split("/").reverse().join("-")).getTime();
        const db = new Date(b.data.split("/").reverse().join("-")).getTime();
        return da - db;
      });

      // 3. Calcular contadores para os módulos de resumo
      const totalPagas = out.filter((p) => p.status === "Pago").length;
      const totalPendentes = out.filter((p) => p.status === "Pendente" || p.status === "Em atraso").length;
      const totalGeral = out.length;

      setRows(out);
      setStats({
        pagas: totalPagas,
        pendentes: totalPendentes,
        total: totalGeral,
      });
    };
    run();
  }, [user, authLoading]);

  const openReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setReceiptOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

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
          <button 
            onClick={() => logout("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
        <h1 className="font-display text-2xl font-bold">Pagamentos</h1>
        <p className="mt-1 text-muted-foreground">Veja cobranças, status e recibos.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Pagos</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.pagas}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.pendentes}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Método</th>
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
                  <td className="px-4 py-3 text-muted-foreground uppercase">{row.metodo}</td>
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
                    <button 
                      onClick={() => openReceipt(row)}
                      disabled={row.status !== "Pago"}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
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
                <div>
                  <div className="font-semibold text-foreground">{row.produto}</div>
                  <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{row.metodo}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.status === "Pago" ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-600"
                }`}>
                  {row.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t border-border pt-3 mt-1">
                <div className="font-medium text-lg">{row.valor}</div>
                <div className="text-sm text-muted-foreground">{row.data}</div>
              </div>
              
              <button 
                onClick={() => openReceipt(row)}
                disabled={row.status !== "Pago"}
                className="w-full rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors mt-2 disabled:opacity-50"
              >
                Recibo
              </button>
            </div>
          ))}
          {rows.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado</div>
          )}
        </div>
      </main>

      {/* Modal de Recibo Profissional */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-white">
          <div className="p-8 md:p-12 print:p-0 receipt-content text-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-primary pb-6 mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">allu.reis</h2>
                <p className="text-sm text-gray-600 mt-1">Soluções em Aluguéis de Dispositivos</p>
                <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-tighter">CNPJ: 00.000.000/0001-00</p>
              </div>
              <div className="text-right">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Nº de Controle</p>
                  <p className="text-xl font-mono font-bold text-primary">
                    #{selectedPayment?.raw?.id?.slice(0, 8).toUpperCase() || "00000000"}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Emitido em {new Date().toLocaleDateString("pt-BR")}</p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-display font-bold uppercase tracking-[0.2em] text-gray-800">Recibo</h3>
                <div className="h-1.5 w-24 bg-primary mx-auto mt-2"></div>
              </div>

              <div className="bg-gray-50 p-8 rounded-2xl space-y-6 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                
                <p className="text-lg leading-relaxed text-gray-700">
                  Recebemos de <span className="font-bold text-gray-900">{profile?.full_name || selectedPayment?.raw?.cliente}</span>, 
                  inscrito no CPF <span className="font-bold text-gray-900">{profile?.cpf || selectedPayment?.raw?.cliente_cpf}</span>, 
                  a importância de:
                </p>
                
                <div className="bg-white border-2 border-dashed border-primary/30 p-6 text-center rounded-xl shadow-sm">
                  <span className="text-5xl font-bold text-primary tracking-tighter">{selectedPayment?.valor}</span>
                </div>
                
                <p className="text-base text-gray-600">
                  Referente ao pagamento do aluguel: <span className="font-bold text-gray-800">{selectedPayment?.produto}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-12 text-sm px-4">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">Data do Pagamento</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedPayment?.data}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">Forma de Pagamento</p>
                  <p className="font-bold text-gray-900 text-lg capitalize">{selectedPayment?.raw?.metodo || "Transferência"}</p>
                </div>
              </div>

              {/* Assinatura */}
              <div className="pt-16 pb-4">
                <div className="flex flex-col items-center">
                  <div className="w-72 border-b border-gray-300 mb-3"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">allu.reis - Departamento Financeiro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-100 print:hidden">
            <Button variant="ghost" onClick={() => setReceiptOpen(false)} className="font-bold uppercase text-[10px] tracking-widest">
              Fechar
            </Button>
            <Button onClick={handlePrint} className="gap-2 px-8 font-bold uppercase text-[10px] tracking-widest">
              <Printer className="h-4 w-4" />
              Imprimir Recibo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
