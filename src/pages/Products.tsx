import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Smartphone, Watch, Tablet, Laptop, Filter } from "lucide-react";

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
};

const displayCategory = (c: string) => (c === "Iphone" ? "Celular" : c);

function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <div className="card-elevated group rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.imagem || "/assets/placeholder.png"}
          alt={product.nome}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">{displayCategory(product.categoria)}</span>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight">{product.nome}</h3>
        {product.marca && <p className="mt-1 text-sm text-muted-foreground">{product.marca}</p>}
        <div className="mt-4 flex items-end gap-1">
          <span className="text-sm text-muted-foreground">a partir de</span>
          <span className="font-display text-2xl font-bold text-primary">
            {product.preco_mensal != null ? `R$ ${product.preco_mensal}` : "—"}
          </span>
          <span className="text-sm text-muted-foreground">/mês</span>
        </div>
        <Button className="mt-4 w-full" asChild>
          <Link to={`/checkout/${product.id}`}>Assinar</Link>
        </Button>
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
      const { data, error } = await supabase
        .from("products")
        .select("id, nome, categoria, image_url, preco_mensal, status")
        .eq("status", "Ativo")
        .limit(200);
      if (!error && data) {
        setItems(
          data.map((d: any) => ({
            id: d.id,
            nome: d.nome,
            categoria: d.categoria,
            imagem: d.image_url ?? null,
            preco_mensal: d.preco_mensal ?? null,
            marca: null,
          })),
        );
      } else {
        setItems([]);
      }
      setLoading(false);
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
            {filtered.map((product) => (
              <div key={product.id} className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-square overflow-hidden bg-secondary relative">
                  <img
                    src={product.imagem || "/assets/placeholder.png"}
                    alt={product.nome}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex flex-col h-full">
                  <span className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
                    {product.categoria === "Iphone" ? "Celular" : product.categoria}
                  </span>
                  <h3 className="font-display text-lg font-semibold leading-tight line-clamp-2 min-h-[3rem]">
                    {product.nome}
                  </h3>
                  <div className="mt-auto pt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">a partir de</span>
                      <span className="font-display text-xl font-bold text-primary">
                        R$ {Number(product.preco_mensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <Button className="mt-4 w-full h-12 text-base font-medium" asChild>
                      <Link to={`/checkout/${product.id}`}>Assinar</Link>
                    </Button>
                  </div>
                </div>
              </div>
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
