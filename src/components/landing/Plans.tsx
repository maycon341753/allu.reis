export function Plans() {
  const plans = [
    { months: 12, highlight: false, description: "Assine por 12 meses e troque quando acabar." },
    { months: 24, highlight: true, description: "Melhor custo mensal. Destaque para 24 meses." },
    { months: 36, highlight: false, description: "Pagamento mensal menor com prazo maior." },
  ];
  return (
    <section id="planos" className="py-20 md:py-28 scroll-mt-24">
      <div className="container">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Planos</span>
          <h2 className="font-display mt-3 text-3xl font-bold md:text-4xl">Escolha seu plano</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Selecione o prazo que melhor se encaixa no seu orçamento e necessidades.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.months}
              className={`rounded-2xl border p-6 ${
                p.highlight ? "border-primary bg-accent" : "border-border bg-card"
              }`}
            >
              <div className="font-display text-2xl font-bold">{p.months} meses</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-4 text-xs text-muted-foreground">Valores finais por produto no checkout</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
