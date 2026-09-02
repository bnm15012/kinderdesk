import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import { plans } from "@/lib/db/schema";

const seedPlans = [
  {
    slug: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for getting started with a single branch.",
    features: JSON.stringify(["Up to 25 students", "1 branch/location", "Basic inquiries", "Student & class records", "Email support"]),
    featured: 0,
    displayOrder: 1,
    status: "active" as const,
    cta: "Start free",
    ctaHref: "/signup",
  },
  {
    slug: "growth",
    name: "Growth",
    price: "₹1,499",
    period: "per month",
    description: "For growing schools with multiple classes and staff.",
    features: JSON.stringify(["Unlimited students", "Multiple branches", "Admissions & waitlist", "Fee management", "Staff & attendance", "WhatsApp/email notifications", "Standard support"]),
    featured: 1,
    displayOrder: 2,
    status: "active" as const,
    cta: "Start free trial",
    ctaHref: "/signup",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "Multi-school chains and franchise networks.",
    features: JSON.stringify(["Everything in Growth", "Multi-school dashboard", "Custom integrations", "Dedicated account manager", "SLA & priority support", "On-premise option"]),
    featured: 0,
    displayOrder: 3,
    status: "active" as const,
    cta: "Contact sales",
    ctaHref: "mailto:hello@sunrisesprouts.in",
  },
];

async function main() {
  for (const p of seedPlans) {
    const [existing] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, p.slug))
      .limit(1);
    if (existing) {
      console.log(`Plan ${p.slug} already exists — skipping`);
      continue;
    }
    const [r] = await db.insert(plans).values(p);
    console.log(`Created plan ${p.slug} (id ${Number((r as any).insertId)})`);
  }
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
