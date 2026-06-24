import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

interface Submission {
  id: string;
  entityType: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function SubmissionCenterDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let data: Submission[] = [];
      switch (tab) {
        case "pending":
          data = await apiClient.get("/admin/submissions/pending");
          break;
        case "approved":
          data = await apiClient.get("/admin/submissions/approved");
          break;
        case "rejected":
          data = await apiClient.get("/admin/submissions/rejected");
          break;
      }
      setSubmissions(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Submission Center</h2>
        <p className="mt-2 text-sm text-slate-600">Review and manage product submissions from manufacturers.</p>
      </section>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            className={`pb-3 text-sm font-semibold ${tab === "pending" ? "border-b-2 border-emerald-600 text-emerald-800" : "text-slate-600"}`}
            onClick={() => setTab("pending")}
          >
            Pending ({submissions.length})
          </button>
          <button
            className={`pb-3 text-sm font-semibold ${tab === "approved" ? "border-b-2 border-emerald-600 text-emerald-800" : "text-slate-600"}`}
            onClick={() => setTab("approved")}
          >
            Approved
          </button>
          <button
            className={`pb-3 text-sm font-semibold ${tab === "rejected" ? "border-b-2 border-emerald-600 text-emerald-800" : "text-slate-600"}`}
            onClick={() => setTab("rejected")}
          >
            Rejected
          </button>
        </nav>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No submissions found</td></tr>
              ) : submissions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{s.entityType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                      s.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                      s.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-900"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}