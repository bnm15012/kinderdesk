import "dotenv/config";
import { eq, and, inArray } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import { staff, staffClassAssignments, schools, locations, classes } from "@/lib/db/schema";

async function main() {
  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.slug, "sunrise-sprouts"))
    .limit(1);
  if (!school) throw new Error("School not found");

  const [loc] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.schoolId, school.id), eq(locations.name, "Koramangala Branch")))
    .limit(1);
  if (!loc) throw new Error("Koramangala Branch not found");

  const [staffRecord] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.email, "teacher-kor@sunrisesprouts.in"))
    .limit(1);
  if (!staffRecord) throw new Error("Teacher staff record not found");

  const classRows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.schoolId, school.id), eq(classes.locationId, loc.id)));

  if (!classRows.length) {
    console.log("No Koramangala classes found");
    await pool.end();
    return;
  }

  const existing = await db
    .select({ classId: staffClassAssignments.classId })
    .from(staffClassAssignments)
    .where(eq(staffClassAssignments.staffId, staffRecord.id));
  const existingClassIds = new Set(existing.map((e) => e.classId));

  let assigned = 0;
  for (const cls of classRows) {
    if (existingClassIds.has(cls.id)) {
      console.log(`Already assigned to class ${cls.id}`);
      continue;
    }
    const [r] = await db.insert(staffClassAssignments).values({
      schoolId: school.id,
      locationId: loc.id,
      staffId: staffRecord.id,
      classId: cls.id,
      academicYear: "2025-26",
    });
    console.log(`Assigned teacher-kor to class ${cls.id} (assignment id ${Number((r as any).insertId)})`);
    assigned++;
  }

  console.log(`\nAssigned to ${assigned} new class(es)`);
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
