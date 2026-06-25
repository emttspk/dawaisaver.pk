import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export default function MasterValidationDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMasterValidationStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading validation stats...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Master Validation Dashboard</h2>
        <p className="text-sm text-slate-600">Overview of master data quality and validation status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi value={String(stats?.totalProducts ?? 0)} label="Total Products" tone="emerald" />
        <Kpi value={String(stats?.activeProducts ?? 0)} label="Active Products" tone="blue" />
        <Kpi value={String(stats?.pendingReview ?? 0)} label="Pending Review" tone="amber" />
        <Kpi value={String(stats?.lowConfidence ?? 0)} label="Low Confidence" tone="red" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi value={String(stats?.missingFields ?? 0)} label="Missing Fields" tone="red" />
        <Kpi value={String(stats?.duplicateCandidates ?? 0)} label="Duplicate Candidates" tone="amber" />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold">{(stats?.totalProducts ?? 0) - (stats?.missingFields ?? 0)}</p>
          <p className="text-sm text-slate-600">Complete Records</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold">{stats?.totalProducts ? Math.round((stats.activeProducts / stats.totalProducts) * 100) : 0}%</p>
          <p className="text-sm text-slate-600">Approval Rate</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold mb-4">Validation Rules</h3>
        <div className="space-y-2 text-sm">
          <Rule label="Registration number" required />
          <Rule label="Brand name" required />
          <Rule label="Generic name" required />
          <Rule label="Manufacturer" required />
          <Rule label="Dosage form" required />
          <Rule label="Composition" required />
        </div>
      </div>
    </div>
  );
}

function Kpi({ value, label, tone }: { value: string; label: string; tone: "emerald" | "blue" | "amber" | "slate" | "red" }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-800",
    blue: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-900",
    slate: "bg-slate-100 text-slate-800",
    red: "bg-red-50 text-red-800",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function Rule({ label, required }: { label: string; required: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className={required ? "text-red-600" : "text-emerald-600"}>
        {required ? "Required" : "Optional"}
      </span>
    </div>
  );
}