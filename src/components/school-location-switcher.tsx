import { useEffect, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getTenantOptions } from "@/lib/auth";

export type Tenant = {
  schoolId: number;
  schoolName: string;
  locationId: number;
  locationName: string;
};

type Props = {
  current: Tenant;
  onChange: (t: Tenant) => void;
};

export function SchoolLocationSwitcher({ current, onChange }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const getOptions = useServerFn(getTenantOptions);
  const navigate = useNavigate();

  const load = async (schoolId?: number) => {
    const options = (await getOptions({ data: { schoolId } })) as {
      role: string;
      schools: { id: number; name: string }[];
      locations: { id: number; name: string }[];
    };
    setRole(options.role);
    setSchools(options.schools);
    setLocations(options.locations);
    return options;
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    load(current.schoolId).then((options) => {
      if (!mounted) return;
      const school = options.schools.find((s) => s.id === current.schoolId) ?? options.schools[0];
      const location = options.locations.find((l) => l.id === current.locationId) ?? options.locations[0];
      if (school && location && (school.id !== current.schoolId || location.id !== current.locationId)) {
        onChange({
          schoolId: school.id,
          schoolName: school.name,
          locationId: location.id,
          locationName: location.name,
        });
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [current.schoolId]);

  const handleSchoolChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schoolId = parseInt(e.target.value);
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    setLoading(true);
    const options = await load(schoolId);
    const location = options.locations[0];
    if (!location) {
      setLoading(false);
      return;
    }

    onChange({
      schoolId: school.id,
      schoolName: school.name,
      locationId: location.id,
      locationName: location.name,
    });
    setLoading(false);
    navigate({ to: "/dashboard" });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = parseInt(e.target.value);
    const location = locations.find((l) => l.id === locationId);
    if (!location) return;
    onChange({
      ...current,
      locationId: location.id,
      locationName: location.name,
    });
    navigate({ to: "/dashboard" });
  };

  if (loading) {
    return <div className="h-9 w-48 bg-slate-100 rounded-lg animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
        {role === "super_admin" ? (
          <select
            className="bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3 py-2 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={current.schoolId || schools[0]?.id}
            onChange={handleSchoolChange}
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-[180px] inline-block text-slate-900">
            {schools.find((s) => s.id === current.schoolId)?.name ?? schools[0]?.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
        <select
          className="bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3 py-2 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={current.locationId || locations[0]?.id}
          onChange={handleLocationChange}
          disabled={locations.length === 0}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
