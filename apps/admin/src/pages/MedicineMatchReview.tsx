import { useState } from "react";
import { apiClient } from "../services/api-client";
import { percent, text } from "./OcrReviewDashboard";

export default function MedicineMatchReview() {
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await apiClient.request("/matching/evaluate", {
        method: "POST",
        body: JSON.stringify({ brandName, genericName, strength, dosageForm }),
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Medicine match review failed.");
    } finally {
      setLoading(false);
    }
  };

  const record = result && typeof result === "object" ? result as Record<string, unknown> : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Medicine Match Review</h2>
      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Brand" className="rounded-md border px-3 py-2" />
        <input value={genericName} onChange={(event) => setGenericName(event.target.value)} placeholder="Generic" className="rounded-md border px-3 py-2" />
        <input value={strength} onChange={(event) => setStrength(event.target.value)} placeholder="Strength" className="rounded-md border px-3 py-2" />
        <input value={dosageForm} onChange={(event) => setDosageForm(event.target.value)} placeholder="Dosage form" className="rounded-md border px-3 py-2" />
        <button onClick={() => void submit()} disabled={loading} className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white md:col-span-4">
          {loading ? "Evaluating..." : "Evaluate match"}
        </button>
      </section>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      {!result && !error && <p className="rounded-lg border bg-white p-4 text-slate-600">Enter a medicine identity to review canonical matching confidence.</p>}
      {record && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Match result</h3>
          <p className="mt-2 text-sm">Confidence: {percent(record.confidenceScore || record.finalConfidence)}</p>
          <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{text(record)}</pre>
        </section>
      )}
    </div>
  );
}
