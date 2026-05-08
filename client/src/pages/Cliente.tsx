import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, Globe2, KeyRound, Loader2, Radar, ShieldCheck, Wifi } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(value?: Date | string | null) {
  if (!value) return "Sem registro";
  return new Date(value).toLocaleString("pt-BR");
}

export default function Cliente() {
  const [code, setCode] = useState("");
  const [newIp, setNewIp] = useState("");
  const [result, setResult] = useState<{ clientName: string; authorizedIp: string | null; expiresAt?: Date | string | null; lastAccessAt?: Date | string | null } | null>(null);

  const buscarIpMutation = trpc.portal.buscarIp.useMutation({
    onSuccess: data => {
      setResult(data);
      setNewIp(data.authorizedIp ?? "");
      toast.success("IP autorizado localizado.");
    },
    onError: error => toast.error(error.message),
  });

  const sincronizarMutation = trpc.portal.sincronizarIp.useMutation({
    onSuccess: data => {
      setResult(previous => ({
        clientName: data.clientName,
        authorizedIp: data.authorizedIp,
        expiresAt: previous?.expiresAt ?? null,
        lastAccessAt: data.lastAccessAt,
      }));
      toast.success("IP sincronizado com sucesso.");
    },
    onError: error => toast.error(error.message),
  });

  function handleBuscarIp() {
    if (!code.trim()) {
      toast.error("Cole sua key antes de buscar o IP.");
      return;
    }
    buscarIpMutation.mutate({ code });
  }

  function handleSincronizarIp() {
    if (!code.trim()) {
      toast.error("Cole sua key antes de sincronizar.");
      return;
    }
    if (!newIp.trim()) {
      toast.error("Informe o novo endereço de IP.");
      return;
    }
    sincronizarMutation.mutate({ code, newIp });
  }

  return (
    <main className="cyber-screen min-h-screen p-4 text-cyan-50 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-cyan-300/10 pb-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_36px_rgba(34,211,238,0.25)]">
              <Radar className="h-6 w-6 text-cyan-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Auth Proxy Client</p>
              <h1 className="text-2xl font-black tracking-[0.08em] text-white">PORTAL DO CLIENTE</h1>
            </div>
          </div>
          <a className="cyber-ghost-button" href="/admin">Acesso administrativo</a>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="cyber-card p-6 md:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/70">Atualizar IP</p>
              <h2 className="mt-3 text-4xl font-black tracking-[0.1em] text-white">SINCRONIZAÇÃO SEGURA</h2>
              <p className="mt-4 max-w-2xl text-cyan-100/60">Insira sua key para consultar o IP autorizado e sincronizar um novo endereço. O sistema registra cada alteração no histórico da key.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="cyber-label">Sua key de acesso</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/50" />
                    <input className="cyber-input pl-11" value={code} onChange={event => setCode(event.target.value)} placeholder="Cole sua key aqui..." />
                  </div>
                  <Button className="cyber-button h-12 min-w-36" onClick={handleBuscarIp} disabled={buscarIpMutation.isPending}>
                    {buscarIpMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                    Buscar IP
                  </Button>
                </div>
              </div>

              <div>
                <label className="cyber-label">Novo endereço de IP</label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/50" />
                  <input className="cyber-input pl-11" value={newIp} onChange={event => setNewIp(event.target.value)} placeholder="Ex: 177.123.45.67" />
                </div>
              </div>

              <Button className="cyber-button h-14 w-full text-base" onClick={handleSincronizarIp} disabled={sincronizarMutation.isPending}>
                {sincronizarMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Globe2 className="mr-2 h-5 w-5" />}
                Sincronizar IP
              </Button>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="cyber-card p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
                <h3 className="text-lg font-bold tracking-[0.08em] text-white">Status da autorização</h3>
              </div>
              {result ? (
                <div className="mt-6 space-y-4">
                  <Info label="Cliente" value={result.clientName} />
                  <Info label="IP autorizado" value={result.authorizedIp ?? "Nenhum IP definido"} />
                  <Info label="Validade" value={formatDate(result.expiresAt)} />
                  <Info label="Último acesso" value={formatDate(result.lastAccessAt)} />
                </div>
              ) : (
                <p className="mt-6 text-sm leading-7 text-cyan-100/60">Nenhuma key consultada ainda. Use o botão <strong className="text-cyan-100">Buscar IP</strong> para exibir o endereço autorizado atualmente.</p>
              )}
            </div>

            <div className="cyber-card p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/60">Proxy info</p>
              <div className="mt-5 grid gap-3">
                <Info label="Servidor" value="144.172.100.226" />
                <Info label="Porta principal" value="1110" />
                <Info label="Porta alternativa" value="1119" />
              </div>
              <Button className="mt-6 h-12 w-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20">
                <Download className="mr-2 h-4 w-4" /> Download do certificado
              </Button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-black/25 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">{label}</p>
      <p className="mt-2 break-words font-mono text-sm text-cyan-50">{value}</p>
    </div>
  );
}
