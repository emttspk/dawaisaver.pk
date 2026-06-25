import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export default function MasterGenericsDashboard() {
  const [generics, setGenerics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadGenerics();
  }, []);

  const loadGenerics = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/generics", { limit: 50, search });
      setGenerics(response.items || response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Master Generics</h2>
        <p className="text-sm text-slate-600">Approved generic names from the Master Builder pipeline</p>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search generics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {generics.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{g.name}</h3>
                  <p className="text-sm text-slate-600">{g.normalizedName}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  g.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {g.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}