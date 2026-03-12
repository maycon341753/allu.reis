// Edge Function minimalista para Mercado Pago
// Sem imports externos para evitar erros de boot (500)

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Body vazio ou inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const token = Deno.env.get("MP_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "Configuração incompleta (MP_ACCESS_TOKEN)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { transaction_amount, description, payment_method_id, payer, installments, token: cardToken } = body;

    const mpPayload: any = {
      transaction_amount,
      description,
      payment_method_id,
      payer,
    };

    if (cardToken) {
      mpPayload.token = cardToken;
      mpPayload.installments = installments || 1;
    }

    console.log("Enviando para MP:", JSON.stringify(mpPayload));

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpRes.json();
    console.log("Resposta MP:", JSON.stringify(mpData));

    // Retorna SEMPRE 200 com o status real dentro do JSON
    // Isso evita que o supabase-js lance exceção genérica
    return new Response(JSON.stringify({
      ...mpData,
      mp_status: mpRes.status,
      mp_ok: mpRes.ok
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });

  } catch (err) {
    console.error("Erro interno:", err);
    return new Response(JSON.stringify({ 
      error: "Erro interno no servidor", 
      details: String(err) 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Retorna 200 mesmo em erro para debug
    });
  }
});
