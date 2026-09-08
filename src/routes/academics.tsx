import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen, Clock, Megaphone, Plus, X, Pencil, Trash2, Save,
  AlertCircle, Loader2, CheckCircle2, GraduationCap,
} from "lucide-react";
import {
  manageSubject, listSubjects, deleteSubject,
  setClassSubjects, getClassSubjects,
  upsertTimetable, getTimetable, deleteTimetable,
  manageSchoolAnnouncement, listSchoolAnnouncements, deleteSchoolAnnouncement,
  listClassesForSchool,
} from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/academics")({
  component: AcademicsPage,
});

type Subject = { id: number; name: string; code: string | null; status: string };
type ClassRow = { id: number; name: string; ageGroup: string };
type TT = { id: number; dayOfWeek: number; periodNumber: number; startTime: string | null; endTime: string | null; subjectId: number | null; teacherId: number | null; subjectName: string | null; teacherName: string | null };
type Announcement = { id: number; title: string; message: string | null; target: string; createdAt: any };

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

function AcademicsPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"subjects" | "classes" | "timetable" | "announcements">("subjects");

  // Server fns
  const manageSubjectFn = useServerFn(manageSubject);
  const listSubjectsFn = useServerFn(listSubjects);
  const deleteSubjectFn = useServerFn(deleteSubject);
  const getClassSubjectsFn = useServerFn(getClassSubjects);
  const setClassSubjectsFn = useServerFn(setClassSubjects);
  const upsertTimetableFn = useServerFn(upsertTimetable);
  const getTimetableFn = useServerFn(getTimetable);
  const deleteTimetableFn = useServerFn(deleteTimetable);
  const listClassesFn = useServerFn(listClassesForSchool);
  const manageAnnouncementFn = useServerFn(manageSchoolAnnouncement);
  const listAnnouncementsFn = useServerFn(listSchoolAnnouncements);
  const deleteAnnouncementFn = useServerFn(deleteSchoolAnnouncement);

  // Shared data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Subjects
  const [subjectForm, setSubjectForm] = useState<{ id?: number; name: string; code: string } | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);

  // Class subjects
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [classSubjectIds, setClassSubjectIds] = useState<number[]>([]);

  // Timetable
  const [tt, setTt] = useState<TT[]>([]);
  const [ttForm, setTtForm] = useState<{ id?: number; dayOfWeek: number; periodNumber: number; startTime: string; endTime: string; subjectId: number; teacherId: number } | null>(null);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annForm, setAnnForm] = useState<{ id?: number; title: string; message: string; target: string } | null>(null);

  useEffect(() => {
    if (!tenant) return;
    listSubjectsFn({ data: { schoolId: tenant.schoolId } }).then((d) => setSubjects(d as Subject[]));
    listClassesFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId } }).then((d) => setClasses(d as ClassRow[]));
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    if (activeTab === "subjects") listSubjectsFn({ data: { schoolId: tenant.schoolId } }).then((d) => setSubjects(d as Subject[]));
    if (activeTab === "announcements") listAnnouncementsFn({ data: {} }).then((d) => setAnnouncements(d as Announcement[]));
  }, [activeTab, tenant]);

  useEffect(() => {
    if (activeTab === "classes" && selectedClass) {
      getClassSubjectsFn({ data: { classId: selectedClass } }).then((d: any) => setClassSubjectIds(d.map((x: any) => x.subjectId)));
    }
  }, [activeTab, selectedClass]);

  useEffect(() => {
    if (activeTab === "timetable" && selectedClass) {
      getTimetableFn({ data: { classId: selectedClass } }).then((d) => setTt(d as TT[]));
    }
  }, [activeTab, selectedClass]);

  if (!tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Academics</h1>

      <div className="flex gap-2 border-b border-slate-200">
        {([
          { key: "subjects", label: "Subjects", icon: BookOpen },
          { key: "classes", label: "Class Subjects", icon: GraduationCap },
          { key: "timetable", label: "Timetable", icon: Clock },
          { key: "announcements", label: "Announcements", icon: Megaphone },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === key ? "text-blue-700 border-b-2 border-blue-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Subjects */}
      {activeTab === "subjects" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Subjects</h2>
            <button onClick={() => setSubjectForm({ name: "", code: "" })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {subjectForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                  <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className={inputCls} placeholder="e.g. Mathematics" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Code</label>
                  <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className={inputCls} placeholder="e.g. MATH" />
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={savingSubject || !subjectForm.name} onClick={async () => {
                  setSavingSubject(true);
                  try {
                    await manageSubjectFn({ data: { id: subjectForm.id, name: subjectForm.name, code: subjectForm.code } });
                    setSubjectForm(null);
                    const d = await listSubjectsFn({ data: { schoolId: tenant.schoolId } });
                    setSubjects(d as Subject[]);
                    toast("Subject saved", "success");
                  } catch (err: any) { toast(err?.message ?? "Save failed", "error"); }
                  finally { setSavingSubject(false); }
                }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                  {savingSubject ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setSubjectForm(null)} className="px-3 py-1.5 text-slate-600 text-xs font-semibold">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                  {s.code && <p className="text-xs text-slate-400">{s.code}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSubjectForm({ id: s.id, name: s.name, code: s.code ?? "" })} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => {
                    if (!confirm("Delete this subject?")) return;
                    await deleteSubjectFn({ data: { id: s.id } });
                    setSubjects((p) => p.filter((x) => x.id !== s.id));
                  }} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {subjects.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No subjects yet</p>}
          </div>
        </div>
      )}

      {/* Class subjects */}
      {activeTab === "classes" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">Class-Subject Assignment</h2>
          <select value={selectedClass} onChange={(e) => setSelectedClass(Number(e.target.value))} className={inputCls + " mb-4 bg-white"}>
            <option value={0}>— select class —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.ageGroup})</option>)}
          </select>

          {selectedClass > 0 && (
            <div className="space-y-2">
              {subjects.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={classSubjectIds.includes(s.id)} onChange={(e) => {
                    setClassSubjectIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id));
                  }} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-slate-800">{s.name}</span>
                </label>
              ))}
              <button onClick={async () => {
                await setClassSubjectsFn({ data: { classId: selectedClass, subjectIds: classSubjectIds } });
                toast("Saved", "success");
              }} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">Save class subjects</button>
            </div>
          )}
        </div>
      )}

      {/* Timetable */}
      {activeTab === "timetable" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Timetable</h2>
            <select value={selectedClass} onChange={(e) => setSelectedClass(Number(e.target.value))} className={inputCls + " w-48 bg-white"}>
              <option value={0}>— select class —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {ttForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <select value={ttForm.dayOfWeek} onChange={(e) => setTtForm({ ...ttForm, dayOfWeek: Number(e.target.value) })} className={inputCls + " bg-white"}>
                  {DAYS.map((d, i) => i > 0 && <option key={i} value={i}>{d}</option>)}
                </select>
                <input type="number" value={ttForm.periodNumber} onChange={(e) => setTtForm({ ...ttForm, periodNumber: Number(e.target.value) })} className={inputCls} placeholder="Period" />
                <input value={ttForm.startTime} onChange={(e) => setTtForm({ ...ttForm, startTime: e.target.value })} className={inputCls} placeholder="09:00" />
                <input value={ttForm.endTime} onChange={(e) => setTtForm({ ...ttForm, endTime: e.target.value })} className={inputCls} placeholder="09:45" />
                <select value={ttForm.subjectId} onChange={(e) => setTtForm({ ...ttForm, subjectId: Number(e.target.value) })} className={inputCls + " bg-white"}>
                  <option value={0}>— subject —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  if (!selectedClass) return;
                  await upsertTimetableFn({ data: { ...ttForm, classId: selectedClass } });
                  setTtForm(null);
                  const d = await getTimetableFn({ data: { classId: selectedClass } });
                  setTt(d as TT[]);
                  toast("Saved", "success");
                }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">Save</button>
                <button onClick={() => setTtForm(null)} className="px-3 py-1.5 text-slate-600 text-xs font-semibold">Cancel</button>
              </div>
            </div>
          )}

          <button onClick={() => setTtForm({ dayOfWeek: 1, periodNumber: 1, startTime: "", endTime: "", subjectId: 0, teacherId: 0 })} className="mb-4 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
            <Plus className="w-3.5 h-3.5" /> Add period
          </button>

          <div className="space-y-4">
            {DAYS.filter((_, i) => i > 0).map((d, dayIdx) => {
              const dayRows = tt.filter((t) => t.dayOfWeek === dayIdx + 1);
              return (
                <div key={d}>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">{d}</h3>
                  {dayRows.length === 0 ? <p className="text-xs text-slate-400">No periods</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dayRows.sort((a,b) => a.periodNumber - b.periodNumber).map((row) => (
                        <div key={row.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">P{row.periodNumber}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setTtForm({ id: row.id, dayOfWeek: row.dayOfWeek, periodNumber: row.periodNumber, startTime: row.startTime ?? "", endTime: row.endTime ?? "", subjectId: row.subjectId ?? 0, teacherId: row.teacherId ?? 0 })} className="p-1 text-slate-500 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                              <button onClick={async () => { await deleteTimetableFn({ data: { id: row.id } }); setTt((p) => p.filter((x) => x.id !== row.id)); }} className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-800">{row.subjectName ?? "—"}</p>
                          <p className="text-xs text-slate-400">{row.startTime} - {row.endTime}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Announcements */}
      {activeTab === "announcements" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">School Announcements</h2>
            <button onClick={() => setAnnForm({ title: "", message: "", target: "all" })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {annForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
              <input value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className={inputCls} placeholder="Title" />
              <textarea value={annForm.message} onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })} className={inputCls} rows={3} placeholder="Message" />
              <select value={annForm.target} onChange={(e) => setAnnForm({ ...annForm, target: e.target.value })} className={inputCls + " bg-white"}>
                <option value="all">All</option>
                <option value="parents">Parents</option>
                <option value="staff">Staff</option>
              </select>
              <div className="flex gap-2">
                <button onClick={async () => {
                  if (!annForm.title) return;
                  await manageAnnouncementFn({ data: { id: annForm.id, title: annForm.title, message: annForm.message, target: annForm.target as any } });
                  setAnnForm(null);
                  const d = await listAnnouncementsFn({ data: {} });
                  setAnnouncements(d as Announcement[]);
                  toast("Saved", "success");
                }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">Save</button>
                <button onClick={() => setAnnForm(null)} className="px-3 py-1.5 text-slate-600 text-xs font-semibold">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-slate-800">{a.title}</p>
                  <div className="flex gap-1">
                    <button onClick={() => setAnnForm({ id: a.id, title: a.title, message: a.message ?? "", target: a.target })} className="p-1 text-slate-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => { await deleteAnnouncementFn({ data: { id: a.id } }); setAnnouncements((p) => p.filter((x) => x.id !== a.id)); }} className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-1">{a.message}</p>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.target}</span>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No announcements</p>}
          </div>
        </div>
      )}
    </div>
  );
}
