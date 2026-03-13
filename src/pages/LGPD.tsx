import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function LGPD() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="font-display text-3xl font-bold">LGPD e Proteção de Dados</h1>
          <p className="mt-3 text-muted-foreground">
            Esta página descreve como a allu.reis trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
          <div className="mt-6 space-y-4 text-sm leading-6">
            <section>
              <h2 className="font-semibold text-foreground">Bases legais e finalidades</h2>
              <p className="text-muted-foreground">
                Coletamos e tratamos dados pessoais para cadastro, análise de crédito, contratação, faturamento, logística e suporte ao cliente.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-foreground">Direitos do titular</h2>
              <p className="text-muted-foreground">
                Você pode solicitar confirmação do tratamento, acesso, correção, anonimização, portabilidade, informação sobre compartilhamentos e revogação de consentimento.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-foreground">Segurança e retenção</h2>
              <p className="text-muted-foreground">
                Adotamos medidas técnicas e administrativas para proteger os dados pessoais e mantemos os registros somente pelo tempo necessário às finalidades previstas.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-foreground">Contato do Encarregado</h2>
              <p className="text-muted-foreground">
                Para exercer seus direitos, contate nosso Encarregado (DPO) pelo e-mail suporte@allu.reis.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
