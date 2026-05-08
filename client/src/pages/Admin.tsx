import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Copy, KeyRound, Loader2, LogOut, Plus, Search, Shield, Trash2, Users } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"keys" | "resellers">("keys");
  const [clientName, setClientName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; code: string; clientName: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [resellerName, setResellerName] = useState("");
  const [resellerPassword, setResellerPassword] = useState("");

  const keysQuery = trpc.keys.list.useQuery();
  const resellersQuery = trpc.resellers.list.useQuery();
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

  const createResellerMutation = trpc.resellers.create.useMutation({
    onSuccess: () => {
      toast.success("Revendedor criado com sucesso!");
      setResellerName("");
      setResellerPassword("");
      utils.resellers.list.invalidate();
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

  function handleCreateReseller() {
    if (!resellerName.trim()) {
      toast.error("Informe o nome do revendedor.");
      return;
    }
    if (!resellerPassword.trim()) {
      toast.error("Informe a senha do revendedor.");
      return;
    }

    createResellerMutation.mutate({
      name: resellerName,
      password: resellerPassword,
    });
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

        <div className="cyber-card p-0">
          <div className="flex border-b border-cyan-300/10">
            <button
              onClick={() => setActiveTab("keys")}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold tracking-[0.08em] transition-colors ${
                activeTab === "keys"
                  ? "bg-cyan-300/20 text-cyan-50 border-b-2 border-cyan-300"
                  : "text-cyan-100/60 hover:bg-cyan-300/5"
              }`}
            >
              <KeyRound className="inline mr-2 h-4 w-4" /> API Keys
            </button>
            <button
              onClick={() => setActiveTab("resellers")}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold tracking-[0.08em] transition-colors ${
                activeTab === "resellers"
                  ? "bg-cyan-300/20 text-cyan-50 border-b-2 border-cyan-300"
                  : "text-cyan-100/60 hover:bg-cyan-300/5"
              }`}
            >
              <Users className="inline mr-2 h-4 w-4" /> Revendedores
            </button>
          </div>
        </div>

        {activeTab === "keys" && (
          <>
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
                    <tbody className="divide-y divide-cyan-300/10">
                      {filteredKeys.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-2 md:px-5 py-6 md:py-8 text-center text-cyan-100/50">
                            {keysQuery.data?.length === 0 ? "Nenhuma key cadastrada ainda." : "Nenhuma key corresponde aos filtros aplicados."}
                          </td>
                        </tr>
                      ) : (
                        filteredKeys.map(key => {
                          const isExpiring = key.expiresAt && new Date(key.expiresAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000 && new Date(key.expiresAt).getTime() > Date.now();
                          const isExpired = key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now();
                          return (
                            <tr key={key.id} className="hover:bg-cyan-300/5 transition-colors">
                              <td className="px-2 md:px-5 py-3 md:py-4 font-mono text-cyan-100">{key.clientName}</td>
                              <td className="px-2 md:px-5 py-3 md:py-4 font-mono text-xs md:text-sm text-cyan-300">{key.code}</td>
                              <td className="px-2 md:px-5 py-3 md:py-4 hidden sm:table-cell text-cyan-100/70">{key.authorizedIp || "—"}</td>
                              <td className="px-2 md:px-5 py-3 md:py-4">
                                <span className={isExpired ? "text-red-300" : isExpiring ? "text-yellow-300" : "text-cyan-100"}>
                                  {formatDate(key.expiresAt)}
                                </span>
                              </td>
                              <td className="px-2 md:px-5 py-3 md:py-4">
                                <span className={key.status === "active" ? "text-green-300" : "text-red-300"}>{statusLabel(key.status)}</span>
                              </td>
                              <td className="px-2 md:px-5 py-3 md:py-4 flex gap-1 md:gap-2">
                                <Button size="sm" variant="outline" className="border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20 h-8 md:h-9 px-2 md:px-3" onClick={() => handleCheck(key.code)}>
                                  <Search className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300/30 bg-red-300/10 text-red-100 hover:bg-red-300/20 h-8 md:h-9 px-2 md:px-3" onClick={() => setDeleteTarget({ id: key.id, code: key.code, clientName: key.clientName })}>
                                  <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {selectedCode && detailsQuery.data && (
              <section className="cyber-card p-4 md:p-6">
                <h2 className="mb-4 text-lg md:text-xl font-bold tracking-[0.08em] text-white">Detalhes da key</h2>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Cliente</p>
                    <p className="mt-1 text-sm md:text-base text-cyan-50">{detailsQuery.data.key.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Key</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="font-mono text-xs md:text-sm text-cyan-300">{detailsQuery.data.key.code}</p>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                        navigator.clipboard.writeText(detailsQuery.data.key.code);
                        toast.success("Key copiada!");
                      }}>
                        <Copy className="h-3 w-3 text-cyan-200" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">IP Autorizado</p>
                    <p className="mt-1 text-sm md:text-base text-cyan-50">{detailsQuery.data.key.authorizedIp || "Não definido"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Validade</p>
                    <p className="mt-1 text-sm md:text-base text-cyan-50">{formatDate(detailsQuery.data.key.expiresAt)}</p>
                  </div>
                </div>
                <div className="border-t border-cyan-300/10 pt-4">
                  <h3 className="mb-3 text-sm font-bold text-cyan-100">Histórico de sincronizações</h3>
                  {detailsQuery.data.logs.length === 0 ? (
                    <p className="text-xs text-cyan-100/50">Nenhuma sincronização registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {detailsQuery.data.logs.map(log => (
                        <div key={log.id} className="text-xs text-cyan-100/70 border-l-2 border-cyan-300/30 pl-3 py-1">
                          <p><strong>IP anterior:</strong> {log.previousIp || "—"}</p>
                          <p><strong>IP novo:</strong> {log.newIp}</p>
                          <p><strong>Data:</strong> {formatDate(log.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {deleteTarget && (
              <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                <div className="cyber-card w-full max-w-md p-6">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3">Confirmar exclusão</h2>
                  <p className="text-sm text-cyan-100/70 mb-6">Tem certeza que deseja excluir a key <strong>{deleteTarget.code}</strong> do cliente <strong>{deleteTarget.clientName}</strong>? Esta ação é irreversível.</p>
                  <div className="flex gap-3">
                    <Button className="cyber-button flex-1" onClick={() => {
                      deleteMutation.mutate({ id: deleteTarget.id, confirmation: true });
                    }} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Excluir
                    </Button>
                    <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10 flex-1" onClick={() => setDeleteTarget(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "resellers" && (
          <>
            <section className="grid gap-6 lg:grid-cols-[350px_1fr] xl:grid-cols-[420px_1fr]">
              <div className="cyber-card p-4 md:p-6">
                <div className="mb-4 flex items-center gap-2 md:gap-3">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-cyan-200" />
                  <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Criar revendedor</h2>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="cyber-label text-xs md:text-sm">Nome</label>
                    <input className="cyber-input text-sm" value={resellerName} onChange={event => setResellerName(event.target.value)} placeholder="Ex: Revendedor Premium" />
                  </div>
                  <div>
                    <label className="cyber-label text-xs md:text-sm">Senha</label>
                    <input className="cyber-input text-sm" value={resellerPassword} onChange={event => setResellerPassword(event.target.value)} placeholder="Digite a senha" type="password" />
                  </div>
                  <Button className="cyber-button h-10 md:h-12 w-full text-sm md:text-base" onClick={handleCreateReseller} disabled={createResellerMutation.isPending}>
                    {createResellerMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />}
                    Criar revendedor
                  </Button>
                </div>
              </div>

              <div className="cyber-card overflow-hidden p-0">
                <div className="border-b border-cyan-300/10 p-3 md:p-5">
                  <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Revendedores cadastrados</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs md:text-sm">
                    <thead className="bg-cyan-300/5 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                      <tr>
                        <th className="px-2 md:px-5 py-3 md:py-4">Nome</th>
                        <th className="px-2 md:px-5 py-3 md:py-4">Status</th>
                        <th className="px-2 md:px-5 py-3 md:py-4">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-300/10">
                      {!resellersQuery.data || resellersQuery.data.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-2 md:px-5 py-6 md:py-8 text-center text-cyan-100/50">
                            Nenhum revendedor cadastrado ainda.
                          </td>
                        </tr>
                      ) : (
                        resellersQuery.data.map(reseller => (
                          <tr key={reseller.id} className="hover:bg-cyan-300/5 transition-colors">
                            <td className="px-2 md:px-5 py-3 md:py-4 font-mono text-cyan-100">{reseller.name}</td>
                            <td className="px-2 md:px-5 py-3 md:py-4">
                              <span className={reseller.status === "active" ? "text-green-300" : "text-red-300"}>{statusLabel(reseller.status)}</span>
                            </td>
                            <td className="px-2 md:px-5 py-3 md:py-4 text-cyan-100/70">{formatDate(reseller.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ title, value, tone }: { title: string; value: number; tone: "cyan" | "green" | "red" }) {
  const colors = {
    cyan: "border-cyan-300/30 bg-cyan-300/5 text-cyan-50",
    green: "border-green-300/30 bg-green-300/5 text-green-50",
    red: "border-red-300/30 bg-red-300/5 text-red-50",
  };
  return (
    <div className={`cyber-card border ${colors[tone]} p-4 md:p-6`}>
      <p className="text-xs uppercase tracking-[0.28em] text-opacity-70">{title}</p>
      <p className="mt-2 text-3xl md:text-4xl font-black tracking-[0.12em]">{value}</p>
    </div>
  );
}
