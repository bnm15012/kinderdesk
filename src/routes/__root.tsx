import { type ReactNode, useEffect, useState } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  GraduationCap,
  Users,
  UserPlus,
  DollarSign,
  Briefcase,
  DoorOpen,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  CalendarCheck,
  BarChart2,
  CreditCard,
  RefreshCcw,
} from "lucide-react";
import appCss from "../styles.css?url";
import { TenantProvider, useTenant } from "@/lib/tenant";
import { ToastProvider } from "@/lib/toast";
import { SchoolLocationSwitcher } from "@/components/school-location-switcher";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { UserMenu } from "@/components/user-menu";
import { useServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/auth";

export const publicPaths = [
  "/", "/about", "/contact", "/refund-policy", "/privacy-policy", "/terms-of-service",
  "/login", "/signup", "/forgot-password", "/reset-password", "/invite",
];

// Role → home route mapping
export function roleHome(role: string | null | undefined): string {
  switch (role) {
    case "super_admin":    return "/super-admin";
    case "teacher":
    case "staff":          return "/teacher";
    case "parent":         return "/parent";
    default:               return "/dashboard"; // school_admin, location_admin, accountant
  }
}

// Nav items visible per role
const ADMIN_NAV = [
  { to: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/admissions",  label: "Admissions",  icon: UserPlus },
  { to: "/students",    label: "Students",    icon: Users },
  { to: "/attendance",  label: "Attendance",  icon: CalendarCheck },
  { to: "/fees",       label: "Fees",       icon: DollarSign },
  { to: "/staff",      label: "Staff",      icon: Briefcase },
  { to: "/classes",    label: "Classes",    icon: DoorOpen },
];

const SCHOOL_ADMIN_NAV = [
  ...ADMIN_NAV,
  { to: "/schools", label: "School & Branches", icon: Building2 },
];

const TEACHER_NAV = [
  { to: "/teacher", label: "My Dashboard", icon: LayoutDashboard },
];

const PARENT_NAV = [
  { to: "/parent", label: "My Child",      icon: Users },
];

const SUPER_ADMIN_NAV = [
  { to: "/super-admin",                label: "Overview",        icon: BarChart2    },
  { to: "/super-admin/schools",        label: "All Schools",     icon: Building2    },
  { to: "/super-admin/subscriptions",  label: "Subscriptions",   icon: RefreshCcw   },
  { to: "/super-admin/payments",       label: "Payments",        icon: CreditCard   },
  { to: "/super-admin/plans",          label: "Plans & Pricing", icon: DollarSign   },
  { to: "/super-admin/announcements",  label: "Announcements",   icon: CalendarCheck},
];

const ACCOUNTANT_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fees",     label: "Fees",      icon: DollarSign },
];

function navForRole(role: string | null | undefined) {
  switch (role) {
    case "super_admin":   return SUPER_ADMIN_NAV;
    case "teacher":
    case "staff":         return TEACHER_NAV;
    case "parent":        return PARENT_NAV;
    case "accountant":    return ACCOUNTANT_NAV;
    case "school_admin":  return SCHOOL_ADMIN_NAV;
    default:              return ADMIN_NAV;
  }
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Sidebar({ role }: { role: string | null | undefined }) {
  const nav = navForRole(role);
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">SchoolNest</div>
          <div className="text-[10px] text-slate-400 leading-tight capitalize">
            {role === "super_admin" ? "Platform Admin" : role === "parent" ? "Parent Portal" : role === "teacher" || role === "staff" ? "Teacher Portal" : "School ERP"}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Menu</p>
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/dashboard" || item.to === "/teacher" || item.to === "/parent" || item.to === "/super-admin" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition [&.active]:bg-blue-600 [&.active]:text-white [&.active]:shadow-sm"
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-[11px] text-slate-600 text-center">SchoolNest v1.0</p>
      </div>
    </aside>
  );
}

function TopBar({ role }: { role: string | null | undefined }) {
  const { tenant, setTenant } = useTenant();
  const { pathname } = useLocation();
  // school_admin always gets the switcher;
  // super_admin gets it only when viewing a school (i.e. outside /super-admin pages)
  const isSuperAdminViewingSchool =
    role === "super_admin" && !pathname.startsWith("/super-admin");
  const canSwitchTenant = role === "school_admin" || isSuperAdminViewingSchool;
  const subtitle =
    role === "super_admin" ? "Platform administration" :
    role === "parent"      ? "Parent & family portal" :
    (role === "teacher" || role === "staff") ? "Teacher portal" :
    "School management portal";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 gap-4 shadow-sm">
      <div>
        <h1 className="text-sm font-bold text-slate-800 leading-tight">SchoolNest</h1>
        <p className="text-xs text-slate-400 leading-tight">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {canSwitchTenant && <SchoolLocationSwitcher current={tenant} onChange={setTenant} />}
        {canSwitchTenant && <div className="h-7 w-px bg-slate-200" />}
        <UserMenu />
      </div>
    </header>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const getSessionFn = useServerFn(getSession);
  const { setTenant } = useTenant();
  // undefined = not checked yet, null = not authenticated, string = role
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "?"));

  useEffect(() => {
    if (isPublic) return;
    setRole(undefined); // reset to "checking" on every navigation
    getSessionFn().then((user) => {
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      // Always sync tenant from the authenticated user's school/location.
      // This is the single source of truth on every page load / refresh.
      if (user.schoolId && user.locationId) {
        const stored = typeof window !== "undefined" ? localStorage.getItem("schoolnest-tenant") : null;
        let needsReset = true;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Keep stored tenant if it belongs to the same school, or if super admin is viewing another school
            if (parsed.schoolId === user.schoolId || user.role === "super_admin") needsReset = false;
          } catch { /* bad JSON — reset */ }
        }
        if (needsReset) {
          setTenant({ schoolId: user.schoolId, locationId: user.locationId, schoolName: "School", locationName: "Branch" });
        }
      }
      setRole(user.role);
      // Role-based redirect
      const home = roleHome(user.role);
      const adminRoutes = ["/dashboard", "/admissions", "/students", "/students/", "/fees", "/staff", "/staff/", "/classes", "/schools", "/locations"];
      const accountantRoutes = ["/dashboard", "/fees"];
      const teacherRoutes = ["/teacher"];
      const parentRoutes = ["/parent"];
      const superRoutes = ["/super-admin"];
      if (user.role === "teacher" || user.role === "staff") {
        if (adminRoutes.includes(pathname) || parentRoutes.includes(pathname) || superRoutes.includes(pathname))
          navigate({ to: home });
      } else if (user.role === "parent") {
        if (adminRoutes.includes(pathname) || teacherRoutes.includes(pathname) || superRoutes.includes(pathname))
          navigate({ to: home });
      } else if (user.role === "accountant") {
        if (!accountantRoutes.includes(pathname))
          navigate({ to: home });
      }
    });
  }, [pathname]);

  if (isPublic) return <Outlet />;

  // Block rendering the page content until session check completes.
  // This prevents page components from firing data-load calls with a stale tenant.
  if (role === undefined) {
    return (
      <div className="min-h-screen flex">
        {/* Blank sidebar — no nav rendered until role is known */}
        <aside className="w-60 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
          <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">SchoolNest</div>
              <div className="w-20 h-2.5 bg-slate-700 rounded animate-pulse mt-1" />
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 mx-1 rounded-xl bg-slate-800 animate-pulse my-0.5" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </nav>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center shrink-0 shadow-sm">
            <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
          </header>
          <main className="flex-1 p-8 overflow-auto flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <svg className="animate-spin w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium">Loading…</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <TopBar role={role} />
        {/* Announcement banner — shown to all non-super-admin roles */}
        {role && role !== "super_admin" && <AnnouncementBanner />}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RootComponent() {
  return (
    <TenantProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </TenantProvider>
  );
}

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SchoolNest — Preschool ERP" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <p className="p-8">Page not found</p>,
});
