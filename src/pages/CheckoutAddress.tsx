import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function CheckoutAddress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [entrega, setEntrega] = useState("");
  const [residencial, setResidencial] = useState("");
  const [cep, setCep] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [info, setInfo] = useState<any>(null);
  const formatCEP = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    const p1 = d.slice(0, 5);
    const p2 = d.slice(5, 8);
    let out = "";
    if (p1) out = p1;
    if (p2) out = `${p1}-${p2}`;
    return out;
  };
  const handleCepChange = async (v: string) => {
    const masked = formatCEP(v);
    setCep(masked);
    const digits = v.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const j = await r.json();
        if (!j.erro) {
          if (!entrega) setEntrega(j.logradouro || "");
          if (!residencial) setResidencial(j.logradouro || "");
          setBairro(j.bairro || "");
          setCidade(j.localidade || "");
          setEstado(j.uf || "");
        }
      } catch {}
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const { data } = await supabase.from("products").select("id, nome, categoria, image_url, preco_mensal").eq("id", id).maybeSingle();
      setProduct(data || null);
      try {
        const saved = localStorage.getItem("checkoutInfo");
        if (saved) setInfo(JSON.parse(saved));
      } catch {}
    };
    run();
  }, [id]);

  const goToPayment = async () => {
    if (!product || !info) return;
    if (!entrega || !residencial || !cep || !bairro || !cidade || !estado) return;
    const addr = { entrega, residencial, cep, complemento, bairro, cidade, estado };
    try {
      localStorage.setItem("addressInfo", JSON.stringify(addr));
    } catch {}
    navigate(`/checkout/${id}/pagamento`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Endereço</h1>
          <p className="mt-2 text-muted-foreground">Informe os dados de entrega</p>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Resumo da assinatura</h2>
              {product && info ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-md bg-secondary">
                      <img src={product.image_url || "/assets/placeholder.png"} alt={product.nome} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{product.nome}</p>
                      <p className="text-sm text-muted-foreground">Plano de fidelidade: {String(info.plano).replace("m", " meses")}</p>
                      <p className="text-sm text-muted-foreground">Pagamento: Mensal</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm">{product.preco_mensal != null ? `R$ ${product.preco_mensal}/mês` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{info.total ? `R$ ${info.total}/mês` : "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-muted-foreground">Carregando...</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Endereços</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="addr_entrega">Endereço de entrega</Label>
                  <Input id="addr_entrega" value={entrega} onChange={(e) => setEntrega(e.target.value)} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="addr_res">Endereço residencial</Label>
                  <Input id="addr_res" value={residencial} onChange={(e) => setResidencial(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="addr_cep">CEP</Label>
                  <Input id="addr_cep" value={cep} onChange={(e) => handleCepChange(e.target.value)} className="mt-1" maxLength={9} inputMode="numeric" />
                </div>
                <div>
                  <Label htmlFor="addr_comp">Complemento (opcional)</Label>
                  <Input id="addr_comp" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="addr_bairro">Bairro</Label>
                  <Input id="addr_bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="addr_cidade">Cidade</Label>
                  <Input id="addr_cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="addr_estado">Estado</Label>
                  <Input id="addr_estado" value={estado} onChange={(e) => setEstado(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={goToPayment} disabled={loading || !product || !info}>
                Ir para pagamento
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
