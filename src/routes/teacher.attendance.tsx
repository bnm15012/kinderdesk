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
  CalendarCheck, CheckCircle2, XCircle, Loader2, Save, Users, ChevronRight, ArrowLeft, BookOpen,
} from "lucide-react";
import { todayIST } from "@/lib/utils";

export const Route = createFileRoute("/teacher/attendance")({
  component: TeacherAttendancePage,
});

type ClassInfo = { classId: number; className: string; ageGroup?: string | null; roomName?: string | null; studentCount: number; startTime?: string | null; endTime?: string | null };
type Student   = { id: number; firstName: string | null; lastName: string | null; status: string | null };
type AttStatus = "present" | "absent" | "half_day" | "leave";

const STATUSES: { value: AttStatus; label: string; color: string; activeColor: string }[] = [
  { value: "present",  label: "Present",  color: "text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700", activeColor: "bg-emerald-50 text-emerald-700 border-emerald-400 ring-1 ring-emerald-400 font-bold" },
  { value: "absent",   label: "Absent",   color: "text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600",         activeColor: "bg-red-50 text-red-600 border-red-400 ring-1 ring-red-400 font-bold"             },
  { value: "half_day", label: "Half Day", color: "text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-700",     activeColor: "bg-amber-50 text-amber-700 border-amber-400 ring-1 ring-amber-400 font-bold"       },
  { value: "leave",    label: "Leave",    color: "text-slate-500 border-slate-200 hover:border-slate-400",                          activeColor: "bg-slate-100 text-slate-600 border-slate-400 ring-1 ring-slate-400 font-bold"       },
];

function TeacherAttendancePage() {
  const getDashFn = useServerFn(getTeacherDashboard);
  const getStudFn = useServerFn(getClassStudents);
  const getAttFn  = useServerFn(getStudentAttendanceForDate);
  const markAttFn = useServerFn(markStudentAttendance);

  const todayStr = todayIST();

  // ── Step 1: class list ──────────────────────────────────────────────────
  const [classes,    setClasses]    = useState<ClassInfo[]>([]);
  const [schoolId,   setSchoolId]   = useState(0);
  const [locationId, setLocationId] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [date,       setDate]       = useState(todayStr);

  // ── Step 2: selected class ──────────────────────────────────────────────
  const [selected,    setSelected]    = useState<ClassInfo | null>(null);
  const [students,    setStudents]    = useState<Student[]>([]);
  const [studLoading, setStudLoading] = useState(false);
  const [attMap,      setAttMap]      = useState<Record<number, AttStatus>>({});
  const [attLoading,  setAttLoading]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState("");

  // Load classes on mount
  useEffect(() => {
    getDashFn({ data: undefined })
      .then((d: any) => {
        setClasses(d.myClasses ?? []);
        setSchoolId(d.schoolId);
        setLocationId(d.locationId ?? 0);
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // Load students when a class is selected
  useEffect(() => {
    if (!selected || !schoolId) return;
    setStudLoading(true); setStudents([]); setAttMap({});
    getStudFn({ data: { schoolId, locationId, classId: selected.classId } })
      .then((s: any) => setStudents(s))
      .catch(() => {})
      .finally(() => setStudLoading(false));
  }, [selected?.classId, schoolId]);

  // Load existing attendance when students or date changes
  useEffect(() => {
    if (!selected || students.length === 0 || !schoolId) return;
    setAttLoading(true); setSaved(false); setSaveError("");
    getAttFn({ data: { schoolId, locationId, classId: selected.classId, date } })
      .then((res: any) => {
        const { sessionTaken, records } = res;
        const map: Record<number, AttStatus> = {};
        // Default all enrolled to present (sessionTaken or not — teacher sees present by default)
        students.filter((s) => s.status === "enrolled").forEach((s) => { map[s.id] = "present"; });
        // Override with actual saved records (only non-present are stored)
        records.forEach((r: any) => { map[r.studentId] = r.status; });
        setAttMap(map);
        if (sessionTaken) setSaved(true);
      })
      .catch(() => {})
      .finally(() => setAttLoading(false));
  }, [students.length, selected?.classId, date]);

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
          schoolId, locationId, classId: selected.classId, date,
          records: enrolled.map((s) => ({ studentId: s.id, status: attMap[s.id] ?? "present" })),
        },
      });
      setSaved(true);
    } catch (e: any) { setSaveError(e?.message ?? "Failed to save"); }
    finally { setSaving(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────

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

  // ── STEP 2: Student attendance detail ───────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: back + class name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { setSelected(null); setStudents([]); setAttMap({}); }}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-slate-900 truncate">{selected.className}</h1>
              <p className="text-xs text-slate-500 truncate">{selected.ageGroup}{selected.roomName ? ` · ${selected.roomName}` : ""}</p>
            </div>
          </div>
          {/* Right: date picker + save */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="date"
              value={date}
              max={todayStr}
              onChange={(e) => { setDate(e.target.value); setSaved(false); }}
              className="border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            />
            <button
              onClick={saveAttendance}
              disabled={saving || attLoading || enrolled.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold transition whitespace-nowrap"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>

        {/* Student table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Stats bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-500">{enrolled.length} enrolled · {date}</p>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {present} present
              </span>
              <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                <XCircle className="w-4 h-4 shrink-0" /> {absent} absent
              </span>
            </div>
          </div>

          {studLoading || attLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : enrolled.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No enrolled students in this class.
            </div>
          ) : (
            <>
              {/* Legend — mobile only */}
              <div className="sm:hidden flex items-center gap-3 px-6 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <span className="text-[11px] text-slate-400 font-medium">Key:</span>
                {[
                  { key: "P", label: "Present",  color: "text-emerald-600" },
                  { key: "A", label: "Absent",   color: "text-red-500" },
                  { key: "H", label: "Half Day", color: "text-amber-600" },
                  { key: "L", label: "Leave",    color: "text-slate-500" },
                ].map(({ key, label, color }) => (
                  <span key={key} className={`text-[11px] font-semibold ${color}`}>
                    {key} <span className="font-normal text-slate-400">= {label}</span>
                  </span>
                ))}
              </div>

              {/* Table header — desktop */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Student</span>
                <span className="text-center">Present</span>
                <span className="text-center">Absent</span>
                <span className="text-center">Half Day</span>
                <span className="text-center">Leave</span>
              </div>
              <div className="divide-y divide-slate-100">
                {enrolled.map((s) => {
                  const current = attMap[s.id] ?? "present";
                  return (
                    <div key={s.id} className="flex items-center justify-between sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 sm:gap-4 px-6 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                          {(s.firstName?.[0] ?? "?").toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-800 truncate">{s.firstName} {s.lastName}</span>
                      </div>
                      {/* Mobile: horizontal pill row */}
                      <div className="flex sm:contents gap-1">
                        {STATUSES.map(({ value, activeColor, color }) => (
                          <div key={value} className="sm:flex sm:justify-center">
                            <button
                              onClick={() => setStatus(s.id, value)}
                              title={value === "present" ? "Present" : value === "absent" ? "Absent" : value === "half_day" ? "Half Day" : "Leave"}
                              className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center ${current === value ? activeColor : `bg-white ${color}`}`}
                            >
                              {value === "present" ? "P" : value === "absent" ? "A" : value === "half_day" ? "H" : "L"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {saveError && (
            <div className="mx-6 mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{saveError}</div>
          )}
        </div>
      </div>
    );
  }

  // ── STEP 1: Class list table ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a class to mark attendance</p>
        </div>
        <input
          type="date"
          value={date}
          max={todayStr}
          onChange={(e) => setDate(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Class table */}
      {classes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-400">No classes assigned to you yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Class</span>
            <span>Timing</span>
            <span>Students</span>
            <span />
          </div>
          <div className="divide-y divide-slate-100">
            {classes.map((cls) => (
              <button
                key={cls.classId}
                onClick={() => setSelected(cls)}
                className="w-full flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-2 sm:gap-4 items-start sm:items-center px-6 py-4 text-left hover:bg-slate-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">{cls.className}</p>
                    <p className="text-xs text-slate-400">{cls.ageGroup}{cls.roomName ? ` · ${cls.roomName}` : ""}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  {cls.startTime && cls.endTime ? `${cls.startTime} – ${cls.endTime}` : "—"}
                </p>
                <p className="text-sm font-semibold text-slate-800">{cls.studentCount}</p>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
