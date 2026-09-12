import { getRequest } from "@tanstack/react-start/server";
import * as jose from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const SESSION_COOKIE = "bb_session";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

async function verifySessionToken(token: string) {
  return await jose.jwtVerify(token, JWT_SECRET);
}

export async function requireSession() {
  const req = getRequest();
  const cookieHeader = req?.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) throw new Error("Not authenticated");
  const { payload } = await verifySessionToken(token);
  const userId = Number(payload.userId);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requireUser() {
  const userId = await requireSession();
  const [user] = await db
    .select({ id: users.id, role: users.role, schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new Error("Not authenticated");
  return user;
}
