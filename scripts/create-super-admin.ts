import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import { users, schools, locations } from "@/lib/db/schema";

const BCRYPT_ROUNDS = 10;

async function main() {
  const [, , rawEmail, password] = process.argv;

  if (!rawEmail || !password) {
    console.error("Usage: bun scripts/create-super-admin.ts <email> <password>");
    process.exit(1);
  }

  const email = rawEmail.toLowerCase().trim();

  // Find or create a school to satisfy the NOT NULL FK on users.schoolId.
  // If a school already exists, use the first one. Otherwise create a dummy.
  let [school] = await db.select().from(schools).limit(1);
  if (!school) {
    const [result] = await db.insert(schools).values({
      name: "KinderDesk Super Admin",
      email: email,
      country: "India",
      currency: "INR",
      plan: "free",
      status: "active",
      maxLocations: 1,
    });
    const schoolId = Number((result as any).insertId);
    [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
  }

  // Find or create a location for that school (users.locationId is nullable but safer to set).
  let [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.schoolId, school.id))
    .limit(1);
  if (!location) {
    const [result] = await db.insert(locations).values({
      schoolId: school.id,
      name: "HQ",
      status: "active",
    });
    const locationId = Number((result as any).insertId);
    [location] = await db.select().from(locations).where(eq(locations.id, locationId));
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: number;
  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        role: "super_admin",
        status: "active",
        emailConfirmed: 1,
        schoolId: school.id,
        locationId: location.id,
      })
      .where(eq(users.id, existing.id));
    userId = existing.id;
    console.log(`Updated user ${userId} as super_admin`);
  } else {
    const [result] = await db.insert(users).values({
      schoolId: school.id,
      locationId: location.id,
      email,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
      status: "active",
      emailConfirmed: 1,
    });
    userId = Number((result as any).insertId);
    console.log(`Created super_admin user ${userId} with email ${email}`);
  }

  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
