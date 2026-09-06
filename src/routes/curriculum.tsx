import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTeacherDashboard, getSession, listClasses, uploadCurriculumActivity, getCurriculumActivities, deleteCurriculumActivity } from "@/lib/auth";
import { ImagePlus, Trash2, X, Upload, BookOpen, Calendar, ChevronDown, AlertCircle, Loader2, Plus, Image } from "lucide-react";
import { todayIST } from "@/lib/utils";

export const Route = createFileRoute("/curriculum")({
  component: CurriculumPage,
});

type ClassInfo = { classId: number; className: string };
type Activity = {
  id: number;
  classId: number;
  className: string;
  title: string;
  description: string | null;
  activityDate: Date | string;
  photoUrl: string | null;
  createdAt: Date | string | null;
  uploaderName: string;
};

const ADMIN_ROLES = ["school_admin", "location_admin", "super_admin"];

function CurriculumPage() {
  const getSessionFn    = useServerFn(getSession);
  const getDashFn       = useServerFn(getTeacherDashboard);
  const listClassesFn   = useServerFn(listClasses);
  const uploadFn        = useServerFn(uploadCurriculumActivity);
  const getActivitiesFn = useServerFn(getCurriculumActivities);
  const deleteFn        = useServerFn(deleteCurriculumActivity);

  const [isAdmin, setIsAdmin]         = useState(false);
  const [classes, setClasses]         = useState<ClassInfo[]>([]);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | "">("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showUpload, setShowUpload]   = useState(false);
  const [lightbox, setLightbox]       = useState<string | null>(null);

  const today = todayIST();

  // Upload form state
  const [upClass, setUpClass]         = useState<number | "">("");
  const [upTitle, setUpTitle]         = useState("");
  const [upDesc, setUpDesc]           = useState("");
  const [upDate, setUpDate]           = useState(today);
  const [upFile, setUpFile]           = useState<File | null>(null);
  const [upPreview, setUpPreview]     = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [upError, setUpError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      // Determine role to decide how to load classes
      const session = (await getSessionFn()) as { user: { role: string; schoolId: number; locationId: number } } | null;
      const role = session?.user?.role ?? "";
      const admin = ADMIN_ROLES.includes(role);
      setIsAdmin(admin);

      if (admin) {
        // Admin: get all classes for the school
        const cls = (await listClassesFn({ data: { schoolId: session!.user.schoolId, locationId: session!.user.locationId } })) as { id: number; name: string }[];
        const mapped = cls.map((c) => ({ classId: c.id, className: c.name }));
        setClasses(mapped);
        if (mapped.length) setUpClass(mapped[0].classId);
      } else {
        // Teacher: get only assigned classes
        const dash = (await getDashFn()) as { myClasses: { classId: number; className: string }[] };
        setClasses(dash.myClasses);
        if (dash.myClasses.length) setUpClass(dash.myClasses[0].classId);
      }
    } catch {}

    try {
      const acts = (await getActivitiesFn({ data: {} })) as Activity[];
      setActivities(acts);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUpPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upClass) { setUpError("Please select a class"); return; }
    setUpError(""); setUploading(true);
    try {
      let fileDataUrl: string | undefined;
      let fileName: string | undefined;
      if (upFile && upPreview) {
        fileDataUrl = upPreview;
        fileName = upFile.name;
      }
      await uploadFn({
        data: {
          classId: Number(upClass),
          title: upTitle,
          description: upDesc || undefined,
          activityDate: upDate,
          fileDataUrl,
          fileName,
        },
      });
      // Reset form
      setUpTitle(""); setUpDesc(""); setUpDate(today); setUpFile(null); setUpPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowUpload(false);
      // Reload activities
      const acts = (await getActivitiesFn({ data: { classId: selectedClass || undefined } })) as Activity[];
      setActivities(acts);
    } catch (err: any) {
      setUpError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await deleteFn({ data: { id } });
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Delete failed");
    }
  };

  const handleClassFilter = async (classId: number | "") => {
    setSelectedClass(classId);
    try {
      const acts = (await getActivitiesFn({ data: { classId: classId || undefined } })) as Activity[];
      setActivities(acts);
    } catch {}
  };

  const filtered = selectedClass ? activities.filter((a) => a.classId === selectedClass) : activities;

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-40 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Curriculum Activities</h1>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Upload photos of classroom activities visible to parents</p>
          <p className="text-sm text-slate-500 mt-0.5 sm:hidden">Upload classroom activity photos</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Activity
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Class filter */}
      {classes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleClassFilter("")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${!selectedClass ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
          >
            All classes
          </button>
          {classes.map((c) => (
            <button
              key={c.classId}
              onClick={() => handleClassFilter(c.classId)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${selectedClass === c.classId ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
            >
              {c.className}
            </button>
          ))}
        </div>
      )}

      {/* Activity grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <ImagePlus className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-slate-700 font-semibold mb-1">No activities yet</p>
          <p className="text-slate-400 text-sm mb-5">Upload photos of classroom activities to keep parents updated</p>
          <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
            Upload first activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((act) => (
            <div key={act.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group">
              {/* Photo */}
              {act.photoUrl ? (
                <div className="relative aspect-video cursor-pointer overflow-hidden bg-slate-100" onClick={() => setLightbox(act.photoUrl!)}>
                  <img src={act.photoUrl} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <Image className="w-10 h-10 text-blue-200" />
                </div>
              )}
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{act.title}</h3>
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {act.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{act.description}</p>}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <BookOpen className="w-3 h-3" /> {act.className}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(act.activityDate as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <ImagePlus className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Add Activity</h2>
              </div>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* Class */}
              <div>
                <label className={labelCls}>Class</label>
                <div className="relative">
                  <select
                    value={upClass}
                    onChange={(e) => setUpClass(Number(e.target.value))}
                    className={`${inputCls} appearance-none pr-8`}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>{c.className}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={labelCls}>Activity title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={upTitle}
                  onChange={(e) => setUpTitle(e.target.value)}
                  placeholder="e.g. Clay modelling — animals"
                  className={inputCls}
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className={labelCls}>Activity date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={upDate}
                  onChange={(e) => setUpDate(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description (optional)</label>
                <textarea
                  value={upDesc}
                  onChange={(e) => setUpDesc(e.target.value)}
                  placeholder="What did the children learn or do?"
                  className={`${inputCls} resize-none`}
                  rows={3}
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className={labelCls}>Photo (optional)</label>
                {upPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={upPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setUpFile(null); setUpPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/60 hover:bg-slate-900/80 rounded-lg text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                    <Upload className="w-7 h-7 text-slate-300" />
                    <span className="text-sm text-slate-500">Click to upload a photo</span>
                    <span className="text-xs text-slate-400">JPG, PNG, WEBP up to 10 MB</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              {upError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{upError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !upTitle || !upClass} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="Activity photo" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
