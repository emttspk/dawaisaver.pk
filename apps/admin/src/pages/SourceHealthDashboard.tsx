import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

export default function SourceHealthDashboard() {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    apiClient.getSourceHealth().then((response) => {
      setItems(Array.isArray(response.data) ? response.data : []);
    });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Source Health Dashboard</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">No source health records found.</p>
      ) : (
        <pre className="bg-white border rounded p-4 text-sm overflow-auto">{JSON.stringify(items, null, 2)}</pre>
      )}
    </div>
  );
}
