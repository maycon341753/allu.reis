import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold">Política de Privacidade</h1>
          <p className="mt-3 text-muted-foreground">
            Esta Política descreve como a allu.reis coleta, usa e compartilha informações pessoais durante o uso de nossos serviços.
          </p>
          <div className="mt-6 space-y-4 text-sm leading-6">
            <section>
              <h2 className="font-semibold text-foreground">Coleta de dados</h2>
              <p className="text-muted-foreground">
                Coletamos dados fornecidos por você e gerados pelo uso da plataforma, incluindo informações de cadastro e contratação.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-foreground">Compartilhamento</h2>
              <p className="text-muted-foreground">
                Compartilhamos dados apenas com parceiros essenciais para a prestação do serviço, conforme bases legais aplicáveis.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-foreground">Segurança</h2>
              <p className="text-muted-foreground">
                Empregamos medidas de proteção para preservar a confidencialidade, integridade e disponibilidade das informações.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
