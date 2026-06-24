import { useState } from "react";
import { apiClient } from "../services/api-client";

export default function ReportsDashboard() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (period: "daily" | "weekly" | "monthly") => {
    setLoading(period);
    try {
      const data = await apiClient.get(`/admin/reports/${period}`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${period}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Reports Center</h2>
        <p className="mt-2 text-sm text-slate-600">Generate and export daily, weekly, and monthly reports.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => handleExport("daily")}
          disabled={loading === "daily"}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <h3 className="font-bold mb-2">Daily Report</h3>
          <p className="text-xs text-slate-500">Last 24 hours of activity</p>
          {loading === "daily" && <p className="mt-2 text-xs text-emerald-600">Exporting...</p>}
        </button>

        <button
          onClick={() => handleExport("weekly")}
          disabled={loading === "weekly"}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <h3 className="font-bold mb-2">Weekly Report</h3>
          <p className="text-xs text-slate-500">Last 7 days of activity</p>
          {loading === "weekly" && <p className="mt-2 text-xs text-emerald-600">Exporting...</p>}
        </button>

        <button
          onClick={() => handleExport("monthly")}
          disabled={loading === "monthly"}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <h3 className="font-bold mb-2">Monthly Report</h3>
          <p className="text-xs text-slate-500">Last 30 days of activity</p>
          {loading === "monthly" && <p className="mt-2 text-xs text-emerald-600">Exporting...</p>}
        </button>
      </div>
    </div>
  );
}