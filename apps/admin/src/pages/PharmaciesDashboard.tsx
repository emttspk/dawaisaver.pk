import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

interface Pharmacy {
  id: string;
  name: string;
  sourceStatus: string;
  scrapingStatus: string;
  priceCount: number;
}

export default function PharmaciesDashboard() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/pharmacies", {
        search: search || undefined,
        limit: 50,
      } as any);
      setPharmacies(Array.isArray(data) ? data : data.items || []);
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
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Pharmacies</p>
            <h2 className="mt-2 text-3xl font-black">Pharmacy Management</h2>
            <p className="mt-2 text-sm text-slate-600">Monitor pharmacy sources, scraping status, and price counts.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pharmacies..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Source Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Scraping</th>
                  <th className="px-4 py-3 text-left font-semibold">Prices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : pharmacies.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No pharmacies found</td></tr>
                ) : pharmacies.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{p.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        p.sourceStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>{p.sourceStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        p.scrapingStatus === "RUNNING" ? "bg-blue-100 text-blue-800" :
                        p.scrapingStatus === "PAUSED" ? "bg-amber-100 text-amber-900" :
                        "bg-slate-100 text-slate-700"
                      }`}>{p.scrapingStatus}</span>
                    </td>
                    <td className="px-4 py-3">{p.priceCount || 0}</td>
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