import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export default function MasterCanonicalProductsDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCanonicalProducts();
  }, []);

  const loadCanonicalProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/canonical-products", { limit: 50, search });
      setProducts(response.items || response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Canonical Products</h2>
        <p className="text-sm text-slate-600">Unique medicine signatures mapped to products</p>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search canonical products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{p.canonicalName}</h3>
                  <p className="text-sm text-slate-600">
                    {p.normalizedBrand} | {p.normalizedGeneric} | {p.packSize}
                  </p>
                  <p className="text-xs text-slate-500">Signature: {p.medicineSignature?.substring(0, 50)}...</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}