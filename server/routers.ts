import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { isIP } from "node:net";
import { z } from "zod";
import {
  createApiKey,
  deleteApiKeyById,
  getApiKeyByCode,
  getApiKeyById,
  getLogsForKey,
  listApiKeys,
  touchKeyAccess,
  updateKeyIp,
  createReseller,
  listResellers,
  getResellerById,
  listApiKeysByReseller,
  getResellerByName,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { hashPassword, verifyPassword } from "./resellerAuth";

const keyCodeGenerator = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 28);

const statusSchema = z.enum(["active", "inactive"]);
const keyCodeSchema = z.string().trim().min(8).max(80);
const ipSchema = z
  .string()
  .trim()
  .min(7, "Informe um IP válido.")
  .max(64, "O IP informado é muito longo.")
  .refine(value => isIP(value) !== 0, "Informe um IPv4 ou IPv6 válido.");

function createKeyCode() {
  return `APX-${keyCodeGenerator()}`;
}

function isKeyExpired(expiresAt: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() < Date.now());
}

function assertClientKeyUsable(key: Awaited<ReturnType<typeof getApiKeyByCode>>) {
  if (!key) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Key não encontrada." });
  }

  if (key.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Esta key está inativa." });
  }

  if (isKeyExpired(key.expiresAt)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Esta key está expirada." });
  }

  return key;
}

function getRequestIp(ctx: { req?: { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } } }) {
  const forwarded = ctx.req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  const realIp = ctx.req?.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp.trim();
  }

  return ctx.req?.socket?.remoteAddress ?? null;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  keys: router({
    list: adminProcedure.query(async () => {
      return listApiKeys();
    }),

    create: adminProcedure
      .input(
        z.object({
          clientName: z.string().trim().min(2).max(160),
          status: statusSchema.default("active"),
          expiresAt: z.string().datetime().nullable().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
        const created = await createApiKey({
          code: createKeyCode(),
          clientName: input.clientName,
          status: input.status,
          expiresAt,
          createdBy: ctx.user.id,
        });

        return created;
      }),

    details: adminProcedure
      .input(z.object({ code: keyCodeSchema }))
      .query(async ({ input }) => {
        const key = await getApiKeyByCode(input.code);
        if (!key) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Key não encontrada." });
        }
        const logs = await getLogsForKey(key.id);
        return { key, logs };
      }),

    remove: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          confirmation: z.literal(true),
        }),
      )
      .mutation(async ({ input }) => {
        const key = await getApiKeyById(input.id);
        if (!key) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Key não encontrada." });
        }

        await deleteApiKeyById(input.id);
        return { success: true } as const;
      }),
  }),

  portal: router({
    buscarIp: publicProcedure
      .input(z.object({ code: keyCodeSchema }))
      .mutation(async ({ input }) => {
        const key = assertClientKeyUsable(await getApiKeyByCode(input.code));
        await touchKeyAccess(key.id);
        return {
          clientName: key.clientName,
          authorizedIp: key.authorizedIp,
          expiresAt: key.expiresAt,
          lastAccessAt: new Date(),
        };
      }),

    sincronizarIp: publicProcedure
      .input(
        z.object({
          code: keyCodeSchema,
          newIp: ipSchema,
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const key = assertClientKeyUsable(await getApiKeyByCode(input.code));
        const updated = await updateKeyIp(key, input.newIp, getRequestIp(ctx));
        return {
          success: true,
          clientName: updated?.clientName ?? key.clientName,
          authorizedIp: updated?.authorizedIp ?? input.newIp,
          previousIp: key.authorizedIp,
          lastAccessAt: updated?.lastAccessAt ?? new Date(),
        } as const;
      }),
  }),

  resellers: router({
    list: adminProcedure.query(async () => {
      return listResellers();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(2).max(160),
          password: z.string().min(4).max(255),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getResellerByName(input.name);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este nome já está cadastrado." });
        }

        const hashedPassword = hashPassword(input.password);
        const created = await createReseller(input.name, hashedPassword, ctx.user.id);
        return { id: created?.id, name: created?.name };
      }),

    login: publicProcedure
      .input(
        z.object({
          name: z.string().min(2).max(160),
          password: z.string().min(4),
        }),
      )
      .mutation(async ({ input }) => {
        const reseller = await getResellerByName(input.name);
        if (!reseller) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Nome ou senha incorretos." });
        }

        if (reseller.status !== "active") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Revendedor inativo." });
        }

        if (!verifyPassword(input.password, reseller.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Nome ou senha incorretos." });
        }

        return { id: reseller.id, name: reseller.name };
      }),

    getKeys: publicProcedure
      .input(z.object({ resellerId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return listApiKeysByReseller(input.resellerId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
