import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export interface MasterProduct {
  id: string;
  registrationNumber: string;
  brandName: string;
  normalizedBrand: string;
  dosageForm?: string;
  packSize?: string;
  status: string;
  confidenceScore: number;
  manufacturer?: {
    id: string;
    name: string;
    normalizedName: string;
  };
  compositions: Array<{
    id: string;
    generic: {
      id: string;
      name: string;
      normalizedName: string;
    };
    strengthValue?: number;
    strengthUnit?: string;
    strengthText?: string;
  }>;
}

export default function MasterProductsDashboard() {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMasterProducts(50, statusFilter, search);
      setProducts(data.items || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Master Products</h2>
          <p className="text-sm text-slate-600">Approved medicines from the Master Builder pipeline</p>
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by brand name or registration number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2"
        >
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="ACTIVE">Active</option>
          <option value="VERIFIED">Verified</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{product.brandName}</h3>
                  <p className="text-sm text-slate-600">
                    {product.registrationNumber} | {product.dosageForm} | {product.packSize}
                  </p>
                  <p className="text-xs text-slate-500">
                    Manufacturer: {product.manufacturer?.name || "Unknown"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{product.confidenceScore.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Confidence</p>
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                    product.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                    product.status === "VERIFIED" ? "bg-blue-100 text-blue-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}