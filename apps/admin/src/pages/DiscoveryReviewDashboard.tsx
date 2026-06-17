import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/api-client";
import { QueueLayout, filterRows, percent, rowId, text } from "./OcrReviewDashboard";

export default function DiscoveryReviewDashboard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.getDiscoveryCandidates().then((response) => {
      setItems(Array.isArray(response) ? response : response.items || []);
    }).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load discovery candidates.");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterRows(items, query), [items, query]);

  const review = async (candidateId: string, decision: "approve" | "reject" | "merge" | "request_more_evidence") => {
    await apiClient.reviewDiscovery(candidateId, decision, notes[candidateId] || `Admin ${decision}`);
    setItems((current) => current.filter((item) => rowId(item) !== candidateId));
  };

  return (
    <QueueLayout title="Discovery Candidate Review" query={query} setQuery={setQuery} loading={loading} error={error} empty="No discovery candidates found.">
      {filtered.map((item) => {
        const id = rowId(item);
        return (
          <article key={id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-semibold">{text(item.candidateName || item.normalizedBrand)}</h3>
                <p className="mt-1 text-sm text-slate-600">{text(item.normalizedGeneric)} · {text(item.normalizedStrength)} · {text(item.normalizedDosageForm)}</p>
                <p className="mt-1 text-sm">Overall confidence: {percent(item.overallConfidence)} · Evidence: {percent(item.evidenceConfidence)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void review(id, "approve")} className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">Approve</button>
                <button onClick={() => void review(id, "reject")} className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800">Reject</button>
                <button onClick={() => void review(id, "request_more_evidence")} className="rounded-md bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900">More evidence</button>
              </div>
            </div>
            <textarea value={notes[id] || ""} onChange={(event) => setNotes({ ...notes, [id]: event.target.value })} placeholder="Review notes and source evidence summary" className="mt-3 w-full rounded-md border px-3 py-2 text-sm" />
            <pre className="mt-3 max-h-36 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{text(item.metadata || item.duplicateFlags)}</pre>
          </article>
        );
      })}
    </QueueLayout>
  );
}
