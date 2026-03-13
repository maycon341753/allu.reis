import { Client } from "https://deno.land/x/postgres@v12.0.0/mod.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const url = Deno.env.get("SUPABASE_DB_URL");
  if (!url) {
    return new Response(JSON.stringify({ error: "SUPABASE_DB_URL não configurado" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
  try {
    const payload = await req.json().catch(() => ({}));
    const productId: string | undefined = payload?.product_id;
    const storageSpec: string | undefined = payload?.armazenamento || "256GB";
    const discounts = payload?.discounts || { "12": 0, "24": 60, "36": 100 };
    if (!productId || typeof productId !== "string") {
      return new Response(JSON.stringify({ error: "Parâmetro product_id obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const client = new Client(url);
    await client.connect();
    try {
      const ddl = `
        create extension if not exists pgcrypto;
        alter table products add column if not exists descricao text;
        create table if not exists product_pricing (
          id uuid primary key default gen_random_uuid(),
          product_id uuid not null references products(id) on delete cascade,
          months smallint not null check (months in (12,24,36)),
          discount_per_month numeric(10,2) not null default 0,
          unique (product_id, months)
        );
        create table if not exists product_specs (
          id uuid primary key default gen_random_uuid(),
          product_id uuid not null references products(id) on delete cascade,
          spec_name text not null,
          spec_value text not null
        );
      `;
      await client.queryArray(ddl);
      const d12 = Number(discounts["12"]) || 0;
      const d24 = Number(discounts["24"]) || 0;
      const d36 = Number(discounts["36"]) || 0;
      const upsertPricing = `
        insert into product_pricing (product_id, months, discount_per_month)
        values
          ($1::uuid, 12, $2::numeric),
          ($1::uuid, 24, $3::numeric),
          ($1::uuid, 36, $4::numeric)
        on conflict (product_id, months)
        do update set discount_per_month = excluded.discount_per_month;
      `;
      await client.queryArray(upsertPricing, [productId, d12, d24, d36]);
      const upsertSpec = `
        insert into product_specs (product_id, spec_name, spec_value)
        values ($1::uuid, 'Armazenamento', $2::text)
        on conflict do nothing;
      `;
      await client.queryArray(upsertSpec, [productId, storageSpec]);
      await client.end();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (err) {
      await client.end();
      return new Response(JSON.stringify({ error: String(err) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

