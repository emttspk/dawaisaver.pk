import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

interface Product {
  id: string;
  brandName: string;
  normalizedBrand: string;
  dosageForm?: string;
  strengthText?: string;
  packSize?: string;
  status: string;
  manufacturer?: { name: string };
}

export default function ProductsDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/products", {
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
      } as any);
      setProducts(Array.isArray(data) ? data : data.items || []);
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
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Products</p>
            <h2 className="mt-2 text-3xl font-black">Product Management</h2>
            <p className="mt-2 text-sm text-slate-600">Manage products, publish/unpublish, and archive.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_REVIEW">Pending</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Brand</th>
                  <th className="px-4 py-3 text-left font-semibold">Dosage</th>
                  <th className="px-4 py-3 text-left font-semibold">Pack</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No products found</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{p.brandName}</div>
                      <div className="text-xs text-slate-500">{p.manufacturer?.name}</div>
                    </td>
                    <td className="px-4 py-3">{p.strengthText || p.dosageForm || "-"}</td>
                    <td className="px-4 py-3">{p.packSize || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                        p.status === "PENDING_REVIEW" ? "bg-amber-100 text-amber-900" :
                        "bg-slate-100 text-slate-700"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-emerald-700 hover:underline">Publish</button>
                        <button className="text-xs text-red-600 hover:underline">Archive</button>
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