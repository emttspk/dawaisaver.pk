import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";
import { text } from "./OcrReviewDashboard";

export default function SystemHealthDashboard() {
  const [items, setItems] = useState<Array<{ label: string; status: string; detail: unknown }>>([]);

  useEffect(() => {
    apiClient.getSystemHealth().then((results) => {
      setItems(["/health", "/health/database", "/health/application"].map((label, index) => {
        const result = results[index];
        return {
          label,
          status: result.status === "fulfilled" ? "Healthy" : "Unavailable",
          detail: result.status === "fulfilled" ? result.value : result.reason,
        };
      }));
    });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">System Health Dashboard</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{item.label}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === "Healthy" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {item.status}
              </span>
            </div>
            <pre className="mt-3 max-h-52 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{text(item.detail)}</pre>
          </article>
        ))}
      </div>
      {items.length === 0 && <p className="rounded-lg border bg-white p-4 text-slate-600">Loading health endpoints...</p>}
    </div>
  );
}
