import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId?: string;
  createdAt: string;
}

export default function AuditLogsDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.get("/admin/audit", {
        limit: "100",
        ...(filter && { action: filter }),
      });
      setLogs(Array.isArray(data) ? data : data.items || []);
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
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Audit Logs</p>
            <h2 className="mt-2 text-3xl font-black">Audit Center</h2>
            <p className="mt-2 text-sm text-slate-600">Track all admin actions, product changes, price updates, and scraper events.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="IMPORT">Import</option>
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Entity</th>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No audit logs found</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">
                      <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                        log.action === "CREATE" ? "bg-blue-100 text-blue-800" :
                        log.action === "UPDATE" ? "bg-amber-100 text-amber-900" :
                        log.action === "DELETE" ? "bg-red-100 text-red-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{log.entityType}</div>
                      <div className="text-xs text-slate-500">{log.entityId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
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