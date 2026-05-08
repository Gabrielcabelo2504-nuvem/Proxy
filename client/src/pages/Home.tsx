import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound, LockKeyhole, Network } from "lucide-react";

export default function Home() {
  return (
    <main className="cyber-screen min-h-screen p-6 text-cyan-50">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-cyan-200/70">Secure key gateway</p>
            <h1 className="mt-5 text-5xl font-black tracking-[0.1em] text-white md:text-7xl">AUTH PROXY</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cyan-100/65">
              Sistema completo para gerar, consultar e controlar API keys com autorização de IP, portal público do cliente e histórico de sincronizações.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/admin"><Button className="cyber-button h-12 px-7">Painel administrativo <ArrowRight className="ml-2 h-4 w-4" /></Button></a>
              <a className="cyber-ghost-button h-12 px-7" href="/cliente">Portal do cliente</a>
            </div>
          </div>

          <div className="cyber-card p-6">
            <div className="grid gap-4">
              <Feature icon={<LockKeyhole className="h-5 w-5" />} title="Admin com OAuth" text="Acesso protegido por Manus OAuth para controle operacional das keys." />
              <Feature icon={<KeyRound className="h-5 w-5" />} title="Keys persistentes" text="Cadastro com cliente, status, validade, IP autorizado e timestamps." />
              <Feature icon={<Network className="h-5 w-5" />} title="Sincronização de IP" text="Portal público com Buscar IP e Sincronizar IP, registrando logs de cada alteração." />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-black/25 p-5">
      <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">{icon}</div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-cyan-100/60">{text}</p>
    </div>
  );
}
