import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  AlertTriangle,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
  MoreVertical,
  ChevronDown,
  Home,
  Settings,
  Eye,
  Copy as CopyIcon,
  Edit2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function ProtectedAdminPage({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (!auth) {
      setLocation('/admin-login');
      return;
    }

    try {
      const authData = JSON.parse(auth);
      // Check if auth is still valid (optional: add expiration time)
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('adminAuth');
      setLocation('/admin-login');
    } finally {
      setIsLoading(false);
    }
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function formatDate(value?: Date | string | null) {
  if (!value) return "Sem validade";
  return new Date(value).toLocaleString("pt-BR");
}

function statusLabel(status: string) {
  return status === "active" ? "Ativa" : "Inativa";
}

function AdminContent() {
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
      <section className="cyber-card w-full max-w-md p-6 md:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <Shield className="h-7 w-7 text-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.55em] text-cyan-200/80">Auth Proxy</p>
          <h1 className="mt-3 text-4xl font-black tracking-[0.16em] text-white">ADMIN</h1>
          <p className="mt-2 text-sm text-cyan-100/60">Autenticação segura via Manus OAuth</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.28em] text-cyan-100/70 mb-2">Usuário</label>
            <input
              className="cyber-input w-full"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              placeholder="Digite seu usuário"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.28em] text-cyan-100/70 mb-2">Senha</label>
            <input
              className="cyber-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <p className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-xs leading-5 text-cyan-100/55">
            Os campos identificam a tentativa de acesso nesta tela. A autenticação obrigatória e definitiva do painel é concluída pelo Manus OAuth.
          </p>
          <Button className="cyber-button h-12 w-full text-base" onClick={handleOAuthLogin}>
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
      <section className="cyber-card max-w-lg w-full p-6 md:p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-300" />
        <h1 className="text-3xl font-black tracking-[0.12em] text-white">ACESSO NEGADO</h1>
        <p className="mt-4 text-sm leading-6 text-cyan-100/65">
          Sua sessão Manus OAuth está ativa, mas este usuário não possui papel administrativo. Solicite a promoção do usuário para admin antes de operar o gerador de keys.
        </p>
        <Button className="mt-6 border-cyan-300/30 bg-black/20 text-cyan-100 hover:bg-cyan-300/10 h-10 text-sm" variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair da sessão
        </Button>
      </section>
    </main>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const utils = trpc.useUtils();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"keys" | "resellers">("keys");
  const [clientName, setClientName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showResellerForm, setShowResellerForm] = useState(false);
  const [resellerName, setResellerName] = useState("");
  const [resellerPassword, setResellerPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteResellerConfirm, setDeleteResellerConfirm] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const keysQuery = trpc.keys.list.useQuery();
  const resellersQuery = trpc.resellers.list.useQuery();
  const createMutation = trpc.keys.create.useMutation({
    onSuccess: () => {
      setClientName("");
      setExpiresAt("");
      setStatus("active");
      utils.keys.list.invalidate();
      toast.success("Key gerada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar key");
    },
  });

  const deleteMutation = trpc.keys.delete.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      utils.keys.list.invalidate();
      toast.success("Key deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar key");
    },
  });

  const createResellerMutation = trpc.resellers.create.useMutation({
    onSuccess: () => {
      setResellerName("");
      setResellerPassword("");
      setShowResellerForm(false);
      utils.resellers.list.invalidate();
      toast.success("Revendedor criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar revendedor");
    },
  });

  const deleteResellerMutation = trpc.resellers.delete.useMutation({
    onSuccess: () => {
      setDeleteResellerConfirm(null);
      utils.resellers.list.invalidate();
      toast.success("Revendedor deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar revendedor");
    },
  });

  const activeCount = useMemo(() => keysQuery.data?.filter((k) => k.status === "active").length ?? 0, [keysQuery.data]);
  const inactiveCount = useMemo(() => keysQuery.data?.filter((k) => k.status === "inactive").length ?? 0, [keysQuery.data]);

  function setExpirationDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpiresAt(date.toISOString().split("T")[0]);
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

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  }

  const selectedKeyData = selectedCode ? keysQuery.data?.find((k) => k.code === selectedCode) : null;

  return (
    <div className="cyber-screen flex min-h-screen bg-slate-950" onClick={() => setOpenMenuId(null)}>
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-cyan-300/15 backdrop-blur-xl transition-transform z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-cyan-300/10 bg-gradient-to-r from-cyan-300/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/40 bg-gradient-to-br from-cyan-300/20 to-cyan-300/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Shield className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] font-semibold text-cyan-300/70">Auth</p>
              <p className="text-base font-black tracking-[0.12em] text-white">PROXY</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1.5">
          <button
            onClick={() => setActiveTab("keys")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
              activeTab === "keys"
                ? "bg-gradient-to-r from-cyan-300/20 to-cyan-300/5 text-cyan-100 border border-cyan-300/40 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
                : "text-cyan-100/50 hover:bg-cyan-300/8 hover:text-cyan-100/70"
            }`}
          >
            <KeyRound className="h-4 w-4 flex-shrink-0" />
            <span>API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab("resellers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
              activeTab === "resellers"
                ? "bg-gradient-to-r from-cyan-300/20 to-cyan-300/5 text-cyan-100 border border-cyan-300/40 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
                : "text-cyan-100/50 hover:bg-cyan-300/8 hover:text-cyan-100/70"
            }`}
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Revendedores</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-300/10 bg-gradient-to-t from-slate-950 to-transparent">
          <Button className="w-full bg-gradient-to-r from-red-500/30 to-red-500/10 text-red-200 hover:from-red-500/40 hover:to-red-500/20 border border-red-300/20 h-10 text-sm font-semibold transition-all" onClick={() => {
            localStorage.removeItem('adminAuth');
            window.location.href = '/admin-login';
          }}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] font-semibold text-cyan-300/60">Gerenciamento</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-[0.06em] text-white">
                {activeTab === "keys" ? "API Keys" : "Revendedores"}
              </h1>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2.5 hover:bg-cyan-300/15 rounded-lg border border-cyan-300/20 transition-colors">
              <MoreVertical className="h-5 w-5 text-cyan-300" />
            </button>
          </div>

          {/* Metrics */}
          {activeTab === "keys" && (
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard title="Total de Keys" value={keysQuery.data?.length ?? 0} tone="cyan" />
              <MetricCard title="Keys Ativas" value={activeCount} tone="green" />
              <MetricCard title="Keys Inativas" value={inactiveCount} tone="red" />
              <MetricCard title="Revendedores" value={resellersQuery.data?.length ?? 0} tone="purple" />
            </div>
          )}

          {/* Content Sections */}
          {activeTab === "keys" ? (
            <div className="space-y-6">
              {/* Create Key Section */}
              <section className="cyber-card p-6 md:p-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-cyan-300" />
                  Gerar Nova Key
                </h2>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-cyan-100/70 mb-2 font-semibold">Cliente</label>
                    <input
                      className="cyber-input w-full text-sm"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-cyan-100/70 mb-2 font-semibold">Validade</label>
                    <input className="cyber-input w-full text-sm" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-cyan-100/70 mb-2 font-semibold">Status</label>
                    <select className="cyber-input w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button className="cyber-button h-10 text-sm font-semibold" onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Gerar
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 7, 15, 30].map((days) => (
                    <Button
                      key={days}
                      size="sm"
                      variant="outline"
                      className="border-cyan-300/20 bg-cyan-300/5 text-xs text-cyan-100 hover:bg-cyan-300/15 h-8 font-semibold"
                      onClick={() => setExpirationDays(days)}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </section>

              {/* Search Section */}
              <section className="cyber-card p-6 md:p-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-cyan-300" />
                  Buscar Key
                </h2>
                <div className="flex gap-2">
                  <input
                    className="cyber-input flex-1 text-sm"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Código da key..."
                  />
                  <Button className="cyber-button h-10 px-4 font-semibold" onClick={() => handleCheck()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </section>

              {/* Key Details */}
              {selectedKeyData && (
                <section className="cyber-card p-6 md:p-8">
                  <h2 className="text-lg font-bold text-white mb-6">Detalhes da Key</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-cyan-300/5 border border-cyan-300/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60 font-semibold">Código</p>
                      <p className="text-sm font-mono text-cyan-200 mt-2">{selectedKeyData.code}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-300/5 border border-cyan-300/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60 font-semibold">Cliente</p>
                      <p className="text-sm text-cyan-200 mt-2">{selectedKeyData.clientName}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-300/5 border border-cyan-300/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60 font-semibold">IP Autorizado</p>
                      <p className="text-sm text-cyan-200 mt-2">{selectedKeyData.authorizedIp || "Não configurado"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-300/5 border border-cyan-300/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60 font-semibold">Status</p>
                      <p className="text-sm text-cyan-200 mt-2">{statusLabel(selectedKeyData.status)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-300/5 border border-cyan-300/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60 font-semibold">Criada em</p>
                      <p className="text-sm text-cyan-200 mt-2">{formatDate(selectedKeyData.createdAt)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-300/5 border border-cyan-300/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60 font-semibold">Validade</p>
                      <p className="text-sm text-cyan-200 mt-2">{formatDate(selectedKeyData.expiresAt)}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Keys Table */}
              <section className="cyber-card overflow-hidden">
                <div className="p-6 md:p-8 border-b border-cyan-300/10">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-cyan-300" />
                    Todas as Keys
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-cyan-300/10 bg-cyan-300/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Código</th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Cliente</th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Validade</th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keysQuery.data?.map((key) => (
                        <tr key={key.id} className="border-b border-cyan-300/5 hover:bg-cyan-300/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-cyan-300">{key.code}</td>
                          <td className="px-6 py-4 text-cyan-100">{key.clientName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${key.status === "active" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                              {statusLabel(key.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-cyan-100/70">{formatDate(key.expiresAt)}</td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-cyan-300/20 bg-cyan-300/5 text-xs h-8 font-semibold hover:bg-cyan-300/15 transition-colors"
                                onClick={() => setOpenMenuId(openMenuId === key.id ? null : key.id)}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                              {openMenuId === key.id && (
                                <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-cyan-300/20 rounded-lg shadow-lg z-50 min-w-max" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="w-full px-4 py-2 text-left text-xs text-cyan-100 hover:bg-cyan-300/10 flex items-center gap-2 border-b border-cyan-300/10 transition-colors"
                                    onClick={() => {
                                      handleCheck(key.code);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <Eye className="h-3 w-3" />
                                    Ver Detalhes
                                  </button>
                                  <button
                                    className="w-full px-4 py-2 text-left text-xs text-cyan-100 hover:bg-cyan-300/10 flex items-center gap-2 border-b border-cyan-300/10 transition-colors"
                                    onClick={() => {
                                      handleCopyCode(key.code);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <CopyIcon className="h-3 w-3" />
                                    Copiar Código
                                  </button>
                                  <button
                                    className="w-full px-4 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                    onClick={() => {
                                      setDeleteConfirm(key.code);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Deletar Key
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Create Reseller */}
              <section className="cyber-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-cyan-300" />
                    Criar Revendedor
                  </h2>
                  {!showResellerForm && (
                    <Button className="cyber-button h-9 text-sm font-semibold" onClick={() => setShowResellerForm(true)}>
                      <Plus className="mr-1 h-4 w-4" />
                      Novo
                    </Button>
                  )}
                </div>

                {showResellerForm && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <input
                      className="cyber-input text-sm"
                      value={resellerName}
                      onChange={(e) => setResellerName(e.target.value)}
                      placeholder="Nome do revendedor"
                    />
                    <input
                      className="cyber-input text-sm"
                      value={resellerPassword}
                      onChange={(e) => setResellerPassword(e.target.value)}
                      placeholder="Senha"
                      type="password"
                    />
                    <div className="flex gap-2">
                      <Button className="cyber-button h-10 flex-1 text-sm font-semibold" onClick={handleCreateReseller} disabled={createResellerMutation.isPending}>
                        {createResellerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Criar
                      </Button>
                      <Button variant="outline" className="border-cyan-300/20 bg-black/20 h-10 text-sm font-semibold" onClick={() => setShowResellerForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              {/* Resellers Table */}
              <section className="cyber-card overflow-hidden">
                <div className="p-6 md:p-8 border-b border-cyan-300/10">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-300" />
                    Revendedores Cadastrados
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-cyan-300/10 bg-cyan-300/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Nome</th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Criado em</th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.1em] text-cyan-200 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resellersQuery.data?.map((reseller: any) => (
                        <tr key={reseller.id} className="border-b border-cyan-300/5 hover:bg-cyan-300/5 transition-colors">
                          <td className="px-6 py-4 text-cyan-100 font-medium">{reseller.name}</td>
                          <td className="px-6 py-4 text-cyan-100/70">{formatDate(reseller.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-cyan-300/20 bg-cyan-300/5 text-xs h-8 font-semibold hover:bg-cyan-300/15 transition-colors"
                                onClick={() => setOpenMenuId(openMenuId === reseller.id ? null : reseller.id)}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                              {openMenuId === reseller.id && (
                                <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-cyan-300/20 rounded-lg shadow-lg z-50 min-w-max" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="w-full px-4 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                    onClick={() => {
                                      setDeleteResellerConfirm(reseller.id.toString());
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Deletar Revendedor
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <section className="cyber-card max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-white mb-2">Confirmar exclusão</h2>
            <p className="text-sm text-cyan-100/70 mb-6">Tem certeza que deseja deletar a key {deleteConfirm}? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 h-9 font-semibold" onClick={() => deleteMutation.mutate({ code: deleteConfirm })}>
                Deletar
              </Button>
              <Button variant="outline" className="flex-1 border-cyan-300/20 bg-black/20 h-9 font-semibold" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Delete Reseller Confirmation Modal */}
      {deleteResellerConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <section className="cyber-card max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-white mb-2">Confirmar exclusão</h2>
            <p className="text-sm text-cyan-100/70 mb-6">Tem certeza que deseja deletar este revendedor? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 h-9 font-semibold"
                onClick={() => deleteResellerMutation.mutate({ id: parseInt(deleteResellerConfirm) })}
              >
                Deletar
              </Button>
              <Button variant="outline" className="flex-1 border-cyan-300/20 bg-black/20 h-9 font-semibold" onClick={() => setDeleteResellerConfirm(null)}>
                Cancelar
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, tone }: { title: string; value: number; tone: "cyan" | "green" | "red" | "purple" }) {
  const colors = {
    cyan: "from-cyan-300/15 to-cyan-300/5 border-cyan-300/30 text-cyan-100",
    green: "from-green-300/15 to-green-300/5 border-green-300/30 text-green-100",
    red: "from-red-300/15 to-red-300/5 border-red-300/30 text-red-100",
    purple: "from-purple-300/15 to-purple-300/5 border-purple-300/30 text-purple-100",
  };

  return (
    <div className={`cyber-card p-6 border bg-gradient-to-br ${colors[tone]} hover:shadow-[0_0_32px_rgba(34,211,238,0.15)] transition-all duration-300`}>
      <p className="text-xs uppercase tracking-[0.25em] font-semibold opacity-60 mb-3">{title}</p>
      <p className="text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}


export default function Admin() {
  return (
    <ProtectedAdminPage>
      <AdminContent />
    </ProtectedAdminPage>
  );
}
