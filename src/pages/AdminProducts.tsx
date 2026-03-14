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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import AdminSidebarMobile from "@/components/responsive/AdminSidebarMobile";
import { Badge } from "@/components/ui/badge";

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

type ProductRow = {
  id: string;
  nome: string;
  categoria: string;
  preco_mensal: string;
  estoque: number;
  status: string;
  image_url?: string | null;
};

export default function AdminProducts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, requireAuth } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pNome, setPNome] = useState("");
  const [pCategoria, setPCategoria] = useState("");
  const [pMensal, setPMensal] = useState("");
  const [pEstoque, setPEstoque] = useState("");
  const [pStatus, setPStatus] = useState<ProductRow["status"]>("Ativo");
  const [pFile, setPFile] = useState<File | null>(null);
  const [pPreview, setPPreview] = useState<string | null>(null);
  const specOptions = [`Tela 6.1" OLED`, "Chip A17 Pro", "128GB", "Câmera 48MP", "5G"];
  const [pSpecs, setPSpecs] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [eId, setEId] = useState<string | null>(null);
  const [eNome, setENome] = useState("");
  const [eCategoria, setECategoria] = useState("");
  const [eMensal, setEMensal] = useState("");
  const [eEstoque, setEEstoque] = useState("");
  const [eStatus, setEStatus] = useState<ProductRow["status"]>("Ativo");
  const [qNome, setQNome] = useState("");
  const [qCategoria, setQCategoria] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qEstoqueMin, setQEstoqueMin] = useState("");

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!pFile) {
      setPPreview(null);
      return;
    }
    const url = URL.createObjectURL(pFile);
    setPPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pFile]);

  const toNumberFromBR = (v: string) => {
    const cleaned = v.replace(/\u00A0/g, " ").replace(/R\$/g, "").replace(/\s+/g, "");
    const simpleDecimal = cleaned.match(/^\d+(\.\d+)?$/);
    if (simpleDecimal) {
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    const s = cleaned
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const normalizeTyping = (v: string) => {
    const only = v.replace(/[^\d,]/g, "");
    const parts = only.split(",");
    if (parts.length <= 1) return only;
    return parts[0] + "," + parts.slice(1).join("").replace(/,/g, "");
  };
  const formatBRL = (v: string) => {
    const n = toNumberFromBR(v);
    if (n == null) return "";
    if (n === 0) return "";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };

  const parseBRL = (v: string) => {
    const n = toNumberFromBR(v);
    if (n == null) return 0;
    return Math.round(n * 100) / 100;
  };

  const openEdit = (row: ProductRow) => {
    setEId(row.id);
    setENome(row.nome);
    setECategoria(row.categoria);
    setEMensal(row.preco_mensal);
    setEEstoque(String(row.estoque));
    setEStatus(row.status);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!eId) return;
    if (!eNome || !eCategoria || !eMensal || !eEstoque) {
      toast({ title: "Preencha todos os campos" });
      return;
    }
    const price = parseBRL(eMensal);
    const stock = parseInt(eEstoque, 10);
    if (Number.isNaN(price) || Number.isNaN(stock)) {
      toast({ title: "Valores inválidos", description: "Verifique mensal e estoque" });
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({
        nome: eNome,
        categoria: eCategoria,
        preco_mensal: price,
        estoque: stock,
        status: eStatus,
      })
      .eq("id", eId);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message });
      return;
    }
    setRows((r) =>
      r.map((x) =>
        x.id === eId
          ? {
              ...x,
              nome: eNome,
              categoria: eCategoria,
              preco_mensal: eMensal,
              estoque: stock,
              status: eStatus,
            }
          : x
      )
    );
    toast({ title: "Produto atualizado" });
    setEditOpen(false);
    setEId(null);
  };

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user) return;
      
      // Verificar se é admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        navigate("/cliente");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .limit(100);
        if (!error && data) {
          setRows(
            data.map((d: any) => ({
              id: d.id || "",
              nome: d.nome || "",
              categoria: d.categoria || "",
              preco_mensal: d.preco_mensal != null ? String(d.preco_mensal) : "",
              estoque: Number(d.estoque ?? d.estoque_disponivel ?? 0),
              status: d.status || "Ativo",
              image_url: d.image_url ?? null,
            }))
          );
          setLoadError(null);
        } else {
          setRows([]);
          setLoadError(error?.message || "Falha ao carregar produtos");
        }
      } catch (e: any) {
        setRows([]);
        setLoadError(e?.message || "Erro inesperado ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const setStatus = async (row: ProductRow, status: ProductRow["status"]) => {
    const prev = rows.slice();
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status } : x)));
    const { error } = await supabase.from("products").update({ status }).eq("id", row.id);
    if (error) {
      setRows(prev);
      toast({ title: "Não foi possível atualizar", description: error.message });
    } else {
      toast({ title: "Status atualizado" });
    }
  };

  const uploadImage = async (row: ProductRow) => {
    if (!file) {
      toast({ title: "Selecione um arquivo" });
      return;
    }
    try {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${row.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
        upsert: true,
        cacheControl: "3600",
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = urlData.publicUrl;
      const { error: updErr } = await supabase.from("products").update({ image_url: url }).eq("id", row.id);
      if (updErr) throw updErr;
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, image_url: url } : x)));
      toast({ title: "Imagem atualizada" });
      setFile(null);
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e?.message || "Tente novamente" });
    } finally {
      setUploading(false);
    }
  };

  const createProduct = async () => {
    if (!pNome || !pCategoria || !pMensal || !pEstoque) {
      toast({ title: "Preencha todos os campos" });
      return;
    }
    const price = parseBRL(pMensal);
    const stock = parseInt(pEstoque, 10);
    if (Number.isNaN(price) || Number.isNaN(stock)) {
      toast({ title: "Valores inválidos", description: "Verifique mensal e estoque" });
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .insert({
        nome: pNome,
        categoria: pCategoria,
        preco_mensal: price,
        estoque: stock,
        status: pStatus,
        specs: pSpecs,
      })
      .select("id, nome, categoria, preco_mensal, estoque, status, image_url")
      .single();
    if (error) {
      toast({ title: "Não foi possível criar", description: error.message });
      return;
    }
    let imageUrl = data.image_url ?? null;
    if (pFile) {
      const ext = pFile.name.split(".").pop();
      const path = `${data.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, pFile, {
        upsert: true,
        cacheControl: "3600",
      });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
        const { error: updErr } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", data.id);
        if (updErr) {
          toast({ title: "Imagem atualizada localmente", description: "Coluna image_url pode faltar; rode admin_products_image.sql" });
        }
      }
    }
    const { data: fresh } = await supabase
      .from("products")
      .select("id, nome, categoria, preco_mensal, estoque, status, image_url")
      .eq("id", data.id)
      .maybeSingle();
    setRows((r) => [
      ...r,
      {
        id: fresh?.id ?? data.id,
        nome: fresh?.nome ?? data.nome,
        categoria: fresh?.categoria ?? data.categoria,
        preco_mensal: String(fresh?.preco_mensal ?? data.preco_mensal),
        estoque: Number((fresh?.estoque ?? data.estoque) ?? 0),
        status: (fresh?.status as ProductRow["status"]) ?? (data.status as ProductRow["status"]),
        image_url: fresh?.image_url ?? imageUrl ?? null,
      },
    ]);
    toast({ title: "Produto criado" });
    setCreateOpen(false);
    setPNome("");
    setPCategoria("");
    setPMensal("");
    setPEstoque("");
    setPStatus("Ativo");
    setPFile(null);
    setPSpecs([]);
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
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-16">
        <div className="flex items-center gap-4 mb-6">
          <AdminSidebarMobile />
          <div className="flex-1 flex items-center justify-between">
             <div>
               <h1 className="font-display text-2xl font-bold">Produtos</h1>
               <p className="mt-1 text-sm text-muted-foreground">Catálogo disponível para locação</p>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
               <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                 <DialogTrigger asChild>
                   <Button variant="success" size="sm">Novo</Button>
                 </DialogTrigger>
                 <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo produto</DialogTitle>
                  <DialogDescription>Preencha os dados para adicionar ao catálogo</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="np_nome">Nome</Label>
                    <Input id="np_nome" value={pNome} onChange={(e) => setPNome(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="np_categoria">Categoria</Label>
                    <Select value={pCategoria} onValueChange={(v) => setPCategoria(v)}>
                      <SelectTrigger id="np_categoria" className="mt-1">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Smartwatch">Smartwatch</SelectItem>
                        <SelectItem value="Celular">Celular</SelectItem>
                        <SelectItem value="Iphone">Iphone</SelectItem>
                        <SelectItem value="Tablets">Tablets</SelectItem>
                        <SelectItem value="Notebooks">Notebooks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="np_mensal">Mensal (R$)</Label>
                    <Input
                      id="np_mensal"
                      value={pMensal}
                      onChange={(e) => setPMensal(normalizeTyping(e.target.value))}
                      onFocus={(e) => {
                        const n = toNumberFromBR(e.target.value);
                        if (n != null) {
                          if (n === 0) setPMensal("");
                          else setPMensal(n.toFixed(2).replace(".", ","));
                        }
                        setTimeout(() => {
                          try {
                            (e.target as HTMLInputElement).select();
                          } catch {}
                        }, 0);
                      }}
                      onBlur={() => {
                        if (!pMensal.trim()) setPMensal("");
                        else setPMensal(formatBRL(pMensal));
                      }}
                      placeholder="R$ 0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="np_estoque">Estoque</Label>
                    <Input id="np_estoque" value={pEstoque} onChange={(e) => setPEstoque(e.target.value)} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Especificações</Label>
                    <Select onValueChange={(v) => setPSpecs((prev) => (prev.includes(v) ? prev : [...prev, v]))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione as especificações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tela</SelectLabel>
                          <SelectItem value={`Tela 6.1" OLED`}>Tela 6.1" OLED</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Chip</SelectLabel>
                          <SelectItem value="Chip A17 Pro">Chip A17 Pro</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Armazenamento</SelectLabel>
                          <SelectItem value="128GB">128GB</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Câmera</SelectLabel>
                          <SelectItem value="Câmera 48MP">Câmera 48MP</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Conectividade</SelectLabel>
                          <SelectItem value="5G">5G</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pSpecs.map((s) => (
                        <button
                          key={s}
                          className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                          onClick={() => setPSpecs((prev) => prev.filter((x) => x !== s))}
                          type="button"
                          aria-label={s}
                          title="Remover"
                        >
                          {s}
                          <span className="ml-1">×</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Status</Label>
                    <Select value={pStatus} onValueChange={(v) => setPStatus(v as ProductRow["status"])}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Indisponível">Indisponível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Imagem</Label>
                    <input type="file" accept="image/*" onChange={(e) => setPFile(e.target.files?.[0] ?? null)} className="mt-1" />
                    <div className="mt-2">
                      {pPreview ? (
                        <img src={pPreview} alt="Prévia da imagem" className="h-32 w-32 rounded-md object-cover border border-border" />
                      ) : (
                        <div className="h-32 w-32 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                          Prévia indisponível
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button onClick={createProduct}>Criar</Button>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
               </Dialog>
             </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Buscar por nome" value={qNome} onChange={(e) => setQNome(e.target.value)} />
          <Input placeholder="Categoria" value={qCategoria} onChange={(e) => setQCategoria(e.target.value)} />
          <Input placeholder="Status" value={qStatus} onChange={(e) => setQStatus(e.target.value)} />
          <Input placeholder="Estoque mínimo" value={qEstoqueMin} onChange={(e) => setQEstoqueMin(e.target.value)} />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
          {loadError && (
            <div className="p-4 text-sm text-red-600 border-b border-border">
              {loadError}
            </div>
          )}
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mensal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estoque</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => {
                  const nomeOk = !qNome || r.nome.toLowerCase().includes(qNome.toLowerCase());
                  const catOk = !qCategoria || r.categoria.toLowerCase().includes(qCategoria.toLowerCase());
                  const statusOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
                  const min = parseInt(qEstoqueMin || "0", 10);
                  const estoqueOk = Number.isNaN(min) ? true : r.estoque >= min;
                  return nomeOk && catOk && statusOk && estoqueOk;
                })
                .map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{row.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.categoria}</td>
                  <td className="px-4 py-3">{formatBRL(String(row.preco_mensal))}</td>
                  <td className="px-4 py-3">{row.estoque}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === "Ativo"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-foreground"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/produtos/${row.id}`} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">Detalhes/Editar</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                    {loading ? "Carregando..." : "Nenhum produto encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
             {rows
                .filter((r) => {
                  const nomeOk = !qNome || r.nome.toLowerCase().includes(qNome.toLowerCase());
                  const catOk = !qCategoria || r.categoria.toLowerCase().includes(qCategoria.toLowerCase());
                  const statusOk = !qStatus || r.status.toLowerCase().includes(qStatus.toLowerCase());
                  const min = parseInt(qEstoqueMin || "0", 10);
                  const estoqueOk = Number.isNaN(min) ? true : r.estoque >= min;
                  return nomeOk && catOk && statusOk && estoqueOk;
                })
                .map((row) => (
                <div key={row.id} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                   <div className="flex justify-between items-start">
                     <div className="flex gap-3">
                       {row.image_url && <img src={row.image_url} alt={row.nome} className="w-12 h-12 rounded object-cover bg-secondary" />}
                       <div>
                         <h3 className="font-medium text-base line-clamp-1">{row.nome}</h3>
                         <p className="text-sm text-muted-foreground">{row.categoria}</p>
                       </div>
                     </div>
                     <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "Ativo"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-foreground"
                      }`}>
                        {row.status}
                      </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/50">
                     <div>
                       <span className="text-xs text-muted-foreground block">Mensal</span>
                       {formatBRL(String(row.preco_mensal))}
                     </div>
                     <div>
                       <span className="text-xs text-muted-foreground block">Estoque</span>
                       {row.estoque}
                     </div>
                   </div>

                   <div className="pt-2 flex gap-2">
                     <Link to={`/admin/produtos/${row.id}`} className="flex-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center">
                       Detalhes/Editar
                     </Link>
                   </div>
                </div>
             ))}
             {!loading && rows.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
          </div>
        </div>
      </main>
      
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
            <DialogDescription>Atualize os dados do item</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ep_nome">Nome</Label>
              <Input id="ep_nome" value={eNome} onChange={(e) => setENome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="ep_categoria">Categoria</Label>
              <Select value={eCategoria} onValueChange={(v) => setECategoria(v)}>
                <SelectTrigger id="ep_categoria" className="mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Smartwatch">Smartwatch</SelectItem>
                  <SelectItem value="Celular">Celular</SelectItem>
                  <SelectItem value="Iphone">Iphone</SelectItem>
                  <SelectItem value="Tablets">Tablets</SelectItem>
                  <SelectItem value="Notebooks">Notebooks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ep_mensal">Mensal (R$)</Label>
              <Input
                id="ep_mensal"
                value={eMensal}
                onChange={(e) => setEMensal(normalizeTyping(e.target.value))}
                onFocus={(e) => {
                  const n = toNumberFromBR(e.target.value);
                  if (n != null) {
                    if (n === 0) setEMensal("");
                    else setEMensal(n.toFixed(2).replace(".", ","));
                  }
                  setTimeout(() => {
                    try {
                      (e.target as HTMLInputElement).select();
                    } catch {}
                  }, 0);
                }}
                onBlur={() => {
                  if (!eMensal.trim()) setEMensal("");
                  else setEMensal(formatBRL(eMensal));
                }}
                placeholder="R$ 0,00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ep_estoque">Estoque</Label>
              <Input id="ep_estoque" value={eEstoque} onChange={(e) => setEEstoque(e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Status</Label>
              <Select value={eStatus} onValueChange={(v) => setEStatus(v as ProductRow["status"])}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Indisponível">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={saveEdit}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
