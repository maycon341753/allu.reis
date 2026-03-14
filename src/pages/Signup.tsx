import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Phone, ArrowRight, IdCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("checkoutInfo");
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj.nome) setName(obj.nome);
        if (obj.email) setEmail(obj.email);
        if (obj.telefone) setPhoneInput(obj.telefone);
        if (obj.cpf) {
          const d = String(obj.cpf || "").replace(/\D/g, "");
          const v =
            d.length <= 3
              ? d
              : d.length <= 6
              ? `${d.slice(0, 3)}.${d.slice(3)}`
              : d.length <= 9
              ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
              : `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
          setCpf(v);
        }
      }
    } catch {}
  }, []);

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  };
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    const ddd = d.slice(0, 2);
    const nine = d.slice(2, 3);
    const p1 = d.length > 10 ? d.slice(3, 7) : d.slice(2, 6);
    const p2 = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
    let out = "";
    if (ddd) out = `(${ddd})`;
    if (d.length > 10) out = `(${ddd}) ${nine}${p1}${p2 ? "-" + p2 : ""}`;
    else if (p1) out = `(${ddd}) ${p1}${p2 ? "-" + p2 : ""}`;
    return out.trim();
  };
  const isValidCpfFormat = (v: string) => /^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/.test(v.trim());
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const full_name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = phoneInput.trim();
    const password = String(data.get("password") || "");
    const passwordConfirm = String(data.get("passwordConfirm") || "");
    const cpfValue = cpf.trim();
    if (!isValidCpfFormat(cpfValue)) {
      toast({ title: "CPF inválido", description: "Use o formato 000.000.000-00" });
      return;
    }
    if (!email || !password || !full_name || !phone) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome, CPF, e‑mail, telefone e senha são obrigatórios" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Senha fraca", description: "A senha deve ter pelo menos 8 caracteres" });
      return;
    }
    if (password !== passwordConfirm) {
      toast({ title: "Senhas diferentes", description: "Confirme a mesma senha digitada" });
      return;
    }
    try {
      setLoading(true);
      const { data: signData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone,
            cpf: cpfValue.replace(/\D/g, ""),
          },
        },
      });
      if (error) throw error;
      const uid = signData.session?.user?.id;
      if (uid) {
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: uid,
            full_name,
            phone,
            cpf: cpfValue.replace(/\D/g, ""),
          });
        if (upsertError) {
          toast({ title: "Perfil não atualizado", description: upsertError.message });
        }
      }
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login.",
      });
      const next = searchParams.get("next");
      if (next) {
        navigate(next);
      } else {
        navigate("/cliente");
      }
      form.reset();
      setCpf("");
    } catch (err: any) {
      toast({
        title: "Erro ao criar conta",
        description: err?.message || "Tente novamente mais tarde",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 pt-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md py-12">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="font-display text-2xl font-bold text-primary-foreground">a</span>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Criar sua conta</h1>
            <p className="mt-2 text-muted-foreground">Comece a alugar tecnologia agora</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative mt-1">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" name="name" placeholder="Seu nome" className="pl-10" required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative mt-1">
                <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cpf"
                  name="cpf"
                  inputMode="numeric"
                  title="Informe 11 dígitos no formato 000.000.000-00"
                  placeholder="000.000.000-00"
                  className="pl-10"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  maxLength={14}
                  autoComplete="off"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (!isValidCpfFormat(v)) {
                      e.target.setCustomValidity("Informe 11 dígitos no formato 000.000.000-00");
                    } else {
                      e.target.setCustomValidity("");
                    }
                  }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.setCustomValidity("");
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="seu@email.com" className="pl-10" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative mt-1">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  required
                  inputMode="numeric"
                  maxLength={16}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="passwordConfirm">Confirmar senha</Label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  placeholder="Repita a senha"
                  className="pl-10"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button className="w-full gap-2" size="lg" disabled={loading}>
              Criar conta <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Fazer login</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
