import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/lib/db";
import { users, pushSubscriptions } from "@/lib/db/schema";

export function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }
  return { publicKey, privateKey };
}

export async function broadcastPush(
  title: string,
  body: string,
  url: string,
  targetSchoolId?: number
) {
  const { publicKey, privateKey } = getVapidConfig();
  webpush.setVapidDetails("mailto:admin@kinderdesk.in", publicKey, privateKey);

  const base = db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId));

  const subs =
    targetSchoolId != null
      ? await base.where(eq(users.schoolId, targetSchoolId))
      : await base;

  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    } as any;
    try {
      await webpush.sendNotification(
        pushSub,
        JSON.stringify({
          title,
          body,
          url,
          icon: "/icon-192.png",
        })
      );
      sent++;
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        removed++;
      }
    }
  }

  return { sent, removed, total: subs.length };
}
