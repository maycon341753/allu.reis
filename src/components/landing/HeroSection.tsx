import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, RefreshCw } from "lucide-react";
import heroImage from "@/assets/hero-devices.png";

export function HeroSection() {
  return (
    <section className="hero-section relative overflow-hidden pt-16">
      <div className="container relative z-10 flex flex-col items-center gap-12 py-20 md:py-32 lg:flex-row lg:gap-16">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Shield size={14} />
            Sem burocracia • Frete grátis
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-hero-foreground md:text-5xl lg:text-6xl">
            Alugue tecnologia{" "}
            <span className="gradient-text">sem precisar comprar</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-hero-foreground/70 md:text-xl">
            Celulares, smartwatches, tablets e notebooks com assinatura mensal.
            Produtos novos com entrega em todo Brasil.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button variant="hero" size="xl" asChild>
              <Link to="/produtos">
                Ver produtos <ArrowRight size={20} />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </div>

          {/* Mini badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 lg:justify-start">
            {[
              { icon: Truck, text: "Frete grátis" },
              { icon: RefreshCw, text: "Troca facilitada" },
              { icon: Shield, text: "Garantia total" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2 text-sm text-hero-foreground/60">
                <b.icon size={16} className="text-primary" />
                {b.text}
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <img
            src={heroImage}
            alt="Dispositivos eletrônicos para aluguel"
            className="w-full max-w-lg mx-auto rounded-2xl"
          />
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      </div>
    </section>
  );
}
