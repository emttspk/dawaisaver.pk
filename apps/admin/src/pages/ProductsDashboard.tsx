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
  createdAt: string;
  registrationNumber?: string;
}

interface ProductsResponse {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
}

export default function ProductsDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [search, statusFilter, currentPage, limit, sortBy, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const data: ProductsResponse = await apiClient.get("/admin/products", {
        limit,
        offset,
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const offset = (currentPage - 1) * limit;
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Products</p>
            <h2 className="mt-2 text-3xl font-black">Product Management</h2>
            <p className="mt-2 text-sm text-slate-600">Manage products, publish/unpublish, and archive. Total: {total} products.</p>
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
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="brandName">Sort by Brand</option>
            <option value="registrationNumber">Sort by Registration</option>
          </select>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold cursor-pointer" onClick={() => handleSort("brandName")}>Brand</th>
                  <th className="px-4 py-3 text-left font-semibold">Generic</th>
                  <th className="px-4 py-3 text-left font-semibold cursor-pointer" onClick={() => handleSort("dosageForm")}>Dosage</th>
                  <th className="px-4 py-3 text-left font-semibold">Pack</th>
                  <th className="px-4 py-3 text-left font-semibold cursor-pointer" onClick={() => handleSort("registrationNumber")}>Reg #</th>
                  <th className="px-4 py-3 text-left font-semibold">Manufacturer</th>
                  <th className="px-4 py-3 text-left font-semibold cursor-pointer" onClick={() => handleSort("status")}>Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No products found</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{p.brandName}</div>
                      <div className="text-xs text-slate-500">{p.registrationNumber || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.normalizedBrand || "-"}</td>
                    <td className="px-4 py-3">{p.strengthText || p.dosageForm || "-"}</td>
                    <td className="px-4 py-3">{p.packSize || "-"}</td>
                    <td className="px-4 py-3">{p.registrationNumber || "-"}</td>
                    <td className="px-4 py-3">{p.manufacturer?.name || "-"}</td>
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

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {Math.min(offset + 1, total)} to {Math.min(offset + products.length, total)} of {total} products
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded-xl border px-3 py-1 text-sm ${page === currentPage ? "bg-emerald-700 text-white" : "border-slate-300"}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function formatMoney(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `PKR ${value.toFixed(0)}` : "Not available";
}

export function formatPercent(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 100)}%` : "Review";
}