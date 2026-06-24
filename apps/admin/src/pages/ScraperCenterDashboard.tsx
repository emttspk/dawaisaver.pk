import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export default function ScraperCenterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getScraperJobs(20);
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      switch (action) {
        case "start":
          await apiClient.startScraperJob(id);
          break;
        case "pause":
          await apiClient.pauseScraperJob(id);
          break;
        case "resume":
          await apiClient.resumeScraperJob(id);
          break;
        case "stop":
          await apiClient.stopScraperJob(id);
          break;
      }
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Scraper Center</h2>
        <p className="mt-2 text-sm text-slate-600">Control and monitor all scraping jobs.</p>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Job Name</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Started</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No jobs found</td></tr>
              ) : jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{job.name}</div>
                    <div className="text-xs text-slate-500">{job.adapterName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline rounded-full px-2 py-1 text-xs font-semibold ${
                      job.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                      job.status === "FAILED" ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-900"
                    }`}>{job.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {job.startedAt ? new Date(job.startedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleAction("start", job.id)} className="text-xs text-blue-700 hover:underline">Start</button>
                      <button onClick={() => handleAction("pause", job.id)} className="text-xs text-amber-700 hover:underline">Pause</button>
                      <button onClick={() => handleAction("resume", job.id)} className="text-xs text-emerald-700 hover:underline">Resume</button>
                      <button onClick={() => handleAction("stop", job.id)} className="text-xs text-red-700 hover:underline">Stop</button>
                    </div>
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