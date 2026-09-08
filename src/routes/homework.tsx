import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { manageHomework, listHomework, deleteHomework, listClassesForSchool, listSubjects } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/homework")({
  component: HomeworkPage,
});

type HW = { id: number; classId: number; subjectId: number | null; subjectName: string | null; title: string; description: string | null; dueDate: string | null; createdAt: any };
type ClassRow = { id: number; name: string };
type Subject = { id: number; name: string };

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

function HomeworkPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [hwList, setHwList] = useState<HW[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>(0);

  const listClassesFn = useServerFn(listClassesForSchool);
  const listSubjectsFn = useServerFn(listSubjects);
  const listHwFn = useServerFn(listHomework);
  const manageHwFn = useServerFn(manageHomework);
  const deleteHwFn = useServerFn(deleteHomework);

  const [form, setForm] = useState<{ id?: number; classId: number; subjectId: number; title: string; description: string; dueDate: string } | null>(null);

  useEffect(() => {
    if (!tenant) return;
    listClassesFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId } }).then((d: any) => setClasses(d));
    listSubjectsFn({ data: { schoolId: tenant.schoolId } }).then((d: any) => setSubjects(d));
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    const filter = selectedClass ? { classId: selectedClass } : {};
    listHwFn({ data: filter }).then((d: any) => setHwList(d));
  }, [selectedClass, tenant]);

  if (!tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Homework & Assignments</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <select value={selectedClass} onChange={(e) => setSelectedClass(Number(e.target.value))} className={inputCls + " w-48 bg-white"}>
              <option value={0}>All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={() => setForm({ classId: selectedClass || (classes[0]?.id ?? 0), subjectId: 0, title: "", description: "", dueDate: "" })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>

        {form && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })} className={inputCls + " bg-white"}>
                <option value={0}>— class —</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })} className={inputCls + " bg-white"}>
                <option value={0}>— subject —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
            </div>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Title" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={3} placeholder="Description" />
            <div className="flex gap-2">
              <button onClick={async () => {
                if (!form.title || !form.classId) return;
                await manageHwFn({ data: { id: form.id, classId: form.classId, subjectId: form.subjectId || undefined, title: form.title, description: form.description, dueDate: form.dueDate } });
                setForm(null);
                const d = await listHwFn({ data: selectedClass ? { classId: selectedClass } : {} });
                setHwList(d as HW[]);
                toast("Saved", "success");
              }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">Save</button>
              <button onClick={() => setForm(null)} className="px-3 py-1.5 text-slate-600 text-xs font-semibold">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {hwList.map((h) => (
            <div key={h.id} className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-bold text-slate-800">{h.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{h.subjectName} · Due: {fmtDate(h.dueDate ? String(h.dueDate) : null)}</p>
                  {h.description && <p className="text-xs text-slate-400 mt-1">{h.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setForm({ id: h.id, classId: h.classId, subjectId: h.subjectId ?? 0, title: h.title, description: h.description ?? "", dueDate: h.dueDate ?? "" })} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { await deleteHwFn({ data: { id: h.id } }); setHwList((p) => p.filter((x) => x.id !== h.id)); }} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {hwList.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No homework posted</p>}
        </div>
      </div>
    </div>
  );
}
