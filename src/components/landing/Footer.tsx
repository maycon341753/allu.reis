import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="surface-dark border-t border-sidebar-border py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-base font-bold text-primary-foreground">a</span>
            </div>
            <span className="font-display text-lg font-bold text-surface-dark-foreground">
              allu<span className="text-primary">.reis</span>
            </span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-surface-dark-foreground/60">
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como funciona</a>
            <Link to="/produtos" className="hover:text-primary transition-colors">Produtos</Link>
            <a href="#" className="hover:text-primary transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          </nav>

          <p className="text-xs text-surface-dark-foreground/40">
            © 2026 allu.reis. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
