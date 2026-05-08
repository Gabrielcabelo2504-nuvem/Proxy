import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  getApiKeyByCode: vi.fn(),
  getApiKeyById: vi.fn(),
  getLogsForKey: vi.fn(),
  touchKeyAccess: vi.fn(),
  updateKeyIp: vi.fn(),
  deleteApiKeyById: vi.fn(),
}));

vi.mock("./db", () => mocks);

const { appRouter } = await import("./routers");

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const sampleKey = {
  id: 42,
  code: "APX-ABCDEFGHJKLMNPQRSTUVWXYZ2345",
  clientName: "Cliente Teste",
  authorizedIp: "177.123.45.67",
  status: "active" as const,
  expiresAt: new Date(Date.now() + 86_400_000),
  lastAccessAt: null,
  createdBy: 1,
  createdAt: new Date("2026-01-01T10:00:00.000Z"),
  updatedAt: new Date("2026-01-01T10:00:00.000Z"),
};

function createContext(role: "admin" | "user" = "admin") {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "200.10.10.10" },
      socket: { remoteAddress: "200.10.10.11" },
    },
    res: { clearCookie: vi.fn() },
  } as unknown as TrpcContext;
}

beforeEach(() => {
  Object.values(mocks).forEach(mock => mock.mockReset());
});

describe("keys router", () => {
  it("gera uma nova key no painel administrativo", async () => {
    mocks.createApiKey.mockResolvedValue(sampleKey);
    const caller = appRouter.createCaller(createContext("admin"));

    const result = await caller.keys.create({
      clientName: "Cliente Teste",
      status: "active",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(result).toEqual(sampleKey);
    expect(mocks.createApiKey).toHaveBeenCalledWith(expect.objectContaining({
      clientName: "Cliente Teste",
      status: "active",
      createdBy: 1,
    }));
  });

  it("checa detalhes de uma key e retorna logs vinculados", async () => {
    mocks.getApiKeyByCode.mockResolvedValue(sampleKey);
    mocks.getLogsForKey.mockResolvedValue([{ id: 1, apiKeyId: 42, action: "sync_ip", previousIp: null, newIp: "177.123.45.67", actorIp: "200.10.10.10", createdAt: new Date() }]);
    const caller = appRouter.createCaller(createContext("admin"));

    const result = await caller.keys.details({ code: sampleKey.code });

    expect(result.key).toEqual(sampleKey);
    expect(result.logs).toHaveLength(1);
  });

  it("exclui uma key apenas quando a confirmação é verdadeira", async () => {
    mocks.getApiKeyById.mockResolvedValue(sampleKey);
    mocks.deleteApiKeyById.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    const result = await caller.keys.remove({ id: 42, confirmation: true });

    expect(result).toEqual({ success: true });
    expect(mocks.deleteApiKeyById).toHaveBeenCalledWith(42);
  });

  it("permite Buscar IP no portal público para uma key ativa", async () => {
    mocks.getApiKeyByCode.mockResolvedValue(sampleKey);
    mocks.touchKeyAccess.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("user"));

    const result = await caller.portal.buscarIp({ code: sampleKey.code });

    expect(result.authorizedIp).toBe("177.123.45.67");
    expect(result.clientName).toBe("Cliente Teste");
    expect(mocks.touchKeyAccess).toHaveBeenCalledWith(42);
  });

  it("sincroniza IP e registra a origem da alteração", async () => {
    const updatedKey = { ...sampleKey, authorizedIp: "177.123.45.99", lastAccessAt: new Date() };
    mocks.getApiKeyByCode.mockResolvedValue(sampleKey);
    mocks.updateKeyIp.mockResolvedValue(updatedKey);
    const caller = appRouter.createCaller(createContext("user"));

    const result = await caller.portal.sincronizarIp({ code: sampleKey.code, newIp: "177.123.45.99" });

    expect(result.success).toBe(true);
    expect(result.previousIp).toBe("177.123.45.67");
    expect(result.authorizedIp).toBe("177.123.45.99");
    expect(mocks.updateKeyIp).toHaveBeenCalledWith(sampleKey, "177.123.45.99", "200.10.10.10");
  });
});
