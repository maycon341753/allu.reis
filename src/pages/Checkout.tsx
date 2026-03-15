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
  const [foundProfile, setFoundProfile] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<12 | 24 | 36>(24);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [plano, setPlano] = useState("24m");
  const [nascimento, setNascimento] = useState("");
  const [cupom, setCupom] = useState("");
  const [armazenamento, setArmazenamento] = useState<string>("");
  const [planPrices, setPlanPrices] = useState<{ 12: number | null; 24: number | null; 36: number | null }>({
    12: null,
    24: null,
    36: null,
  });
  const precoBase = product?.preco_mensal ?? 0;
  const precoPlano = (planPrices[selectedPlan] ?? precoBase) || 0;
  const descontoCupom = cupom === "CUPOM10" ? Math.round(precoPlano * 0.1 * 100) / 100 : 0;
  const precoAjustado = Math.max(0, Math.round((precoPlano - descontoCupom) * 100) / 100);
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
  const fmtISOToPT = (s: string) => {
    if (!s) return "";
    // Accept YYYY-MM-DD or ISO datetime
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split("-");
        return `${d}/${m}/${y}`;
      }
      const d = new Date(s);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    } catch {
      return s;
    }
  };

  useEffect(() => {
    // Generate stable IDs for the checkout session to prevent duplication
    if (!localStorage.getItem("checkout_order_id")) {
      localStorage.setItem("checkout_order_id", crypto.randomUUID());
    }
    if (!localStorage.getItem("checkout_payment_id")) {
      localStorage.setItem("checkout_payment_id", crypto.randomUUID());
    }

    const run = async () => {
      // Check if user is logged in and pre-fill data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email, nascimento, cpf")
          .eq("id", user.id)
          .maybeSingle();
        if (prof) {
          setFoundProfile(prof);
          if (prof.full_name) setNome(String(prof.full_name));
          if (prof.phone) setTelefone(formatPhone(String(prof.phone)));
          if (prof.email) setEmail(String(prof.email || user.email || ""));
          if (prof.nascimento) setNascimento(fmtISOToPT(String(prof.nascimento)));
          if (prof.cpf) setCpf(formatCPF(String(prof.cpf)));
        }
      }

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
      // Definir preços por plano com base em products.preco12/24/36
      let prices: { 12: number | null; 24: number | null; 36: number | null } = {
        12: isFinite(Number(data?.preco12)) ? Number(data?.preco12) : null,
        24: isFinite(Number(data?.preco24)) ? Number(data?.preco24) : null,
        36: isFinite(Number(data?.preco36)) ? Number(data?.preco36) : null,
      };
      // Fallback: completar com valores de product_pricing (monthly_price) quando ausentes
      const { data: aux } = await supabase
        .from("product_pricing")
        .select("months, monthly_price")
        .eq("product_id", id);
      if (aux && Array.isArray(aux)) {
        aux.forEach((p: any) => {
          const m = Number(p.months);
          const mp = Number(p.monthly_price ?? NaN);
          if ((m === 12 || m === 24 || m === 36) && isFinite(mp) && prices[m as 12 | 24 | 36] == null) {
            // @ts-ignore
            prices[m] = mp;
          }
        });
      }
      setPlanPrices(prices);
    };
    run();
  }, [id]);

  const lookupByCpf = async (cpfMasked: string) => {
    const digits = onlyDigits(cpfMasked);
    if (digits.length !== 11) return;
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, nascimento")
        .eq("cpf", digits)
        .maybeSingle();
      if (prof) {
        setFoundProfile(prof);
        if (prof.full_name) setNome(String(prof.full_name));
        if (prof.phone) setTelefone(formatPhone(String(prof.phone)));
        if (prof.email) setEmail(String(prof.email));
        if (prof.nascimento) setNascimento(fmtISOToPT(String(prof.nascimento)));
      } else {
        setFoundProfile(null);
      }
    } catch {}
  };

  const goToAddress = async () => {
    if (!product) return;
    const cpfDigits = onlyDigits(cpf);
    if (!cpfDigits || cpfDigits.length !== 11) return;
    try {
      // Check if we have profile data (either from lookup or login)
      const prof = foundProfile;
      
      const nm = nome || String(prof?.full_name || "");
      const em = email || String(prof?.email || "");
      const tel = telefone || formatPhone(String(prof?.phone || ""));
      const nasc = nascimento || fmtISOToPT(String(prof?.nascimento || ""));
      
      if (!nm || !em || !tel || !nasc) {
        toast({ title: "Preencha todos os campos", description: "Nome, e-mail, telefone e nascimento são obrigatórios." });
        return;
      }

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      const info = {
        nome: nm,
        cpf: cpfDigits,
        email: em,
        telefone: tel,
        nascimento: nasc,
        plano,
        cupom,
        total,
        user_id: prof?.id || user?.id || null, // Link profile id or logged user id
      };
      
      try {
        localStorage.setItem("checkoutInfo", JSON.stringify(info));
      } catch {}

      if (!prof && !user) {
        navigate(`/cadastro?next=${encodeURIComponent(`/checkout/${id}/endereco`)}`);
        return;
      }
      
      navigate(`/checkout/${id}/endereco`);
    } catch {
      return;
    }
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
                        <span className="block text-xs text-muted-foreground">
                          {planPrices[m as 12 | 24 | 36] != null ? `${formatBRL(planPrices[m as 12 | 24 | 36])}/mês` : "—"}
                        </span>
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
                <div>
                  <Label htmlFor="ck_cpf">CPF</Label>
                  <Input
                    id="ck_cpf"
                    value={cpf}
                    onChange={(e) => {
                      const v = formatCPF(e.target.value);
                      setCpf(v);
                      if (onlyDigits(v).length === 11) {
                        lookupByCpf(v);
                      }
                    }}
                    onBlur={(e) => lookupByCpf(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="ck_nome">Nome completo</Label>
                  <Input id="ck_nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
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
