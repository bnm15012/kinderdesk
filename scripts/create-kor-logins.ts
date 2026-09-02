import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import { schools, locations, users, staff } from "@/lib/db/schema";

const PASS = "Demo@1234";

async function main() {
  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.slug, "sunrise-sprouts"))
    .limit(1);
  if (!school) {
    console.error("School 'sunrise-sprouts' not found");
    await pool.end();
    return;
  }

  const [loc] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.schoolId, school.id), eq(locations.name, "Koramangala Branch")))
    .limit(1);
  if (!loc) {
    console.error("Koramangala Branch not found");
    await pool.end();
    return;
  }

  const logins = [
    {
      email: "teacher-kor@sunrisesprouts.in",
      firstName: "Teacher",
      lastName: "Koramangala",
      role: "teacher" as const,
    },
    {
      email: "locadmin-kor@sunrisesprouts.in",
      firstName: "LocAdmin",
      lastName: "Koramangala",
      role: "location_admin" as const,
    },
  ];

  for (const u of logins) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);
    if (existing) {
      console.log(`User ${u.email} already exists — skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash(PASS, 10);
    const [userRes] = await db.insert(users).values({
      schoolId: school.id,
      locationId: loc.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      passwordHash,
      role: u.role,
      status: "active",
    });
    const userId = Number((userRes as any).insertId);

    if (u.role === "teacher") {
      const [staffRes] = await db.insert(staff).values({
        schoolId: school.id,
        locationId: loc.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: null,
        role: "teacher",
        status: "active",
      });
      const staffId = Number((staffRes as any).insertId);
      console.log(`Created teacher login ${u.email} (userId ${userId}, staffId ${staffId})`);
    } else {
      console.log(`Created ${u.role} login ${u.email} (userId ${userId})`);
    }
  }

  console.log(`\nPassword for all new accounts: ${PASS}`);
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
