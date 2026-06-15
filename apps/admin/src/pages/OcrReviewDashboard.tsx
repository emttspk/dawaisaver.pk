import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

interface OcrJob {
  id: string;
  providerName: string;
  confidenceScore: number;
  rawText: string;
}

export default function OcrReviewDashboard() {
  const [jobs, setJobs] = useState<OcrJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getOcrJobs();
      setJobs(response.data.items as OcrJob[] || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">OCR Review Queue</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <OcrJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function OcrJobCard({ job }: { job: OcrJob }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-500">Provider: {job.providerName}</p>
          <p className="text-sm text-gray-500">Confidence: {(job.confidenceScore * 100).toFixed(1)}%</p>
          <pre className="mt-2 text-sm bg-gray-50 p-2 rounded">{job.rawText || "No text"}</pre>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-green-100 text-green-800 rounded">Approve</button>
          <button className="px-3 py-1 bg-red-100 text-red-800 rounded">Reject</button>
        </div>
      </div>
    </div>
  );
}