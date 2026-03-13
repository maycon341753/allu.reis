import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, CreditCard, FileText, Headphones, UserCircle, LogOut, Mail, Phone as PhoneIcon, IdCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/cliente" },
  { icon: Package, label: "Meus Aluguéis", path: "/cliente/alugueis" },
  { icon: CreditCard, label: "Pagamentos", path: "/cliente/pagamentos" },
  { icon: FileText, label: "Documentos", path: "/cliente/documentos" },
  { icon: Headphones, label: "Suporte", path: "/cliente/suporte" },
  { icon: UserCircle, label: "Perfil", path: "/cliente/perfil" },
];

function formatCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export default function ClientProfile() {
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session?.user?.id) return;
      setUid(session.user.id);
      setEmail(session.user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, cpf")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setCpf(formatCpf(String(profile.cpf || "")));
      }
    };
    run();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || !uid) return;
    if (!fullName || !email) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome e e‑mail são obrigatórios" });
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: uid,
          full_name: fullName.trim(),
          phone: phone.trim(),
          cpf: cpf.replace(/\D/g, ""),
        });
      if (error) throw error;
      toast({ title: "Perfil atualizado" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message || "Tente novamente" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-base font-bold text-primary-foreground">a</span>
          </div>
          <span className="font-display text-lg font-bold">
            allu<span className="text-primary">.reis</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
            <LogOut size={18} /> Sair
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold">Perfil</h1>
        <p className="mt-1 text-muted-foreground">
          Seus dados pessoais estão bloqueados para edição. Para alterar, acesse{" "}
          <Link to="/cliente/suporte" className="text-primary underline hover:text-primary/80">Suporte</Link>{" "}
          e abra um chamado.
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
          <div className="sm:col-span-2">
            <Label htmlFor="email">E‑mail</Label>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" value={email} readOnly className="pl-10" />
            </div>
          </div>
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <div className="relative mt-1">
              <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="full_name" value={fullName} readOnly disabled placeholder="Seu nome" className="pl-10" required />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative mt-1">
              <PhoneIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" value={phone} readOnly disabled placeholder="(11) 99999-9999" className="pl-10" />
            </div>
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <div className="relative mt-1">
              <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="cpf" value={cpf} readOnly disabled placeholder="000.000.000-00" className="pl-10" maxLength={14} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button asChild variant="outline">
              <Link to="/cliente/suporte">Solicitar alteração via Suporte</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
