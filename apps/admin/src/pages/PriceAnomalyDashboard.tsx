import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

export default function PriceAnomalyDashboard() {
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    apiClient.getPriceAnomalies().then((response) => {
      setItems((response.data as { items?: unknown[]; anomalies?: unknown[] }).items || (response.data as { anomalies?: unknown[] }).anomalies || []);
    });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Price Anomaly Review Queue</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">No price anomalies found.</p>
      ) : (
        <pre className="bg-white border rounded p-4 text-sm overflow-auto">{JSON.stringify(items, null, 2)}</pre>
      )}
    </div>
  );
}
