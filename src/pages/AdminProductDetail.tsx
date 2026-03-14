import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  CreditCard, FolderOpen, ShieldCheck, Headphones,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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

export default function AdminProductDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [p, setP] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<string>("Ativo");
  const [preco12, setPreco12] = useState("");
  const [preco24, setPreco24] = useState("");
  const [preco36, setPreco36] = useState("");
  const [precoMensal, setPrecoMensal] = useState("");
  const [estoqueTotal, setEstoqueTotal] = useState("");
  const [estoqueDisp, setEstoqueDisp] = useState("");
  const [gallery, setGallery] = useState<Array<{ id: string; image_url: string; principal: boolean }>>([]);
  const [gFile, setGFile] = useState<File | null>(null);
  const [gUploading, setGUploading] = useState(false);
  const [specs, setSpecs] = useState<Array<{ id: string; name: string; value: string }>>([]);
  const [specName, setSpecName] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [permitirBoleto, setPermitirBoleto] = useState(true);
  const [valorMaxBoleto, setValorMaxBoleto] = useState("");
  const [devices, setDevices] = useState<Array<{ id: string; serial: string; status: string }>>([]);
  const [devSerial, setDevSerial] = useState("");
  const [devStatus, setDevStatus] = useState("disponivel");
  const [logs, setLogs] = useState<Array<{ id: string; acao: string; descricao?: string; data: string }>>([]);

  useEffect(() => {
    const run = async () => {
      if (authLoading || !user || !id || isAdmin !== true) return;

      setLoading(true);
      try {
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select("id, nome, categoria, marca, modelo, descricao, preco12, preco24, preco36, preco_mensal, estoque_total, estoque_disponivel, status, image_url, created_at")
          .eq("id", id)
          .maybeSingle();

        if (prodError) {
          console.error("Erro ao buscar produto:", prodError);
          toast({ title: "Erro ao carregar produto", description: "Verifique se a tabela products possui todas as colunas (preco12, etc)." });
        }

        if (prod) {
          setP(prod);
          setNome(prod.nome || "");
          setCategoria(prod.categoria || "");
          setMarca(prod.marca || "");
          setModelo(prod.modelo || "");
          setDescricao(prod.descricao || "");
          setStatus(prod.status || "Ativo");
          setPreco12(formatBRL(String(prod.preco12 ?? "")));
          setPreco24(formatBRL(String(prod.preco24 ?? "")));
          setPreco36(formatBRL(String(prod.preco36 ?? "")));
          setPrecoMensal(formatBRL(String(prod.preco_mensal ?? "")));
          setEstoqueTotal(String(prod.estoque_total ?? ""));
          setEstoqueDisp(String(prod.estoque_disponivel ?? ""));
        }
        const { data: imgs } = await supabase
          .from("product_images")
          .select("id, image_url, principal")
          .eq("product_id", id)
          .order("principal", { descending: true });
        setGallery(imgs || []);
        const { data: sp } = await supabase
          .from("product_specs")
          .select("id, spec_name, spec_value")
          .eq("product_id", id);
        setSpecs((sp || []).map((s: any) => ({ id: s.id, name: s.spec_name, value: s.spec_value })));
        const { data: rules } = await supabase
          .from("product_rules")
          .select("permitir_boleto, valor_maximo_boleto")
          .eq("product_id", id)
          .maybeSingle();
        setPermitirBoleto(!!rules?.permitir_boleto ?? true);
        setValorMaxBoleto(formatBRL(String(rules?.valor_maximo_boleto ?? "")));
        const { data: dev } = await supabase
          .from("product_devices")
          .select("id, serial, status")
          .eq("product_id", id)
          .order("created_at", { descending: true });
        setDevices(dev || []);
        const { data: lg } = await supabase
          .from("product_logs")
          .select("id, acao, descricao, data")
          .eq("product_id", id)
          .order("data", { descending: true })
          .limit(100);
        setLogs(lg || []);
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
  }, [id, user, authLoading, isAdmin, navigate]);

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
    if (n == null) return null;
    return Math.round(n * 100) / 100;
  };
  const fmtDate = (s?: string | null) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    } catch {
      return String(s);
    }
  };
  const logAction = async (acao: string, descricao?: string) => {
    if (!id) return;
    await supabase.from("product_logs").insert({ product_id: id, acao, descricao, data: new Date().toISOString() });
  };

  const saveBasics = async () => {
    if (!id) return;
    const { error } = await supabase
      .from("products")
      .update({ nome, categoria, marca, modelo, descricao, status })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Informações atualizadas" });
      await logAction("Atualização", "Informações básicas");
    }
  };
  const savePrices = async () => {
    if (!id) return;
    const p12 = parseBRL(preco12);
    const p24 = parseBRL(preco24);
    const p36 = parseBRL(preco36);
    const pm = parseBRL(precoMensal);
    const { error } = await supabase
      .from("products")
      .update({ preco12: p12, preco24: p24, preco36: p36, preco_mensal: pm })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Preços atualizados" });
      await logAction("Atualização", "Preços");
      const { data: prod } = await supabase
        .from("products")
        .select("preco12, preco24, preco36, preco_mensal")
        .eq("id", id)
        .maybeSingle();
      if (prod) {
        setPreco12(formatBRL(String(prod.preco12 ?? "")));
        setPreco24(formatBRL(String(prod.preco24 ?? "")));
        setPreco36(formatBRL(String(prod.preco36 ?? "")));
        setPrecoMensal(formatBRL(String(prod.preco_mensal ?? "")));
      }
    }
  };
  const saveStock = async () => {
    if (!id) return;
    const total = parseInt(estoqueTotal || "0", 10);
    const disp = parseInt(estoqueDisp || "0", 10);
    const { error } = await supabase
      .from("products")
      .update({ estoque_total: total, estoque_disponivel: disp })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Estoque atualizado" });
      await logAction("Atualização", "Estoque");
    }
  };
  const addImage = async () => {
    if (!id || !gFile) return;
    try {
      setGUploading(true);
      const ext = gFile.name.split(".").pop();
      const path = `${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, gFile, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const url = urlData.publicUrl;
      const { data, error } = await supabase
        .from("product_images")
        .insert({ product_id: id, image_url: url, principal: false })
        .select("*")
        .single();
      if (error) throw error;
      setGallery((g) => [{ id: data.id, image_url: url, principal: false }, ...g]);
      setGFile(null);
      toast({ title: "Imagem adicionada" });
      await logAction("Imagem", "Imagem adicionada");
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e?.message || "Tente novamente" });
    } finally {
      setGUploading(false);
    }
  };
  const setPrincipal = async (imgId: string) => {
    if (!id) return;
    const prev = gallery.slice();
    setGallery((g) => g.map((x) => ({ ...x, principal: x.id === imgId })));
    const target = gallery.find((i) => i.id === imgId);
    const { error } = await supabase
      .from("product_images")
      .update({ principal: true })
      .eq("id", imgId);
    if (!error && target) {
      await supabase.from("product_images").update({ principal: false }).eq("product_id", id).neq("id", imgId);
      await supabase.from("products").update({ image_url: target.image_url }).eq("id", id);
      await logAction("Imagem", "Principal atualizada");
    } else {
      setGallery(prev);
    }
  };
  const addSpec = async () => {
    if (!id || !specName || !specValue) return;
    const { data, error } = await supabase
      .from("product_specs")
      .insert({ product_id: id, spec_name: specName, spec_value: specValue })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Erro ao adicionar especificação", description: error.message });
      return;
    }
    setSpecs((s) => [...s, { id: data.id, name: data.spec_name, value: data.spec_value }]);
    setSpecName("");
    setSpecValue("");
    await logAction("Especificação", "Adicionada");
  };
  const removeSpec = async (specId: string) => {
    const prev = specs.slice();
    setSpecs((s) => s.filter((x) => x.id !== specId));
    const { error } = await supabase.from("product_specs").delete().eq("id", specId);
    if (error) {
      setSpecs(prev);
    } else {
      await logAction("Especificação", "Removida");
    }
  };
  const saveRules = async () => {
    if (!id) return;
    const max = parseBRL(valorMaxBoleto);
    const { error } = await supabase
      .from("product_rules")
      .upsert({ product_id: id, permitir_boleto: permitirBoleto, valor_maximo_boleto: max }, { onConflict: "product_id" });
    if (error) {
      toast({ title: "Erro ao salvar regras", description: error.message });
    } else {
      toast({ title: "Regras atualizadas" });
      await logAction("Regras", "Atualizadas");
    }
  };
  const addDevice = async () => {
    if (!id || !devSerial) return;
    const { data, error } = await supabase
      .from("product_devices")
      .insert({ product_id: id, serial: devSerial, status: devStatus })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Erro ao adicionar equipamento", description: error.message });
      return;
    }
    setDevices((d) => [{ id: data.id, serial: data.serial, status: data.status }, ...d]);
    setDevSerial("");
    setDevStatus("disponivel");
    await logAction("Equipamento", "Adicionado");
  };
  const setDeviceStatus = async (devId: string, status: string) => {
    const prev = devices.slice();
    setDevices((d) => d.map((x) => (x.id === devId ? { ...x, status } : x)));
    const { error } = await supabase.from("product_devices").update({ status }).eq("id", devId);
    if (error) {
      setDevices(prev);
    } else {
      await logAction("Equipamento", `Status: ${status}`);
    }
  };
  const removeDevice = async (devId: string) => {
    const prev = devices.slice();
    setDevices((d) => d.filter((x) => x.id !== devId));
    const { error } = await supabase.from("product_devices").delete().eq("id", devId);
    if (error) {
      setDevices(prev);
    } else {
      await logAction("Equipamento", "Removido");
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
            <h1 className="font-display text-2xl font-bold">Produto</h1>
            <p className="mt-1 text-muted-foreground">Detalhes e configuração</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>Recarregar</Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Informações básicas</p>
            <div className="mt-3 grid gap-3">
              <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" /></div>
              <div><Label>Categoria</Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Celular">Celular</SelectItem>
                    <SelectItem value="Smartwatch">Smartwatch</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Notebook">Notebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Marca</Label><Input value={marca} onChange={(e) => setMarca(e.target.value)} className="mt-1" /></div>
              <div><Label>Modelo</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} className="mt-1" /></div>
              <div><Label>Descrição</Label><textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} /></div>
              <div><Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Fora de estoque">Fora de estoque</SelectItem>
                    <SelectItem value="Indisponível">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="mt-2" onClick={saveBasics}>Salvar informações</Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Preços de assinatura</p>
            <div className="mt-3 grid gap-3">
              <div>
                <Label>12 meses</Label>
                <Input
                  value={preco12}
                  onChange={(e) => setPreco12(normalizeTyping(e.target.value))}
                  onFocus={(e) => {
                    const n = toNumberFromBR(e.target.value);
                    if (n != null) {
                      if (n === 0) setPreco12("");
                      else setPreco12(n.toFixed(2).replace(".", ","));
                    }
                    setTimeout(() => {
                      try {
                        (e.target as HTMLInputElement).select();
                      } catch {}
                    }, 0);
                  }}
                  onBlur={() => {
                    if (!preco12.trim()) setPreco12("");
                    else setPreco12(formatBRL(preco12));
                  }}
                  placeholder="R$ 0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>24 meses</Label>
                <Input
                  value={preco24}
                  onChange={(e) => setPreco24(normalizeTyping(e.target.value))}
                  onFocus={(e) => {
                    const n = toNumberFromBR(e.target.value);
                    if (n != null) {
                      if (n === 0) setPreco24("");
                      else setPreco24(n.toFixed(2).replace(".", ","));
                    }
                    setTimeout(() => {
                      try {
                        (e.target as HTMLInputElement).select();
                      } catch {}
                    }, 0);
                  }}
                  onBlur={() => {
                    if (!preco24.trim()) setPreco24("");
                    else setPreco24(formatBRL(preco24));
                  }}
                  placeholder="R$ 0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>36 meses</Label>
                <Input
                  value={preco36}
                  onChange={(e) => setPreco36(normalizeTyping(e.target.value))}
                  onFocus={(e) => {
                    const n = toNumberFromBR(e.target.value);
                    if (n != null) {
                      if (n === 0) setPreco36("");
                      else setPreco36(n.toFixed(2).replace(".", ","));
                    }
                    setTimeout(() => {
                      try {
                        (e.target as HTMLInputElement).select();
                      } catch {}
                    }, 0);
                  }}
                  onBlur={() => {
                    if (!preco36.trim()) setPreco36("");
                    else setPreco36(formatBRL(preco36));
                  }}
                  placeholder="R$ 0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Mensal padrão</Label>
                <Input
                  value={precoMensal}
                  onChange={(e) => setPrecoMensal(normalizeTyping(e.target.value))}
                  onFocus={(e) => {
                    const n = toNumberFromBR(e.target.value);
                    if (n != null) {
                      if (n === 0) setPrecoMensal("");
                      else setPrecoMensal(n.toFixed(2).replace(".", ","));
                    }
                    setTimeout(() => {
                      try {
                        (e.target as HTMLInputElement).select();
                      } catch {}
                    }, 0);
                  }}
                  onBlur={() => {
                    if (!precoMensal.trim()) setPrecoMensal("");
                    else setPrecoMensal(formatBRL(precoMensal));
                  }}
                  placeholder="R$ 0,00"
                  className="mt-1"
                />
              </div>
              <Button className="mt-2" onClick={savePrices}>Salvar preços</Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Imagens</p>
            <div className="mt-3">
              <input type="file" accept="image/*" onChange={(e) => setGFile(e.target.files?.[0] ?? null)} />
              <div className="mt-2 flex gap-2">
                <Button disabled={gUploading || !gFile} onClick={addImage}>Enviar</Button>
                <Button variant="outline" disabled={gUploading || !gFile} onClick={() => setGFile(null)}>Limpar</Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {gallery.map((img) => (
                  <div key={img.id} className="rounded-lg border border-border p-2">
                    <img src={img.image_url} alt="" className="h-24 w-full object-cover rounded-md" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{img.principal ? "Principal" : "Galeria"}</span>
                      {!img.principal && <Button size="sm" variant="outline" onClick={() => setPrincipal(img.id)}>Tornar principal</Button>}
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <div className="text-sm text-muted-foreground">Sem imagens</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Estoque</p>
            <div className="mt-3 grid gap-3">
              <div><Label>Total</Label><Input value={estoqueTotal} onChange={(e) => setEstoqueTotal(e.target.value)} className="mt-1" /></div>
              <div><Label>Disponível</Label><Input value={estoqueDisp} onChange={(e) => setEstoqueDisp(e.target.value)} className="mt-1" /></div>
              <Button className="mt-2" onClick={saveStock}>Salvar estoque</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Especificações</p>
            <div className="mt-3 grid gap-3">
              <div><Label>Nome</Label><Input value={specName} onChange={(e) => setSpecName(e.target.value)} className="mt-1" /></div>
              <div><Label>Valor</Label><Input value={specValue} onChange={(e) => setSpecValue(e.target.value)} className="mt-1" /></div>
              <Button className="mt-2" onClick={addSpec}>Adicionar</Button>
              <div className="mt-3 space-y-2 max-h-[240px] overflow-auto">
                {specs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                    <span className="text-sm">{s.name}: {s.value}</span>
                    <Button size="sm" variant="destructive" onClick={() => removeSpec(s.id)}>Remover</Button>
                  </div>
                ))}
                {specs.length === 0 && <div className="text-sm text-muted-foreground">Sem especificações</div>}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Regras</p>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Permitir boleto</span>
                <Switch checked={permitirBoleto} onCheckedChange={setPermitirBoleto} />
              </div>
              <div><Label>Valor máximo boleto</Label><Input value={valorMaxBoleto} onChange={(e) => setValorMaxBoleto(formatBRL(e.target.value))} className="mt-1" placeholder="R$ 0,00" /></div>
              <Button className="mt-2" onClick={saveRules}>Salvar regras</Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Equipamentos (IMEI/serial)</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2"><Label>Serial/IMEI</Label><Input value={devSerial} onChange={(e) => setDevSerial(e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Status</Label>
                <Select value={devStatus} onValueChange={(v) => setDevStatus(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">disponivel</SelectItem>
                    <SelectItem value="alugado">alugado</SelectItem>
                    <SelectItem value="manutencao">manutencao</SelectItem>
                    <SelectItem value="indisponivel">indisponivel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3"><Button onClick={addDevice}>Adicionar equipamento</Button></div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[560px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serial/IMEI</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{d.serial || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs">{d.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" onClick={() => setDeviceStatus(d.id, "disponivel")}>Disponível</Button>
                          <Button size="sm" variant="outline" onClick={() => setDeviceStatus(d.id, "manutencao")}>Manutenção</Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeviceStatus(d.id, "indisponivel")}>Indisponível</Button>
                          <Button size="sm" variant="outline" onClick={() => removeDevice(d.id)}>Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {devices.length === 0 && (
                    <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={3}>Nenhum equipamento</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Histórico de alterações</p>
            <div className="mt-3 space-y-2 max-h-[280px] overflow-auto">
              {logs.map((l) => (
                <div key={l.id} className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">{fmtDate(l.data)} · {l.acao}</div>
                  <div className="mt-1 text-sm">{l.descricao || ""}</div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-sm text-muted-foreground">Sem alterações</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}