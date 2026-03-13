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
  const [selectedPlan, setSelectedPlan] = useState<12 | 24 | 36>(24);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [plano, setPlano] = useState("24m");
  const [nascimento, setNascimento] = useState("");
  const [cupom, setCupom] = useState("");
  const [armazenamento, setArmazenamento] = useState<string>("");
  const [planDiscounts, setPlanDiscounts] = useState<{ 12: number; 24: number; 36: number }>({ 12: 0, 24: 60, 36: 100 });
  const precoBase = product?.preco_mensal ?? 0;
  const descontoCupom = cupom === "CUPOM10" ? Math.round(precoBase * 0.1 * 100) / 100 : 0;
  const descontoPlano = planDiscounts[selectedPlan] ?? 0;
  const precoAjustado = Math.max(0, Math.round((precoBase - descontoPlano) * 100) / 100);
  const total = Math.max(0, Math.round((precoAjustado - descontoCupom) * 100) / 100);
  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };
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
  const formatDate = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    const p1 = d.slice(0, 2);
    const p2 = d.slice(2, 4);
    const p3 = d.slice(4, 8);
    let out = "";
    if (p1) out = p1;
    if (p2) out = `${p1}/${p2}`;
    if (p3) out = `${p1}/${p2}/${p3}`;
    return out;
  };
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    const ddd = d.slice(0, 2);
    const nine = d.slice(2, 3);
    const p1 = d.length > 10 ? d.slice(3, 7) : d.slice(2, 6);
    const p2 = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
    let out = "";
    if (ddd) out = `(${ddd})`;
    if (d.length > 10) out = `(${ddd}) ${nine}${p1}${p2 ? "-" + p2 : ""}`;
    else if (p1) out = `(${ddd}) ${p1}${p2 ? "-" + p2 : ""}`;
    return out.trim();
  };
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("products")
        .select("id, nome, categoria, image_url, preco_mensal, preco12, preco24, preco36, descricao")
        .eq("id", id)
        .maybeSingle();
      let baseMonthly = data?.preco_mensal ?? null;
      // Fallback: se não houver preco_mensal, tentar pegar o menor preço da tabela auxiliar
      if (baseMonthly == null) {
        const { data: auxMin } = await supabase
          .from("product_pricing")
          .select("monthly_price")
          .eq("product_id", id)
          .order("monthly_price", { ascending: true })
          .limit(1);
        if (auxMin && auxMin.length) {
          const v = Number(auxMin[0]?.monthly_price ?? NaN);
          baseMonthly = isFinite(v) ? v : null;
        }
      }
      setProduct({
        ...data,
        preco_mensal: baseMonthly ?? 0,
      });
      const { data: specs } = await supabase
        .from("product_specs")
        .select("spec_name, spec_value")
        .eq("product_id", id);
      const arm = (specs || []).find((s: any) => String(s.spec_name).toLowerCase() === "armazenamento");
      setArmazenamento(arm?.spec_value || "");
      // Definir descontos com base nos preços configurados no Admin (products.preco12/24/36)
      const next = { 12: 0, 24: 0, 36: 0 } as { 12: number; 24: number; 36: number };
      const base = Number(baseMonthly ?? 0);
      const p12 = Number(data?.preco12 ?? NaN);
      const p24 = Number(data?.preco24 ?? NaN);
      const p36 = Number(data?.preco36 ?? NaN);
      if (isFinite(base)) {
        if (isFinite(p12)) next[12] = Math.max(0, Math.round((base - p12) * 100) / 100);
        if (isFinite(p24)) next[24] = Math.max(0, Math.round((base - p24) * 100) / 100);
        if (isFinite(p36)) next[36] = Math.max(0, Math.round((base - p36) * 100) / 100);
      }
      // Fallback: se não houver preços no products, tentar derivar via product_pricing (monthly_price)
      if (next[12] === 0 && next[24] === 0 && next[36] === 0) {
        const { data: aux } = await supabase
          .from("product_pricing")
          .select("months, monthly_price")
          .eq("product_id", id);
        if (aux && base) {
          aux.forEach((p: any) => {
            const m = Number(p.months);
            const mp = Number(p.monthly_price ?? NaN);
            if ((m === 12 || m === 24 || m === 36) && isFinite(mp)) {
              // @ts-ignore
              next[m] = Math.max(0, Math.round((base - mp) * 100) / 100);
            }
          });
        }
      }
      setPlanDiscounts(next);
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

          {/* Top product layout (similar ao exemplo) */}
          {product && (
            <div className="mt-10 grid gap-12 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl bg-secondary">
                <img src={product.image_url || "/assets/placeholder.png"} alt={product.nome} className="w-full aspect-square object-cover" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold md:text-4xl">{product.nome}</h2>
                <p className="mt-2 text-muted-foreground">{product.descricao || product.categoria || "Assinatura mensal de eletrônicos"}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-sm text-muted-foreground">Preço/mês</span>
                  <span className="font-display text-4xl font-bold">{formatBRL(precoAjustado)}</span>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Armazenamento:</p>
                  <div className="mt-2">
                    <button className="rounded-full border px-4 py-2 text-sm font-semibold">{armazenamento || "—"}</button>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Escolha o tempo de contrato:</p>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {[12, 24, 36].map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedPlan(m as 12 | 24 | 36);
                          setPlano(`${m}m`);
                        }}
                        className={`rounded-xl border-2 p-4 text-center transition-all ${
                          selectedPlan === m ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <span className="block text-sm">{m} meses</span>
                        <span className="block text-xs text-green-600">−{formatBRL(planDiscounts[m as 12 | 24 | 36])}/mês</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  className="mt-6 w-full"
                  onClick={() => {
                    const el = document.getElementById("dados-contrato");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Assinar
                </Button>
                <div className="mt-6 rounded-xl border p-4">
                  <p className="font-display text-sm font-semibold">Benefícios e vantagens</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Proteção contra furto qualificado e roubo</li>
                    <li>Entrega grátis em 10 dias úteis</li>
                    <li>Pague mês a mês sem comprometer o limite do cartão</li>
                    <li>Qualidade garantida</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-1">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 id="dados-contrato" className="font-display text-lg font-semibold">Dados do contrato</h2>
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
                  <Input id="ck_nasc" placeholder="dd/mm/aaaa" value={nascimento} onChange={(e) => setNascimento(formatDate(e.target.value))} className="mt-1" maxLength={10} inputMode="numeric" />
                </div>
                <div>
                  <Label htmlFor="ck_email">E-mail</Label>
                  <Input id="ck_email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="ck_tel">Telefone</Label>
                  <Input id="ck_tel" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} className="mt-1" maxLength={16} inputMode="numeric" />
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
                    <span className="text-sm">{precoBase ? `${formatBRL(precoAjustado)}/mês` : "—"}</span>
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
                    <span className="font-semibold">{total ? `${formatBRL(total)}/mês` : "—"}</span>
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
