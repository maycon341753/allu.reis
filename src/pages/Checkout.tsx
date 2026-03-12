import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [plano, setPlano] = useState("24m");
  const [nascimento, setNascimento] = useState("");
  const [cupom, setCupom] = useState("");
  const precoBase = product?.preco_mensal ?? 0;
  const desconto = cupom === "CUPOM10" ? Math.round(precoBase * 0.1 * 100) / 100 : 0;
  const total = Math.max(0, Math.round((precoBase - desconto) * 100) / 100);
  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    let out = "";
    if (p1) out = p1;
    if (p2) out = `${p1}.${p2}`;
    if (p3) out = `${p1}.${p2}.${p3}`;
    if (p4) out = `${p1}.${p2}.${p3}-${p4}`;
    return out;
  };
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const { data } = await supabase.from("products").select("id, nome, categoria, image_url, preco_mensal").eq("id", id).maybeSingle();
      setProduct(data || null);
    };
    run();
  }, [id]);

  const goToAddress = async () => {
    if (!product) return;
    if (!nome || !cpf || !email || !telefone || !nascimento) return;
    const info = {
      nome,
      cpf: onlyDigits(cpf),
      email,
      telefone,
      nascimento,
      plano,
      cupom,
      total,
    };
    try {
      localStorage.setItem("checkoutInfo", JSON.stringify(info));
    } catch {}
    navigate(`/checkout/${id}/endereco`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Preencha os dados para o contrato de assinatura</p>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Produto</h2>
              {product ? (
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-md bg-secondary">
                    <img src={product.image_url || "/assets/placeholder.png"} alt={product.nome} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium">{product.nome}</p>
                    <p className="text-sm text-muted-foreground">{product.categoria}</p>
                    <p className="mt-1 text-sm">Mensal: {product.preco_mensal != null ? `R$ ${product.preco_mensal}` : "—"}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-muted-foreground">Carregando...</p>
              )}

              <div className="mt-6">
                <Label>Plano</Label>
                <Select value={plano} onValueChange={setPlano}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12m">12 meses</SelectItem>
                    <SelectItem value="24m">24 meses</SelectItem>
                    <SelectItem value="36m">36 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Dados do contrato</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="ck_nome">Nome completo</Label>
                  <Input id="ck_nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="ck_cpf">CPF</Label>
                  <Input id="ck_cpf" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="ck_nasc">Data de nascimento</Label>
                  <Input id="ck_nasc" placeholder="dd/mm/aaaa" value={nascimento} onChange={(e) => setNascimento(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="ck_email">E-mail</Label>
                  <Input id="ck_email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="ck_tel">Telefone</Label>
                  <Input id="ck_tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={goToAddress} disabled={loading || !product}>
                Ir para endereço
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Resumo</h2>
              {product && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-md bg-secondary">
                      <img src={product.image_url || "/assets/placeholder.png"} alt={product.nome} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{product.nome}</p>
                      <p className="text-sm text-muted-foreground">Plano de fidelidade: {plano.replace("m", " meses")}</p>
                      <p className="text-sm text-muted-foreground">Pagamento: Mensal</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Entrega</span>
                    <span className="text-sm">até 10 dias úteis</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm">{precoBase ? `R$ ${precoBase}/mês` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cupom</span>
                    <div className="flex gap-2">
                      <Input value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="Adicionar cupom" />
                      <Button variant="outline">Aplicar</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{total ? `R$ ${total}/mês` : "—"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
