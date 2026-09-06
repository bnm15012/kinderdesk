/**
 * Fresh seed — KinderDesk local dev
 *
 * Structure:
 *   1  Super admin  (platform level, no school)
 *   1  School  →  Sunrise Sprouts Academy  (growth plan, 2 branches)
 *      Branch 1: Koramangala  →  school_admin, location_admin, 4 staff, 3 classes, 10 students, fees, inquiries
 *      Branch 2: Whitefield   →  location_admin, 3 staff, 2 classes, 6 students, fees, inquiries
 *
 * Run:  bun run scripts/seed-fresh.ts
 * All passwords: Demo@1234
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool } from "@/lib/db";
import {
  schools, locations, users, subscriptions, subscriptionPayments, plans,
  classes, staff, staffClassAssignments,
  students, parents, emergencyContacts, medicalNotes,
  classEnrollments, feeStructures, invoices,
  inquiries, studentAttendance, staffAttendance,
} from "@/lib/db/schema";

const PASS = "Demo@1234";
async function hash(p: string) { return bcrypt.hash(p, 10); }

// ─── Super admin needs a "platform" school row (app requirement) ──────────────
const SUPER_ADMIN_EMAIL  = "superadmin@kinderdesk.in";

// ─── School ───────────────────────────────────────────────────────────────────
const SCHOOL_EMAIL       = "hello@sunrisesprouts.in";
const SCHOOL_ADMIN_EMAIL = "priya.sharma@sunrisesprouts.in";   // school_admin (sees both branches)

// Branch 1 – Koramangala
const LOC1_ADMIN_EMAIL   = "rajan.nair@sunrisesprouts.in";     // location_admin
const LOC1_TEACHER1      = "neha.gupta@sunrisesprouts.in";     // teacher
const LOC1_TEACHER2      = "kavitha.pillai@sunrisesprouts.in"; // teacher
const LOC1_ACCOUNTANT    = "sanjay.mehta@sunrisesprouts.in";   // accountant

// Branch 2 – Whitefield
const LOC2_ADMIN_EMAIL   = "meena.krishna@sunrisesprouts.in";  // location_admin
const LOC2_TEACHER1      = "arjun.das@sunrisesprouts.in";      // teacher
const LOC2_TEACHER2      = "sunita.rao@sunrisesprouts.in";     // teacher

// Parent (tied to a student in Branch 1)
const PARENT_EMAIL       = "anil.kumar@gmail.com";

async function main() {
  console.log("\n🌱  Seeding fresh KinderDesk data…\n");

  // ─── 0. Platform super-admin (needs a school row as FK) ───────────────────
  const [platformSchoolRes] = await db.insert(schools).values({
    name: "KinderDesk Platform",
    slug: "kinderdesk-platform",
    status: "active",
    plan: "enterprise",
    maxLocations: 999,
    maxStudents: 999999,
    maxStaff: 999999,
  });
  const platformSchoolId = Number((platformSchoolRes as any).insertId);

  const [platformLocRes] = await db.insert(locations).values({
    schoolId: platformSchoolId,
    name: "Platform HQ",
    status: "active",
  });
  const platformLocId = Number((platformLocRes as any).insertId);

  await db.insert(users).values({
    schoolId: platformSchoolId,
    locationId: platformLocId,
    email: SUPER_ADMIN_EMAIL,
    passwordHash: await hash(PASS),
    firstName: "Platform",
    lastName: "Admin",
    role: "super_admin",
    status: "active",
    emailConfirmed: 1,
  });
  console.log("✅  Super admin created");

  // ─── 1. Plans catalog ─────────────────────────────────────────────────────
  await db.insert(plans).values([
    {
      slug: "free", name: "Free", price: "₹0", period: "forever",
      description: "Perfect for getting started with a single branch.",
      features: JSON.stringify(["1 branch", "Up to 50 students", "3 staff accounts", "Basic fee management"]),
      featured: 0, displayOrder: 1, status: "active",
      cta: "Get started free", ctaHref: "/signup",
    },
    {
      slug: "growth", name: "Growth", price: "Contact us", period: "for a quote",
      description: "For growing schools with multiple branches.",
      features: JSON.stringify(["Up to 5 branches", "Unlimited students & staff", "Full admissions pipeline", "Razorpay payments", "Analytics & reports"]),
      featured: 1, displayOrder: 2, status: "active",
      cta: "Get a quote", ctaHref: "https://wa.me/917326027500",
    },
    {
      slug: "enterprise", name: "Enterprise", price: "Contact us", period: "for a quote",
      description: "For chains and franchise networks.",
      features: JSON.stringify(["Unlimited branches", "Dedicated account manager", "Custom integrations", "SLA guarantee"]),
      featured: 0, displayOrder: 3, status: "active",
      cta: "Talk to us", ctaHref: "https://wa.me/917326027500",
    },
  ]);
  console.log("✅  Plans created");

  // ─── 2. School ────────────────────────────────────────────────────────────
  const [schoolRes] = await db.insert(schools).values({
    name: "Sunrise Sprouts Academy",
    slug: "sunrise-sprouts",
    email: SCHOOL_EMAIL,
    phone: "080-4567-8900",
    address: "12, 3rd Cross, Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    country: "India",
    currency: "INR",
    plan: "growth",
    maxLocations: 5,
    maxStudents: 999,
    maxStaff: 999,
    status: "active",
  });
  const schoolId = Number((schoolRes as any).insertId);
  console.log(`✅  School created (id ${schoolId})`);

  const [subRes] = await db.insert(subscriptions).values({
    schoolId, plan: "growth", amount: "1999",
    currency: "INR", billingCycle: "monthly", status: "active",
    currentPeriodStart: new Date("2026-09-01"),
    currentPeriodEnd:   new Date("2026-09-30"),
    startedAt: new Date("2026-06-01"),
  });
  const subscriptionId = Number((subRes as any).insertId);

  // Simulate 3 months of Razorpay payments (captured via webhook)
  const paymentMonths = [
    { month: "2026-06", paidAt: new Date("2026-06-01"), orderId: "order_QJun2026001", paymentId: "pay_QJun2026ABC001" },
    { month: "2026-07", paidAt: new Date("2026-07-01"), orderId: "order_QJul2026001", paymentId: "pay_QJul2026ABC001" },
    { month: "2026-08", paidAt: new Date("2026-08-01"), orderId: "order_QAug2026001", paymentId: "pay_QAug2026ABC001" },
  ];
  for (const p of paymentMonths) {
    await db.insert(subscriptionPayments).values({
      schoolId,
      subscriptionId,
      amount: "1999",
      currency: "INR",
      status: "captured",
      razorpayOrderId:   p.orderId,
      razorpayPaymentId: p.paymentId,
      paidAt: p.paidAt,
    });
  }

  // ─── 3. Branches ──────────────────────────────────────────────────────────
  const [loc1Res] = await db.insert(locations).values({
    schoolId, name: "Koramangala Branch",
    address: "12, 3rd Cross, Koramangala",
    city: "Bengaluru", state: "Karnataka", pincode: "560034",
    phone: "080-4567-8901", capacity: 80, status: "active",
  });
  const locId1 = Number((loc1Res as any).insertId);

  const [loc2Res] = await db.insert(locations).values({
    schoolId, name: "Whitefield Branch",
    address: "45, ITPL Road, Whitefield",
    city: "Bengaluru", state: "Karnataka", pincode: "560066",
    phone: "080-4567-8902", capacity: 60, status: "active",
  });
  const locId2 = Number((loc2Res as any).insertId);
  console.log(`✅  Branches created (Koramangala: ${locId1}, Whitefield: ${locId2})`);

  // ─── 4. Users ─────────────────────────────────────────────────────────────
  const pw = await hash(PASS);

  // School admin (sees all branches)
  await db.insert(users).values({
    schoolId, locationId: locId1, email: SCHOOL_ADMIN_EMAIL,
    passwordHash: pw, firstName: "Priya", lastName: "Sharma",
    role: "school_admin", status: "active", emailConfirmed: 1,
  });

  // Branch 1 – Koramangala admins & staff
  await db.insert(users).values({
    schoolId, locationId: locId1, email: LOC1_ADMIN_EMAIL,
    passwordHash: pw, firstName: "Rajan", lastName: "Nair",
    role: "location_admin", status: "active", emailConfirmed: 1,
  });
  await db.insert(users).values({
    schoolId, locationId: locId1, email: LOC1_TEACHER1,
    passwordHash: pw, firstName: "Neha", lastName: "Gupta",
    role: "teacher", status: "active", emailConfirmed: 1,
  });
  await db.insert(users).values({
    schoolId, locationId: locId1, email: LOC1_TEACHER2,
    passwordHash: pw, firstName: "Kavitha", lastName: "Pillai",
    role: "teacher", status: "active", emailConfirmed: 1,
  });
  await db.insert(users).values({
    schoolId, locationId: locId1, email: LOC1_ACCOUNTANT,
    passwordHash: pw, firstName: "Sanjay", lastName: "Mehta",
    role: "accountant", status: "active", emailConfirmed: 1,
  });

  // Branch 2 – Whitefield
  await db.insert(users).values({
    schoolId, locationId: locId2, email: LOC2_ADMIN_EMAIL,
    passwordHash: pw, firstName: "Meena", lastName: "Krishna",
    role: "location_admin", status: "active", emailConfirmed: 1,
  });
  await db.insert(users).values({
    schoolId, locationId: locId2, email: LOC2_TEACHER1,
    passwordHash: pw, firstName: "Arjun", lastName: "Das",
    role: "teacher", status: "active", emailConfirmed: 1,
  });
  await db.insert(users).values({
    schoolId, locationId: locId2, email: LOC2_TEACHER2,
    passwordHash: pw, firstName: "Sunita", lastName: "Rao",
    role: "teacher", status: "active", emailConfirmed: 1,
  });

  // Parent user
  await db.insert(users).values({
    schoolId, locationId: locId1, email: PARENT_EMAIL,
    passwordHash: pw, firstName: "Anil", lastName: "Kumar",
    role: "parent", status: "active", emailConfirmed: 1,
  });

  console.log("✅  Users created (9 users across both branches)");

  // ─── 5. Staff records ─────────────────────────────────────────────────────

  // Branch 1 staff
  const [s1r] = await db.insert(staff).values({
    schoolId, locationId: locId1,
    firstName: "Neha", lastName: "Gupta", email: LOC1_TEACHER1, phone: "9876511223",
    role: "teacher", salary: "28000", joinDate: new Date("2023-06-01"),
    status: "active", backgroundCheckStatus: "verified",
  });
  const staffId1 = Number((s1r as any).insertId);

  const [s2r] = await db.insert(staff).values({
    schoolId, locationId: locId1,
    firstName: "Kavitha", lastName: "Pillai", email: LOC1_TEACHER2, phone: "9988001122",
    role: "teacher", salary: "27000", joinDate: new Date("2023-09-01"),
    status: "active", backgroundCheckStatus: "verified",
  });
  const staffId2 = Number((s2r as any).insertId);

  const [s3r] = await db.insert(staff).values({
    schoolId, locationId: locId1,
    firstName: "Rahul", lastName: "Iyer", email: "rahul.iyer@sunrisesprouts.in", phone: "9123499887",
    role: "assistant", salary: "18000", joinDate: new Date("2024-01-15"),
    status: "active", backgroundCheckStatus: "in_progress",
  });
  const staffId3 = Number((s3r as any).insertId);

  const [s4r] = await db.insert(staff).values({
    schoolId, locationId: locId1,
    firstName: "Dinesh", lastName: "Bhat", email: "dinesh.bhat@sunrisesprouts.in", phone: "9776655443",
    role: "support", salary: "15000", joinDate: new Date("2024-03-01"),
    status: "active", backgroundCheckStatus: "pending",
  });
  const staffId4 = Number((s4r as any).insertId);

  // Branch 2 staff
  const [s5r] = await db.insert(staff).values({
    schoolId, locationId: locId2,
    firstName: "Arjun", lastName: "Das", email: LOC2_TEACHER1, phone: "9811223344",
    role: "teacher", salary: "29000", joinDate: new Date("2022-06-01"),
    status: "active", backgroundCheckStatus: "verified",
  });
  const staffId5 = Number((s5r as any).insertId);

  const [s6r] = await db.insert(staff).values({
    schoolId, locationId: locId2,
    firstName: "Sunita", lastName: "Rao", email: LOC2_TEACHER2, phone: "9900112233",
    role: "teacher", salary: "26000", joinDate: new Date("2023-04-01"),
    status: "active", backgroundCheckStatus: "verified",
  });
  const staffId6 = Number((s6r as any).insertId);

  const [s7r] = await db.insert(staff).values({
    schoolId, locationId: locId2,
    firstName: "Pooja", lastName: "Menon", email: "pooja.menon@sunrisesprouts.in", phone: "9845566778",
    role: "assistant", salary: "17000", joinDate: new Date("2024-02-01"),
    status: "active", backgroundCheckStatus: "pending",
  });
  const staffId7 = Number((s7r as any).insertId);

  console.log("✅  Staff created (4 in Koramangala, 3 in Whitefield)");

  // ─── 6. Classes ───────────────────────────────────────────────────────────

  // Branch 1
  const [c1r] = await db.insert(classes).values({ schoolId, locationId: locId1, academicYear: "2025-26", status: "active", name: "Playgroup",  ageGroup: "1.5–2.5 yrs", roomName: "Sunflower Room", capacity: 15, startTime: "09:00", endTime: "12:00" });
  const classId1 = Number((c1r as any).insertId);
  const [c2r] = await db.insert(classes).values({ schoolId, locationId: locId1, academicYear: "2025-26", status: "active", name: "Nursery A",  ageGroup: "2.5–3.5 yrs", roomName: "Rainbow Room",   capacity: 20, startTime: "09:00", endTime: "12:30" });
  const classId2 = Number((c2r as any).insertId);
  const [c3r] = await db.insert(classes).values({ schoolId, locationId: locId1, academicYear: "2025-26", status: "active", name: "Jr. KG",    ageGroup: "3.5–4.5 yrs", roomName: "Rocket Room",    capacity: 25, startTime: "09:00", endTime: "13:00" });
  const classId3 = Number((c3r as any).insertId);

  // Branch 2
  const [c4r] = await db.insert(classes).values({ schoolId, locationId: locId2, academicYear: "2025-26", status: "active", name: "Nursery B",  ageGroup: "2.5–3.5 yrs", roomName: "Butterfly Room", capacity: 20, startTime: "09:00", endTime: "12:30" });
  const classId4 = Number((c4r as any).insertId);
  const [c5r] = await db.insert(classes).values({ schoolId, locationId: locId2, academicYear: "2025-26", status: "active", name: "Sr. KG",    ageGroup: "4.5–5.5 yrs", roomName: "Ocean Room",     capacity: 25, startTime: "09:00", endTime: "13:30" });
  const classId5 = Number((c5r as any).insertId);

  // Staff → class assignments
  await db.insert(staffClassAssignments).values([
    { schoolId, locationId: locId1, staffId: staffId1, classId: classId2, academicYear: "2025-26" }, // Neha → Nursery A
    { schoolId, locationId: locId1, staffId: staffId3, classId: classId2, academicYear: "2025-26" }, // Rahul (assistant) → Nursery A
    { schoolId, locationId: locId1, staffId: staffId2, classId: classId3, academicYear: "2025-26" }, // Kavitha → Jr. KG
    { schoolId, locationId: locId2, staffId: staffId5, classId: classId4, academicYear: "2025-26" }, // Arjun → Nursery B
    { schoolId, locationId: locId2, staffId: staffId6, classId: classId5, academicYear: "2025-26" }, // Sunita → Sr. KG
    { schoolId, locationId: locId2, staffId: staffId7, classId: classId4, academicYear: "2025-26" }, // Pooja (assistant) → Nursery B
  ]);
  console.log("✅  Classes created + staff assigned");

  // ─── 7. Students — Branch 1 (Koramangala) — 10 students ──────────────────
  type StudentDef = { firstName: string; lastName: string; dob: string; gender: "male"|"female"; classId: number; status: "enrolled"|"applied"|"waitlisted"; parentName: string; parentEmail: string; parentPhone: string; parentRel: "father"|"mother"|"guardian"; allergy?: string; };

  const b1Students: StudentDef[] = [
    { firstName: "Aarav",   lastName: "Kumar",   dob: "2022-03-12", gender: "male",   classId: classId1, status: "enrolled",   parentName: "Anil Kumar",    parentEmail: PARENT_EMAIL,              parentPhone: "9812345678", parentRel: "father" },
    { firstName: "Mira",    lastName: "Shah",    dob: "2021-07-25", gender: "female", classId: classId2, status: "enrolled",   parentName: "Ramesh Shah",   parentEmail: "ramesh.shah@gmail.com",   parentPhone: "9823456789", parentRel: "father" },
    { firstName: "Vivan",   lastName: "Mehta",   dob: "2020-11-08", gender: "male",   classId: classId3, status: "enrolled",   parentName: "Seema Mehta",   parentEmail: "seema.m@gmail.com",       parentPhone: "9834567890", parentRel: "mother", allergy: "Peanuts" },
    { firstName: "Ananya",  lastName: "Reddy",   dob: "2022-01-30", gender: "female", classId: classId1, status: "enrolled",   parentName: "Vijay Reddy",   parentEmail: "vijay.r@gmail.com",       parentPhone: "9845678901", parentRel: "father" },
    { firstName: "Rohan",   lastName: "Patel",   dob: "2021-09-14", gender: "male",   classId: classId2, status: "enrolled",   parentName: "Geeta Patel",   parentEmail: "geeta.p@gmail.com",       parentPhone: "9856789012", parentRel: "mother" },
    { firstName: "Sia",     lastName: "Joshi",   dob: "2022-04-05", gender: "female", classId: classId1, status: "enrolled",   parentName: "Lakshmi Joshi", parentEmail: "lakshmi.j@gmail.com",    parentPhone: "9867890123", parentRel: "mother" },
    { firstName: "Dev",     lastName: "Nair",    dob: "2021-08-19", gender: "male",   classId: classId2, status: "enrolled",   parentName: "Suresh Nair",   parentEmail: "suresh.n@gmail.com",      parentPhone: "9878901234", parentRel: "father" },
    { firstName: "Priya",   lastName: "Iyer",    dob: "2021-05-22", gender: "female", classId: classId2, status: "enrolled",   parentName: "Deepa Iyer",    parentEmail: "deepa.i@gmail.com",       parentPhone: "9889012345", parentRel: "mother" },
    { firstName: "Kabir",   lastName: "Singh",   dob: "2020-12-01", gender: "male",   classId: classId3, status: "applied",    parentName: "Harish Singh",  parentEmail: "harish.s@gmail.com",      parentPhone: "9890123456", parentRel: "father" },
    { firstName: "Zara",    lastName: "Khan",    dob: "2021-10-11", gender: "female", classId: classId2, status: "waitlisted", parentName: "Farid Khan",    parentEmail: "farid.k@gmail.com",       parentPhone: "9901234567", parentRel: "father" },
  ];

  const b1StudentIds: number[] = [];
  for (const s of b1Students) {
    const [r] = await db.insert(students).values({
      schoolId, locationId: locId1,
      firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: new Date(s.dob),
      gender: s.gender, status: s.status,
      currentClassId: s.classId,
    });
    const sid = Number((r as any).insertId);
    b1StudentIds.push(sid);

    await db.insert(parents).values({
      schoolId, locationId: locId1, studentId: sid,
      relation: s.parentRel, name: s.parentName,
      email: s.parentEmail, phone: s.parentPhone,
      isPrimary: 1, isEmergency: 1,
    });

    await db.insert(emergencyContacts).values({
      schoolId, locationId: locId1, studentId: sid,
      name: s.parentName, relation: s.parentRel, phone: s.parentPhone,
    });

    if (s.allergy) {
      await db.insert(medicalNotes).values({
        schoolId, locationId: locId1, studentId: sid, allergies: s.allergy,
      });
    }
  }

  // Enroll active students (Branch 1)
  for (let i = 0; i < b1Students.length; i++) {
    if (b1Students[i].status === "enrolled") {
      await db.insert(classEnrollments).values({
        schoolId, locationId: locId1,
        studentId: b1StudentIds[i], classId: b1Students[i].classId,
        academicYear: "2025-26", status: "active",
      });
    }
  }

  // ─── 8. Students — Branch 2 (Whitefield) — 6 students ────────────────────
  const b2Students: StudentDef[] = [
    { firstName: "Aryan",   lastName: "Sharma",  dob: "2021-06-30", gender: "male",   classId: classId4, status: "enrolled",   parentName: "Sunita Sharma", parentEmail: "sunita.shar@gmail.com",  parentPhone: "9912233445", parentRel: "mother" },
    { firstName: "Tara",    lastName: "Menon",   dob: "2020-04-15", gender: "female", classId: classId5, status: "enrolled",   parentName: "Ravi Menon",    parentEmail: "ravi.m@gmail.com",        parentPhone: "9923344556", parentRel: "father" },
    { firstName: "Ishaan",  lastName: "Kapoor",  dob: "2021-02-08", gender: "male",   classId: classId4, status: "enrolled",   parentName: "Pooja Kapoor",  parentEmail: "pooja.kap@gmail.com",     parentPhone: "9934455667", parentRel: "mother" },
    { firstName: "Naina",   lastName: "Desai",   dob: "2020-09-20", gender: "female", classId: classId5, status: "enrolled",   parentName: "Nita Desai",    parentEmail: "nita.d@gmail.com",        parentPhone: "9945566778", parentRel: "mother" },
    { firstName: "Krish",   lastName: "Pillai",  dob: "2022-01-15", gender: "male",   classId: classId4, status: "applied",    parentName: "Kavya Pillai",  parentEmail: "kavya.p@gmail.com",       parentPhone: "9956677889", parentRel: "mother" },
    { firstName: "Pari",    lastName: "Das",     dob: "2020-11-03", gender: "female", classId: classId5, status: "enrolled",   parentName: "Suresh Das",    parentEmail: "suresh.das@gmail.com",    parentPhone: "9967788990", parentRel: "father" },
  ];

  const b2StudentIds: number[] = [];
  for (const s of b2Students) {
    const [r] = await db.insert(students).values({
      schoolId, locationId: locId2,
      firstName: s.firstName, lastName: s.lastName,
      dateOfBirth: new Date(s.dob),
      gender: s.gender, status: s.status,
      currentClassId: s.classId,
    });
    const sid = Number((r as any).insertId);
    b2StudentIds.push(sid);

    await db.insert(parents).values({
      schoolId, locationId: locId2, studentId: sid,
      relation: s.parentRel, name: s.parentName,
      email: s.parentEmail, phone: s.parentPhone,
      isPrimary: 1, isEmergency: 1,
    });

    await db.insert(emergencyContacts).values({
      schoolId, locationId: locId2, studentId: sid,
      name: s.parentName, relation: s.parentRel, phone: s.parentPhone,
    });
  }

  for (let i = 0; i < b2Students.length; i++) {
    if (b2Students[i].status === "enrolled") {
      await db.insert(classEnrollments).values({
        schoolId, locationId: locId2,
        studentId: b2StudentIds[i], classId: b2Students[i].classId,
        academicYear: "2025-26", status: "active",
      });
    }
  }

  console.log("✅  Students created (10 in Koramangala, 6 in Whitefield)");

  // ─── 9. Fee structures ────────────────────────────────────────────────────
  // Branch 1
  const [fs1r] = await db.insert(feeStructures).values({ schoolId, locationId: locId1, classId: classId1, name: "Monthly Tuition – Playgroup", amount: "4500", frequency: "monthly", dueDay: 5 });
  const fsPlaygroup = Number((fs1r as any).insertId);
  const [fs2r] = await db.insert(feeStructures).values({ schoolId, locationId: locId1, classId: classId2, name: "Monthly Tuition – Nursery A",  amount: "5500", frequency: "monthly", dueDay: 5 });
  const fsNurseryA = Number((fs2r as any).insertId);
  const [fs3r] = await db.insert(feeStructures).values({ schoolId, locationId: locId1, classId: classId3, name: "Monthly Tuition – Jr. KG",     amount: "6500", frequency: "monthly", dueDay: 5 });
  const fsJrKg = Number((fs3r as any).insertId);
  const [fs4r] = await db.insert(feeStructures).values({ schoolId, locationId: locId1, name: "One-time Admission Fee", amount: "5000", frequency: "one_time", dueDay: 1 });
  const fsAdmission1 = Number((fs4r as any).insertId);

  // Branch 2
  const [fs5r] = await db.insert(feeStructures).values({ schoolId, locationId: locId2, classId: classId4, name: "Monthly Tuition – Nursery B", amount: "5500", frequency: "monthly", dueDay: 5 });
  const fsNurseryB = Number((fs5r as any).insertId);
  const [fs6r] = await db.insert(feeStructures).values({ schoolId, locationId: locId2, classId: classId5, name: "Monthly Tuition – Sr. KG",    amount: "7000", frequency: "monthly", dueDay: 5 });
  const fsSrKg = Number((fs6r as any).insertId);
  const [fs7r] = await db.insert(feeStructures).values({ schoolId, locationId: locId2, name: "One-time Admission Fee", amount: "5000", frequency: "one_time", dueDay: 1 });
  const fsAdmission2 = Number((fs7r as any).insertId);

  // ─── 10. Invoices — Branch 1 ──────────────────────────────────────────────
  // Aarav Kumar (b1[0]) → Playgroup
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[0], feeStructureId: fsAdmission1, amount: "5000", dueDate: new Date("2025-04-01"), status: "paid",    paidAt: new Date("2025-04-01") });
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[0], feeStructureId: fsPlaygroup,  amount: "4500", dueDate: new Date("2025-06-05"), status: "paid",    paidAt: new Date("2025-06-03") });
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[0], feeStructureId: fsPlaygroup,  amount: "4500", dueDate: new Date("2025-07-05"), status: "sent",    paidAt: null });
  // Mira Shah (b1[1]) → Nursery A
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[1], feeStructureId: fsNurseryA,  amount: "5500", dueDate: new Date("2025-06-05"), status: "paid",    paidAt: new Date("2025-06-04") });
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[1], feeStructureId: fsNurseryA,  amount: "5500", dueDate: new Date("2025-07-05"), status: "sent",    paidAt: null });
  // Vivan Mehta (b1[2]) → Jr. KG
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[2], feeStructureId: fsJrKg,     amount: "6500", dueDate: new Date("2025-06-05"), status: "paid",    paidAt: new Date("2025-06-05") });
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[2], feeStructureId: fsJrKg,     amount: "6500", dueDate: new Date("2025-07-05"), status: "draft",   paidAt: null });
  // Rohan Patel (b1[4]) → overdue
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[4], feeStructureId: fsNurseryA,  amount: "5500", dueDate: new Date("2025-05-05"), status: "overdue", paidAt: null });
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[4], feeStructureId: fsNurseryA,  amount: "5500", dueDate: new Date("2025-06-05"), status: "overdue", paidAt: null });
  // Priya Iyer (b1[7]) → sent
  await db.insert(invoices).values({ schoolId, locationId: locId1, studentId: b1StudentIds[7], feeStructureId: fsNurseryA,  amount: "5500", dueDate: new Date("2025-07-05"), status: "sent",    paidAt: null });

  // ─── 11. Invoices — Branch 2 ──────────────────────────────────────────────
  // Aryan Sharma (b2[0]) → Nursery B
  await db.insert(invoices).values({ schoolId, locationId: locId2, studentId: b2StudentIds[0], feeStructureId: fsAdmission2, amount: "5000", dueDate: new Date("2025-04-01"), status: "paid",    paidAt: new Date("2025-04-01") });
  await db.insert(invoices).values({ schoolId, locationId: locId2, studentId: b2StudentIds[0], feeStructureId: fsNurseryB,  amount: "5500", dueDate: new Date("2025-06-05"), status: "paid",    paidAt: new Date("2025-06-02") });
  await db.insert(invoices).values({ schoolId, locationId: locId2, studentId: b2StudentIds[0], feeStructureId: fsNurseryB,  amount: "5500", dueDate: new Date("2025-07-05"), status: "sent",    paidAt: null });
  // Tara Menon (b2[1]) → Sr. KG
  await db.insert(invoices).values({ schoolId, locationId: locId2, studentId: b2StudentIds[1], feeStructureId: fsSrKg,     amount: "7000", dueDate: new Date("2025-06-05"), status: "paid",    paidAt: new Date("2025-06-01") });
  await db.insert(invoices).values({ schoolId, locationId: locId2, studentId: b2StudentIds[1], feeStructureId: fsSrKg,     amount: "7000", dueDate: new Date("2025-07-05"), status: "sent",    paidAt: null });
  // Naina Desai (b2[3]) → overdue
  await db.insert(invoices).values({ schoolId, locationId: locId2, studentId: b2StudentIds[3], feeStructureId: fsSrKg,     amount: "7000", dueDate: new Date("2025-05-05"), status: "overdue", paidAt: null });

  console.log("✅  Fee structures + invoices created");

  // ─── 12. Admissions / Inquiries ───────────────────────────────────────────
  // Branch 1
  await db.insert(inquiries).values([
    { schoolId, locationId: locId1, parentName: "Meera Krishnan", email: "meera.k@gmail.com",  phone: "9901122334", childName: "Arjun",  childDob: new Date("2022-05-10"), programInterest: "Playgroup", source: "walk_in",  status: "new"            },
    { schoolId, locationId: locId1, parentName: "Suresh Babu",    email: "suresh.b@gmail.com",  phone: "9912233445", childName: "Lata",   childDob: new Date("2021-08-20"), programInterest: "Nursery A", source: "referral", status: "contacted"      },
    { schoolId, locationId: locId1, parentName: "Nita Verma",     email: "nita.v@gmail.com",    phone: "9923344556", childName: "Ronak",  childDob: new Date("2020-03-15"), programInterest: "Jr. KG",    source: "website",  status: "tour_scheduled" },
    { schoolId, locationId: locId1, parentName: "Farhan Akhtar",  email: "farhan.a@gmail.com",  phone: "9934455667", childName: "Imaan",  childDob: new Date("2021-11-01"), programInterest: "Nursery A", source: "social",   status: "applied"        },
    { schoolId, locationId: locId1, parentName: "Suma Rao",       email: "suma.r@gmail.com",    phone: "9967788990", childName: "Vedant", childDob: new Date("2020-12-07"), programInterest: "Jr. KG",    source: "walk_in",  status: "new"            },
  ]);

  // Branch 2
  await db.insert(inquiries).values([
    { schoolId, locationId: locId2, parentName: "Kiran Shah",   email: "kiran.s@gmail.com",    phone: "9978899001", childName: "Niti",   childDob: new Date("2022-07-03"), programInterest: "Nursery B", source: "website",  status: "new"            },
    { schoolId, locationId: locId2, parentName: "Preethi Nair", email: "preethi.n@gmail.com",  phone: "9989900112", childName: "Aditi",  childDob: new Date("2021-04-16"), programInterest: "Nursery B", source: "google",   status: "tour_scheduled" },
    { schoolId, locationId: locId2, parentName: "Ravi Bose",    email: "ravi.b@gmail.com",     phone: "9990011223", childName: "Saurav", childDob: new Date("2019-06-22"), programInterest: "Sr. KG",    source: "social",   status: "contacted"      },
  ]);

  console.log("✅  Admissions inquiries created");

  // ─── 13. Attendance (last 3 days) ─────────────────────────────────────────
  const today = new Date();
  const days = [-2, -1, 0].map((d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt;
  });

  // Branch 1 student attendance (enrolled students, Nursery A class)
  const nurseryAEnrolled = [b1StudentIds[1], b1StudentIds[4], b1StudentIds[6], b1StudentIds[7]]; // Mira, Rohan, Dev, Priya
  const statuses = ["present", "present", "absent"] as const;
  for (let di = 0; di < days.length; di++) {
    for (const sid of nurseryAEnrolled) {
      await db.insert(studentAttendance).values({
        schoolId, locationId: locId1, classId: classId2,
        studentId: sid, date: days[di],
        status: di === 1 ? "absent" : "present",
        markedBy: staffId1,
      });
    }
  }

  // Branch 1 staff attendance
  for (const day of days) {
    for (const sid of [staffId1, staffId2, staffId3, staffId4]) {
      await db.insert(staffAttendance).values({
        schoolId, locationId: locId1, staffId: sid, date: day,
        status: "present",
      });
    }
  }

  console.log("✅  Attendance records seeded (last 3 days)");

  // ─── Done ─────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(68));
  console.log("  KinderDesk — Demo Credentials  (password: Demo@1234 for all)");
  console.log("═".repeat(68));
  console.log(`
  PLATFORM
  ─────────────────────────────────────────────────────────────────
  Super Admin        │ ${SUPER_ADMIN_EMAIL}

  SUNRISE SPROUTS ACADEMY
  ─────────────────────────────────────────────────────────────────
  School Admin       │ ${SCHOOL_ADMIN_EMAIL}
    (sees both branches, all data)

  KORAMANGALA BRANCH
  ─────────────────────────────────────────────────────────────────
  Location Admin     │ ${LOC1_ADMIN_EMAIL}
  Teacher (Nursery A)│ ${LOC1_TEACHER1}
  Teacher (Jr. KG)   │ ${LOC1_TEACHER2}
  Accountant         │ ${LOC1_ACCOUNTANT}
  Parent (Aarav K.)  │ ${PARENT_EMAIL}

  WHITEFIELD BRANCH
  ─────────────────────────────────────────────────────────────────
  Location Admin     │ ${LOC2_ADMIN_EMAIL}
  Teacher (Nursery B)│ ${LOC2_TEACHER1}
  Teacher (Sr. KG)   │ ${LOC2_TEACHER2}
  `);
  console.log("  URL: http://localhost:8080");
  console.log("═".repeat(68) + "\n");

  await pool.end();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
