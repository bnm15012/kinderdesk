import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import { schools, locations, users, subscriptions } from "@/lib/db/schema";

const TEST_EMAIL = "admin@schoolnest.local";
const TEST_PASSWORD = "Password123";

async function main() {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log(`Test user already exists: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
    return;
  }

  const [schoolResult] = await db.insert(schools).values({
    name: "SchoolNest Test School",
    slug: "schoolnest-test",
    status: "active",
    plan: "free",
    maxLocations: 1,
  });
  const schoolId = Number((schoolResult as any).insertId);

  const [locationResult] = await db.insert(locations).values({
    schoolId,
    name: "Main Branch",
    status: "active",
  });
  const locationId = Number((locationResult as any).insertId);

  await db.insert(subscriptions).values({
    schoolId,
    plan: "free",
    amount: "0",
    currency: "INR",
    billingCycle: "monthly",
    status: "active",
    startedAt: new Date(),
  });

  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  const [userResult] = await db.insert(users).values({
    schoolId,
    locationId,
    email: TEST_EMAIL,
    passwordHash: hash,
    firstName: "Test",
    lastName: "Admin",
    role: "school_admin",
    status: "active",
  });

  console.log(`Created user id ${Number((userResult as any).insertId)}`);
  console.log(`Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  await pool.end();
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
