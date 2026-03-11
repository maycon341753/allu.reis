import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { mockProducts, type Product } from "@/data/products";
import { Smartphone, Watch, Tablet, Laptop, Filter } from "lucide-react";

const categories = [
  { value: "todos", label: "Todos", icon: Filter },
  { value: "celular", label: "Celulares", icon: Smartphone },
  { value: "smartwatch", label: "Smartwatches", icon: Watch },
  { value: "tablet", label: "Tablets", icon: Tablet },
  { value: "notebook", label: "Notebooks", icon: Laptop },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card-elevated group rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.imagem}
          alt={product.nome}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">{product.categoria}</span>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight">{product.nome}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{product.marca}</p>
        <div className="mt-4 flex items-end gap-1">
          <span className="text-sm text-muted-foreground">a partir de</span>
          <span className="font-display text-2xl font-bold text-primary">
            R${product.preco36}
          </span>
          <span className="text-sm text-muted-foreground">/mês</span>
        </div>
        <Button className="mt-4 w-full" asChild>
          <Link to={`/produtos/${product.id}`}>Alugar</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [category, setCategory] = useState("todos");

  const filtered = category === "todos"
    ? mockProducts
    : mockProducts.filter((p) => p.categoria === category);

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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
