import { Search, ListChecks, FileText, Package } from "lucide-react";

const steps = [
  { icon: Search, title: "Escolha o produto", description: "Navegue pelo catálogo e encontre o eletrônico ideal para você." },
  { icon: ListChecks, title: "Escolha o plano", description: "Selecione entre 12, 24 ou 36 meses de assinatura." },
  { icon: FileText, title: "Envie seus documentos", description: "Processo rápido de verificação para sua segurança." },
  { icon: Package, title: "Receba em casa", description: "Entrega gratuita em todo o Brasil com rastreamento." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Simples e rápido</span>
          <h2 className="font-display mt-3 text-3xl font-bold md:text-4xl">Como funciona</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Em apenas 4 passos você já pode usar o eletrônico dos seus sonhos
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="card-elevated group relative rounded-2xl border border-border bg-card p-6 text-center"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <step.icon size={24} />
              </div>
              <div className="mt-2 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-primary/20">{i + 1}</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
