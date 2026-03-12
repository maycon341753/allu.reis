import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function CheckoutPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const { data } = await supabase.from("products").select("id, nome, categoria, image_url, preco_mensal").eq("id", id).maybeSingle();
      setProduct(data || null);
      try {
        const saved = localStorage.getItem("checkoutInfo");
        const savedAddr = localStorage.getItem("addressInfo");
        if (saved) setInfo(JSON.parse(saved));
        if (savedAddr) setAddress(JSON.parse(savedAddr));
      } catch {}
    };
    run();
  }, [id]);

  const pay = async () => {
    if (!product || !info || !address) return;
    setLoading(true);
    const c = await supabase.functions.invoke("asaas-customer", {
      body: { name: info.nome, cpfCnpj: info.cpf, email: info.email, phone: info.telefone },
    });
    if (c.error) {
      setLoading(false);
      return;
    }
    const customerId = (c.data as any)?.id;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const d = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
    const p = await supabase.functions.invoke("asaas-payment", {
      body: {
        customerId,
        value: info.total ?? product.preco_mensal ?? 0,
        billingType: "BOLETO",
        dueDate: d,
        description: `Assinatura de ${product.nome}`,
      },
    });
    if (p.error) {
      setLoading(false);
      return;
    }
    const pdata = p.data as any;
    await supabase.from("payments").insert({
      produto: product.nome,
      categoria: product.categoria,
      plano: info.plano,
      total_mensal: info.total ?? product.preco_mensal ?? "",
      status: "Pendente",
      metodo: "boleto",
      cliente_nome: info.nome,
      cliente_cpf: info.cpf,
      cliente_email: info.email,
      cliente_telefone: info.telefone,
      entrega_endereco: address.entrega,
      residencial_endereco: address.residencial,
      cep: address.cep,
      complemento: address.complemento,
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
      provider: "asaas",
      external_id: pdata?.id ?? null,
      customer_external_id: customerId ?? null,
      billing_type: "BOLETO",
      boleto_url: pdata?.bankSlipUrl ?? null,
    });
    setLoading(false);
    navigate("/cliente");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Pagamento</h1>
          <p className="mt-2 text-muted-foreground">Revise sua assinatura antes de pagar</p>

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
              <h2 className="font-display text-lg font-semibold">Pagamento</h2>
              <p className="mt-2 text-sm text-muted-foreground">Integração de pagamento será adicionada aqui.</p>
              <Button className="mt-6 w-full" onClick={pay} disabled={loading || !product || !info || !address}>
                {loading ? "Processando..." : "Pagar agora"}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
