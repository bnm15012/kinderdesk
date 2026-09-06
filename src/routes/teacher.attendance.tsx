import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getTeacherDashboard,
  getClassStudents,
  getStudentAttendanceForDate,
  markStudentAttendance,
} from "@/lib/auth";
import {
  CalendarCheck, CheckCircle2, XCircle, Loader2, Save, Users, ChevronDown,
} from "lucide-react";
import { todayIST } from "@/lib/utils";
import { useTenant } from "@/lib/tenant";

export const Route = createFileRoute("/teacher/attendance")({
  component: TeacherAttendancePage,
});

type ClassInfo = { classId: number; className: string; ageGroup?: string | null; roomName?: string | null };
type Student   = { id: number; firstName: string | null; lastName: string | null; status: string | null };
type AttStatus = "present" | "absent" | "half_day" | "leave";

const STATUSES: { value: AttStatus; label: string; color: string; activeRing: string }[] = [
  { value: "present",  label: "Present",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", activeRing: "ring-emerald-400" },
  { value: "absent",   label: "Absent",   color: "bg-red-50 text-red-600 border-red-200",             activeRing: "ring-red-400"     },
  { value: "half_day", label: "Half Day", color: "bg-amber-50 text-amber-700 border-amber-200",       activeRing: "ring-amber-400"   },
  { value: "leave",    label: "Leave",    color: "bg-slate-100 text-slate-500 border-slate-200",      activeRing: "ring-slate-300"   },
];

function TeacherAttendancePage() {
  const { tenant } = useTenant();
  const getDashFn = useServerFn(getTeacherDashboard);
  const getStudFn = useServerFn(getClassStudents);
  const getAttFn  = useServerFn(getStudentAttendanceForDate);
  const markAttFn = useServerFn(markStudentAttendance);

  const todayStr = todayIST();

  const [classes,    setClasses]    = useState<ClassInfo[]>([]);
  const [selected,   setSelected]   = useState<ClassInfo | null>(null);
  const [schoolId,   setSchoolId]   = useState(0);
  const [locationId, setLocationId] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const [students,       setStudents]       = useState<Student[]>([]);
  const [studLoading,    setStudLoading]    = useState(false);
  const [attMap,         setAttMap]         = useState<Record<number, AttStatus>>({});
  const [attLoading,     setAttLoading]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [saveError,      setSaveError]      = useState("");

  // Load teacher dashboard to get classes
  useEffect(() => {
    getDashFn({ data: undefined })
      .then((d: any) => {
        setClasses(d.myClasses ?? []);
        setSchoolId(d.schoolId);
        setLocationId(tenant?.locationId ?? 0);
        if (d.myClasses?.length > 0) setSelected(d.myClasses[0]);
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selected || !schoolId) return;
    setStudLoading(true); setStudents([]); setAttMap({});
    getStudFn({ data: { schoolId, locationId, classId: selected.classId } })
      .then((s: any) => setStudents(s))
      .catch(() => {})
      .finally(() => setStudLoading(false));
  }, [selected?.classId, schoolId]);

  // Load existing attendance when students load
  useEffect(() => {
    if (!selected || students.length === 0 || !schoolId) return;
    setAttLoading(true); setSaved(false); setSaveError("");
    getAttFn({ data: { schoolId, locationId, classId: selected.classId, date: todayStr } })
      .then((rows: any[]) => {
        const map: Record<number, AttStatus> = {};
        students.filter((s) => s.status === "enrolled").forEach((s) => { map[s.id] = "present"; });
        rows.forEach((r: any) => { map[r.studentId] = r.status; });
        setAttMap(map);
        if (rows.length > 0) setSaved(true);
      })
      .catch(() => {})
      .finally(() => setAttLoading(false));
  }, [students.length, selected?.classId]);

  const setStatus = (studentId: number, status: AttStatus) => {
    setSaved(false);
    setAttMap((p) => ({ ...p, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!selected) return;
    const enrolled = students.filter((s) => s.status === "enrolled");
    if (!enrolled.length) return;
    setSaving(true); setSaveError("");
    try {
      await markAttFn({
        data: {
          schoolId, locationId, classId: selected.classId, date: todayStr,
          records: enrolled.map((s) => ({ studentId: s.id, status: attMap[s.id] ?? "present" })),
        },
      });
      setSaved(true);
    } catch (e: any) { setSaveError(e?.message ?? "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">{error}</div>
  );

  const enrolled = students.filter((s) => s.status === "enrolled");
  const present  = enrolled.filter((s) => (attMap[s.id] ?? "present") === "present").length;
  const absent   = enrolled.filter((s) => attMap[s.id] === "absent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">{todayStr}</p>
        </div>
        {selected && (
          <button
            onClick={saveAttendance}
            disabled={saving || attLoading || enrolled.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save attendance"}
          </button>
        )}
      </div>

      {/* Class selector */}
      {classes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No classes assigned to you yet.
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          {classes.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => { setSelected(cls); setSaved(false); }}
              className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
                selected?.classId === cls.classId
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {cls.className}
            </button>
          ))}
        </div>
      )}

      {/* Attendance panel */}
      {selected && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Stats bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-800">{selected.className}</p>
              <p className="text-xs text-slate-400">{enrolled.length} enrolled students</p>
            </div>
            <div className="flex gap-5 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> {present} present
              </span>
              <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                <XCircle className="w-4 h-4" /> {absent} absent
              </span>
            </div>
          </div>

          {/* Student list */}
          {studLoading || attLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : enrolled.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No enrolled students in this class.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {enrolled.map((s) => {
                const current = attMap[s.id] ?? "present";
                return (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                        {(s.firstName?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {s.firstName} {s.lastName}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {STATUSES.map(({ value, label, color, activeRing }) => (
                        <button
                          key={value}
                          onClick={() => setStatus(s.id, value)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${color} ${
                            current === value ? `ring-2 ${activeRing}` : "opacity-50 hover:opacity-80"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {saveError && (
            <div className="mx-6 mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{saveError}</div>
          )}
        </div>
      )}
    </div>
  );
}
