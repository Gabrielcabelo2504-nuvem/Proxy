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
    <main className="cyber-screen min-h-screen p-3 md:p-4 lg:p-8 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        <header className="flex flex-col justify-between gap-3 md:gap-4 border-b border-cyan-300/10 pb-4 md:pb-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_36px_rgba(34,211,238,0.25)]">
              <Radar className="h-5 w-5 md:h-6 md:w-6 text-cyan-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Auth Proxy Client</p>
              <h1 className="text-xl md:text-2xl font-black tracking-[0.08em] text-white">PORTAL DO CLIENTE</h1>
            </div>
          </div>
          <a className="cyber-ghost-button text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 h-9 md:h-11" href="/admin">Acesso administrativo</a>
        </header>

        <section className="grid gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="cyber-card p-4 md:p-6 lg:p-8">
            <div className="mb-6 md:mb-8">
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/70">Atualizar IP</p>
              <h2 className="mt-2 md:mt-3 text-2xl md:text-4xl font-black tracking-[0.1em] text-white">SINCRONIZAÇÃO SEGURA</h2>
              <p className="mt-3 md:mt-4 max-w-2xl text-xs md:text-sm text-cyan-100/60">Insira sua key para consultar o IP autorizado e sincronizar um novo endereço. O sistema registra cada alteração no histórico da key.</p>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="cyber-label text-xs md:text-sm">Sua key de acesso</label>
                <div className="flex flex-col gap-2 md:gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3 md:left-4 top-1/2 h-3 w-3 md:h-4 md:w-4 -translate-y-1/2 text-cyan-200/50" />
                    <input className="cyber-input pl-9 md:pl-11 text-sm" value={code} onChange={event => setCode(event.target.value)} placeholder="Cole sua key aqui..." />
                  </div>
                  <Button className="cyber-button h-9 md:h-11 md:h-12 min-w-28 md:min-w-36 text-xs md:text-sm" onClick={handleBuscarIp} disabled={buscarIpMutation.isPending}>
                    {buscarIpMutation.isPending ? <Loader2 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <Radar className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />}
                    Buscar IP
                  </Button>
                </div>
              </div>

              <div>
                <label className="cyber-label text-xs md:text-sm">Novo endereço de IP</label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3 md:left-4 top-1/2 h-3 w-3 md:h-4 md:w-4 -translate-y-1/2 text-cyan-200/50" />
                  <input className="cyber-input pl-9 md:pl-11 text-sm" value={newIp} onChange={event => setNewIp(event.target.value)} placeholder="Ex: 177.123.45.67" />
                </div>
              </div>

              <Button className="cyber-button h-10 md:h-12 md:h-14 w-full text-sm md:text-base" onClick={handleSincronizarIp} disabled={sincronizarMutation.isPending}>
                {sincronizarMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Globe2 className="mr-2 h-4 w-4 md:h-5 md:w-5" />}
                Sincronizar IP
              </Button>
            </div>
          </div>

          <aside className="space-y-4 md:space-y-5">
            <div className="cyber-card p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-cyan-200" />
                <h3 className="text-base md:text-lg font-bold tracking-[0.08em] text-white">Status da autorização</h3>
              </div>
              {result ? (
                <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
                  <Info label="Cliente" value={result.clientName} />
                  <Info label="IP autorizado" value={result.authorizedIp ?? "Nenhum IP definido"} />
                  <Info label="Validade" value={formatDate(result.expiresAt)} />
                  <Info label="Último acesso" value={formatDate(result.lastAccessAt)} />
                </div>
              ) : (
                <p className="mt-4 md:mt-6 text-xs md:text-sm leading-6 md:leading-7 text-cyan-100/60">Nenhuma key consultada ainda. Use o botão <strong className="text-cyan-100">Buscar IP</strong> para exibir o endereço autorizado atualmente.</p>
              )}
            </div>

            <div className="cyber-card p-4 md:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/60">XIT PROXY - Configuração</p>
              <div className="mt-4 md:mt-5 grid gap-2 md:gap-3">
                <Info label="Servidor" value="172.86.114.247" />
                <Info label="Porta HS Pescoço" value="8881" />
                <Info label="Porta HS Peito" value="3333" />
                <Info label="Usuário" value="ARIFI" />
                <Info label="Senha" value="ARIFI" />
              </div>
              <Button asChild className="mt-4 md:mt-6 h-9 md:h-12 w-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20 text-xs md:text-sm">
                <a href="https://www.mediafire.com/file/54ron26rizd5004/Marcelo+ruiz+.cer/file" target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Download do certificado
                </a>
              </Button>
            </div>

            <div className="cyber-card p-4 md:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/60">Ferramentas úteis</p>
              <p className="mt-3 md:mt-4 text-xs md:text-sm leading-5 md:leading-6 text-cyan-100/70">Descubra seu IP aqui</p>
              <Button asChild className="mt-3 md:mt-4 h-9 md:h-12 w-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20 text-xs md:text-sm">
                <a href="https://meuip.com/" target="_blank" rel="noopener noreferrer">
                  <Globe2 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Verificar meu IP
                </a>
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
    <div className="rounded-xl border border-cyan-300/10 bg-black/25 p-3 md:p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">{label}</p>
      <p className="mt-1.5 md:mt-2 break-words font-mono text-xs md:text-sm text-cyan-50 select-all">{value}</p>
    </div>
  );
}
