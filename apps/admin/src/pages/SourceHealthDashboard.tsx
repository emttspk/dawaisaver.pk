import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/api-client";
import { QueueLayout, filterRows, rowId, text } from "./OcrReviewDashboard";

export default function SourceHealthDashboard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.getSourceHealth().then(setItems).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load source health.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterRows(items, query), [items, query]);

  return (
    <QueueLayout title="Source Health Dashboard" query={query} setQuery={setQuery} loading={loading} error={error} empty="No source health records found.">
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <article key={rowId(item)} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{text(item.providerCode)}</h3>
                <p className="mt-1 text-sm text-slate-600">Checked: {text(item.checkedAt)}</p>
                <p className="mt-1 text-sm">Response: {text(item.responseTimeMs)} ms · HTTP {text(item.statusCode)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.healthy ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {item.healthy ? "Healthy" : "Unhealthy"}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{text(item.message)}</p>
          </article>
        ))}
      </div>
    </QueueLayout>
  );
}
