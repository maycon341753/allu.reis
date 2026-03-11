import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/products";
import { ArrowLeft, Check, CreditCard, FileText } from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === id);
  const [selectedPlan, setSelectedPlan] = useState<12 | 24 | 36>(24);

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

  const prices = { 12: product.preco12, 24: product.preco24, 36: product.preco36 };
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
              <img src={product.imagem} alt={product.nome} className="w-full aspect-square object-cover" />
            </div>

            {/* Info */}
            <div>
              <span className="text-sm font-medium uppercase tracking-wider text-primary">{product.categoria} • {product.marca}</span>
              <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{product.nome}</h1>
              <p className="mt-4 text-muted-foreground">{product.descricao}</p>

              {/* Specs */}
              <div className="mt-6">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Especificações</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.especificacoes.map((spec) => (
                    <span key={spec} className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

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
                      <span className="mt-1 block font-display text-2xl font-bold">R${prices[months]}</span>
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
