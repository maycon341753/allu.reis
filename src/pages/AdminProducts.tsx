import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

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
  status: "Ativo" | "Indisponível";
  image_url?: string | null;
};

export default function AdminProducts() {
  const location = useLocation();
  const { toast } = useToast();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
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
  useEffect(() => {
    if (!pFile) {
      setPPreview(null);
      return;
    }
    const url = URL.createObjectURL(pFile);
    setPPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pFile]);
  const formatBRL = (v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) return "";
    const num = Number(digits) / 100;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  const parseBRL = (v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) return 0;
    return Number(digits) / 100;
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const demo: ProductRow[] = [
        { id: "#PR-1001", nome: "iPhone 15 Pro 128GB", categoria: "Celular", preco_mensal: "R$289,00", estoque: 12, status: "Ativo" },
        { id: "#PR-1002", nome: "MacBook Air M3 8/256", categoria: "Notebook", preco_mensal: "R$449,00", estoque: 5, status: "Ativo" },
        { id: "#PR-1003", nome: "Apple Watch Series 9", categoria: "Wearable", preco_mensal: "R$149,00", estoque: 0, status: "Indisponível" },
      ];
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, nome, categoria, preco_mensal, estoque, status, image_url")
          .limit(100);
        if (error || !data) {
          setRows(demo);
        } else {
          setRows(
            data.map((d: any) => ({
              id: d.id || "",
              nome: d.nome || "",
              categoria: d.categoria || "",
              preco_mensal: d.preco_mensal != null ? String(d.preco_mensal) : "",
              estoque: Number(d.estoque ?? 0),
              status: (d.status as ProductRow["status"]) || "Ativo",
              image_url: d.image_url ?? null,
            }))
          );
        }
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
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <LogOut size={18} /> Sair
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Produtos</h1>
            <p className="mt-1 text-muted-foreground">Catálogo disponível para locação</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="success">Novo produto</Button>
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
                    <Input id="np_categoria" value={pCategoria} onChange={(e) => setPCategoria(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="np_mensal">Mensal (R$)</Label>
                    <Input
                      id="np_mensal"
                      value={pMensal}
                      onChange={(e) => setPMensal(formatBRL(e.target.value))}
                      placeholder="R$ 0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="np_estoque">Estoque</Label>
                    <Input id="np_estoque" value={pEstoque} onChange={(e) => setPEstoque(e.target.value)} className="mt-1" />
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

        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mensal</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estoque</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.id}</td>
                  <td className="px-4 py-3">{row.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.categoria}</td>
                  <td className="px-4 py-3">{row.preco_mensal}</td>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">Ver</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Produto {row.id}</DialogTitle>
                            <DialogDescription>Detalhes do produto</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            {row.image_url ? (
                              <img src={row.image_url} alt={row.nome} className="h-32 w-32 rounded-md object-cover border border-border" />
                            ) : (
                              <div className="h-32 w-32 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                                Sem imagem
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Nome</span>
                              <span className="font-medium">{row.nome}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Categoria</span>
                              <span className="font-medium">{row.categoria}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Mensal</span>
                              <span className="font-medium">{row.preco_mensal}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Estoque</span>
                              <span className="font-medium">{row.estoque}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <span className="font-medium">{row.status}</span>
                            </div>
                            <div className="mt-3 space-y-2">
                              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                              <div className="flex gap-2">
                                <Button disabled={uploading || !file} onClick={() => uploadImage(row)}>Enviar imagem</Button>
                                <Button variant="outline" onClick={() => setFile(null)} disabled={uploading || !file}>Limpar</Button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button variant="success" onClick={() => setStatus(row, "Ativo")}>Ativar</Button>
                            <Button variant="destructive" onClick={() => setStatus(row, "Indisponível")}>Indisponibilizar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="success" size="sm" onClick={() => setStatus(row, "Ativo")}>Ativar</Button>
                      <Button variant="destructive" size="sm" onClick={() => setStatus(row, "Indisponível")}>Indisponibilizar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                    {loading ? "Carregando..." : "Nenhum produto encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
