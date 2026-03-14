import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Check, CreditCard, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<12 | 24 | 36>(24);
  const [storages, setStorages] = useState<Array<{ id: string; capacity: string; price_adjustment: number }>>([]);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [specs, setSpecs] = useState<Array<{ id: string; name: string; value: string }>>([]);
  const [gallery, setGallery] = useState<Array<{ id: string; image_url: string; principal: boolean }>>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
          
          // Fetch Gallery
          console.log("Fetching images for product:", id);
          const { data: imgs, error: imgsError } = await supabase
            .from("product_images")
            .select("id, image_url, principal")
            .eq("product_id", id);
          
          if (imgsError) {
            console.error("Erro ao buscar galeria:", imgsError);
          }
          
          const galleryData = imgs || [];
          
          // Criar uma galeria única combinando a image_url do produto e a galeria de imagens
          // Isso garante que a imagem principal do produto SEMPRE esteja no carrossel
          let finalGallery = [...galleryData];
          
          const mainImageUrl = prod.image_url;
          if (mainImageUrl) {
            const alreadyInGallery = galleryData.some(img => img.image_url === mainImageUrl);
            if (!alreadyInGallery) {
              finalGallery.unshift({ id: "main-fallback", image_url: mainImageUrl, principal: true });
            }
          }

          // Ordenar: principal primeiro
          finalGallery.sort((a, b) => {
            if (a.principal && !b.principal) return -1;
            if (!a.principal && b.principal) return 1;
            return 0;
          });

          console.log("Final gallery for display:", finalGallery);
          setGallery(finalGallery);
          setActiveImageIndex(0);

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

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container py-12">
          <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={16} /> Voltar ao catálogo
          </Link>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Carousel Container */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-secondary group">
                <img 
                  src={gallery[activeImageIndex]?.image_url || product.image_url} 
                  alt={product.nome} 
                  className="w-full aspect-square object-cover transition-all duration-500"
                />
                
                {gallery.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImageIndex === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
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
