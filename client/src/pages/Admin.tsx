import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Copy, KeyRound, Loader2, LogOut, MoreVertical, Plus, Search, Shield, Trash2, Users, Eye, EyeOff } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; code: string; clientName: string } | null>(null);
  const [deleteResellerTarget, setDeleteResellerTarget] = useState<{ id: number; name: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [resellerName, setResellerName] = useState("");
  const [resellerPassword, setResellerPassword] = useState("");
  const [showResellerForm, setShowResellerForm] = useState(false);
  const [showResellerList, setShowResellerList] = useState(false);

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
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = trpc.keys.remove.useMutation({
    onSuccess: () => {
      toast.success("Key excluída com confirmação.");
      setDeleteTarget(null);
      setSelectedCode(null);
      utils.keys.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const createResellerMutation = trpc.resellers.create.useMutation({
    onSuccess: () => {
      toast.success("Revendedor criado com sucesso!");
      setResellerName("");
      setResellerPassword("");
      setShowResellerForm(false);
      utils.resellers.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteResellerMutation = trpc.resellers.delete.useMutation({
    onSuccess: () => {
      toast.success("Revendedor deletado com sucesso!");
      setDeleteResellerTarget(null);
      utils.resellers.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
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
        {/* Header com Menu de 3 Pontinhos */}
        <header className="cyber-card flex flex-col justify-between gap-4 p-4 md:p-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.55em] text-cyan-200/70">Command center</p>
            <h1 className="mt-2 text-2xl md:text-4xl font-black tracking-[0.12em] text-white">AUTH PROXY</h1>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-cyan-100/60">Gerenciamento seguro de API keys e revendedores</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <a className="cyber-ghost-button text-xs md:text-sm h-9 md:h-10 px-3 md:px-4" href="/cliente">Portal do cliente</a>
            <div className="relative">
              <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10 h-9 md:h-10 px-2 md:px-3" onClick={() => setMenuOpen(!menuOpen)}>
                <MoreVertical className="h-4 w-4" />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 cyber-card p-2 z-50 shadow-lg">
                  <button onClick={() => { setShowResellerForm(true); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-300/10 rounded transition-colors flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Criar revendedor
                  </button>
                  <button onClick={() => { setShowResellerList(true); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-300/10 rounded transition-colors flex items-center gap-2">
                    <Users className="h-4 w-4" /> Gerenciar revendedores
                  </button>
                  <button onClick={exportToCSV} className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-300/10 rounded transition-colors flex items-center gap-2">
                    <Search className="h-4 w-4" /> Exportar CSV
                  </button>
                  <hr className="border-cyan-300/10 my-2" />
                  <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-red-300/10 rounded transition-colors flex items-center gap-2 text-red-300">
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard com Métricas */}
        <section className="grid gap-3 md:gap-4 md:grid-cols-4">
          <Metric title="Total de keys" value={keysQuery.data?.length ?? 0} tone="cyan" />
          <Metric title="Keys ativas" value={activeCount} tone="green" />
          <Metric title="Keys inativas" value={inactiveCount} tone="red" />
          <Metric title="Revendedores" value={resellersQuery.data?.length ?? 0} tone="purple" />
        </section>

        {/* Seção de Gerar Key */}
        <section className="cyber-card p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4">
            <KeyRound className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Gerar nova key</h2>
          </div>
          <div className="grid gap-3 md:gap-4 md:grid-cols-4">
            <div>
              <label className="cyber-label text-xs md:text-sm">Nome do cliente</label>
              <input className="cyber-input text-sm" value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Ex: Cliente Premium" />
            </div>
            <div>
              <label className="cyber-label text-xs md:text-sm">Validade</label>
              <input className="cyber-input text-sm" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} type="date" />
            </div>
            <div>
              <label className="cyber-label text-xs md:text-sm">Status</label>
              <select className="cyber-input text-sm" value={status} onChange={event => setStatus(event.target.value as "active" | "inactive")}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Button className="cyber-button h-10 md:h-11 text-sm" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Gerar
              </Button>
            </div>
          </div>
          <div className="mt-3 md:mt-4 flex flex-wrap gap-1 md:gap-2">
            <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8" onClick={() => setExpirationDays(1)}>1d</Button>
            <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8" onClick={() => setExpirationDays(3)}>3d</Button>
            <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8" onClick={() => setExpirationDays(7)}>7d</Button>
            <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8" onClick={() => setExpirationDays(15)}>15d</Button>
            <Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8" onClick={() => setExpirationDays(30)}>30d</Button>
          </div>
        </section>

        {/* Seção de Buscar Key */}
        <section className="cyber-card p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4">
            <Search className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Buscar detalhes da key</h2>
          </div>
          <div className="flex gap-2">
            <input className="cyber-input text-sm flex-1" value={searchCode} onChange={event => setSearchCode(event.target.value)} placeholder="APX-..." />
            <Button className="cyber-button h-10 md:h-11 px-4" onClick={() => handleCheck()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Tabela de Keys */}
        <section className="cyber-card overflow-hidden p-0">
          <div className="border-b border-cyan-300/10 p-3 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg md:text-xl font-bold tracking-[0.08em] text-white">Keys cadastradas</h2>
            <div className="flex gap-2 flex-wrap">
              <select className="cyber-input text-xs h-9" value={filterStatus} onChange={event => setFilterStatus(event.target.value as "all" | "active" | "inactive")}>
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
              <Button size="sm" variant={filterExpiring ? "default" : "outline"} className={filterExpiring ? "cyber-button text-xs h-9" : "border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-9"} onClick={() => setFilterExpiring(!filterExpiring)}>
                Expirando
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs md:text-sm">
              <thead className="bg-cyan-300/5 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                <tr>
                  <th className="px-3 md:px-5 py-3">Cliente</th>
                  <th className="px-3 md:px-5 py-3 hidden sm:table-cell">Key</th>
                  <th className="px-3 md:px-5 py-3">Validade</th>
                  <th className="px-3 md:px-5 py-3">Status</th>
                  <th className="px-3 md:px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-300/10">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 md:px-5 py-6 text-center text-cyan-100/50 text-xs md:text-sm">
                      {keysQuery.data?.length === 0 ? "Nenhuma key cadastrada." : "Nenhuma key corresponde aos filtros."}
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map(key => {
                    const isExpired = key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now();
                    const isExpiring = key.expiresAt && new Date(key.expiresAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000 && !isExpired;
                    return (
                      <tr key={key.id} className="hover:bg-cyan-300/5 transition-colors">
                        <td className="px-3 md:px-5 py-3 font-mono text-cyan-100 text-xs md:text-sm">{key.clientName}</td>
                        <td className="px-3 md:px-5 py-3 hidden sm:table-cell font-mono text-cyan-300 text-xs">{key.code}</td>
                        <td className="px-3 md:px-5 py-3">
                          <span className={isExpired ? "text-red-300" : isExpiring ? "text-yellow-300" : "text-cyan-100"}>
                            {formatDate(key.expiresAt)}
                          </span>
                        </td>
                        <td className="px-3 md:px-5 py-3">
                          <span className={key.status === "active" ? "text-green-300" : "text-red-300"}>{statusLabel(key.status)}</span>
                        </td>
                        <td className="px-3 md:px-5 py-3 flex gap-1">
                          <Button size="sm" variant="outline" className="border-cyan-300/30 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20 h-8 px-2" onClick={() => handleCheck(key.code)} title="Checar detalhes">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300/30 bg-red-300/10 text-red-100 hover:bg-red-300/20 h-8 px-2" onClick={() => setDeleteTarget({ id: key.id, code: key.code, clientName: key.clientName })} title="Deletar key">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detalhes da Key */}
        {selectedCode && detailsQuery.data && (
          <section className="cyber-card p-4 md:p-6">
            <h2 className="mb-4 text-lg md:text-xl font-bold tracking-[0.08em] text-white">Detalhes da key</h2>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Cliente</p>
                <p className="mt-1 text-sm text-cyan-50">{detailsQuery.data.key.clientName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Key</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-xs text-cyan-300">{detailsQuery.data.key.code}</p>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                    navigator.clipboard.writeText(detailsQuery.data.key.code);
                    toast.success("Key copiada!");
                  }}>
                    <Copy className="h-3 w-3 text-cyan-200" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">IP Autorizado</p>
                <p className="mt-1 text-sm text-cyan-50">{detailsQuery.data.key.authorizedIp || "Não definido"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Validade</p>
                <p className="mt-1 text-sm text-cyan-50">{formatDate(detailsQuery.data.key.expiresAt)}</p>
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

        {/* Modal de Confirmação de Exclusão de Key */}
        {deleteTarget && (
          <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="cyber-card w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-white mb-3">Confirmar exclusão de key</h2>
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

        {/* Modal de Criar Revendedor */}
        {showResellerForm && (
          <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="cyber-card w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-white mb-4">Criar revendedor</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="cyber-label text-xs">Nome</label>
                  <input className="cyber-input text-sm" value={resellerName} onChange={event => setResellerName(event.target.value)} placeholder="Ex: Revendedor Premium" />
                </div>
                <div>
                  <label className="cyber-label text-xs">Senha</label>
                  <input className="cyber-input text-sm" value={resellerPassword} onChange={event => setResellerPassword(event.target.value)} placeholder="Digite a senha" type="password" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="cyber-button flex-1" onClick={handleCreateReseller} disabled={createResellerMutation.isPending}>
                  {createResellerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar
                </Button>
                <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10 flex-1" onClick={() => setShowResellerForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Modal de Gerenciar Revendedores */}
        {showResellerList && (
          <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="cyber-card w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-white mb-4">Gerenciar revendedores</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-cyan-300/5 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                    <tr>
                      <th className="px-3 py-3">Nome</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Criado em</th>
                      <th className="px-3 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-300/10">
                    {!resellersQuery.data || resellersQuery.data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-cyan-100/50">
                          Nenhum revendedor cadastrado.
                        </td>
                      </tr>
                    ) : (
                      resellersQuery.data.map(reseller => (
                        <tr key={reseller.id} className="hover:bg-cyan-300/5 transition-colors">
                          <td className="px-3 py-3 font-mono text-cyan-100">{reseller.name}</td>
                          <td className="px-3 py-3">
                            <span className={reseller.status === "active" ? "text-green-300" : "text-red-300"}>{statusLabel(reseller.status)}</span>
                          </td>
                          <td className="px-3 py-3 text-cyan-100/70 text-xs">{formatDate(reseller.createdAt)}</td>
                          <td className="px-3 py-3">
                            <Button size="sm" variant="outline" className="border-red-300/30 bg-red-300/10 text-red-100 hover:bg-red-300/20 h-8 px-2" onClick={() => setDeleteResellerTarget({ id: reseller.id, name: reseller.name })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10" onClick={() => setShowResellerList(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Modal de Confirmação de Exclusão de Revendedor */}
        {deleteResellerTarget && (
          <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="cyber-card w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-white mb-3">Confirmar exclusão de revendedor</h2>
              <p className="text-sm text-cyan-100/70 mb-6">Tem certeza que deseja deletar o revendedor <strong>{deleteResellerTarget.name}</strong>? Esta ação é irreversível.</p>
              <div className="flex gap-3">
                <Button className="cyber-button flex-1" onClick={() => {
                  deleteResellerMutation.mutate({ id: deleteResellerTarget.id });
                }} disabled={deleteResellerMutation.isPending}>
                  {deleteResellerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Deletar
                </Button>
                <Button variant="outline" className="border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10 flex-1" onClick={() => setDeleteResellerTarget(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ title, value, tone }: { title: string; value: number; tone: "cyan" | "green" | "red" | "purple" }) {
  const colors = {
    cyan: "border-cyan-300/30 bg-cyan-300/5 text-cyan-50",
    green: "border-green-300/30 bg-green-300/5 text-green-50",
    red: "border-red-300/30 bg-red-300/5 text-red-50",
    purple: "border-purple-300/30 bg-purple-300/5 text-purple-50",
  };
  return (
    <div className={`cyber-card border ${colors[tone]} p-4 md:p-6`}>
      <p className="text-xs uppercase tracking-[0.28em] text-opacity-70">{title}</p>
      <p className="mt-2 text-3xl md:text-4xl font-black tracking-[0.12em]">{value}</p>
    </div>
  );
}
