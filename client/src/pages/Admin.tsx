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
    <main className="cyber-screen flex items-center justify-center p-3 md:p-6">
      <section className="cyber-card w-full max-w-md p-4 md:p-8">
        <div className="mb-6 md:mb-8 flex flex-col items-center text-center">
          <div className="mb-3 md:mb-5 grid h-10 w-10 md:h-14 md:w-14 place-items-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <Shield className="h-5 w-5 md:h-7 md:w-7 text-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.55em] text-cyan-200/80">Auth Proxy</p>
          <h1 className="mt-2 md:mt-3 text-2xl md:text-4xl font-black tracking-[0.16em] text-white">ADMIN</h1>
          <p className="mt-2 md:mt-3 text-xs md:text-sm text-cyan-100/60">Autenticação segura via Manus OAuth</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <label className="block text-xs uppercase tracking-[0.28em] text-cyan-100/70">Usuário</label>
          <input className="cyber-input text-sm" value={loginUser} onChange={event => setLoginUser(event.target.value)} placeholder="Digite seu usuário" autoComplete="username" />
          <label className="block text-xs uppercase tracking-[0.28em] text-cyan-100/70">Senha</label>
          <input className="cyber-input text-sm" value={password} onChange={event => setPassword(event.target.value)} placeholder="Digite sua senha" type="password" autoComplete="current-password" />
          <p className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-2 md:p-3 text-xs leading-5 text-cyan-100/55">Os campos identificam a tentativa de acesso nesta tela. A autenticação obrigatória e definitiva do painel é concluída pelo Manus OAuth.</p>
          <Button className="cyber-button h-10 md:h-12 w-full text-sm md:text-base" onClick={handleOAuthLogin}>
            Acessar painel com Manus OAuth
          </Button>
        </div>
      </section>
    </main>
  );
}

function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <main className="cyber-screen flex min-h-screen items-center justify-center p-3 md:p-6">
      <section className="cyber-card max-w-lg p-4 md:p-8 text-center w-full">
        <AlertTriangle className="mx-auto mb-3 md:mb-5 h-8 w-8 md:h-10 md:w-10 text-red-300" />
        <h1 className="text-xl md:text-3xl font-black tracking-[0.12em] text-white">ACESSO NEGADO</h1>
        <p className="mt-3 md:mt-4 text-xs md:text-sm leading-6 md:leading-7 text-cyan-100/65">Sua sessão Manus OAuth está ativa, mas este usuário não possui papel administrativo. Solicite a promoção do usuário para admin antes de operar o gerador de keys.</p>
        <Button className="mt-4 md:mt-6 border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10 h-9 md:h-10 text-xs md:text-sm" variant="outline" onClick={onLogout}>
          <LogOut className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Sair da sessão
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
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterExpiring, setFilterExpiring] = useState(false);

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

  function setExpirationDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    setExpiresAt(`${year}-${month}-${day}`);
  }

  const filteredKeys = useMemo(() => {
    if (!keysQuery.data) return [];
    let result = keysQuery.data;
    if (filterStatus !== "all") {
      result = result.filter(key => key.status === filterStatus);
    }
    if (filterExpiring) {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter(key => {
        if (!key.expiresAt) return false;
        const expiryDate = new Date(key.expiresAt);
        return expiryDate <= sevenDaysFromNow && expiryDate > now;
      });
    }
    return result;
  }, [keysQuery.data, filterStatus, filterExpiring]);

  function exportToCSV() {
    if (!keysQuery.data || keysQuery.data.length === 0) {
      toast.error("Nenhuma key para exportar.");
      return;
    }
    const headers = ["Cliente", "Key", "IP Autorizado", "Validade", "Status", "Criada em", "Último acesso"];
    const rows = keysQuery.data.map(key => [
      key.clientName,
      key.code,
      key.authorizedIp || "Não definido",
      formatDate(key.expiresAt),
      statusLabel(key.status),
      formatDate(key.createdAt),
      formatDate(key.lastAccessAt),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `auth-proxy-keys-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Arquivo CSV exportado com sucesso.");
  }

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

        <section className="grid gap-6 lg:grid-cols-[350px_1fr] xl:grid-cols-[420px_1fr]">
          <div className="cyber-card p-4 md:p-6">
            <div className="mb-4 flex items-center gap-2 md:gap-3">
              <KeyRound className="h-4 w-4 md:h-5 md:w-5 text-cyan-200" />
              <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Gerar nova key</h2>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="cyber-label text-xs md:text-sm">Nome do cliente</label>
                <input className="cyber-input text-sm" value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Ex: Cliente Premium 01" />
              </div>
              <div>
                <label className="cyber-label text-xs md:text-sm">Validade</label>
                <input className="cyber-input text-sm" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} type="date" />
                <div className="mt-2 md:mt-3 grid grid-cols-5 gap-1 md:gap-2">
                  <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8 md:h-9" onClick={() => setExpirationDays(1)}>1d</Button>
                  <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8 md:h-9" onClick={() => setExpirationDays(3)}>3d</Button>
                  <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8 md:h-9" onClick={() => setExpirationDays(7)}>7d</Button>
                  <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8 md:h-9" onClick={() => setExpirationDays(15)}>15d</Button>
                  <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8 md:h-9" onClick={() => setExpirationDays(30)}>30d</Button>
                </div>
              </div>
              <div>
                <label className="cyber-label text-xs md:text-sm">Status</label>
                <select className="cyber-input text-sm" value={status} onChange={event => setStatus(event.target.value as "active" | "inactive")}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <Button className="cyber-button h-10 md:h-12 w-full text-sm md:text-base" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />}
                Gerar key
              </Button>
            </div>

            <div className="mt-6 md:mt-8 border-t border-cyan-300/10 pt-4 md:pt-6">
              <label className="cyber-label text-xs md:text-sm">Checar detalhes por key</label>
              <div className="flex gap-2">
                <input className="cyber-input text-sm" value={searchCode} onChange={event => setSearchCode(event.target.value)} placeholder="APX-..." />
                <Button className="border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20 h-10 md:h-11 px-3" onClick={() => handleCheck()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="cyber-card overflow-hidden p-0">
            <div className="border-b border-cyan-300/10 p-3 md:p-5">
              <div className="mb-3 md:mb-4 flex flex-col items-start justify-between gap-3 md:gap-4">
                <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Keys cadastradas</h2>
                <div className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap">
                  <select className="cyber-input text-xs h-9 md:h-10" value={filterStatus} onChange={event => setFilterStatus(event.target.value as "all" | "active" | "inactive")}>
                    <option value="all">Todos os status</option>
                    <option value="active">Apenas ativas</option>
                    <option value="inactive">Apenas inativas</option>
                  </select>
                  <Button size="sm" variant={filterExpiring ? "default" : "outline"} className={filterExpiring ? "cyber-button text-xs h-9 md:h-10" : "border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-9 md:h-10"} onClick={() => setFilterExpiring(!filterExpiring)}>Expirando em 7d</Button>
                  <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-9 md:h-10" onClick={exportToCSV}>Exportar CSV</Button>
                  {keysQuery.isLoading && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-cyan-200" />}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs md:text-sm">
                <thead className="bg-cyan-300/5 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                  <tr>
                    <th className="px-2 md:px-5 py-3 md:py-4">Cliente</th>
                    <th className="px-2 md:px-5 py-3 md:py-4">Key</th>
                    <th className="px-2 md:px-5 py-3 md:py-4 hidden sm:table-cell">IP</th>
                    <th className="px-2 md:px-5 py-3 md:py-4">Validade</th>
                    <th className="px-2 md:px-5 py-3 md:py-4">Status</th>
                    <th className="px-2 md:px-5 py-3 md:py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map(key => {
                    const now = new Date();
                    const expiryDate = key.expiresAt ? new Date(key.expiresAt) : null;
                    const isExpired = expiryDate && expiryDate < now;
                    const isExpiringSoon = expiryDate && expiryDate > now && expiryDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={key.id} className={`border-t border-cyan-300/10 text-cyan-50/85 hover:bg-cyan-300/5 ${isExpiringSoon ? "bg-red-500/10" : ""}`}>
                        <td className="px-2 md:px-5 py-3 md:py-4 font-semibold text-white text-xs md:text-sm">{key.clientName}</td>
                        <td className="px-2 md:px-5 py-3 md:py-4 font-mono text-xs text-cyan-200 truncate">{key.code}</td>
                        <td className="px-2 md:px-5 py-3 md:py-4 hidden sm:table-cell text-xs">{key.authorizedIp ?? "N/A"}</td>
                        <td className="px-2 md:px-5 py-3 md:py-4 text-xs md:text-sm">{formatDate(key.expiresAt)}</td>
                        <td className="px-2 md:px-5 py-3 md:py-4">
                          <div className="flex flex-wrap items-center gap-1 md:gap-2">
                            <span className={key.status === "active" ? "cyber-badge-green text-xs" : "cyber-badge-red text-xs"}>{statusLabel(key.status)}</span>
                            {isExpired && <span className="rounded-md bg-red-600/40 px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-red-50">Exp</span>}
                            {isExpiringSoon && <span className="rounded-md bg-orange-500/30 px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-orange-100">Exp!</span>}
                          </div>
                        </td>
                        <td className="px-2 md:px-5 py-3 md:py-4">
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            <Button size="sm" variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 h-8 px-2 md:h-9 md:px-3 text-xs" onClick={() => handleCheck(key.code)}>Checar</Button>
                            <Button size="sm" variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 h-8 px-2 md:h-9 md:px-3" onClick={() => { navigator.clipboard.writeText(key.code); toast.success("Key copiada."); }}><Copy className="h-3 w-3 md:h-3.5 md:w-3.5" /></Button>
                            <Button size="sm" variant="outline" className="border-red-400/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 h-8 px-2 md:h-9 md:px-3" onClick={() => setDeleteTarget({ id: key.id, code: key.code, clientName: key.clientName })}><Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!keysQuery.isLoading && filteredKeys.length === 0 && (
                    <tr><td className="px-5 py-10 text-center text-cyan-100/55" colSpan={6}>{keysQuery.data?.length === 0 ? "Nenhuma key cadastrada ainda." : "Nenhuma key corresponde aos filtros aplicados."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {selectedCode && (
          <section className="cyber-card p-4 md:p-6">
            <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold tracking-[0.08em] text-white">Detalhes da key</h2>
            {detailsQuery.isLoading && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-cyan-200" />}
            {detailsQuery.error && <p className="text-xs md:text-sm text-red-200">{detailsQuery.error.message}</p>}
            {detailsQuery.data && (
              <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="grid gap-2 md:gap-3 sm:grid-cols-2">
                  <Info label="Cliente" value={detailsQuery.data.key.clientName} />
                  <Info label="IP autorizado" value={detailsQuery.data.key.authorizedIp ?? "Não definido"} />
                  <Info label="Criada em" value={formatDate(detailsQuery.data.key.createdAt)} />
                  <Info label="Validade" value={formatDate(detailsQuery.data.key.expiresAt)} />
                  <Info label="Último acesso" value={formatDate(detailsQuery.data.key.lastAccessAt)} />
                  <Info label="Status" value={statusLabel(detailsQuery.data.key.status)} />
                </div>
                <div>
                  <p className="cyber-label text-xs md:text-sm">Logs de sincronização</p>
                  <div className="max-h-48 md:max-h-64 space-y-1.5 md:space-y-2 overflow-auto pr-2">
                    {detailsQuery.data.logs.map(log => (
                      <div key={log.id} className="rounded-xl border border-cyan-300/10 bg-black/25 p-2 md:p-3 text-xs md:text-sm text-cyan-50/80">
                        <p><strong className="text-cyan-200">{formatDate(log.createdAt)}</strong></p>
                        <p className="break-words">IP anterior: {log.previousIp ?? "N/A"} → Novo IP: {log.newIp ?? "N/A"}</p>
                      </div>
                    ))}
                    {detailsQuery.data.logs.length === 0 && <p className="text-xs md:text-sm text-cyan-100/55">Nenhuma sincronização registrada.</p>}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 md:p-4 backdrop-blur-sm">
          <div className="cyber-card max-w-lg p-4 md:p-6 w-full">
            <AlertTriangle className="mb-3 md:mb-4 h-6 w-6 md:h-8 md:w-8 text-red-300" />
            <h2 className="text-lg md:text-2xl font-bold text-white">Confirmar exclusão</h2>
            <p className="mt-2 md:mt-3 text-xs md:text-sm text-cyan-100/70">Você está prestes a excluir definitivamente a key de <strong>{deleteTarget.clientName}</strong>. Esta ação remove também os logs vinculados.</p>
            <p className="mt-2 md:mt-3 rounded-xl border border-red-300/20 bg-red-500/10 p-2 md:p-3 font-mono text-xs text-red-100 break-all">{deleteTarget.code}</p>
            <div className="mt-4 md:mt-6 flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
              <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-500 h-9 md:h-10 text-xs md:text-sm" onClick={() => deleteMutation.mutate({ id: deleteTarget.id, confirmation: true })} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <Trash2 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />}
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
    <div className="cyber-card p-3 md:p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/50">{title}</p>
      <p className={`mt-2 md:mt-3 text-2xl md:text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-black/25 p-2.5 md:p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/45">{label}</p>
      <p className="mt-1.5 md:mt-2 break-words text-xs md:text-sm font-semibold text-cyan-50">{value}</p>
    </div>
  );
}
