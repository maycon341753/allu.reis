import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, QrCode } from "lucide-react";

export default function CheckoutPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"BOLETO" | "CREDIT_CARD">("BOLETO");
  const [showPix, setShowPix] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pollId, setPollId] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  
  // Credit Card State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");
  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };

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
    const cpfDigits = String(info.cpf || "").replace(/\D/g, "");
    const { data: profile } = await supabase.from("profiles").select("id").eq("cpf", cpfDigits).maybeSingle();
    if (!profile) {
      setLoading(false);
      navigate(`/cadastro?next=${encodeURIComponent(`/checkout/${id}/pagamento`)}`);
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    // Permitir seguir com Pix se já houver cadastro por CPF, mesmo sem login ativo
    const uid = authData?.user?.id || profile.id;

    // Fix transaction amount parsing
    // info.total might be "199.90" or "R$ 199.90/mês"
    let rawAmount = info.total ?? product.preco_mensal ?? 0;
    if (typeof rawAmount === "string") {
      // Remove R$, /mês, spaces, and replace comma with dot if needed
      rawAmount = rawAmount.replace("R$", "").replace("/mês", "").trim().replace(",", ".");
    }
    const amount = Number(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      setLoading(false);
      alert("Valor inválido para pagamento: " + rawAmount);
      return;
    }

    // Ensure CPF is clean and valid
    const cleanCpf = cpfDigits.replace(/\D/g, "");
    
    // Fetch user profile data to ensure we have the correct email and name associated with the CPF
    const { data: profileData } = await supabase
      .from("profiles")
      .select("email, nome")
      .eq("cpf", cleanCpf)
      .maybeSingle();

    const payerEmail = profileData?.email || info.email;
    const payerName = profileData?.nome || info.nome;

    if (!payerEmail) {
       setLoading(false);
       alert("E-mail do pagador não encontrado. Verifique seu cadastro.");
       return;
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const venc = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;

    // Prepare payload for Mercado Pago
    const payload: any = {
      transaction_amount: amount,
      description: `Assinatura de ${product.nome} (1ª Mensalidade)`,
    };

    if (paymentMethod === "BOLETO") {
      // Primeira mensalidade deve ser PIX
      payload.payment_method_id = "pix";
      // Para PIX, não enviar identificação do CPF para evitar erro 2067
      payload.payer = {
        email: payerEmail,
        first_name: payerName.split(" ")[0],
        last_name: payerName.split(" ").slice(1).join(" ") || "Cliente",
      };
    } else {
      // For Credit Card, we need to generate token first
      // Since we are using raw data here (MVP), we need to handle tokenization.
      // But passing raw card data to backend is not recommended. 
      // Ideally we use MP SDK window.MercadoPago
      
      try {
         // @ts-ignore
         const mp = new window.MercadoPago("APP_USR-4874651f-ea8a-480b-bf4e-444502d1a2fb");
         const cardToken = await mp.createCardToken({
           cardNumber: cardNumber.replace(/\D/g, ""),
          cardholderName: cardName,
          cardExpirationMonth: expiry.split("/")[0],
          cardExpirationYear: "20" + expiry.split("/")[1],
          securityCode: ccv,
          identification: {
            type: "CPF",
            number: cpfDigits
          }
        });

        if (cardToken.id) {
          payload.token = cardToken.id;
          payload.payment_method_id = "master"; // We should detect this or let MP SDK handle
          // Actually MP SDK createCardToken returns id. We also need to guess payment method.
          // mp.getPaymentMethods can be used. For MVP let's try to guess or hardcode master/visa based on bin? 
          // Better: Let's assume we get payment_method_id from client logic or just send token and MP infers? 
          // MP requires payment_method_id. 
          
          // Simple bin detection
          const bin = cardNumber.replace(/\D/g, "").substring(0,6);
          if (bin.startsWith("4")) payload.payment_method_id = "visa";
          else if (bin.startsWith("5")) payload.payment_method_id = "master";
          else payload.payment_method_id = "master"; // Fallback
        } else {
           throw new Error("Falha ao gerar token do cartão");
        }
      } catch (err: any) {
        setLoading(false);
        alert("Erro ao processar cartão: " + (err.message || JSON.stringify(err)));
        return;
      }
      // Para cartão, enviar identificação completa
      payload.payer = {
        email: payerEmail,
        first_name: payerName.split(" ")[0],
        last_name: payerName.split(" ").slice(1).join(" ") || "Cliente",
        identification: {
          type: "CPF",
          number: cleanCpf,
        },
      };
    }

    // Use fetch directly to avoid supabase-js generic error masking and ensure Anon Key usage
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/mp-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload),
      });

      // Check if the request itself failed (404, 500, etc)
      if (!response.ok) {
        const errorText = await response.text();
        setLoading(false);
        console.error("Function Error:", response.status, errorText);
        let errorMsg = `Erro ${response.status}: ${response.statusText}`;
        try {
           const jsonErr = JSON.parse(errorText);
           if (jsonErr.error) errorMsg = jsonErr.error;
        } catch {}
        alert("Erro na comunicação com servidor: " + errorMsg);
        return;
      }

      const pdata = await response.json();
      
      // Check for application level errors inside 200 OK
      // Edge function returns flattened MP response, so error details are at root
      if (pdata?.error || pdata?.mp_ok === false) {
         setLoading(false);
         console.error("Payment function error:", pdata);
         
         let msg = pdata.message || pdata.error || "Erro desconhecido";
         
         if (pdata.cause && Array.isArray(pdata.cause)) {
             msg += "\n" + pdata.cause.map((c: any) => `${c.code}: ${c.description}`).join("\n");
         } else if (pdata.details) {
             // Fallback if structure is nested (legacy)
             msg += "\n" + JSON.stringify(pdata.details);
         }
         
         alert("Erro Mercado Pago:\n" + msg);
         return;
      }

    // Success
    await supabase.from("payments").insert({
        produto: product.nome,
        categoria: product.categoria,
        plano: info.plano,
      total_mensal: info.total ?? product.preco_mensal ?? "",
      valor: String(amount),
      vencimento: venc,
      cliente: payerName,
        status: pdata.status === "approved" ? "Pago" : "Pendente",
        metodo: paymentMethod === "BOLETO" ? "pix" : "cartao",
        cliente_nome: info.nome,
        cliente_cpf: cleanCpf,
        cliente_email: info.email,
        cliente_telefone: info.telefone,
        entrega_endereco: address.entrega,
        residencial_endereco: address.residencial,
        cep: address.cep,
        complemento: address.complemento,
        bairro: address.bairro,
        cidade: address.cidade,
        estado: address.estado,
        provider: "mercadopago",
        external_id: String(pdata.id),
        customer_external_id: null,
        billing_type: paymentMethod === "BOLETO" ? "PIX" : "CREDIT_CARD",
        boleto_url: pdata.point_of_interaction?.transaction_data?.ticket_url || pdata.transaction_details?.external_resource_url || null,
      });
      // Create admin tracking records
      try {
        await supabase.from("orders").insert({
          cliente: payerName,
          email: info.email || payerEmail || null,
          cpf: cleanCpf || null,
          telefone: info.telefone || null,
          produto: product.nome,
          plano: info.plano,
          valor_mensal: String(amount),
          forma_pagamento: paymentMethod === "BOLETO" ? "PIX" : "CREDIT_CARD",
          status: "Em análise",
          user_id: uid,
          cep: address.cep || null,
          logradouro: address.entrega || address.residencial || null,
          numero: address.numero || null,
          complemento: address.complemento || null,
          bairro: address.bairro || null,
          cidade: address.cidade || null,
          estado: address.estado || null,
        });
      } catch {}
      
      // Criar contrato imediatamente (se não existir pendente para este produto)
      // Vinculado ao user_id (uid) para aparecer em Meus Aluguéis
      try {
        const { data: existing } = await supabase
          .from("contratos")
          .select("id")
          .eq("user_id", uid)
          .eq("produto", product.nome)
          .in("status", ["Em análise", "Pendente", "Aprovado"])
          .maybeSingle();
          
        if (!existing) {
          await supabase.from("contratos").insert({
            cliente: payerName,
            produto: product.nome,
            plano: info.plano,
            valor: amount,
            status: "Em análise", // Status inicial até aprovação do admin
            user_id: uid,
          });
        }
      } catch {}
      
      setLoading(false);
      
      // Redirect logic for PIX (using ticket_url)
      const pixUrl = pdata.point_of_interaction?.transaction_data?.ticket_url;
      if (paymentMethod === "BOLETO" && pixUrl) {
        setPixData({
          ticket_url: pixUrl,
          qr_code: pdata.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: pdata.point_of_interaction?.transaction_data?.qr_code_base64,
          payment_id: pdata.id,
        });
        setShowPix(true);
        // Start polling status
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const interval = setInterval(async () => {
          try {
            const resp = await fetch(`${SUPABASE_URL}/functions/v1/mp-status`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ id: pdata.id }),
            });
            if (resp.ok) {
              const js = await resp.json();
              if (js?.status === "approved") {
                clearInterval(interval);
                setPollId(null);
                setShowPix(false);
                await supabase.from("payments").update({ status: "Pago" }).eq("external_id", String(pdata.id));
                setSuccess(true);
              }
            }
          } catch {}
        }, 5000);
        setPollId(interval);
        return;
      }
      
      setSuccess(true);

    } catch (networkError: any) {
      setLoading(false);
      console.error("Network Error:", networkError);
      alert("Erro de conexão: " + networkError.message);
    }
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
                    <span className="text-sm">{product.preco_mensal != null ? `${formatBRL(product.preco_mensal)}/mês` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{info.total ? `${formatBRL(info.total)}/mês` : "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-muted-foreground">Carregando...</p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Forma de Pagamento</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={(v: "BOLETO" | "CREDIT_CARD") => setPaymentMethod(v)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="BOLETO" id="boleto" className="peer sr-only" />
                  <Label
                    htmlFor="boleto"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <QrCode className="mb-3 h-6 w-6" />
                    Pix (1ª Mensalidade)
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="CREDIT_CARD" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <CreditCard className="mb-3 h-6 w-6" />
                    Cartão de Crédito
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "CREDIT_CARD" && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input id="cardName" placeholder="Como impresso no cartão" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Validade</Label>
                      <Input id="expiry" placeholder="MM/AA" value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} />
                    </div>
                    <div>
                      <Label htmlFor="ccv">CCV</Label>
                      <Input id="ccv" placeholder="123" value={ccv} onChange={(e) => setCcv(e.target.value)} maxLength={4} />
                    </div>
                  </div>
                </div>
              )}

              <Button className="mt-8 w-full" onClick={pay} disabled={loading || !product || !info || !address}>
                {loading ? "Processando..." : `Pagar com ${paymentMethod === "BOLETO" ? "Pix" : "Cartão"}`}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento aprovado!</DialogTitle>
            <DialogDescription>Obrigado por assinar. Você será redirecionado para acessar seu perfil.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => navigate(`/login?next=${encodeURIComponent("/cliente/pagamentos")}`)}>Ir para Login</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Pix Modal */}
      <Dialog open={showPix} onOpenChange={(o) => {
        setShowPix(o);
        if (!o && pollId) { clearInterval(pollId); setPollId(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento Pix</DialogTitle>
            <DialogDescription>Use o QR Code ou copie o código Pix para pagar a 1ª mensalidade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {pixData?.qr_code_base64 ? (
              <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Pix" className="mx-auto h-48 w-48" />
            ) : null}
            {pixData?.qr_code ? (
              <div className="rounded-md border p-3 text-xs break-all">{pixData.qr_code}</div>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => window.open(pixData?.ticket_url, "_blank")}>Abrir página do Pix</Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(pixData?.qr_code || "")}>Copiar código</Button>
            </div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação de pagamento…</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
