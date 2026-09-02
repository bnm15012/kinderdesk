/**
 * Comprehensive seed script for KinderDesk Preschool ERP
 * Creates one school with two branches, realistic data for every
 * module (students, staff, classes, inquiries, invoices), and one
 * login user per role.
 *
 * Run:  bun run scripts/seed-all.ts
 *
 * Credentials printed at the end. Safe to re-run: skips if school
 * slug already exists.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import {
  schools, locations, users, subscriptions,
  classes, students, parents, staff,
  inquiries, feeStructures, invoices,
  classEnrollments, staffClassAssignments,
} from "@/lib/db/schema";

const SCHOOL_SLUG = "sunrise-sprouts";
const PASS        = "Demo@1234";
const BCRYPT_SALT = 10;

async function hashPass(p: string) { return bcrypt.hash(p, BCRYPT_SALT); }

// ─── Helper to skip entire run if already seeded ─────────────────────────────
async function alreadySeeded(): Promise<boolean> {
  const r = await db.select({ id: schools.id }).from(schools).where(eq(schools.slug, SCHOOL_SLUG)).limit(1);
  return r.length > 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (await alreadySeeded()) {
    console.log("\n⚠️  School already seeded. Listing credentials:\n");
    printCreds();
    await pool.end();
    return;
  }

  console.log("🌱  Seeding KinderDesk demo data…\n");

  // ── 1. School ──────────────────────────────────────────────────────────────
  const [schoolRes] = await db.insert(schools).values({
    name: "Sunrise Sprouts Academy",
    slug: SCHOOL_SLUG,
    email: "hello@sunrisesprouts.in",
    phone: "080-4567-8900",
    address: "12, 3rd Cross, Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    country: "India",
    currency: "INR",
    plan: "pro",
    maxLocations: 2,
    status: "active",
  });
  const schoolId = Number((schoolRes as any).insertId);
  console.log(`✅  School created  (id ${schoolId})`);

  // ── 2. Subscription ────────────────────────────────────────────────────────
  await db.insert(subscriptions).values({
    schoolId, plan: "pro", amount: "2999",
    currency: "INR", billingCycle: "monthly", status: "active",
  });

  // ── 3. Locations (branches) ────────────────────────────────────────────────
  const [loc1Res] = await db.insert(locations).values({
    schoolId, name: "Koramangala Branch",
    address: "12, 3rd Cross, Koramangala", city: "Bengaluru",
    state: "Karnataka", pincode: "560034", phone: "080-4567-8901",
    capacity: 80, status: "active",
  });
  const locId1 = Number((loc1Res as any).insertId);

  const [loc2Res] = await db.insert(locations).values({
    schoolId, name: "Whitefield Branch",
    address: "45, ITPL Road, Whitefield", city: "Bengaluru",
    state: "Karnataka", pincode: "560066", phone: "080-4567-8902",
    capacity: 60, status: "active",
  });
  const locId2 = Number((loc2Res as any).insertId);
  console.log(`✅  Locations created (ids ${locId1}, ${locId2})`);

  // ── 4. Users (one per role) ─────────────────────────────────────────────────
  const userDefs = [
    { email: "admin@sunrisesprouts.in",      role: "school_admin"   as const, firstName: "Priya",   lastName: "Sharma",   locationId: locId1 },
    { email: "loc-admin@sunrisesprouts.in",  role: "location_admin" as const, firstName: "Rajan",   lastName: "Nair",     locationId: locId2 },
    { email: "teacher@sunrisesprouts.in",    role: "teacher"        as const, firstName: "Neha",    lastName: "Gupta",    locationId: locId1 },
    { email: "accountant@sunrisesprouts.in", role: "accountant"     as const, firstName: "Sanjay",  lastName: "Mehta",    locationId: locId1 },
    { email: "parent@sunrisesprouts.in",     role: "parent"         as const, firstName: "Anil",    lastName: "Kumar",    locationId: locId1 },
    { email: "superadmin@kinderdesk.in",      role: "super_admin"    as const, firstName: "Platform",lastName: "Admin",    locationId: locId1 },
  ];

  const createdUsers: Record<string, number> = {};
  for (const u of userDefs) {
    const [r] = await db.insert(users).values({
      schoolId, locationId: u.locationId, email: u.email,
      passwordHash: await hashPass(PASS),
      firstName: u.firstName, lastName: u.lastName,
      role: u.role, status: "active",
    });
    createdUsers[u.role] = Number((r as any).insertId);
  }
  console.log("✅  Users created (6 roles)");

  // ── 5. Classes (branch 1) ──────────────────────────────────────────────────
  const classDefs = [
    { name: "Playgroup",  ageGroup: "1.5–2.5 yrs", roomName: "Sunflower Room", capacity: 15, startTime: "09:00", endTime: "12:00" },
    { name: "Nursery A",  ageGroup: "2.5–3.5 yrs", roomName: "Rainbow Room",   capacity: 20, startTime: "09:00", endTime: "12:30" },
    { name: "Nursery B",  ageGroup: "2.5–3.5 yrs", roomName: "Butterfly Room", capacity: 20, startTime: "09:00", endTime: "12:30" },
    { name: "Jr. KG",    ageGroup: "3.5–4.5 yrs", roomName: "Rocket Room",    capacity: 25, startTime: "09:00", endTime: "13:00" },
    { name: "Sr. KG",    ageGroup: "4.5–5.5 yrs", roomName: "Ocean Room",     capacity: 25, startTime: "09:00", endTime: "13:30" },
  ];
  const classIds: number[] = [];
  for (const c of classDefs) {
    const [r] = await db.insert(classes).values({
      schoolId, locationId: locId1, academicYear: "2025-26", status: "active", ...c,
    });
    classIds.push(Number((r as any).insertId));
  }
  console.log("✅  Classes created");

  // ── 6. Staff (branch 1) ────────────────────────────────────────────────────
  const staffDefs = [
    { firstName: "Neha",    lastName: "Gupta",    email: "neha.g@sunrisesprouts.in",   phone: "9876511223", role: "teacher"   as const, salary: "28000", joinDate: "2023-06-01", bgCheck: "verified"    as const },
    { firstName: "Rahul",   lastName: "Iyer",     email: "rahul.i@sunrisesprouts.in",  phone: "9123499887", role: "assistant" as const, salary: "18000", joinDate: "2024-01-15", bgCheck: "verified"    as const },
    { firstName: "Sunita",  lastName: "Rao",      email: "sunita.r@sunrisesprouts.in", phone: "9900112233", role: "admin"     as const, salary: "22000", joinDate: "2022-08-01", bgCheck: "verified"    as const },
    { firstName: "Kavitha", lastName: "Pillai",   email: "kavitha@sunrisesprouts.in",  phone: "9988001122", role: "teacher"   as const, salary: "27000", joinDate: "2023-09-01", bgCheck: "in_progress" as const },
    { firstName: "Dinesh",  lastName: "Bhat",     email: "dinesh@sunrisesprouts.in",   phone: "9776655443", role: "support"   as const, salary: "15000", joinDate: "2024-03-01", bgCheck: "pending"     as const },
  ];
  const staffIds: number[] = [];
  for (const s of staffDefs) {
    const [r] = await db.insert(staff).values({
      schoolId, locationId: locId1,
      firstName: s.firstName, lastName: s.lastName,
      email: s.email, phone: s.phone,
      role: s.role, salary: s.salary,
      joinDate: new Date(s.joinDate),
      status: "active", backgroundCheckStatus: s.bgCheck,
    });
    staffIds.push(Number((r as any).insertId));
  }

  // Assign staff to classes
  await db.insert(staffClassAssignments).values([
    { schoolId, locationId: locId1, staffId: staffIds[0], classId: classIds[1], academicYear: "2025-26" },
    { schoolId, locationId: locId1, staffId: staffIds[1], classId: classIds[1], academicYear: "2025-26" },
    { schoolId, locationId: locId1, staffId: staffIds[3], classId: classIds[3], academicYear: "2025-26" },
  ]);
  console.log("✅  Staff created + class assignments done");

  // ── 7. Students ────────────────────────────────────────────────────────────
  const studentDefs = [
    { firstName: "Aarav",   lastName: "Kumar",   dob: "2021-03-12", gender: "male"   as const, classIdx: 2, status: "enrolled" as const },
    { firstName: "Mira",    lastName: "Shah",    dob: "2020-07-25", gender: "female" as const, classIdx: 3, status: "enrolled" as const },
    { firstName: "Vivan",   lastName: "Mehta",   dob: "2019-11-08", gender: "male"   as const, classIdx: 4, status: "enrolled" as const },
    { firstName: "Ananya",  lastName: "Reddy",   dob: "2021-01-30", gender: "female" as const, classIdx: 2, status: "enrolled" as const },
    { firstName: "Rohan",   lastName: "Patel",   dob: "2020-09-14", gender: "male"   as const, classIdx: 3, status: "enrolled" as const },
    { firstName: "Sia",     lastName: "Joshi",   dob: "2022-04-05", gender: "female" as const, classIdx: 0, status: "enrolled" as const },
    { firstName: "Dev",     lastName: "Nair",    dob: "2021-08-19", gender: "male"   as const, classIdx: 1, status: "enrolled" as const },
    { firstName: "Priya",   lastName: "Iyer",    dob: "2021-05-22", gender: "female" as const, classIdx: 1, status: "enrolled" as const },
    { firstName: "Kabir",   lastName: "Singh",   dob: "2019-12-01", gender: "male"   as const, classIdx: 4, status: "enrolled" as const },
    { firstName: "Nisha",   lastName: "Gupta",   dob: "2022-02-14", gender: "female" as const, classIdx: 0, status: "waitlisted" as const },
    { firstName: "Aryan",   lastName: "Sharma",  dob: "2020-06-30", gender: "male"   as const, classIdx: 3, status: "applied"  as const },
    { firstName: "Zara",    lastName: "Khan",    dob: "2021-10-11", gender: "female" as const, classIdx: 2, status: "enrolled" as const },
  ];
  const studentIds: number[] = [];
  for (const s of studentDefs) {
    const [r] = await db.insert(students).values({
      schoolId, locationId: locId1,
      firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      status: s.status,
      currentClassId: classIds[s.classIdx],
    });
    studentIds.push(Number((r as any).insertId));
  }

  // Enroll enrolled students
  const enrollmentInserts = studentDefs
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.status === "enrolled")
    .map(({ s, i }) => ({
      schoolId, locationId: locId1,
      studentId: studentIds[i], classId: classIds[s.classIdx],
      academicYear: "2025-26", status: "active" as const,
    }));
  await db.insert(classEnrollments).values(enrollmentInserts);

  // Parent for Aarav (parent role user)
  await db.insert(parents).values({
    schoolId, locationId: locId1,
    studentId: studentIds[0],
    relation: "father", name: "Anil Kumar",
    email: "parent@sunrisesprouts.in",
    phone: "9812345678",
    isPrimary: 1, isEmergency: 1,
  });
  // Other parents (generic)
  const parentPairs = [
    { studentIdx: 1, name: "Ramesh Shah",    email: "ramesh.shah@gmail.com",  phone: "9823456789", rel: "father" as const },
    { studentIdx: 2, name: "Seema Mehta",    email: "seema.m@gmail.com",      phone: "9834567890", rel: "mother" as const },
    { studentIdx: 3, name: "Vijay Reddy",    email: "vijay.r@gmail.com",      phone: "9845678901", rel: "father" as const },
    { studentIdx: 4, name: "Geeta Patel",    email: "geeta.p@gmail.com",      phone: "9856789012", rel: "mother" as const },
    { studentIdx: 5, name: "Lakshmi Joshi",  email: "lakshmi.j@gmail.com",    phone: "9867890123", rel: "mother" as const },
    { studentIdx: 6, name: "Suresh Nair",    email: "suresh.n@gmail.com",     phone: "9878901234", rel: "father" as const },
    { studentIdx: 7, name: "Deepa Iyer",     email: "deepa.i@gmail.com",      phone: "9889012345", rel: "mother" as const },
    { studentIdx: 8, name: "Harish Singh",   email: "harish.s@gmail.com",     phone: "9890123456", rel: "father" as const },
    { studentIdx: 11, name: "Farid Khan",    email: "farid.k@gmail.com",      phone: "9901234567", rel: "father" as const },
  ];
  for (const p of parentPairs) {
    await db.insert(parents).values({
      schoolId, locationId: locId1, studentId: studentIds[p.studentIdx],
      relation: p.rel, name: p.name, email: p.email, phone: p.phone,
      isPrimary: 1, isEmergency: 0,
    });
  }
  console.log("✅  Students + parents created");

  // ── 8. Fee structures ──────────────────────────────────────────────────────
  const feeStructureDefs = [
    { name: "Monthly Tuition – Playgroup",  amount: "4500", frequency: "monthly"   as const, classIdx: 0 },
    { name: "Monthly Tuition – Nursery",    amount: "5500", frequency: "monthly"   as const, classIdx: 1 },
    { name: "Monthly Tuition – Jr. KG",     amount: "6500", frequency: "monthly"   as const, classIdx: 3 },
    { name: "Monthly Tuition – Sr. KG",     amount: "7000", frequency: "monthly"   as const, classIdx: 4 },
    { name: "Annual Activity Fee",          amount: "3000", frequency: "annually"  as const, classIdx: null },
    { name: "One-time Admission Fee",       amount: "5000", frequency: "one_time"  as const, classIdx: null },
  ];
  const feeStructureIds: number[] = [];
  for (const f of feeStructureDefs) {
    const [r] = await db.insert(feeStructures).values({
      schoolId, locationId: locId1,
      classId: f.classIdx !== null ? classIds[f.classIdx] : null,
      name: f.name, amount: f.amount, frequency: f.frequency, dueDay: 5,
    });
    feeStructureIds.push(Number((r as any).insertId));
  }
  console.log("✅  Fee structures created");

  // ── 9. Invoices ────────────────────────────────────────────────────────────
  const now = new Date();
  const invoiceDefs = [
    // paid invoices
    { studentIdx: 0,  amount: "4500", dueDate: "2025-06-05", status: "paid"    as const, paidAt: new Date("2025-06-04"), feeStructureIdx: 0 },
    { studentIdx: 1,  amount: "5500", dueDate: "2025-06-05", status: "paid"    as const, paidAt: new Date("2025-06-03"), feeStructureIdx: 1 },
    { studentIdx: 2,  amount: "6500", dueDate: "2025-06-05", status: "paid"    as const, paidAt: new Date("2025-06-05"), feeStructureIdx: 2 },
    { studentIdx: 3,  amount: "5500", dueDate: "2025-06-05", status: "paid"    as const, paidAt: new Date("2025-06-02"), feeStructureIdx: 1 },
    { studentIdx: 4,  amount: "6500", dueDate: "2025-06-05", status: "paid"    as const, paidAt: new Date("2025-06-05"), feeStructureIdx: 2 },
    // pending (July)
    { studentIdx: 0,  amount: "4500", dueDate: "2025-07-05", status: "sent"    as const, paidAt: null, feeStructureIdx: 0 },
    { studentIdx: 1,  amount: "5500", dueDate: "2025-07-05", status: "sent"    as const, paidAt: null, feeStructureIdx: 1 },
    { studentIdx: 2,  amount: "6500", dueDate: "2025-07-05", status: "draft"   as const, paidAt: null, feeStructureIdx: 2 },
    { studentIdx: 3,  amount: "5500", dueDate: "2025-07-05", status: "sent"    as const, paidAt: null, feeStructureIdx: 1 },
    // overdue
    { studentIdx: 5,  amount: "4500", dueDate: "2025-05-05", status: "overdue" as const, paidAt: null, feeStructureIdx: 0 },
    { studentIdx: 7,  amount: "5500", dueDate: "2025-05-05", status: "overdue" as const, paidAt: null, feeStructureIdx: 1 },
    // one-time admission fees
    { studentIdx: 6,  amount: "5000", dueDate: "2025-04-01", status: "paid"    as const, paidAt: new Date("2025-04-01"), feeStructureIdx: 5 },
    { studentIdx: 8,  amount: "5000", dueDate: "2025-04-01", status: "paid"    as const, paidAt: new Date("2025-03-30"), feeStructureIdx: 5 },
    { studentIdx: 11, amount: "5000", dueDate: "2025-08-01", status: "draft"   as const, paidAt: null, feeStructureIdx: 5 },
    // annual activity
    { studentIdx: 0,  amount: "3000", dueDate: "2025-04-15", status: "paid"    as const, paidAt: new Date("2025-04-14"), feeStructureIdx: 4 },
    { studentIdx: 1,  amount: "3000", dueDate: "2025-04-15", status: "paid"    as const, paidAt: new Date("2025-04-15"), feeStructureIdx: 4 },
    { studentIdx: 2,  amount: "3000", dueDate: "2025-04-15", status: "paid"    as const, paidAt: new Date("2025-04-13"), feeStructureIdx: 4 },
  ];
  for (const inv of invoiceDefs) {
    await db.insert(invoices).values({
      schoolId, locationId: locId1,
      studentId: studentIds[inv.studentIdx],
      feeStructureId: feeStructureIds[inv.feeStructureIdx],
      amount: inv.amount,
      dueDate: new Date(inv.dueDate),
      status: inv.status,
      paidAt: inv.paidAt,
    });
  }
  console.log("✅  Invoices created");

  // ── 10. Admissions / Inquiries ─────────────────────────────────────────────
  const inquiryDefs = [
    { parentName: "Meera Krishnan", email: "meera.k@gmail.com",  phone: "9901122334", childName: "Arjun",   childDob: "2022-05-10", program: "Playgroup", source: "walk_in",   status: "new"            as const },
    { parentName: "Suresh Babu",    email: "suresh.b@gmail.com",  phone: "9912233445", childName: "Lata",    childDob: "2021-08-20", program: "Nursery A", source: "referral",  status: "contacted"      as const },
    { parentName: "Nita Desai",     email: "nita.d@gmail.com",    phone: "9923344556", childName: "Ronak",   childDob: "2020-03-15", program: "Jr. KG",    source: "website",   status: "tour_scheduled" as const },
    { parentName: "Farhan Akhtar",  email: "farhan.a@gmail.com",  phone: "9934455667", childName: "Imaan",   childDob: "2021-11-01", program: "Nursery B", source: "social",    status: "applied"        as const },
    { parentName: "Kavya Pillai",   email: "kavya.p@gmail.com",   phone: "9945566778", childName: "Krish",   childDob: "2022-01-25", program: "Playgroup", source: "google",    status: "waitlisted"     as const },
    { parentName: "Arjun Das",      email: "arjun.d@gmail.com",   phone: "9956677889", childName: "Pari",    childDob: "2019-09-18", program: "Sr. KG",    source: "referral",  status: "enrolled"       as const },
    { parentName: "Suma Rao",       email: "suma.r@gmail.com",    phone: "9967788990", childName: "Vedant",  childDob: "2020-12-07", program: "Jr. KG",    source: "walk_in",   status: "new"            as const },
    { parentName: "Kiran Shah",     email: "kiran.s@gmail.com",   phone: "9978899001", childName: "Niti",    childDob: "2022-07-03", program: "Playgroup", source: "website",   status: "contacted"      as const },
    { parentName: "Preethi Nair",   email: "preethi.n@gmail.com", phone: "9989900112", childName: "Aditi",   childDob: "2021-04-16", program: "Nursery A", source: "google",    status: "tour_scheduled" as const },
    { parentName: "Ravi Menon",     email: "ravi.m@gmail.com",    phone: "9990011223", childName: "Saurav",  childDob: "2019-06-22", program: "Sr. KG",    source: "social",    status: "rejected"       as const },
  ];
  for (const inq of inquiryDefs) {
    await db.insert(inquiries).values({
      schoolId, locationId: locId1,
      parentName: inq.parentName, email: inq.email, phone: inq.phone,
      childName: inq.childName, childDob: new Date(inq.childDob),
      programInterest: inq.program, source: inq.source, status: inq.status,
      notes: null,
    });
  }
  console.log("✅  Inquiries created");

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  printCreds();
  await pool.end();
}

function printCreds() {
  const rows = [
    { role: "School Admin",    email: "admin@sunrisesprouts.in",      view: "/dashboard (full ERP access)" },
    { role: "Location Admin",  email: "loc-admin@sunrisesprouts.in",  view: "/dashboard (Whitefield branch)" },
    { role: "Teacher / Staff", email: "teacher@sunrisesprouts.in",    view: "/teacher" },
    { role: "Accountant",      email: "accountant@sunrisesprouts.in", view: "/dashboard (fees/finance focus)" },
    { role: "Parent",          email: "parent@sunrisesprouts.in",     view: "/parent (Aarav Kumar)" },
    { role: "Super Admin",     email: "superadmin@kinderdesk.in",      view: "/super-admin (platform view)" },
  ];
  console.log("\n🔑  LOGIN CREDENTIALS  (all share password: Demo@1234)\n");
  for (const r of rows) {
    console.log(`  ${r.role.padEnd(16)} │  ${r.email.padEnd(38)} │  ${r.view}`);
  }
  console.log("\n  URL: http://localhost:8080\n");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
