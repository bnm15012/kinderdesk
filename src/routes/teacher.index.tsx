import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTeacherDashboard, getClassStudents, markStaffAttendance, getStudentAttendanceForDate, markStudentAttendance } from "@/lib/auth";
import { BookOpen, Users, CheckCircle2, Clock, AlertCircle, ChevronRight, GraduationCap, CalendarCheck, X, Save, Loader2, XCircle } from "lucide-react";
import { todayIST, currentHourIST, fmtDate, fmtDateLong, fmtDateShort } from "@/lib/utils";

export const Route = createFileRoute("/teacher/")({
  component: TeacherDashboard,
});

type ClassInfo = {
  classId: number; className: string; ageGroup: string;
  roomName: string | null; startTime: string | null; endTime: string | null; studentCount: number;
};
type Student = {
  id: number; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null; status: string;
};
type DashData = {
  user: { firstName: string | null; lastName: string | null; email: string; role: string | null };
  myClasses: ClassInfo[];
  attendanceMarkedToday: boolean;
  staffId: number | null;
  schoolId: number;
  locationId: number;
};

// ── Attendance Modal ───────────────────────────────────────────────────────

const ATT_STATUSES = [
  { value: "present",  label: "Present",   color: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" },
  { value: "absent",   label: "Absent",    color: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100" },
  { value: "half_day", label: "Half day",  color: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100" },
  { value: "leave",    label: "On leave",  color: "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200" },
] as const;

function AttendanceModal({ staffId, schoolId, locationId, onClose, onSaved }: {
  staffId: number; schoolId: number; locationId: number;
  onClose: () => void; onSaved: () => void;
}) {
  const markFn = useServerFn(markStaffAttendance);
  const today = todayIST();
  const [status, setStatus] = useState<"present" | "absent" | "half_day" | "leave">("present");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      await markFn({ data: { staffId, schoolId, locationId, date: today, status, notes: notes || undefined } });
      onSaved();
    } catch (e: any) { setError(e?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Mark Attendance</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">{fmtDateLong()}</p>
          <div className="grid grid-cols-2 gap-2">
            {ATT_STATUSES.map((s) => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition ${status === s.value ? s.color + " ring-2 ring-offset-1 ring-blue-400" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Doctor's appointment"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">Cancel</button>
            <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold transition">
              {saving ? "Saving…" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Attendance Panel ───────────────────────────────────────────────

type AttStatus = "present" | "absent" | "half_day" | "leave";
const ATT_STUDENT_STATUSES: { value: AttStatus; label: string; color: string; activeRing: string }[] = [
  { value: "present",  label: "Present",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", activeRing: "ring-emerald-400" },
  { value: "absent",   label: "Absent",   color: "bg-red-50 text-red-600 border-red-200",             activeRing: "ring-red-400" },
  { value: "half_day", label: "Half Day", color: "bg-amber-50 text-amber-700 border-amber-200",       activeRing: "ring-amber-400" },
  { value: "leave",    label: "Leave",    color: "bg-slate-100 text-slate-500 border-slate-200",      activeRing: "ring-slate-300" },
];

function StudentAttendancePanel({
  selectedClass, students, studentsLoading, schoolId, locationId,
}: {
  selectedClass: ClassInfo | null;
  students: Student[];
  studentsLoading: boolean;
  schoolId: number;
  locationId: number;
}) {
  const getAttFn  = useServerFn(getStudentAttendanceForDate);
  const markAttFn = useServerFn(markStudentAttendance);

  const todayStr = todayIST();
  const [attMap, setAttMap] = useState<Record<number, AttStatus>>({});
  const [attLoading, setAttLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load existing attendance when class/students change
  useEffect(() => {
    if (!selectedClass || students.length === 0) return;
    setAttLoading(true); setSaved(false); setSaveError("");
    getAttFn({ data: { schoolId, locationId, classId: selectedClass.classId, date: todayStr } })
      .then((res: any) => {
        const { sessionTaken, records } = res;
        const map: Record<number, AttStatus> = {};
        students.filter((s) => s.status === "enrolled").forEach((s) => { map[s.id] = "present"; });
        records.forEach((r: any) => { map[r.studentId] = r.status; });
        setAttMap(map);
        if (sessionTaken) setSaved(true);
      })
      .catch(() => {})
      .finally(() => setAttLoading(false));
  }, [selectedClass?.classId, students.length]);

  const setStatus = (studentId: number, status: AttStatus) => {
    setSaved(false);
    setAttMap((p) => ({ ...p, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedClass) return;
    const enrolled = students.filter((s) => s.status === "enrolled");
    if (enrolled.length === 0) return;
    setSaving(true); setSaveError("");
    try {
      await markAttFn({
        data: {
          schoolId, locationId, classId: selectedClass.classId, date: todayStr,
          records: enrolled.map((s) => ({ studentId: s.id, status: attMap[s.id] ?? "present" })),
        },
      });
      setSaved(true);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedClass) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
      <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
      Click a class on the "My Classes" tab to see its students.
    </div>
  );

  const enrolled = students.filter((s) => s.status === "enrolled");
  const present  = enrolled.filter((s) => (attMap[s.id] ?? "present") === "present").length;
  const absent   = enrolled.filter((s) => attMap[s.id] === "absent").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <p className="text-sm font-bold text-slate-800">{selectedClass.className} — Attendance</p>
          <p className="text-xs text-slate-400">{todayStr} · {enrolled.length} enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          <button
            onClick={saveAttendance}
            disabled={saving || attLoading || enrolled.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {enrolled.length > 0 && (
        <div className="flex gap-6 px-6 py-3 bg-slate-50 border-b border-slate-100 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><CheckCircle2 className="w-4 h-4" />{present} present</span>
          <span className="flex items-center gap-1.5 text-red-500 font-semibold"><XCircle className="w-4 h-4" />{absent} absent</span>
        </div>
      )}

      {/* Student list */}
      {studentsLoading || attLoading ? (
        <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : enrolled.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No enrolled students in this class yet.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {enrolled.map((s, i) => {
            const status = attMap[s.id] ?? "present";
            return (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition">
                <span className="text-xs text-slate-300 w-5 text-right font-mono">{i + 1}</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-800">{s.firstName} {s.lastName}</span>
                <div className="flex gap-1.5">
                  {ATT_STUDENT_STATUSES.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setStatus(s.id, st.value)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        status === st.value
                          ? `${st.color} ring-2 ring-offset-1 ${st.activeRing}`
                          : "border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

function TeacherDashboard() {
  const getDashFn = useServerFn(getTeacherDashboard);
  const getStudentsFn = useServerFn(getClassStudents);

  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"classes" | "students">("classes");
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [attMarked, setAttMarked] = useState(false);

  useEffect(() => {
    getDashFn()
      .then((d) => {
        const dash = d as DashData;
        setData(dash);
        setStaffId(dash.staffId);
        setAttMarked(dash.attendanceMarkedToday);
      })
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const selectClass = async (cls: ClassInfo) => {
    setSelectedClass(cls);
    setActiveTab("students");
    setStudentsLoading(true);
    try {
      const s = await getStudentsFn({ data: { classId: cls.classId } });
      setStudents(s as Student[]);
    } catch { setStudents([]); }
    finally { setStudentsLoading(false); }
  };

  const displayName = data?.user.firstName
    ? `${data.user.firstName} ${data.user.lastName ?? ""}`.trim()
    : data?.user.email ?? "Teacher";

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
      <AlertCircle className="w-5 h-5 shrink-0" /> {error}
    </div>
  );

  const totalStudents = data?.myClasses.reduce((a, c) => a + c.studentCount, 0) ?? 0;

  return (
    <div className="space-y-7">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Good {greeting()}, {data?.user.firstName ?? "Teacher"}!</h1>
        <p className="text-sm text-slate-500 mt-0.5">{fmtDateLong()}</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{data?.myClasses.length ?? 0}</p>
            <p className="text-xs text-slate-500">My classes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalStudents}</p>
            <p className="text-xs text-slate-500">Total students</p>
          </div>
        </div>
        <div className={`rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${attMarked ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${attMarked ? "bg-emerald-100" : "bg-amber-100"}`}>
            <CalendarCheck className={`w-5 h-5 ${attMarked ? "text-emerald-600" : "text-amber-600"}`} />
          </div>
          <div>
            <p className={`text-sm font-bold ${attMarked ? "text-emerald-700" : "text-amber-700"}`}>
              {attMarked ? "Attendance done" : "Attendance pending"}
            </p>
            <p className={`text-xs ${attMarked ? "text-emerald-600" : "text-amber-600"}`}>Today</p>
          </div>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <span className="text-sm font-bold text-slate-800">Today's Classes</span>
        </div>
        {!data?.myClasses.length ? (
          <div className="py-10 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">No classes assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.myClasses.map((cls) => (
              <div key={cls.classId} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{cls.className}</p>
                    <p className="text-xs text-slate-400">{cls.ageGroup}{cls.roomName ? ` · ${cls.roomName}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  {(cls.startTime || cls.endTime) && (
                    <div>
                      <p className="text-xs text-slate-400">Timing</p>
                      <p className="text-sm font-semibold text-slate-700">{cls.startTime ?? "—"} – {cls.endTime ?? "—"}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400">Students</p>
                    <p className="text-lg font-extrabold text-slate-900">{cls.studentCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance modal (for own attendance) */}
      {showAttModal && staffId && data && (
        <AttendanceModal
          staffId={staffId}
          schoolId={data.schoolId}
          locationId={data.locationId}
          onClose={() => setShowAttModal(false)}
          onSaved={() => { setShowAttModal(false); setAttMarked(true); }}
        />
      )}
    </div>
  );
}

function greeting() {
  const h = currentHourIST();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
