import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Package, CreditCard, FileText, 
  Headphones, UserCircle, LogOut, Smartphone, Watch, 
  Tablet, Laptop, Filter, ChevronLeft, ChevronRight, ShoppingBag
} from "lucide-react";
import { mockProducts } from "@/data/products";

// Funções Utilitárias Globais
const formatBRL = (v: any) => {
  if (v == null) return "—";
  const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
};

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/cliente" },
  { icon: ShoppingBag, label: "Produtos", path: "/cliente/produtos" },
  { icon: Package, label: "Meus Aluguéis", path: "/cliente/alugueis" },
  { icon: CreditCard, label: "Pagamentos", path: "/cliente/pagamentos" },
  { icon: FileText, label: "Documentos", path: "/cliente/documentos" },
  { icon: Headphones, label: "Suporte", path: "/cliente/suporte" },
  { icon: UserCircle, label: "Perfil", path: "/cliente/perfil" },
];

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

function ProductCard({ product }: { product: CatalogProduct }) {
  const images = useMemo(() => {
    return product.galeria && product.galeria.length > 0 
      ? product.galeria 
      : [product.imagem || "/assets/placeholder.png"];
  }, [product.galeria, product.imagem]);
  
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
        <div className="relative h-full w-full">
          <img
            src={images[currentIndex]}
            alt={product.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {images.length > 1 && (
            <>
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
                ? formatBRL(product.preco_mensal)
                : "Indisponível"}
            </span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
          <Button className="mt-4 w-full h-12 text-base font-medium" asChild>
            <Link to={`/produtos/${product.id}`}>Assinar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ClientProducts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [category, setCategory] = useState("todos");
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const run = async () => {
      // Se a autenticação ainda está carregando, não fazemos nada
      if (authLoading) return;
      
      // Se não houver usuário, o outro useEffect já vai redirecionar
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Iniciando busca de produtos para o cliente...");
        const { data, error } = await supabase
          .from("products")
          .select("id, nome, categoria, image_url, preco_mensal, status")
          .eq("status", "Ativo")
          .limit(200);

        if (error) {
          console.error("Erro Supabase:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn("Nenhum produto ativo encontrado no banco.");
          setItems([]);
          setLoading(false);
          return;
        }

        const ids = data.map((d: any) => d.id).filter(Boolean);
        
        let galleryMap: Record<string, string[]> = {};
        let minPriceByProduct: Record<string, number> = {};

        try {
          const [galleryRes, pricingRes] = await Promise.allSettled([
            supabase.from("product_images").select("product_id, image_url, principal").in("product_id", ids),
            supabase.from("product_pricing").select("product_id, monthly_price").in("product_id", ids)
          ]);

          if (galleryRes.status === 'fulfilled' && galleryRes.value.data) {
            galleryRes.value.data.forEach((img: any) => {
              if (!galleryMap[img.product_id]) galleryMap[img.product_id] = [];
              if (img.principal) galleryMap[img.product_id].unshift(img.image_url);
              else galleryMap[img.product_id].push(img.image_url);
            });
          }

          if (pricingRes.status === 'fulfilled' && pricingRes.value.data) {
            pricingRes.value.data.forEach((p: any) => {
              const val = Number(p.monthly_price ?? NaN);
              if (Number.isFinite(val)) {
                minPriceByProduct[p.product_id] = minPriceByProduct[p.product_id] != null 
                  ? Math.min(minPriceByProduct[p.product_id], val) 
                  : val;
              }
            });
          }
        } catch (e) {
          console.warn("Falha na busca de dados secundários:", e);
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

        console.log("Produtos carregados com sucesso:", mapped.length);
        setItems(mapped);
      } catch (err) {
        console.error("Falha crítica ao carregar produtos:", err);
        // Fallback para mock apenas em caso de erro real de conexão
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
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    return category === "todos"
      ? items
      : items.filter((p) =>
          category === "Celular" ? (p.categoria === "Celular" || p.categoria === "Iphone") : p.categoria === category
        );
  }, [items, category]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex sticky top-0 h-screen">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-base font-bold text-primary-foreground">a</span>
            </div>
            <span className="font-display text-lg font-bold">allu<span className="text-primary">.reis</span></span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <button 
            onClick={() => logout("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-3xl font-bold">Produtos Disponíveis</h1>
        <p className="text-muted-foreground">Escolha o seu próximo eletrônico para alugar</p>

        {/* Categories */}
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
        <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && (
            <div className="col-span-full flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          {!loading && filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              Nenhum produto encontrado nesta categoria.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
