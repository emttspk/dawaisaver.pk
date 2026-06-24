import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

interface Distributor {
  id: string;
  distributorName: string;
  territory?: string[];
  status: string;
  trustScore?: number;
}

export default function DistributorsDashboard() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.get("/admin/distributors", {
        limit: "50",
        ...(search && { search }),
      });
      setDistributors(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Distributors</p>
            <h2 className="mt-2 text-3xl font-black">Distributor Management</h2>
            <p className="mt-2 text-sm text-slate-600">Manage distributors, ownership claims, and territory coverage.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search distributors..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Territory</th>
                  <th className="px-4 py-3 text-left font-semibold">Trust Score</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : distributors.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No distributors found</td></tr>
                ) : distributors.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{d.distributorName}</div>
                    </td>
                    <td className="px-4 py-3">{d.territory?.join(", ") || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        (d.trustScore || 0) >= 80 ? "bg-emerald-100 text-emerald-800" :
                        (d.trustScore || 0) >= 50 ? "bg-amber-100 text-amber-900" :
                        "bg-slate-100 text-slate-700"
                      }`}>{d.trustScore || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        d.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}