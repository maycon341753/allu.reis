import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import AdminSidebarMobile from "@/components/responsive/AdminSidebarMobile";

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

type ContractRow = {
  id: string;
  cliente: string;
  cliente_cpf?: string;
  produto: string;
  plano: string;
  valor_mensal: string;
  status: "Ativo" | "Pendente" | "Encerrado" | "Em análise";
  user_id?: string | null;
};

export default function AdminContracts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);
  const [edit, setEdit] = useState<ContractRow & { contractText: string }>({
    id: "",
    cliente: "",
    produto: "",
    plano: "",
    valor_mensal: "",
    status: "Pendente",
    contractText: "",
  });

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user || isAdmin !== true) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contratos")
          .select("id, cliente, produto, plano, valor, status, user_id, cliente_cpf, created_at")
          .order("created_at", { descending: true })
          .limit(100);
        if (!error) {
          setRows(
            (data || []).map((d: any) => ({
              id: d.id || "",
              cliente: d.cliente || "",
              produto: d.produto || "",
              plano: d.plano || "",
              valor_mensal: d.valor != null ? String(d.valor) : "",
              status: (d.status as ContractRow["status"]) || "Em análise",
              user_id: d.user_id ?? null,
              cliente_cpf: d.cliente_cpf || "",
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    run();

    if (!authLoading && user && isAdmin === false) {
      navigate("/cliente");
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, isAdmin, navigate]);

  const closeContract = async (row: ContractRow) => {
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: "Encerrado" } : x)));
    const { error } = await supabase.from("contratos").update({ status: "Encerrado" }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível encerrar", description: error.message });
    } else {
      toast({ title: "Contrato encerrado" });
    }
  };
  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };
  const generateContractText = (c: ContractRow) => {
    const empresa = "allu.reis";
    const cnpj = "39.433.448/0001-34";
    return [
      "CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS ELETRÔNICOS",
      "",
      `LOCADORA: ${empresa}, inscrita no CNPJ nº ${cnpj}.`,
      `LOCATÁRIO: ${c.cliente}.`,
      "",
      `OBJETO: Locação do produto ${c.produto}, plano ${c.plano}, pelo valor mensal de ${c.valor_mensal}.`,
      "VIGÊNCIA: Conforme plano contratado, iniciando na data de assinatura.",
      "PAGAMENTO: Mensal, até a data acordada; atraso implica multa de 2%, juros de 1% ao mês e correção.",
      "USO E CUIDADOS: O locatário deve zelar pelo equipamento; vedada a cessão, sublocação ou uso indevido.",
      "ROUBO, FURTO E PERDA: Em caso de roubo/furto, o locatário deve registrar boletim de ocorrência em até 24h e comunicar a locadora. O locatário é responsável pelos valores decorrentes, inclusive franquias, dedutíveis, reposição do equipamento e taxas administrativas, sem prejuízo das mensalidades até a restituição/regularização.",
      "DANOS: Danos, avarias e mau uso são de responsabilidade do locatário, devendo arcar com reparo ou substituição.",
      "SEGURO: Opcional, quando disponível; não elimina dedutíveis, franquias e responsabilidades previstas.",
      "MANUTENÇÃO: Preventiva e corretiva conforme política da locadora; agendamento e logística conforme instruções.",
      "RESTITUIÇÃO: Ao término, o equipamento deve ser devolvido em condições normais de uso; perdas implicam cobrança.",
      "RESCISÃO: A locadora poderá rescindir por inadimplência, mau uso ou violação contratual, sem prejuízo de cobranças.",
      "INADIMPLÊNCIA: Autoriza negativação, cobrança e medidas judiciais; o locatário responde por custas e honorários.",
      "DADOS PESSOAIS: Tratamento conforme LGPD; finalidade vinculada à prestação dos serviços de locação.",
      "FORO: Comarca da sede da locadora.",
      "",
      "Assinaturas:",
      "LOCADORA __________________________",
      "LOCATÁRIO _________________________",
    ].join("\n");
  };
  const formatDateBR = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };
  const fetchCpfByName = async (name: string) => {
    if (!name) return "";
    const { data } = await supabase.from("profiles").select("cpf").eq("full_name", name).maybeSingle();
    return data?.cpf ? String(data.cpf) : "";
  };
  const fetchCpfByUserId = async (uid?: string | null) => {
    if (!uid) return "";
    const { data } = await supabase.from("profiles").select("cpf").eq("id", uid).maybeSingle();
    return data?.cpf ? String(data.cpf) : "";
  };
  const getContractBase = async () => {
    const { data } = await supabase.from("settings").select("contract_base").eq("id", "global").maybeSingle();
    return data?.contract_base as string | undefined;
  };
  const fillContractTemplate = (base: string, name: string, cpf: string, dateStr: string) => {
    const cpfFmt =
      cpf && cpf.length === 11 ? `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}` : cpf || "—";
    let text = base;
    text = text.replace(
      /(\*\*CONTRATANTE \(LOCATÁRIO\):\*\s*\n)/i,
      `$1Nome: ${name || "—"}\nCPF: ${cpfFmt}\n`,
    );
    text = text.replace(/Data da contratação:\s*.*$/im, `Data da contratação: ${dateStr}`);
    return text;
  };
  const downloadContract = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const printContract = (title: string, content: string) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 32px; line-height: 1.6; color: #111; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            pre { white-space: pre-wrap; word-wrap: break-word; font: inherit; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .brand { font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">allu.reis</div>
            <div>${new Date().toLocaleString()}</div>
          </div>
          <pre>${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>`;
    w.document.write(html);
    w.document.close();
  };
  const saveContract = async () => {
    const { error } = await supabase
      .from("contratos")
      .update({
        cliente: edit.cliente,
        produto: edit.produto,
        plano: edit.plano,
        valor: edit.valor_mensal,
        status: edit.status,
      })
      .eq("id", edit.id);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message });
    } else {
      setRows((r) =>
        r.map((x) =>
          x.id === edit.id
            ? { ...x, cliente: edit.cliente, produto: edit.produto, plano: edit.plano, valor_mensal: edit.valor_mensal, status: edit.status }
            : x,
        ),
      );
      toast({ title: "Contrato atualizado" });
      setEditOpen(false);
    }
  };

  const updateContractStatus = async (id: string, newStatus: ContractRow["status"]) => {
    const { error } = await supabase
      .from("contratos")
      .update({ status: newStatus })
      .eq("id", id);
    
    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message });
    } else {
      setRows((r) => r.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
      toast({ title: `Contrato definido como ${newStatus}` });
      setViewOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 flex-col surface-dark md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold text-surface-dark-foreground">Admin</span>
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
          <button 
            onClick={() => logout("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 pb-16">
        <div className="md:hidden mb-6">
          <AdminSidebarMobile />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Contratos</h1>
            <p className="mt-1 text-muted-foreground">Acompanhe e gerencie contratos de locação</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-x-auto hidden md:block">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mensal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.produto}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.plano}</td>
                  <td className="px-4 py-3">{formatBRL(row.valor_mensal)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Ativo"
                        ? "bg-primary/10 text-primary"
                        : (row.status === "Pendente" || row.status === "Em análise")
                        ? "bg-yellow-500/10 text-yellow-600"
                        : "bg-secondary text-foreground"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedContract(row);
                          setViewOpen(true);
                        }}
                      >
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEdit({
                            ...row,
                            contractText: generateContractText(row),
                          });
                          setEditOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" onClick={() => closeContract(row)}>Encerrar</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEdit({
                            ...row,
                            contractText: generateContractText(row),
                          });
                          setEditOpen(true);
                        }}
                      >
                        Editar contrato
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    {loading ? "Carregando..." : "Nenhum contrato encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
            {rows
                .map((row) => (
                <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="font-semibold">{row.cliente}</div>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.status === "Ativo"
                            ? "bg-primary/10 text-primary"
                            : (row.status === "Pendente" || row.status === "Em análise")
                            ? "bg-yellow-500/10 text-yellow-600"
                            : "bg-secondary text-foreground"
                        }`}>
                            {row.status}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {row.produto} • {row.plano}
                    </div>
                    <div className="font-medium text-lg">
                        {formatBRL(row.valor_mensal)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                                setSelectedContract(row);
                                setViewOpen(true);
                            }}
                        >
                            Ver
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                                setEdit({
                                    ...row,
                                    contractText: generateContractText(row),
                                });
                                setEditOpen(true);
                            }}
                        >
                            Editar
                        </Button>
                        <Button size="sm" onClick={() => closeContract(row)} className="w-full">Encerrar</Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                setEdit({
                                ...row,
                                contractText: generateContractText(row),
                                });
                                setEditOpen(true);
                            }}
                        >
                            Contrato
                        </Button>
                    </div>
                </div>
            ))}
             {rows.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</div>
             )}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar contrato {edit.id}</DialogTitle>
              <DialogDescription>Atualize dados e gere o documento</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Input value={edit.cliente} onChange={(e) => setEdit({ ...edit, cliente: e.target.value })} placeholder="Cliente" />
              </div>
              <div>
                <Input value={edit.produto} onChange={(e) => setEdit({ ...edit, produto: e.target.value })} placeholder="Produto" />
              </div>
              <div>
                <Input value={edit.plano} onChange={(e) => setEdit({ ...edit, plano: e.target.value })} placeholder="Plano" />
              </div>
              <div>
                <Input value={edit.valor_mensal} onChange={(e) => setEdit({ ...edit, valor_mensal: e.target.value })} placeholder="Mensal" />
              </div>
                <div className="sm:col-span-2">
                  <Input value={edit.user_id || ""} onChange={(e) => setEdit({ ...edit, user_id: e.target.value })} placeholder="User ID (UUID do cliente)" />
                </div>
              <div className="sm:col-span-2">
                <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v as ContractRow["status"] })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Textarea rows={10} value={edit.contractText} onChange={(e) => setEdit({ ...edit, contractText: e.target.value })} placeholder="Conteúdo do contrato" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button
                  variant="success"
                  onClick={async () => {
                    const base = (await getContractBase()) || edit.contractText || generateContractText(edit);
                      const cpf = (await fetchCpfByUserId(edit.user_id)) || (await fetchCpfByName(edit.cliente));
                    const filled = fillContractTemplate(base, edit.cliente, cpf, formatDateBR(new Date()));
                    setEdit({ ...edit, contractText: filled });
                  }}
                >
                  Gerar contrato
                </Button>
                <Button onClick={() => downloadContract(`Contrato-${edit.id || "novo"}.txt`, edit.contractText)}>Baixar</Button>
                <Button onClick={() => printContract(`Contrato-${edit.id || "novo"}`, edit.contractText)}>PDF/Imprimir</Button>
                <Button variant="outline" onClick={saveContract}>Salvar alterações</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes do Contrato */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
              <DialogDescription>
                Revise as informações e altere o status do contrato.
              </DialogDescription>
            </DialogHeader>
            
            {selectedContract && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Cliente:</div>
                  <div className="font-medium">{selectedContract.cliente}</div>
                  <div className="text-muted-foreground">Produto:</div>
                  <div className="font-medium">{selectedContract.produto}</div>
                  <div className="text-muted-foreground">Plano:</div>
                  <div className="font-medium">{selectedContract.plano}</div>
                  <div className="text-muted-foreground">Valor Mensal:</div>
                  <div className="font-medium">{formatBRL(selectedContract.valor_mensal)}</div>
                  <div className="text-muted-foreground">Status Atual:</div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      selectedContract.status === "Ativo"
                        ? "bg-primary/10 text-primary"
                        : (selectedContract.status === "Pendente" || selectedContract.status === "Em análise")
                        ? "bg-yellow-500/10 text-yellow-600"
                        : "bg-secondary text-foreground"
                    }`}>
                      {selectedContract.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Ações de Status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button 
                      variant="success" 
                      onClick={() => updateContractStatus(selectedContract.id, "Ativo")}
                      className="w-full"
                    >
                      Aprovar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => updateContractStatus(selectedContract.id, "Encerrado")}
                      className="w-full"
                    >
                      Rejeitar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => updateContractStatus(selectedContract.id, "Em análise")}
                      className="w-full"
                    >
                      Em análise
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
