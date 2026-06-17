import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlternativeResult, apiClient } from "../services/api-client";
import { formatMoney, formatPercent } from "./MedicineSearch";

export default function Alternatives() {
  const { id } = useParams();
  const [result, setResult] = useState<AlternativeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.getAlternatives(id).then(setResult).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load alternatives.");
    }).finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-5">
      <Link to="/search" className="text-sm font-medium text-emerald-700">Back to search</Link>
      <h1 className="text-2xl font-bold">Equivalent Alternatives</h1>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Equivalent options with same active ingredient, strength, and dosage form. Do not switch high-risk medicines without clinical advice.
      </p>
      {loading && <p className="rounded-lg border bg-white p-4">Loading alternatives...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && !result && <p className="rounded-lg border bg-white p-4 text-slate-600">No equivalent alternatives found for this medicine.</p>}
      {result && (
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">{result.canonicalProduct.brandName}</h2>
            <p className="text-sm text-slate-600">{result.canonicalProduct.genericName}</p>
            <p className="mt-2 text-sm">Match confidence: {formatPercent(result.confidenceScore)}</p>
          </section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.equivalentBrands.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-semibold">{item.brandName}</h3>
                <p className="text-sm text-slate-600">{item.genericName}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <span>Lowest: {formatMoney(item.lowestPrice)}</span>
                  <span>Average: {formatMoney(item.averagePrice)}</span>
                  <span>Confidence: {formatPercent(item.confidenceScore)}</span>
                  <span>Availability: {formatPercent(item.availabilityScore)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
