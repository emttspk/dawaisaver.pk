import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/api-client";
import { QueueLayout, filterRows, percent, rowId, shortId, text } from "./OcrReviewDashboard";

export default function PrescriptionReviewDashboard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.getPrescriptionReviews().then((response) => setItems(response.items || [])).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load prescription reviews.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterRows(items, query), [items, query]);

  const review = async (id: string, decision: "approve" | "reject" | "request_more_evidence") => {
    await apiClient.reviewPrescription(id, decision, notes[id] || `Admin ${decision}`);
    setItems((current) => current.filter((item) => rowId(item) !== id));
  };

  return (
    <QueueLayout title="Prescription Review Queue" query={query} setQuery={setQuery} loading={loading} error={error} empty="No prescription review items found.">
      {filtered.map((item) => {
        const id = rowId(item);
        const rxItems = Array.isArray(item.items) ? item.items as Record<string, unknown>[] : [];
        return (
          <article key={id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-semibold">Prescription {shortId(id)}</h3>
                <p className="mt-1 text-sm text-slate-600">Status: {text(item.status)} · Confidence: {percent(item.confidenceScore)}</p>
                <p className="mt-1 text-sm">Items: {rxItems.length}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void review(id, "approve")} className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">Approve</button>
                <button onClick={() => void review(id, "reject")} className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">Reject</button>
                <button onClick={() => void review(id, "request_more_evidence")} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">More evidence</button>
              </div>
            </div>
            <textarea value={notes[id] || ""} onChange={(event) => setNotes({ ...notes, [id]: event.target.value })} placeholder="Audit notes" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <div className="mt-3 grid gap-2">
              {rxItems.map((rxItem) => (
                <div key={rowId(rxItem)} className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <span className="font-medium">{text(rxItem.parsedName || rxItem.rawText)}</span>
                  <span className="ml-2 text-slate-600">Confidence: {percent(rxItem.confidenceScore)}</span>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </QueueLayout>
  );
}
