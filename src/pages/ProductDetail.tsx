import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Check, CreditCard, FileText } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<12 | 24 | 36>(24);
  const [storages, setStorages] = useState<Array<{ id: string; capacity: string; price_adjustment: number }>>([]);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [specs, setSpecs] = useState<Array<{ id: string; name: string; value: string }>>([]);

  const formatBRL = (v: any) => {
    if (v == null) return "—";
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const { data: prod } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        
        if (prod) {
          setProduct(prod);
          
          // Fetch Storages - Verificando o ID do produto
          console.log("Fetching storage for product:", id);
          const { data: st, error: stError } = await supabase
            .from("product_storage_options")
            .select("id, capacity, price_adjustment")
            .eq("product_id", id);
          
          if (stError) {
            console.error("Erro ao buscar armazenamento:", stError);
          }

          const options = st || [];
          console.log("Storage options found:", options);
          
          // Ordenar manualmente se o capacity for texto
          const sortedOptions = options.sort((a, b) => {
            const valA = parseInt(a.capacity);
            const valB = parseInt(b.capacity);
            if (!isNaN(valA) && !isNaN(valB)) return valA - valB;
            return a.capacity.localeCompare(b.capacity);
          });

          setStorages(sortedOptions);
          if (sortedOptions.length > 0) {
            setSelectedStorage(sortedOptions[0].id);
          }

          // Fetch Specs
          const { data: sp } = await supabase
            .from("product_specs")
            .select("id, spec_name, spec_value")
            .eq("product_id", id);
          setSpecs((sp || []).map((s: any) => ({ id: s.id, name: s.spec_name, value: s.spec_value })));
        }
      } catch (err) {
        console.error("Erro ao buscar produto:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex items-center justify-center py-32">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex items-center justify-center py-32">
          <p className="text-muted-foreground">Produto não encontrado.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const storageAdjustment = storages.find(s => s.id === selectedStorage)?.price_adjustment || 0;
  
  // Garantir que os preços base sejam números
  const basePreco12 = Number(product.preco12) || 0;
  const basePreco24 = Number(product.preco24) || 0;
  const basePreco36 = Number(product.preco36) || 0;

  const prices = { 
    12: basePreco12 + storageAdjustment, 
    24: basePreco24 + storageAdjustment, 
    36: basePreco36 + storageAdjustment 
  };
  const currentPrice = prices[selectedPlan];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container py-12">
          <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={16} /> Voltar ao catálogo
          </Link>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Image */}
            <div className="overflow-hidden rounded-2xl bg-secondary">
              <img src={product.image_url} alt={product.nome} className="w-full aspect-square object-cover" />
            </div>

            {/* Info */}
            <div>
              <span className="text-sm font-medium uppercase tracking-wider text-primary">{product.categoria} • {product.marca}</span>
              <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{product.nome}</h1>
              <p className="mt-4 text-muted-foreground">{product.descricao}</p>

              {/* Storage Selection */}
              {storages.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Armazenamento</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {storages.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStorage(st.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                          selectedStorage === st.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {st.capacity}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs */}
              {specs.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Especificações</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {specs.map((spec) => (
                      <span key={spec.id} className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
                        {spec.name}: {spec.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Plans */}
              <div className="mt-8">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Escolha seu plano</h3>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {([12, 24, 36] as const).map((months) => (
                    <button
                      key={months}
                      onClick={() => setSelectedPlan(months)}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        selectedPlan === months
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="block text-sm text-muted-foreground">{months} meses</span>
                      <span className="mt-1 block font-display text-2xl font-bold">{formatBRL(prices[months])}</span>
                      <span className="block text-xs text-muted-foreground">/mês</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="mt-8 space-y-3">
                <Button size="lg" className="w-full gap-2">
                  <CreditCard size={18} />
                  Alugar com Cartão de Crédito
                </Button>
                <Button size="lg" variant="outline" className="w-full gap-2">
                  <FileText size={18} />
                  Alugar com Boleto
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Boleto disponível apenas para CLT com mais de 6 meses • Limite R$2.500
                </p>
              </div>

              {/* Includes */}
              <div className="mt-6 rounded-xl bg-accent/50 p-4">
                <h4 className="font-display text-sm font-semibold">Incluso no plano:</h4>
                <ul className="mt-2 space-y-1">
                  {["Frete grátis para todo Brasil", "Garantia completa", "Troca facilitada", "Suporte dedicado"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
