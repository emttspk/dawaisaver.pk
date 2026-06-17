import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/api-client";
import { QueueLayout, alertAction, filterRows, percent, rowId, text } from "./OcrReviewDashboard";

export default function PriceAnomalyDashboard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.getPriceAnomalies().then((response) => setItems(response.items || [])).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load price anomalies.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterRows(items, query), [items, query]);

  return (
    <QueueLayout title="Price Anomaly Review" query={query} setQuery={setQuery} loading={loading} error={error} empty="No price anomalies found.">
      {filtered.map((item) => (
        <article key={rowId(item)} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-semibold">{text(item.productId || item.medicineSignature || item.anomalyType)}</h3>
              <p className="mt-1 text-sm text-slate-600">Severity: {text(item.severity || item.anomalyType)} · Confidence: {percent(item.confidenceScore)}</p>
              <p className="mt-1 text-sm">Source evidence: {text(item.sourceProviderCode || item.sourceUrl || item.source)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => alertAction("Price anomaly", rowId(item), "approve")} className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">Mark valid</button>
              <button onClick={() => alertAction("Price anomaly", rowId(item), "reject")} className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800">Reject</button>
            </div>
          </div>
          <pre className="mt-3 max-h-36 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{text(item)}</pre>
        </article>
      ))}
    </QueueLayout>
  );
}
