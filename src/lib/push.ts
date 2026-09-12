import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { requireSession, requireUser } from "@/lib/session.server";
import { getVapidConfig, broadcastPush } from "@/lib/push-core";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { publicKey } = getVapidConfig();
  return { publicKey };
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const subscribePush = createServerFn({ method: "POST" })
  .validator((input: unknown) => subscribeSchema.parse(input))
  .handler(async ({ data }) => {
    const userId = await requireSession();

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, data.endpoint));

    const [result] = await db.insert(pushSubscriptions).values({
      userId,
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
    });

    return { id: Number((result as any).insertId) };
  });

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const unsubscribePush = createServerFn({ method: "POST" })
  .validator((input: unknown) => unsubscribeSchema.parse(input))
  .handler(async ({ data }) => {
    await requireSession();

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, data.endpoint));
    return { ok: true };
  });

const sendPushSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  url: z.string().default("/"),
  schoolId: z.number().optional(),
});

export const sendPush = createServerFn({ method: "POST" })
  .validator((input: unknown) => sendPushSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await requireUser();

    const isSuperAdmin = user.role === "super_admin";
    if (data.schoolId != null && !isSuperAdmin && user.schoolId !== data.schoolId) {
      throw new Error("Not authorized");
    }

    const targetSchoolId = data.schoolId ?? (isSuperAdmin ? undefined : user.schoolId);
    return await broadcastPush(data.title, data.body, data.url, targetSchoolId);
  });
