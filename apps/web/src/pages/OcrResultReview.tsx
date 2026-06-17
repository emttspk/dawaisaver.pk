import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../services/api-client";

interface ReviewState {
  imageReference: string;
  city?: string;
  ocrText: string;
  confidenceScore?: number;
  providerName?: string;
}

export default function OcrResultReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || null) as ReviewState | null;
  const [text, setText] = useState(state?.ocrText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!state) {
    return <Navigate to="/prescription/upload" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiClient.submitMockUpload(state.imageReference, text, state.city || undefined);
      navigate("/prescription/report", { state: { result } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">OCR Result Review</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">Provider: {state.providerName || "OCR"} · Confidence: {Math.round((state.confidenceScore || 0) * 100)}%</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={10} className="w-full rounded-md border px-3 py-3" />
          <button disabled={loading || !text.trim()} className="w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Matching medicines..." : "Confirm text and estimate savings"}
          </button>
        </form>
      </div>
    </div>
  );
}
