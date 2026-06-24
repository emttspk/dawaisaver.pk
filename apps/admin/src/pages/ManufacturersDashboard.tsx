import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

interface Manufacturer {
  id: string;
  name: string;
  normalizedName: string;
  country?: string;
  status: string;
  trustScore?: number;
  products?: { id: string; brandName: string }[];
}

export default function ManufacturersDashboard() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/manufacturers", {
        search: search || undefined,
        limit: 50,
      } as any);
      setManufacturers(Array.isArray(data) ? data : data.items || []);
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
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Manufacturers</p>
            <h2 className="mt-2 text-3xl font-black">Manufacturer Management</h2>
            <p className="mt-2 text-sm text-slate-600">Verify manufacturers, manage trust scores, and review linked products.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search manufacturers..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Country</th>
                  <th className="px-4 py-3 text-left font-semibold">Trust Score</th>
                  <th className="px-4 py-3 text-left font-semibold">Products</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : manufacturers.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No manufacturers found</td></tr>
                ) : manufacturers.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.normalizedName}</div>
                    </td>
                    <td className="px-4 py-3">{m.country || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        (m.trustScore || 0) >= 80 ? "bg-emerald-100 text-emerald-800" :
                        (m.trustScore || 0) >= 50 ? "bg-amber-100 text-amber-900" :
                        "bg-slate-100 text-slate-700"
                      }`}>{m.trustScore || 0}</span>
                    </td>
                    <td className="px-4 py-3">{m.products?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-emerald-700 hover:underline">Verify</button>
                        <button className="text-xs text-slate-700 hover:underline">Suspend</button>
                      </div>
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