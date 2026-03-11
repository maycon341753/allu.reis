import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Phone, ArrowRight } from "lucide-react";

export default function SignupPage() {
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

          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative mt-1">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" placeholder="Seu nome" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative mt-1">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" placeholder="(11) 99999-9999" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Mínimo 8 caracteres" className="pl-10" />
              </div>
            </div>
            <Button className="w-full gap-2" size="lg">
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
