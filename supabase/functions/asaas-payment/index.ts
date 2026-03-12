import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const origin = "*";
  const headers = {
    "content-type": "application/json",
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  try {
    const { customerId, value, billingType, dueDate, description, creditCard, creditCardHolderInfo, remoteIp } = await req.json();
    const token = Deno.env.get("ASAAS_API_KEY") ?? "";
    const base = Deno.env.get("ASAAS_BASE_URL") ?? "https://api.asaas.com/v3";
    if (!token) {
      return new Response(JSON.stringify({ error: "ASAAS_API_KEY não definido" }), { status: 500, headers });
    }
    const payload: any = { customer: customerId, value, billingType, dueDate, description };
    if (billingType === "CREDIT_CARD") {
      payload.creditCard = creditCard;
      payload.creditCardHolderInfo = creditCardHolderInfo;
      payload.remoteIp = remoteIp;
    }
    const r = await fetch(`${base}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json", "access_token": token },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    return new Response(JSON.stringify(data), { status: r.status, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
