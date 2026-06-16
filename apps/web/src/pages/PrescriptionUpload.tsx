import { useState } from "react";
import { apiClient } from "../services/api-client";

export default function PrescriptionUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const uploadResponse = await apiClient.uploadImage(file);
      const processResponse = await apiClient.processOcr({
        imageReference: uploadResponse.data.url,
      });
      setResult(processResponse.data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Upload Prescription</h1>
      
      <div className="border-2 border-dashed rounded-lg p-8 text-center mb-6">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600">Click to upload prescription image</p>
          <p className="text-sm text-gray-400">JPG, PNG, or PDF</p>
        </label>
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {uploading ? "Processing..." : "Upload & Process"}
        </button>
      )}

      {result && (
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h3 className="font-semibold mb-2">OCR Result</h3>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}