import { Search, ListChecks, FileText, Package, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

        <div className="mt-24 grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-3xl font-bold md:text-4xl">
              <span className="text-primary">Assinar</span> é melhor
              <br />
              do que comprar
            </h3>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-4">
              <Card className="rounded-2xl border bg-muted/30 w-full sm:w-[320px] md:w-[360px]">
                <CardContent className="p-6">
                  <p className="text-base font-semibold text-foreground">Comprar na loja</p>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <XCircle size={18} className="text-destructive" />
                      <span>Prende limite do cartão</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle size={18} className="text-destructive" />
                      <span>Necessidade de contratação de seguro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle size={18} className="text-destructive" />
                      <span>Desvalorização na revenda do aparelho</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-2xl sm:-ml-6 md:-ml-10 z-10 w-full sm:w-[320px] md:w-[360px] border bg-gradient-to-b from-emerald-900 to-emerald-700 text-emerald-50 mt-4 sm:mt-0">
                <CardContent className="p-6">
                  <Badge className="bg-emerald-500 text-white border-transparent">MELHOR CUSTO BENEFÍCIO</Badge>
                  <p className="mt-3 font-display text-xl font-semibold">Assinar na allu.reis</p>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-emerald-300" />
                      <span>Pagamento mês a mês</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-emerald-300" />
                      <span>Cobertura roubo, furto qualificado e danos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-emerald-300" />
                      <span>Assistência técnica sem burocracia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-emerald-300" />
                      <span>Liberdade para trocar de modelo quando quiser</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
