import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/api-client";

export default function PrescriptionTextEntry() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiClient.submitPrescriptionText(text, city || undefined);
      navigate("/prescription/report", { state: { result } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Prescription processing failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Prescription Text Entry</h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={10}
          placeholder={"Enter one medicine per line, for example:\nAugmentin 625mg tablet\nPanadol 500mg tablet"}
          className="w-full rounded-md border border-slate-300 px-3 py-3"
          required
        />
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City for local price estimate" className="w-full rounded-md border px-3 py-3" />
        <button disabled={loading} className="w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? "Processing..." : "Process prescription"}
        </button>
      </form>
    </div>
  );
}
