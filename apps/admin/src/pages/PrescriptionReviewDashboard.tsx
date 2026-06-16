import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

export default function PrescriptionReviewDashboard() {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    apiClient.getPrescriptionReviews().then((response) => {
      setItems((response.data as { items?: unknown[] }).items || []);
    });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prescription Review Queue</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">No prescription review items found.</p>
      ) : (
        <pre className="bg-white border rounded p-4 text-sm overflow-auto">{JSON.stringify(items, null, 2)}</pre>
      )}
    </div>
  );
}
