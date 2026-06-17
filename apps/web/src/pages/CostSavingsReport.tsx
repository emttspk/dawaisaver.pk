import { Link, Navigate, useLocation } from "react-router-dom";
import { PrescriptionResult } from "../services/api-client";
import { formatMoney, formatPercent } from "./MedicineSearch";

export default function CostSavingsReport() {
  const location = useLocation();
  const result = (location.state as { result?: PrescriptionResult } | null)?.result;

  if (!result) {
    return <Navigate to="/prescription/text" replace />;
  }

  const warnings = Array.from(new Set([...(result.safetyWarnings || []), ...(result.costEstimate.safetyWarnings || [])]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cost Savings Report</h1>
        <p className="mt-1 text-sm text-slate-600">Prescription ID: {result.prescriptionId}</p>
      </div>
      {warnings.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <h2 className="font-semibold">High-risk medicine warning</h2>
          <p className="mt-1 text-sm">This prescription includes: {warnings.join(", ")}. Do not substitute without doctor or pharmacist review.</p>
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Original estimate" value={formatMoney(result.costEstimate.originalEstimatedCost)} />
        <Metric label="Cheapest equivalent" value={formatMoney(result.costEstimate.cheapestEquivalentCost)} />
        <Metric label="Estimated saving" value={formatMoney(result.costEstimate.estimatedSaving)} />
        <Metric label="Confidence" value={formatPercent(result.confidenceScore)} />
      </section>
      {result.reviewRequired && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          One or more lines require review because confidence is low, evidence is incomplete, or safety warnings are present.
        </p>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Medicine matches</h2>
        {result.items.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-slate-600">No medicine lines were detected.</p>
        ) : (
          result.items.map((item) => (
            <article key={`${item.lineNumber}-${item.rawText}`} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold">{item.brandName || item.parsedName}</h3>
                  <p className="text-sm text-slate-600">{item.rawText}</p>
                  <p className="mt-1 text-sm">Status: {item.matchStatus} · Confidence: {formatPercent(item.confidenceScore)}</p>
                </div>
                {item.reviewRequired && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">Review required</span>}
              </div>
              {item.alternativeOptions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Equivalent options with same active ingredient, strength, and dosage form.</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {item.alternativeOptions.map((option) => (
                      <div key={`${option.label}-${option.productId}`} className="rounded-md bg-slate-50 p-3 text-sm">
                        <span className="font-medium">{option.label}</span>
                        <span className="ml-2 text-slate-600">{formatMoney(option.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
      <Link to="/dashboard" className="inline-flex rounded-md bg-slate-900 px-4 py-3 font-semibold text-white">Go to dashboard</Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
