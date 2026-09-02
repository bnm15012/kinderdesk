import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, X, Building2, MapPin, Users, Briefcase,
  AlertCircle, Pencil, Phone, Mail,
} from "lucide-react";
import { getSchoolWithLocations, addBranch, updateSchool, updateBranch, updateSchoolLogo } from "@/lib/auth";

export const Route = createFileRoute("/schools")({
  component: SchoolsPage,
});

// ── Types ──────────────────────────────────────────────────────────────────

type Location = {
  id: number; name: string; address: string | null; city: string | null;
  state: string | null; pincode: string | null; phone: string | null;
  capacity: number | null; status: string; studentCount: number; staffCount: number;
};
type School = {
  id: number; name: string; email: string | null; phone: string | null;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; plan: string | null; status: string | null; logoUrl: string | null;
};
type PageData = { school: School; locations: Location[]; role: string | null };

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

// ── Add Branch Modal ───────────────────────────────────────────────────────

function AddBranchModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const addFn = useServerFn(addBranch);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ name: "", address: "", city: "", state: "", pincode: "", phone: "", capacity: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await addFn({
        data: {
          name: f.name,
          address: f.address || undefined,
          city: f.city || undefined,
          state: f.state || undefined,
          pincode: f.pincode || undefined,
          phone: f.phone || undefined,
          capacity: f.capacity ? parseInt(f.capacity) : undefined,
        },
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add branch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Add New Branch</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Branch name *</label>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. South Branch" className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
              <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Capacity</label>
              <input type="number" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="100" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
            <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
              <input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
              <input value={f.state} onChange={(e) => set("state", e.target.value)} placeholder="Maharashtra" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pincode</label>
              <input value={f.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="400001" className={inputCls} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold transition">
              {saving ? "Adding…" : "Add Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit School Info Modal ─────────────────────────────────────────────────

function EditSchoolModal({ school, onClose, onSaved }: { school: School; onClose: () => void; onSaved: () => void }) {
  const updateFn = useServerFn(updateSchool);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name: school.name ?? "",
    email: school.email ?? "",
    phone: school.phone ?? "",
    address: school.address ?? "",
    city: school.city ?? "",
    state: school.state ?? "",
    pincode: school.pincode ?? "",
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await updateFn({ data: { name: f.name, email: f.email || "", phone: f.phone || undefined, address: f.address || undefined, city: f.city || undefined, state: f.state || undefined, pincode: f.pincode || undefined } });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update school");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Edit School Info</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">School name *</label>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
              <input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
            <input value={f.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
              <input value={f.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
              <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pincode</label>
              <input value={f.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold transition">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function EditBranchModal({ branch, onClose, onSaved }: { branch: Location; onClose: () => void; onSaved: () => void }) {
  const updateFn = useServerFn(updateBranch);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name: branch.name ?? "", address: branch.address ?? "", city: branch.city ?? "",
    state: branch.state ?? "", pincode: branch.pincode ?? "", phone: branch.phone ?? "",
    capacity: branch.capacity ? String(branch.capacity) : "",
    status: (branch.status ?? "active") as "active" | "inactive",
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await updateFn({ data: { locationId: branch.id, name: f.name, address: f.address || undefined, city: f.city || undefined, state: f.state || undefined, pincode: f.pincode || undefined, phone: f.phone || undefined, capacity: f.capacity ? parseInt(f.capacity) : undefined, status: f.status } });
      onSaved();
    } catch (err: any) { setError(err?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Edit Branch</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Branch name *</label>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
              <input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Capacity</label>
              <input type="number" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
            <input value={f.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
              <input value={f.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
              <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pincode</label>
              <input value={f.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <select value={f.status} onChange={(e) => set("status", e.target.value)} className={`${inputCls} bg-white`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {error && <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold transition">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SchoolsPage() {
  const getFn = useServerFn(getSchoolWithLocations);
  const uploadLogoFn = useServerFn(updateSchoolLogo);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Location | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getFn()
      .then((d) => setData(d as PageData))
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const logo = await toBase64(file);
      await uploadLogoFn({ data: { logo } });
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const school = data?.school;
  const locs = data?.locations ?? [];

  const STATUS = { active: "bg-emerald-50 text-emerald-700 border border-emerald-200", inactive: "bg-slate-100 text-slate-500 border border-slate-200" };

  return (
    <div className="space-y-7">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">School & Branches</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your school profile and branch locations</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* School profile card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 h-40 animate-pulse" />
      ) : school && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-600" />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt={`${school.name} logo`} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-7 h-7 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900">{school.name}</h2>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS[school.status as keyof typeof STATUS] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {school.status}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 capitalize">
                      {school.plan ?? "free"} plan
                    </span>
                  </div>
                  <div className="flex gap-5 mt-2 text-sm text-slate-500 flex-wrap">
                    {school.email && (
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{school.email}</span>
                    )}
                    {school.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{school.phone}</span>
                    )}
                    {school.city && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{[school.city, school.state].filter(Boolean).join(", ")}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 rounded-xl transition"
                  disabled={uploading}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition"
                >
                  {uploading ? "Uploading…" : "Upload logo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branches table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800">Branches / Locations</h2>
            <span className="text-xs text-slate-400 font-medium">({locs.length})</span>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : !locs.length ? (
          <div className="py-14 text-center">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">No branches yet. Add your first branch!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Branch name</th>
                <th className="px-5 py-3.5">City / State</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Capacity</th>
                <th className="px-5 py-3.5">Students</th>
                <th className="px-5 py-3.5">Staff</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{l.name}</p>
                        {l.address && <p className="text-xs text-slate-400 truncate max-w-[180px]">{l.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {[l.city, l.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{l.phone ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-500">{l.capacity ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Users className="w-3.5 h-3.5 text-blue-400" /> {l.studentCount}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Briefcase className="w-3.5 h-3.5 text-violet-400" /> {l.staffCount}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${STATUS[l.status as keyof typeof STATUS] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setEditBranch(l)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-700 rounded-lg transition"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {addOpen && <AddBranchModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} />}
      {editOpen && school && <EditSchoolModal school={school} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />}
      {editBranch && <EditBranchModal branch={editBranch} onClose={() => setEditBranch(null)} onSaved={() => { setEditBranch(null); load(); }} />}
    </div>
  );
}
