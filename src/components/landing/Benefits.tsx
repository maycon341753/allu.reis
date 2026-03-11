import { Truck, Sparkles, RefreshCw, ShieldCheck, CreditCard, Headphones } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Frete grátis", description: "Entrega gratuita para todo o Brasil." },
  { icon: Sparkles, title: "Produtos novos", description: "Todos os aparelhos são novos e lacrados." },
  { icon: RefreshCw, title: "Troca facilitada", description: "Upgrade ou troca sem complicação." },
  { icon: ShieldCheck, title: "Sem burocracia", description: "Processo 100% online e simplificado." },
  { icon: CreditCard, title: "Pagamento flexível", description: "Cartão de crédito ou boleto bancário." },
  { icon: Headphones, title: "Suporte dedicado", description: "Atendimento rápido quando precisar." },
];

export function Benefits() {
  return (
    <section className="surface-dark py-20 md:py-28">
      <div className="container">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Vantagens</span>
          <h2 className="font-display mt-3 text-3xl font-bold text-surface-dark-foreground md:text-4xl">
            Por que escolher a allu.reis?
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-6 transition-all hover:border-primary/30 hover:bg-sidebar-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-surface-dark-foreground">{b.title}</h3>
              <p className="mt-2 text-sm text-surface-dark-foreground/60">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
