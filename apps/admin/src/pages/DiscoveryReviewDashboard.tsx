import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

export default function DiscoveryReviewDashboard() {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    apiClient.getDiscoveryCandidates().then((response) => {
      setItems(Array.isArray(response.data) ? response.data : (response.data as { items?: unknown[] }).items || []);
    });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Discovery Candidate Review Queue</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">No discovery candidates found.</p>
      ) : (
        <pre className="bg-white border rounded p-4 text-sm overflow-auto">{JSON.stringify(items, null, 2)}</pre>
      )}
    </div>
  );
}
