import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Copy, KeyRound, Loader2, LogOut, Plus, Search, Shield, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function formatDate(value?: Date | string | null) {
  if (!value) return "Sem validade";
  return new Date(value).toLocaleString("pt-BR");
}

function statusLabel(status: string) {
  return status === "active" ? "Ativa" : "Inativa";
}

export default function Admin() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="cyber-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
      </main>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (user.role !== "admin") {
    return <AccessDenied onLogout={logout} />;
  }

  return <AdminDashboard onLogout={logout} />;
}

function AdminLogin() {
  const [loginUser, setLoginUser] = useState("");
  const [password, setPassword] = useState("");

  function handleOAuthLogin() {
    if (!loginUser.trim() || !password.trim()) {
      toast.error("Preencha usuário e senha para identificar a sessão antes do OAuth.");
      return;
    }
    window.location.href = getLoginUrl();
  }

  return (
    <main className="cyber-screen flex items-center justify-center p-6">
      <section className="cyber-card w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <Shield className="h-7 w-7 text-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.55em] text-cyan-200/80">Auth Proxy</p>
          <h1 className="mt-3 text-4xl font-black tracking-[0.16em] text-white">ADMIN</h1>
          <p className="mt-3 text-sm text-cyan-100/60">Autenticação segura via Manus OAuth</p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-[0.28em] text-cyan-100/70">Usuário</label>
          <input className="cyber-input" value={loginUser} onChange={event => setLoginUser(event.target.value)} placeholder="Digite seu usuário" autoComplete="username" />
          <label className="block text-xs uppercase tracking-[0.28em] text-cyan-100/70">Senha</label>
          <input className="cyber-input" value={password} onChange={event => setPassword(event.target.value)} placeholder="Digite sua senha" type="password" autoComplete="current-password" />
          <p className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-xs leading-5 text-cyan-100/55">Os campos identificam a tentativa de acesso nesta tela. A autenticação obrigatória e definitiva do painel é concluída pelo Manus OAuth.</p>
          <Button className="cyber-button h-12 w-full" onClick={handleOAuthLogin}>
            Acessar painel com Manus OAuth
          </Button>
        </div>
      </section>
    </main>
  );
}

function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <main className="cyber-screen flex min-h-screen items-center justify-center p-6">
      <section className="cyber-card max-w-lg p-8 text-center">
        <AlertTriangle className="mx-auto mb-5 h-10 w-10 text-red-300" />
        <h1 className="text-3xl font-black tracking-[0.12em] text-white">ACESSO NEGADO</h1>
        <p className="mt-4 text-sm leading-7 text-cyan-100/65">Sua sessão Manus OAuth está ativa, mas este usuário não possui papel administrativo. Solicite a promoção do usuário para admin antes de operar o gerador de keys.</p>
        <Button className="mt-6 border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10" variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair da sessão
        </Button>
      </section>
    </main>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const utils = trpc.useUtils();
  const [clientName, setClientName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; code: string; clientName: string } | null>(null);

  const keysQuery = trpc.keys.list.useQuery();
  const detailsQuery = trpc.keys.details.useQuery({ code: selectedCode ?? "" }, { enabled: Boolean(selectedCode) });

  const createMutation = trpc.keys.create.useMutation({
    onSuccess: key => {
      toast.success("Key gerada com sucesso.");
      setClientName("");
      setExpiresAt("");
      setStatus("active");
      setSelectedCode(key?.code ?? null);
      utils.keys.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const deleteMutation = trpc.keys.remove.useMutation({
    onSuccess: () => {
      toast.success("Key excluída com confirmação.");
      setDeleteTarget(null);
      setSelectedCode(null);
      utils.keys.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const activeCount = useMemo(() => keysQuery.data?.filter(key => key.status === "active").length ?? 0, [keysQuery.data]);
  const inactiveCount = useMemo(() => keysQuery.data?.filter(key => key.status === "inactive").length ?? 0, [keysQuery.data]);

  function handleCreate() {
    if (!clientName.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    createMutation.mutate({
      clientName,
      status,
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
    });
  }

  function handleCheck(code?: string) {
    const normalized = (code ?? searchCode).trim();
    if (!normalized) {
      toast.error("Informe uma key para checar.");
      return;
    }
    setSelectedCode(normalized);
  }

  return (
    <main className="cyber-screen min-h-screen p-4 text-cyan-50 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="cyber-card flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.55em] text-cyan-200/70">Command center</p>
            <h1 className="mt-3 text-3xl font-black tracking-[0.12em] text-white md:text-5xl">AUTH PROXY</h1>
            <p className="mt-2 text-sm text-cyan-100/60">Gerenciamento seguro de API keys, autorização de IP e logs de sincronização.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="cyber-ghost-button" href="/cliente">Abrir portal do cliente</a>
            <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric title="Keys cadastradas" value={keysQuery.data?.length ?? 0} tone="cyan" />
          <Metric title="Keys ativas" value={activeCount} tone="green" />
          <Metric title="Keys inativas" value={inactiveCount} tone="red" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="cyber-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-bold tracking-[0.08em] text-white">Gerar nova key</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="cyber-label">Nome do cliente</label>
                <input className="cyber-input" value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Ex: Cliente Premium 01" />
              </div>
              <div>
                <label className="cyber-label">Validade</label>
                <input className="cyber-input" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} type="date" />
              </div>
              <div>
                <label className="cyber-label">Status</label>
                <select className="cyber-input" value={status} onChange={event => setStatus(event.target.value as "active" | "inactive")}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <Button className="cyber-button h-12 w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Gerar key
              </Button>
            </div>

            <div className="mt-8 border-t border-cyan-300/10 pt-6">
              <label className="cyber-label">Checar detalhes por key</label>
              <div className="flex gap-2">
                <input className="cyber-input" value={searchCode} onChange={event => setSearchCode(event.target.value)} placeholder="APX-..." />
                <Button className="border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20" onClick={() => handleCheck()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="cyber-card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-cyan-300/10 p-5">
              <h2 className="text-xl font-bold tracking-[0.08em] text-white">Keys cadastradas</h2>
              {keysQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-cyan-300/5 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                  <tr>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Key</th>
                    <th className="px-5 py-4">IP autorizado</th>
                    <th className="px-5 py-4">Validade</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {keysQuery.data?.map(key => (
                    <tr key={key.id} className="border-t border-cyan-300/10 text-cyan-50/85 hover:bg-cyan-300/5">
                      <td className="px-5 py-4 font-semibold text-white">{key.clientName}</td>
                      <td className="px-5 py-4 font-mono text-xs text-cyan-200">{key.code}</td>
                      <td className="px-5 py-4">{key.authorizedIp ?? "Não definido"}</td>
                      <td className="px-5 py-4">{formatDate(key.expiresAt)}</td>
                      <td className="px-5 py-4"><span className={key.status === "active" ? "cyber-badge-green" : "cyber-badge-red"}>{statusLabel(key.status)}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100" onClick={() => handleCheck(key.code)}>Checar</Button>
                          <Button size="sm" variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100" onClick={() => { navigator.clipboard.writeText(key.code); toast.success("Key copiada."); }}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="border-red-400/40 bg-red-500/10 text-red-100 hover:bg-red-500/20" onClick={() => setDeleteTarget({ id: key.id, code: key.code, clientName: key.clientName })}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!keysQuery.isLoading && keysQuery.data?.length === 0 && (
                    <tr><td className="px-5 py-10 text-center text-cyan-100/55" colSpan={6}>Nenhuma key cadastrada ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {selectedCode && (
          <section className="cyber-card p-6">
            <h2 className="mb-4 text-xl font-bold tracking-[0.08em] text-white">Detalhes da key</h2>
            {detailsQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />}
            {detailsQuery.error && <p className="text-red-200">{detailsQuery.error.message}</p>}
            {detailsQuery.data && (
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Cliente" value={detailsQuery.data.key.clientName} />
                  <Info label="IP autorizado" value={detailsQuery.data.key.authorizedIp ?? "Não definido"} />
                  <Info label="Criada em" value={formatDate(detailsQuery.data.key.createdAt)} />
                  <Info label="Validade" value={formatDate(detailsQuery.data.key.expiresAt)} />
                  <Info label="Último acesso" value={formatDate(detailsQuery.data.key.lastAccessAt)} />
                  <Info label="Status" value={statusLabel(detailsQuery.data.key.status)} />
                </div>
                <div>
                  <p className="cyber-label">Logs de sincronização</p>
                  <div className="max-h-64 space-y-2 overflow-auto pr-2">
                    {detailsQuery.data.logs.map(log => (
                      <div key={log.id} className="rounded-xl border border-cyan-300/10 bg-black/25 p-3 text-sm text-cyan-50/80">
                        <p><strong className="text-cyan-200">{formatDate(log.createdAt)}</strong></p>
                        <p>IP anterior: {log.previousIp ?? "Não definido"} → Novo IP: {log.newIp ?? "Não definido"}</p>
                      </div>
                    ))}
                    {detailsQuery.data.logs.length === 0 && <p className="text-cyan-100/55">Nenhuma sincronização registrada.</p>}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="cyber-card max-w-lg p-6">
            <AlertTriangle className="mb-4 h-8 w-8 text-red-300" />
            <h2 className="text-2xl font-bold text-white">Confirmar exclusão</h2>
            <p className="mt-3 text-cyan-100/70">Você está prestes a excluir definitivamente a key de <strong>{deleteTarget.clientName}</strong>. Esta ação remove também os logs vinculados.</p>
            <p className="mt-3 rounded-xl border border-red-300/20 bg-red-500/10 p-3 font-mono text-xs text-red-100">{deleteTarget.code}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-500" onClick={() => deleteMutation.mutate({ id: deleteTarget.id, confirmation: true })} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Confirmar exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({ title, value, tone }: { title: string; value: number; tone: "cyan" | "green" | "red" }) {
  const color = tone === "green" ? "text-emerald-200" : tone === "red" ? "text-red-200" : "text-cyan-200";
  return (
    <div className="cyber-card p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/50">{title}</p>
      <p className={`mt-3 text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-black/25 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/45">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-cyan-50">{value}</p>
    </div>
  );
}
