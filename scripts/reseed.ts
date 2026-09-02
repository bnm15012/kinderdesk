/**
 * Full reseed: truncates all data tables, then seeds fresh demo data
 * for every role in the system.
 *
 * Run:  bun run scripts/reseed.ts
 *
 * All users share password:  Demo@1234
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool } from "@/lib/db";
import {
  schools, locations, users, subscriptions, plans,
  classes, students, parents, staff,
  inquiries, feeStructures, invoices,
  classEnrollments, staffClassAssignments,
} from "@/lib/db/schema";

const PASS = "Demo@1234";
const SALT = 10;

const hash = (p: string) => bcrypt.hash(p, SALT);

// ── 1. Truncate all data tables ────────────────────────────────────────────────
async function truncateAll() {
  // Order matters — children first to avoid FK violations
  const tables = [
    "staff_attendance", "staff_class_assignments", "class_enrollments",
    "emergency_contacts", "medical_notes", "parents",
    "invoices", "payments", "subscription_payments",
    "fee_structures", "inquiries", "documents", "waitlist",
    "students", "staff", "classes",
    "subscriptions", "users", "locations", "schools",
    "plans",
  ];
  const conn = await pool.getConnection();
  try {
    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
    for (const t of tables) {
      await conn.execute(`TRUNCATE TABLE \`${t}\``);
    }
    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    conn.release();
  }
  console.log("🗑   All tables truncated\n");
}

// ── 2. Plans ──────────────────────────────────────────────────────────────────
async function seedPlans() {
  await db.insert(plans).values([
    {
      slug: "free", name: "Free", price: "₹0", period: "forever",
      description: "Perfect for getting started with a single branch.",
      features: JSON.stringify(["Up to 25 students", "1 branch/location", "Basic inquiries", "Student & class records", "Email support"]),
      featured: 0, displayOrder: 1, status: "active", cta: "Start free", ctaHref: "/signup",
    },
    {
      slug: "growth", name: "Growth", price: "₹1,499", period: "per month",
      description: "For growing schools with multiple classes and staff.",
      features: JSON.stringify(["Unlimited students", "Multiple branches", "Admissions & waitlist", "Fee management", "Staff & attendance", "WhatsApp/email notifications", "Standard support"]),
      featured: 1, displayOrder: 2, status: "active", cta: "Start free trial", ctaHref: "/signup",
    },
    {
      slug: "enterprise", name: "Enterprise", price: "Custom", period: "contact us",
      description: "Multi-school chains and franchise networks.",
      features: JSON.stringify(["Everything in Growth", "Multi-school dashboard", "Custom integrations", "Dedicated account manager", "SLA & priority support", "On-premise option"]),
      featured: 0, displayOrder: 3, status: "active", cta: "Contact sales", ctaHref: "mailto:sales@schoolnest.in",
    },
  ]);
  console.log("✅  Plans seeded (3)");
}

// ── 3. Super Admin (platform-level — no school) ───────────────────────────────
async function seedSuperAdmin() {
  // Super admin needs a school row but we store schoolId=1 (dummy)
  // Actually in our schema super_admin still has a schoolId column.
  // We'll create a dedicated internal "SchoolNest Platform" school for them.
  const [r] = await db.insert(schools).values({
    name: "SchoolNest Platform", slug: "schoolnest-platform",
    email: "platform@schoolnest.in", status: "active", plan: "enterprise", maxLocations: 99,
  });
  const schoolId = Number((r as any).insertId);

  const [lr] = await db.insert(locations).values({
    schoolId, name: "HQ", status: "active",
  });
  const locationId = Number((lr as any).insertId);

  await db.insert(users).values({
    schoolId, locationId,
    email: "superadmin@schoolnest.in",
    passwordHash: await hash(PASS),
    firstName: "Platform", lastName: "Admin",
    role: "super_admin", status: "active",
  });
  console.log("✅  Super admin created  →  superadmin@schoolnest.in");
  return { platformSchoolId: schoolId, platformLocationId: locationId };
}

// ── 4. Sunrise Sprouts Academy (main demo school) ─────────────────────────────
async function seedSunriseSchool() {
  // School
  const [sr] = await db.insert(schools).values({
    name: "Sunrise Sprouts Academy", slug: "sunrise-sprouts",
    email: "hello@sunrisesprouts.in", phone: "080-4567-8900",
    address: "12, 3rd Cross, Koramangala", city: "Bengaluru",
    state: "Karnataka", pincode: "560034", country: "India",
    currency: "INR", plan: "growth", maxLocations: 3, status: "active",
  });
  const schoolId = Number((sr as any).insertId);

  await db.insert(subscriptions).values({
    schoolId, plan: "growth", amount: "1499",
    currency: "INR", billingCycle: "monthly", status: "active",
  });

  // Branches
  const [lr1] = await db.insert(locations).values({
    schoolId, name: "Koramangala Branch",
    address: "12, 3rd Cross, Koramangala", city: "Bengaluru",
    state: "Karnataka", pincode: "560034", phone: "080-4567-8901",
    capacity: 80, status: "active",
  });
  const locKor = Number((lr1 as any).insertId);

  const [lr2] = await db.insert(locations).values({
    schoolId, name: "Whitefield Branch",
    address: "45, ITPL Road, Whitefield", city: "Bengaluru",
    state: "Karnataka", pincode: "560066", phone: "080-4567-8902",
    capacity: 60, status: "active",
  });
  const locWf = Number((lr2 as any).insertId);

  console.log(`✅  Sunrise Sprouts Academy created  (id ${schoolId}, branches ${locKor}, ${locWf})`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const userRows = [
    { email: "admin@sunrisesprouts.in",      role: "school_admin"   as const, firstName: "Priya",   lastName: "Sharma",   locationId: locKor },
    { email: "loc-admin@sunrisesprouts.in",  role: "location_admin" as const, firstName: "Rajan",   lastName: "Nair",     locationId: locWf  },
    { email: "teacher@sunrisesprouts.in",    role: "teacher"        as const, firstName: "Neha",    lastName: "Gupta",    locationId: locKor },
    { email: "accountant@sunrisesprouts.in", role: "accountant"     as const, firstName: "Sanjay",  lastName: "Mehta",    locationId: locKor },
    { email: "parent@sunrisesprouts.in",     role: "parent"         as const, firstName: "Anil",    lastName: "Kumar",    locationId: locKor },
  ];
  for (const u of userRows) {
    await db.insert(users).values({
      schoolId, locationId: u.locationId, email: u.email,
      passwordHash: await hash(PASS),
      firstName: u.firstName, lastName: u.lastName,
      role: u.role, status: "active",
    });
  }
  console.log("✅  Users created (school_admin, location_admin, teacher, accountant, parent)");

  // ── Classes (Koramangala) ──────────────────────────────────────────────────
  const classDefs = [
    { name: "Playgroup", ageGroup: "1.5–2.5 yrs", roomName: "Sunflower Room", capacity: 15, startTime: "08:30", endTime: "11:30" },
    { name: "Nursery A", ageGroup: "2.5–3.5 yrs", roomName: "Rainbow Room",   capacity: 20, startTime: "09:00", endTime: "12:30" },
    { name: "Nursery B", ageGroup: "2.5–3.5 yrs", roomName: "Butterfly Room", capacity: 20, startTime: "09:30", endTime: "13:00" },
    { name: "Jr. KG",   ageGroup: "3.5–4.5 yrs", roomName: "Rocket Room",    capacity: 25, startTime: "09:00", endTime: "13:30" },
    { name: "Sr. KG",   ageGroup: "4.5–5.5 yrs", roomName: "Ocean Room",     capacity: 25, startTime: "09:30", endTime: "14:00" },
  ];
  const classIds: number[] = [];
  for (const c of classDefs) {
    const [r] = await db.insert(classes).values({
      schoolId, locationId: locKor, academicYear: "2025-26", status: "active", ...c,
    });
    classIds.push(Number((r as any).insertId));
  }

  // Classes (Whitefield) — simpler set
  const wfClassDefs = [
    { name: "Playgroup", ageGroup: "1.5–2.5 yrs", roomName: "Yellow Room", capacity: 12, startTime: "09:00", endTime: "12:00" },
    { name: "Nursery",   ageGroup: "2.5–3.5 yrs", roomName: "Blue Room",   capacity: 18, startTime: "09:00", endTime: "12:30" },
    { name: "Jr. KG",   ageGroup: "3.5–4.5 yrs", roomName: "Green Room",  capacity: 20, startTime: "09:00", endTime: "13:00" },
  ];
  const wfClassIds: number[] = [];
  for (const c of wfClassDefs) {
    const [r] = await db.insert(classes).values({
      schoolId, locationId: locWf, academicYear: "2025-26", status: "active", ...c,
    });
    wfClassIds.push(Number((r as any).insertId));
  }
  console.log("✅  Classes created (5 Koramangala + 3 Whitefield)");

  // ── Staff (Koramangala) ────────────────────────────────────────────────────
  const staffDefs = [
    // First entry email matches teacher login → portal works
    { firstName: "Neha",    lastName: "Gupta",   email: "teacher@sunrisesprouts.in",  phone: "9876511223", role: "teacher"   as const, salary: "28000", joinDate: "2023-06-01", bgCheck: "verified"    as const },
    { firstName: "Rahul",   lastName: "Iyer",    email: "rahul.i@sunrisesprouts.in",  phone: "9123499887", role: "assistant" as const, salary: "18000", joinDate: "2024-01-15", bgCheck: "verified"    as const },
    { firstName: "Sunita",  lastName: "Rao",     email: "sunita.r@sunrisesprouts.in", phone: "9900112233", role: "admin"     as const, salary: "22000", joinDate: "2022-08-01", bgCheck: "verified"    as const },
    { firstName: "Kavitha", lastName: "Pillai",  email: "kavitha@sunrisesprouts.in",  phone: "9988001122", role: "teacher"   as const, salary: "27000", joinDate: "2023-09-01", bgCheck: "in_progress" as const },
    { firstName: "Dinesh",  lastName: "Bhat",    email: "dinesh@sunrisesprouts.in",   phone: "9776655443", role: "support"   as const, salary: "15000", joinDate: "2024-03-01", bgCheck: "pending"     as const },
    { firstName: "Anita",   lastName: "Verma",   email: "anita.v@sunrisesprouts.in",  phone: "9665544332", role: "principal" as const, salary: "45000", joinDate: "2021-05-01", bgCheck: "verified"    as const },
  ];
  const staffIds: number[] = [];
  for (const s of staffDefs) {
    const [r] = await db.insert(staff).values({
      schoolId, locationId: locKor,
      firstName: s.firstName, lastName: s.lastName,
      email: s.email, phone: s.phone,
      role: s.role, salary: s.salary,
      joinDate: new Date(s.joinDate),
      status: "active", backgroundCheckStatus: s.bgCheck,
    });
    staffIds.push(Number((r as any).insertId));
  }

  // Neha (teacher, login: teacher@sunrisesprouts.in) → Nursery A only
  await db.insert(staffClassAssignments).values({
    schoolId, locationId: locKor, staffId: staffIds[0], classId: classIds[1], academicYear: "2025-26",
  });
  // Rahul (assistant) → supports Nursery A & Nursery B (non-clashing: 09:00 & 09:30)
  await db.insert(staffClassAssignments).values([
    { schoolId, locationId: locKor, staffId: staffIds[1], classId: classIds[1], academicYear: "2025-26" },
    { schoolId, locationId: locKor, staffId: staffIds[1], classId: classIds[2], academicYear: "2025-26" },
  ]);
  // Kavitha → Jr. KG (09:00) & Sr. KG (09:30) — staggered so no clash
  await db.insert(staffClassAssignments).values([
    { schoolId, locationId: locKor, staffId: staffIds[3], classId: classIds[3], academicYear: "2025-26" },
    { schoolId, locationId: locKor, staffId: staffIds[3], classId: classIds[4], academicYear: "2025-26" },
  ]);
  // Playgroup has no assigned teacher — Anita (principal) covers ad-hoc
  console.log("✅  Staff created + class assignments done");

  // Staff (Whitefield)
  await db.insert(staff).values([
    { schoolId, locationId: locWf, firstName: "Meena", lastName: "Thomas",  email: "meena.t@sunrisesprouts.in", phone: "9554433221", role: "teacher",   salary: "26000", joinDate: new Date("2023-07-01"), status: "active", backgroundCheckStatus: "verified" },
    { schoolId, locationId: locWf, firstName: "Vivek", lastName: "Pandey",  email: "vivek.p@sunrisesprouts.in", phone: "9443322110", role: "assistant",  salary: "17000", joinDate: new Date("2024-02-01"), status: "active", backgroundCheckStatus: "verified" },
  ]);
  console.log("✅  Whitefield staff created");

  // ── Students (Koramangala) ─────────────────────────────────────────────────
  const studentDefs = [
    { firstName: "Aarav",  lastName: "Kumar",  dob: "2021-03-12", gender: "male"   as const, classIdx: 2, status: "enrolled"   as const, allergies: null },
    { firstName: "Mira",   lastName: "Shah",   dob: "2020-07-25", gender: "female" as const, classIdx: 3, status: "enrolled"   as const, allergies: "Peanuts" },
    { firstName: "Vivan",  lastName: "Mehta",  dob: "2019-11-08", gender: "male"   as const, classIdx: 4, status: "enrolled"   as const, allergies: null },
    { firstName: "Ananya", lastName: "Reddy",  dob: "2021-01-30", gender: "female" as const, classIdx: 2, status: "enrolled"   as const, allergies: null },
    { firstName: "Rohan",  lastName: "Patel",  dob: "2020-09-14", gender: "male"   as const, classIdx: 3, status: "enrolled"   as const, allergies: "Dairy" },
    { firstName: "Sia",    lastName: "Joshi",  dob: "2022-04-05", gender: "female" as const, classIdx: 0, status: "enrolled"   as const, allergies: null },
    { firstName: "Dev",    lastName: "Nair",   dob: "2021-08-19", gender: "male"   as const, classIdx: 1, status: "enrolled"   as const, allergies: null },
    { firstName: "Priya",  lastName: "Iyer",   dob: "2021-05-22", gender: "female" as const, classIdx: 1, status: "enrolled"   as const, allergies: null },
    { firstName: "Kabir",  lastName: "Singh",  dob: "2019-12-01", gender: "male"   as const, classIdx: 4, status: "enrolled"   as const, allergies: null },
    { firstName: "Nisha",  lastName: "Gupta",  dob: "2022-02-14", gender: "female" as const, classIdx: 0, status: "waitlisted" as const, allergies: null },
    { firstName: "Aryan",  lastName: "Sharma", dob: "2020-06-30", gender: "male"   as const, classIdx: 3, status: "applied"    as const, allergies: null },
    { firstName: "Zara",   lastName: "Khan",   dob: "2021-10-11", gender: "female" as const, classIdx: 2, status: "enrolled"   as const, allergies: "Eggs" },
    { firstName: "Riya",   lastName: "Desai",  dob: "2022-01-20", gender: "female" as const, classIdx: 0, status: "enrolled"   as const, allergies: null },
    { firstName: "Aiden",  lastName: "D'Souza",dob: "2020-05-16", gender: "male"   as const, classIdx: 3, status: "enrolled"   as const, allergies: null },
    { firstName: "Tara",   lastName: "Menon",  dob: "2021-09-03", gender: "female" as const, classIdx: 1, status: "enrolled"   as const, allergies: null },
  ];
  const studentIds: number[] = [];
  for (const s of studentDefs) {
    const [r] = await db.insert(students).values({
      schoolId, locationId: locKor,
      firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: new Date(s.dob), gender: s.gender,
      status: s.status, allergies: s.allergies,
      currentClassId: classIds[s.classIdx],
    });
    studentIds.push(Number((r as any).insertId));
  }

  // Enroll enrolled students
  const toEnroll = studentDefs.map((s, i) => ({ s, i })).filter(({ s }) => s.status === "enrolled");
  await db.insert(classEnrollments).values(
    toEnroll.map(({ s, i }) => ({
      schoolId, locationId: locKor,
      studentId: studentIds[i], classId: classIds[s.classIdx],
      academicYear: "2025-26", status: "active" as const,
    }))
  );

  // Parent for Aarav (links to parent login)
  await db.insert(parents).values({
    schoolId, locationId: locKor, studentId: studentIds[0],
    relation: "father", name: "Anil Kumar",
    email: "parent@sunrisesprouts.in", phone: "9812345678",
    isPrimary: 1, isEmergency: 1,
  });
  // Other parents
  const parentPairs = [
    { i: 1,  name: "Ramesh Shah",    email: "ramesh.shah@gmail.com",  phone: "9823456789", rel: "father" as const },
    { i: 2,  name: "Seema Mehta",    email: "seema.m@gmail.com",      phone: "9834567890", rel: "mother" as const },
    { i: 3,  name: "Vijay Reddy",    email: "vijay.r@gmail.com",      phone: "9845678901", rel: "father" as const },
    { i: 4,  name: "Geeta Patel",    email: "geeta.p@gmail.com",      phone: "9856789012", rel: "mother" as const },
    { i: 5,  name: "Lakshmi Joshi",  email: "lakshmi.j@gmail.com",    phone: "9867890123", rel: "mother" as const },
    { i: 6,  name: "Suresh Nair",    email: "suresh.n@gmail.com",     phone: "9878901234", rel: "father" as const },
    { i: 7,  name: "Deepa Iyer",     email: "deepa.i@gmail.com",      phone: "9889012345", rel: "mother" as const },
    { i: 8,  name: "Harish Singh",   email: "harish.s@gmail.com",     phone: "9890123456", rel: "father" as const },
    { i: 11, name: "Farid Khan",     email: "farid.k@gmail.com",      phone: "9901234567", rel: "father" as const },
    { i: 12, name: "Priti Desai",    email: "priti.d@gmail.com",      phone: "9912345678", rel: "mother" as const },
    { i: 13, name: "Jude D'Souza",   email: "jude.d@gmail.com",       phone: "9923456789", rel: "father" as const },
    { i: 14, name: "Nandita Menon",  email: "nandita.m@gmail.com",    phone: "9934567890", rel: "mother" as const },
  ];
  for (const p of parentPairs) {
    await db.insert(parents).values({
      schoolId, locationId: locKor, studentId: studentIds[p.i],
      relation: p.rel, name: p.name, email: p.email, phone: p.phone,
      isPrimary: 1, isEmergency: 0,
    });
  }
  console.log("✅  Students + parents created (15 students)");

  // Students (Whitefield) — smaller set
  const wfStudentDefs = [
    { firstName: "Aanya",  lastName: "Nair",  dob: "2022-03-10", gender: "female" as const, classIdx: 0, status: "enrolled" as const },
    { firstName: "Ishaan", lastName: "Roy",   dob: "2021-07-14", gender: "male"   as const, classIdx: 1, status: "enrolled" as const },
    { firstName: "Diya",   lastName: "Bose",  dob: "2020-11-22", gender: "female" as const, classIdx: 2, status: "enrolled" as const },
    { firstName: "Vivaan", lastName: "Kaur",  dob: "2022-01-08", gender: "male"   as const, classIdx: 0, status: "enrolled" as const },
    { firstName: "Pihu",   lastName: "Gill",  dob: "2021-05-30", gender: "female" as const, classIdx: 1, status: "applied"  as const },
  ];
  const wfStudentIds: number[] = [];
  for (const s of wfStudentDefs) {
    const [r] = await db.insert(students).values({
      schoolId, locationId: locWf,
      firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: new Date(s.dob), gender: s.gender,
      status: s.status, currentClassId: wfClassIds[s.classIdx],
    });
    wfStudentIds.push(Number((r as any).insertId));
  }
  const wfToEnroll = wfStudentDefs.map((s, i) => ({ s, i })).filter(({ s }) => s.status === "enrolled");
  await db.insert(classEnrollments).values(
    wfToEnroll.map(({ s, i }) => ({
      schoolId, locationId: locWf,
      studentId: wfStudentIds[i], classId: wfClassIds[s.classIdx],
      academicYear: "2025-26", status: "active" as const,
    }))
  );
  console.log("✅  Whitefield students created (5)");

  // ── Fee Structures ─────────────────────────────────────────────────────────
  const fsDefs = [
    { name: "Monthly Tuition – Playgroup", amount: "4500", frequency: "monthly"  as const, classIdx: 0 as number | null },
    { name: "Monthly Tuition – Nursery A", amount: "5500", frequency: "monthly"  as const, classIdx: 1 },
    { name: "Monthly Tuition – Nursery B", amount: "5500", frequency: "monthly"  as const, classIdx: 2 },
    { name: "Monthly Tuition – Jr. KG",    amount: "6500", frequency: "monthly"  as const, classIdx: 3 },
    { name: "Monthly Tuition – Sr. KG",    amount: "7000", frequency: "monthly"  as const, classIdx: 4 },
    { name: "Annual Activity Fee",         amount: "3000", frequency: "annually" as const, classIdx: null },
    { name: "One-time Admission Fee",      amount: "5000", frequency: "one_time" as const, classIdx: null },
  ];
  const fsIds: number[] = [];
  for (const f of fsDefs) {
    const [r] = await db.insert(feeStructures).values({
      schoolId, locationId: locKor,
      classId: f.classIdx !== null ? classIds[f.classIdx] : null,
      name: f.name, amount: f.amount, frequency: f.frequency, dueDay: 5,
    });
    fsIds.push(Number((r as any).insertId));
  }
  console.log("✅  Fee structures created");

  // ── Invoices ───────────────────────────────────────────────────────────────
  // Use relative dates so demo data always looks realistic regardless of when reseed is run.
  const d = (offsetDays: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);

  const invDefs = [
    // paid – last month (historical)
    { si: 0,  amount: "4500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-31), fsi: 0 },
    { si: 1,  amount: "5500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-32), fsi: 1 },
    { si: 2,  amount: "6500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-30), fsi: 3 },
    { si: 3,  amount: "5500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-33), fsi: 1 },
    { si: 4,  amount: "6500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-30), fsi: 3 },
    { si: 6,  amount: "5500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-34), fsi: 1 },
    { si: 7,  amount: "5500", due: fmt(d(-30)), status: "paid"    as const, paidAt: d(-30), fsi: 1 },
    // sent – upcoming this month (due in 5 / 8 / 10 days)
    { si: 0,  amount: "4500", due: fmt(d(5)),  status: "sent"    as const, paidAt: null, fsi: 0 },
    { si: 1,  amount: "5500", due: fmt(d(5)),  status: "sent"    as const, paidAt: null, fsi: 1 },
    { si: 2,  amount: "6500", due: fmt(d(5)),  status: "draft"   as const, paidAt: null, fsi: 3 },
    { si: 3,  amount: "5500", due: fmt(d(8)),  status: "sent"    as const, paidAt: null, fsi: 1 },
    { si: 4,  amount: "6500", due: fmt(d(8)),  status: "sent"    as const, paidAt: null, fsi: 3 },
    { si: 12, amount: "4500", due: fmt(d(10)), status: "sent"    as const, paidAt: null, fsi: 0 },
    { si: 13, amount: "6500", due: fmt(d(10)), status: "sent"    as const, paidAt: null, fsi: 3 },
    { si: 14, amount: "5500", due: fmt(d(10)), status: "draft"   as const, paidAt: null, fsi: 1 },
    // overdue – missed last month (due -25 / -20 / -15 days ago)
    { si: 5,  amount: "4500", due: fmt(d(-25)), status: "overdue" as const, paidAt: null, fsi: 0 },
    { si: 7,  amount: "5500", due: fmt(d(-20)), status: "overdue" as const, paidAt: null, fsi: 1 },
    { si: 8,  amount: "7000", due: fmt(d(-15)), status: "overdue" as const, paidAt: null, fsi: 4 },
    // one-time admission fees
    { si: 6,  amount: "5000", due: fmt(d(-60)), status: "paid"    as const, paidAt: d(-60), fsi: 6 },
    { si: 8,  amount: "5000", due: fmt(d(-60)), status: "paid"    as const, paidAt: d(-62), fsi: 6 },
    { si: 11, amount: "5000", due: fmt(d(30)),  status: "draft"   as const, paidAt: null,   fsi: 6 },
    // annual activity fees
    { si: 0,  amount: "3000", due: fmt(d(-45)), status: "paid"    as const, paidAt: d(-46), fsi: 5 },
    { si: 1,  amount: "3000", due: fmt(d(-45)), status: "paid"    as const, paidAt: d(-45), fsi: 5 },
    { si: 2,  amount: "3000", due: fmt(d(-45)), status: "paid"    as const, paidAt: d(-47), fsi: 5 },
  ];
  for (const inv of invDefs) {
    await db.insert(invoices).values({
      schoolId, locationId: locKor,
      studentId: studentIds[inv.si],
      feeStructureId: fsIds[inv.fsi],
      amount: inv.amount,
      dueDate: new Date(inv.due),
      status: inv.status,
      paidAt: inv.paidAt,
    });
  }
  console.log("✅  Invoices created (24)");

  // ── Inquiries (Admissions) ─────────────────────────────────────────────────
  const inquiryDefs = [
    { parentName: "Meera Krishnan",  email: "meera.k@gmail.com",   phone: "9901122334", childName: "Arjun",  childDob: "2022-05-10", program: "Playgroup", source: "walk_in",   status: "new"            as const },
    { parentName: "Suresh Babu",     email: "suresh.b@gmail.com",   phone: "9912233445", childName: "Lata",   childDob: "2021-08-20", program: "Nursery A", source: "referral",  status: "contacted"      as const },
    { parentName: "Nita Desai",      email: "nita.d@gmail.com",     phone: "9923344556", childName: "Ronak",  childDob: "2020-03-15", program: "Jr. KG",    source: "website",   status: "tour_scheduled" as const },
    { parentName: "Farhan Akhtar",   email: "farhan.a@gmail.com",   phone: "9934455667", childName: "Imaan",  childDob: "2021-11-01", program: "Nursery B", source: "social",    status: "applied"        as const },
    { parentName: "Kavya Pillai",    email: "kavya.p@gmail.com",    phone: "9945566778", childName: "Krish",  childDob: "2022-01-25", program: "Playgroup", source: "google",    status: "waitlisted"     as const },
    { parentName: "Arjun Das",       email: "arjun.d@gmail.com",    phone: "9956677889", childName: "Pari",   childDob: "2019-09-18", program: "Sr. KG",    source: "referral",  status: "enrolled"       as const },
    { parentName: "Suma Rao",        email: "suma.r@gmail.com",     phone: "9967788990", childName: "Vedant", childDob: "2020-12-07", program: "Jr. KG",    source: "walk_in",   status: "new"            as const },
    { parentName: "Kiran Shah",      email: "kiran.s@gmail.com",    phone: "9978899001", childName: "Niti",   childDob: "2022-07-03", program: "Playgroup", source: "website",   status: "contacted"      as const },
    { parentName: "Preethi Nair",    email: "preethi.n@gmail.com",  phone: "9989900112", childName: "Aditi",  childDob: "2021-04-16", program: "Nursery A", source: "google",    status: "tour_scheduled" as const },
    { parentName: "Ravi Menon",      email: "ravi.m@gmail.com",     phone: "9990011223", childName: "Saurav", childDob: "2019-06-22", program: "Sr. KG",    source: "social",    status: "rejected"       as const },
    { parentName: "Pooja Agarwal",   email: "pooja.a@gmail.com",    phone: "8890011223", childName: "Tejas",  childDob: "2022-09-05", program: "Playgroup", source: "google",    status: "new"            as const },
    { parentName: "Siddharth Iyer",  email: "siddharth.i@gmail.com",phone: "8780011223", childName: "Anvi",   childDob: "2021-02-18", program: "Nursery B", source: "referral",  status: "applied"        as const },
  ];
  for (const inq of inquiryDefs) {
    await db.insert(inquiries).values({
      schoolId, locationId: locKor,
      parentName: inq.parentName, email: inq.email, phone: inq.phone,
      childName: inq.childName, childDob: new Date(inq.childDob),
      programInterest: inq.program, source: inq.source, status: inq.status,
      notes: null,
    });
  }
  console.log("✅  Inquiries created (12)");

  return { schoolId, locKor, locWf };
}

// ── 5. Second school: Bloomfield Kids (to demo super-admin multi-school) ─────
async function seedBloomfieldSchool() {
  const [sr] = await db.insert(schools).values({
    name: "Bloomfield Kids", slug: "bloomfield-kids",
    email: "hello@bloomfieldkids.in", phone: "022-3456-7890",
    address: "78, Linking Road, Bandra", city: "Mumbai",
    state: "Maharashtra", pincode: "400050", country: "India",
    currency: "INR", plan: "free", maxLocations: 1, status: "active",
  });
  const schoolId = Number((sr as any).insertId);

  await db.insert(subscriptions).values({
    schoolId, plan: "free", amount: "0",
    currency: "INR", billingCycle: "monthly", status: "active",
  });

  const [lr] = await db.insert(locations).values({
    schoolId, name: "Bandra Branch",
    address: "78, Linking Road, Bandra", city: "Mumbai",
    state: "Maharashtra", pincode: "400050", phone: "022-3456-7891",
    capacity: 50, status: "active",
  });
  const locationId = Number((lr as any).insertId);

  await db.insert(users).values({
    schoolId, locationId,
    email: "admin@bloomfieldkids.in",
    passwordHash: await hash(PASS),
    firstName: "Preetam", lastName: "Kolhapure",
    role: "school_admin", status: "active",
  });

  // A few classes + students so it looks real in super-admin view
  const [cls1r] = await db.insert(classes).values({ schoolId, locationId, name: "Nursery", ageGroup: "2.5–3.5 yrs", roomName: "Room 1", capacity: 20, academicYear: "2025-26", status: "active" });
  const [cls2r] = await db.insert(classes).values({ schoolId, locationId, name: "Jr. KG",  ageGroup: "3.5–4.5 yrs", roomName: "Room 2", capacity: 20, academicYear: "2025-26", status: "active" });
  const cls1 = Number((cls1r as any).insertId);
  const cls2 = Number((cls2r as any).insertId);

  const bfStudents = [
    { firstName: "Mihir", lastName: "Joshi", dob: "2021-04-12", gender: "male" as const, classId: cls1 },
    { firstName: "Riya",  lastName: "Shah",  dob: "2020-09-20", gender: "female" as const, classId: cls2 },
    { firstName: "Kush",  lastName: "Mehta", dob: "2021-11-05", gender: "male" as const, classId: cls1 },
  ];
  for (const s of bfStudents) {
    const [r] = await db.insert(students).values({
      schoolId, locationId, firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: new Date(s.dob), gender: s.gender,
      status: "enrolled", currentClassId: s.classId,
    });
    await db.insert(classEnrollments).values({
      schoolId, locationId, studentId: Number((r as any).insertId),
      classId: s.classId, academicYear: "2025-26", status: "active",
    });
  }

  console.log(`✅  Bloomfield Kids (Mumbai) created  (id ${schoolId})`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀  SchoolNest full reseed starting…\n");
  await truncateAll();
  await seedPlans();
  await seedSuperAdmin();
  await seedSunriseSchool();
  await seedBloomfieldSchool();

  console.log("\n" + "═".repeat(72));
  console.log("\n🔑  LOGIN CREDENTIALS  (all share password: Demo@1234)\n");
  const creds = [
    { role: "Platform Super Admin", email: "superadmin@schoolnest.in",      url: "/super-admin" },
    { role: "School Admin",         email: "admin@sunrisesprouts.in",      url: "/dashboard (full ERP)" },
    { role: "Location Admin",       email: "loc-admin@sunrisesprouts.in",  url: "/dashboard (Whitefield)" },
    { role: "Teacher / Staff",      email: "teacher@sunrisesprouts.in",    url: "/teacher" },
    { role: "Accountant",           email: "accountant@sunrisesprouts.in", url: "/dashboard (fees)" },
    { role: "Parent",               email: "parent@sunrisesprouts.in",     url: "/parent (Aarav Kumar)" },
    { role: "School 2 Admin",       email: "admin@bloomfieldkids.in",      url: "/dashboard (Bloomfield Kids)" },
  ];
  for (const c of creds) {
    console.log(`  ${c.role.padEnd(22)} │  ${c.email.padEnd(38)} │  ${c.url}`);
  }
  console.log("\n  URL: http://localhost:8080\n");
  await pool.end();
}

main().catch(async (e) => {
  console.error("\n❌  Reseed failed:", e.message);
  await pool.end();
  process.exit(1);
});
