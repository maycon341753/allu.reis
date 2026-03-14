import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Smartphone, Watch, Tablet, Laptop, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { mockProducts } from "@/data/products";

const categories = [
  { value: "todos", label: "Todos", icon: Filter },
  { value: "Celular", label: "Celulares", icon: Smartphone },
  { value: "Smartwhats", label: "Smartwatches", icon: Watch },
  { value: "Tablets", label: "Tablets", icon: Tablet },
  { value: "Notebooks", label: "Notebooks", icon: Laptop },
];

type CatalogProduct = {
  id: string;
  nome: string;
  categoria: string;
  imagem?: string | null;
  preco_mensal?: number | null;
  marca?: string | null;
  galeria?: string[];
};

const displayCategory = (c: string) => (c === "Iphone" ? "Celular" : c);

function ProductCard({ product }: { product: CatalogProduct }) {
  const images = product.galeria && product.galeria.length > 0 
    ? product.galeria 
    : [product.imagem || "/assets/placeholder.png"];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-square overflow-hidden bg-secondary relative">
        {/* Carrossel de Imagens */}
        <div className="relative h-full w-full">
          <img
            src={images[currentIndex]}
            alt={product.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {images.length > 1 && (
            <>
              {/* Controles do Carrossel */}
              <button 
                onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-background"
              >
                <ChevronRight size={20} />
              </button>

              {/* Indicadores (Dots) */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      idx === currentIndex ? "bg-primary w-3" : "bg-primary/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
          {product.categoria === "Iphone" ? "Celular" : product.categoria}
        </span>
        <h3 className="font-display text-lg font-semibold leading-tight line-clamp-2 min-h-[3rem]">
          {product.nome}
        </h3>
        <div className="mt-4 pt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">a partir de</span>
            <span className="font-display text-xl font-bold text-primary">
              {product.preco_mensal != null
                ? `R$ ${Number(product.preco_mensal).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`
                : "Indisponível"}
            </span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
          <Button className="mt-4 w-full h-12 text-base font-medium" asChild>
            <Link to={`/checkout/${product.id}`}>Assinar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [category, setCategory] = useState("todos");
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, nome, categoria, image_url, preco_mensal, status")
          .eq("status", "Ativo")
          .limit(200);

        if (error || !data || data.length === 0) {
          throw new Error("No data or error");
        }

        const ids = data.map((d: any) => d.id).filter(Boolean);
        
        // Busca galeria para todos os produtos de uma vez
        const { data: galleries } = await supabase
          .from("product_images")
          .select("product_id, image_url, principal")
          .in("product_id", ids);

        let galleryMap: Record<string, string[]> = {};
        (galleries || []).forEach((img: any) => {
          if (!galleryMap[img.product_id]) galleryMap[img.product_id] = [];
          if (img.principal) {
            galleryMap[img.product_id].unshift(img.image_url);
          } else {
            galleryMap[img.product_id].push(img.image_url);
          }
        });

        let minPriceByProduct: Record<string, number> = {};
        
        if (ids.length) {
          const { data: prices } = await supabase
            .from("product_pricing")
            .select("product_id, monthly_price")
            .in("product_id", ids);
            
          (prices || []).forEach((p: any) => {
            const pid = p.product_id;
            const val = Number(p.monthly_price ?? NaN);
            if (Number.isFinite(val)) {
              minPriceByProduct[pid] = minPriceByProduct[pid] != null ? Math.min(minPriceByProduct[pid], val) : val;
            }
          });
        }

        const mapped = data.map((d: any) => {
          let preco: number | null = null;
          
          if (d.preco_mensal != null && d.preco_mensal !== "") {
             const p = Number(d.preco_mensal);
             if (Number.isFinite(p)) preco = p;
          }
          
          if (preco === null && minPriceByProduct[d.id] != null) {
             preco = minPriceByProduct[d.id];
          }

          // Combina a imagem principal do produto com a galeria
          let finalGallery = galleryMap[d.id] || [];
          if (d.image_url && !finalGallery.includes(d.image_url)) {
            finalGallery.unshift(d.image_url);
          }

          return {
            id: d.id,
            nome: d.nome || "Produto sem nome",
            categoria: d.categoria || "Outros",
            imagem: d.image_url ?? null,
            preco_mensal: preco,
            marca: null,
            galeria: finalGallery,
          } as CatalogProduct;
        });

        setItems(mapped);
      } catch (err) {
        console.error("Error loading products, using mock:", err);
        setItems(
          mockProducts.map((p) => ({
            id: p.id,
            nome: p.nome,
            categoria: p.categoria === "celular" ? "Celular" : p.categoria === "smartwatch" ? "Smartwhats" : p.categoria === "tablet" ? "Tablets" : "Notebooks",
            imagem: p.imagem,
            preco_mensal: p.preco24,
            marca: p.marca,
            galeria: [p.imagem],
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = category === "todos"
    ? items
    : items.filter((p) =>
        category === "Celular" ? (p.categoria === "Celular" || p.categoria === "Iphone") : p.categoria === category
      );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Nossos Produtos</h1>
          <p className="mt-2 text-muted-foreground">Escolha o eletrônico ideal para você</p>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="mt-10 grid gap-6 grid-cols-1 tb:grid-cols-2 dt:grid-cols-3 ld:grid-cols-4">
            {loading && (
              <div className="col-span-full flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
            {!loading && filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">Nenhum produto encontrado</div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
