import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export default function MasterManufacturersDashboard() {
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMasterManufacturers(50, search);
      setManufacturers(data.items || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Master Manufacturers</h2>
        <p className="text-sm text-slate-600">Approved manufacturers from the Master Builder pipeline</p>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search manufacturers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {manufacturers.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{m.name}</h3>
                  <p className="text-sm text-slate-600">{m.normalizedName}</p>
                  <p className="text-xs text-slate-500">Country: {m.country || "Unknown"}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}