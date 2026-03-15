import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, Package, CreditCard, FileText, 
  Headphones, UserCircle, LogOut, Calendar, Tag, Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [pagamentosEmDia, setPagamentosEmDia] = useState<string>("—");
  const [mesesRestantes, setMesesRestantes] = useState<string>("—");
  const [proximaCobranca, setProximaCobranca] = useState<string>("—");
  const [produtosAtivos, setProdutosAtivos] = useState<number>(0);
  const [alugadosCount, setAlugadosCount] = useState<number>(0);
  const [alugadosLista, setAlugadosLista] = useState<any[]>([]);
  const [contratoStatus, setContratoStatus] = useState<string>("—");
  const [proximasCobrancasLista, setProximasCobrancasLista] = useState<string[]>([]);
  const [clientName, setClientName] = useState<string>("");
  const [accountApproved, setAccountApproved] = useState<boolean>(false);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user) return;
      
      const uid = user.id;
      const { data: profile } = await supabase.from("profiles").select("full_name, cpf").eq("id", uid).maybeSingle();
      setClientName(profile?.full_name || "");
      // Verificar documentos aprovados
      try {
        const { data: docs } = await supabase.from("documents").select("status").eq("user_id", uid);
        const hasDocs = Array.isArray(docs) && docs.length > 0;
        const docsOk = hasDocs && docs.every((d: any) => String(d.status).toLowerCase() === "aprovado");
        setAccountApproved(!!docsOk);
      } catch {
        setAccountApproved(false);
      }
      const cpfDigits = String(profile?.cpf || "").replace(/\D/g, "");
      const { data: pays } = await supabase
        .from("payments")
        .select("vencimento, status")
        .eq("cliente_cpf", cpfDigits)
        .order("vencimento", { descending: false })
        .limit(50);
      const today = new Date();
      const pendentes = (pays || []).filter((p: any) => p.status === "Pendente");
      const atrasados = pendentes.filter((p: any) => {
        if (!p.vencimento) return false;
        const d = new Date(p.vencimento);
        return d.getTime() < today.getTime();
      });
      setPagamentosEmDia(atrasados.length ? "Não" : "Sim");
      const next = pendentes.find((p: any) => p.vencimento);
      if (next?.vencimento) {
        const nd = new Date(next.vencimento);
        const dd = String(nd.getDate()).padStart(2, "0");
        const mm = String(nd.getMonth() + 1).padStart(2, "0");
        const yy = nd.getFullYear();
        setProximaCobranca(`${dd}/${mm}/${yy}`);
      } else {
        setProximaCobranca("—");
      }
      const { data: contratos } = await supabase
        .from("contratos")
        .select("id, status, plano, produto, created_at, user_id, cliente, cliente_cpf, image_url")
        .or(`user_id.eq.${uid}${cpfDigits ? `,cliente_cpf.eq.${cpfDigits}` : ""}${profile?.full_name ? `,cliente.eq."${profile.full_name}"` : ""}`)
        .order("created_at", { descending: true })
        .limit(50);
      
      // Mostrar todos os contratos relevantes (Ativo, Aprovado, Em análise, Rejeitado)
      const allowedStatusList = ["ativo", "aprovado", "em análise", "em analise", "rejeitado", "pendente", "aguardando aprovação", "aguardando aprovacao"];
      const displayList = (contratos || []).filter((c: any) => 
        allowedStatusList.includes(String(c.status).toLowerCase())
      );
      
      const ativosOnly = displayList.filter((c: any) => String(c.status).toLowerCase() === "ativo");
      
      setProdutosAtivos(ativosOnly.length);
      setAlugadosCount(ativosOnly.length);
      setAlugadosLista(ativosOnly);
      
      const statusResumo =
        contratos && contratos.length
          ? [...new Set(
              contratos
                .filter((c: any) => allowedStatusList.includes(String(c.status).toLowerCase()))
                .map((c: any) => c.status)
            )].join(", ")
          : "—";
      setContratoStatus(statusResumo || "—");
      setProximasCobrancasLista(
        pendentes.slice(0, 3).map((p: any) => {
          const s = p.vencimento;
          if (!s) return "—";
          const d = new Date(s);
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = d.getFullYear();
          return `${dd}/${mm}/${yy}`;
        }),
      );
      const alvo = ativosOnly[0] || null;
      if (alvo?.plano && alvo?.created_at) {
        const total = parseInt(String(alvo.plano).replace("m", "")) || 0;
        const start = new Date(alvo.created_at);
        const diffMonths =
          (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        const rest = Math.max(0, total - diffMonths);
        setMesesRestantes(String(rest));
      } else {
        setMesesRestantes("—");
      }
    };
    run();
  }, [user, authLoading]);

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
          <button 
            onClick={() => logout("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Bem-vindo{clientName ? `, ${clientName}` : ""}!</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Pagamentos em dia</p>
            <p className="mt-1 font-display text-2xl font-bold">{pagamentosEmDia}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Meses restantes</p>
            <p className="mt-1 font-display text-2xl font-bold">{mesesRestantes}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Próxima cobrança</p>
            <p className="mt-1 font-display text-2xl font-bold">{proximaCobranca}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            {accountApproved ? (
              <>
                <p className="text-sm text-muted-foreground">Status da conta</p>
                <p className="mt-1 font-display text-2xl font-bold text-green-600">Aprovado</p>
                <Link to="/cliente/pagamentos" className="mt-2 inline-block text-xs text-primary hover:underline">
                  Ver pagamentos
                </Link>
              </>
            ) : produtosAtivos > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">Produtos ativos</p>
                <p className="mt-1 font-display text-2xl font-bold">{produtosAtivos}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Status da conta</p>
                <p className="mt-1 font-display text-2xl font-bold text-yellow-600">Em análise</p>
                <Link to="/cliente/documentos" className="mt-2 inline-block text-xs text-primary hover:underline">
                  Envie seus documentos
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Produtos alugados</p>
            <p className="mt-1 font-display text-2xl font-bold">{alugadosCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Status contrato</p>
            <p className="mt-1 font-display text-2xl font-bold">{contratoStatus}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Próximas cobranças</p>
            <div className="mt-2 space-y-1 text-sm">
              {proximasCobrancasLista.length ? (
                proximasCobrancasLista.map((d, i) => <div key={i}>{d}</div>)
              ) : (
                <div>—</div>
              )}
            </div>
          </div>
        </div>

        {/* Aluguéis */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">Produtos alugados</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {alugadosLista.length > 0 ? (
              alugadosLista.map((item, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-display font-semibold">{item.produto}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ["ativo", "aprovado"].includes(String(item.status).toLowerCase()) 
                            ? "bg-green-100 text-green-700" 
                            : String(item.status).toLowerCase() === "rejeitado" 
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>Plano: {item.plano || "—"}</p>
                        <p>Status: <span className="capitalize">{item.status}</span></p>
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
                  <button 
                    onClick={() => {
                      setSelectedRental(item);
                      setIsModalOpen(true);
                    }}
                    className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Ver detalhes do aluguel
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Nenhum aluguel encontrado. Assim que seu contrato for aprovado, os aluguéis aparecerão aqui.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes do Aluguel */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Detalhes do Aluguel</DialogTitle>
            <DialogDescription>
              Informações completas sobre seu contrato de locação.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRental && (
            <div className="mt-4 space-y-6">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/20 p-4">
                {selectedRental.image_url ? (
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-background shadow-sm">
                    <img 
                      src={selectedRental.image_url} 
                      alt={selectedRental.produto} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                    <Package size={32} />
                  </div>
                )}
                <div>
                  <h4 className="font-display font-bold text-foreground">{selectedRental.produto}</h4>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ["ativo", "aprovado"].includes(String(selectedRental.status).toLowerCase()) 
                      ? "bg-green-100 text-green-700" 
                      : String(selectedRental.status).toLowerCase() === "rejeitado" 
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {selectedRental.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag size={14} />
                    <span>Plano</span>
                  </div>
                  <p className="text-sm font-medium">{selectedRental.plano || "—"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={14} />
                    <span>Início do Contrato</span>
                  </div>
                  <p className="text-sm font-medium">
                    {selectedRental.created_at ? new Date(selectedRental.created_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield size={14} />
                    <span>Status de Verificação</span>
                  </div>
                  <p className="text-sm font-medium capitalize">{selectedRental.status}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText size={14} />
                    <span>ID do Contrato</span>
                  </div>
                  <p className="text-sm font-medium text-xs font-mono">{selectedRental.id || "—"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Fechar Detalhes
                </Button>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate("/cliente/suporte");
                  }}
                  className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Precisa de ajuda com este aluguel? Fale com o suporte
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
