import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/api-client";

export default function PrescriptionUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const imageReference = await apiClient.uploadImage(file);
      const ocr = await apiClient.processOcr({ imageReference, city: city || undefined, provider: "mock" });
      navigate("/prescription/review", {
        state: {
          imageReference,
          city,
          ocrText: ocr.text,
          confidenceScore: ocr.confidenceScore,
          providerName: ocr.providerName,
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Prescription Upload</h1>
        <p className="mt-1 text-sm text-slate-600">Upload JPG, PNG, or PDF, then review extracted text before medicine matching.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-500">
          <span className="text-lg font-semibold">{file ? file.name : "Choose prescription file"}</span>
          <span className="mt-1 text-sm text-slate-500">Image or PDF, stored through the API upload flow</span>
          <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City for local price estimate" className="w-full rounded-md border px-3 py-3" />
        <button disabled={!file || loading} className="w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? "Uploading and reading..." : "Upload and review OCR"}
        </button>
      </form>
    </div>
  );
}
