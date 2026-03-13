import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold">Termos de Uso</h1>
          <p className="mt-3 text-muted-foreground">
            Estes Termos regulam o uso da plataforma allu.reis e a contratação de planos de assinatura de dispositivos.
          </p>
          <div className="mt-6 space-y-4 text-sm leading-6">
            <section>
              <h2 className="font-semibold text-foreground">Condições gerais</h2>
              <p className="text-muted-foreground">
                Ao utilizar a plataforma, você concorda com as regras de cadastro, elegibilidade, pagamentos e responsabilidade sobre o equipamento.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-foreground">Planos e cobranças</h2>
              <p className="text-muted-foreground">
                Os planos possuem valores mensais e prazos definidos, com cobrança recorrente até o cancelamento ou término do contrato.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
