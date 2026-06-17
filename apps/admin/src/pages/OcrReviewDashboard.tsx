import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../services/api-client";

export default function OcrReviewDashboard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.getOcrJobs().then((response) => setItems(response.items || [])).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load OCR queue.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterRows(items, query), [items, query]);

  return (
    <QueueLayout title="OCR Review Queue" query={query} setQuery={setQuery} loading={loading} error={error} empty="No OCR review items found.">
      {filtered.map((item) => (
        <article key={rowId(item)} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-semibold">OCR job {shortId(item.id)}</h3>
              <p className="mt-1 text-sm text-slate-600">Provider: {text(item.providerName || item.provider)} · Status: {text(item.status)}</p>
              <p className="mt-1 text-sm">Confidence: {percent(item.confidenceScore)}</p>
            </div>
            <ReviewButtons onAction={(decision) => alertAction("OCR", rowId(item), decision)} />
          </div>
          <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{text(item.rawText || item.extractedText || item.resultSummary || item.metadata)}</pre>
        </article>
      ))}
    </QueueLayout>
  );
}

export function QueueLayout({
  title,
  query,
  setQuery,
  loading,
  error,
  empty,
  children,
}: {
  title: string;
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  error: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Review workspace</p>
            <h2 className="mt-1 text-2xl font-bold">{title}</h2>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search table..." className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/20" />
        </div>
      </div>
      {loading && <p className="rounded-2xl border bg-white p-5 text-slate-600 shadow-sm">Loading...</p>}
      {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</p>}
      {!loading && !error && !hasChildren && <p className="rounded-2xl border bg-white p-5 text-slate-600 shadow-sm">{empty}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function ReviewButtons({ onAction }: { onAction: (decision: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onAction("approve")} className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">Approve</button>
      <button onClick={() => onAction("reject")} className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">Reject</button>
      <button onClick={() => onAction("request_more_evidence")} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">More evidence</button>
    </div>
  );
}

export function filterRows(rows: Record<string, unknown>[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
}

export function rowId(row: Record<string, unknown>) {
  return String(row.id || row.candidateId || row.providerCode || row.productId || JSON.stringify(row).slice(0, 80));
}

export function shortId(value: unknown) {
  const id = String(value || "pending");
  return id.length > 10 ? `${id.slice(0, 8)}...` : id;
}

export function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function percent(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "Review";
}

export function alertAction(scope: string, id: string, decision: string) {
  window.alert(`${scope} ${id}: ${decision} captured for audit action. Endpoint support is pending for this queue.`);
}
