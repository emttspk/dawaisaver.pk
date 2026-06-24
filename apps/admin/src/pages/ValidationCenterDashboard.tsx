import { useState, useEffect } from "react";
import { apiClient } from "../services/api-client";

export default function ValidationCenterDashboard() {
  const [queues, setQueues] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getValidationQueues(20);
      setQueues(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const queuesConfig = [
    { key: "ingredient", label: "Ingredient Review", count: queues.ingredient?.length || 0 },
    { key: "products", label: "Product Review", count: queues.products?.length || 0 },
    { key: "manufacturers", label: "Manufacturer Review", count: queues.manufacturers?.length || 0 },
    { key: "prices", label: "Price Review", count: queues.prices?.length || 0 },
    { key: "ownershipClaims", label: "Ownership Claims", count: queues.ownershipClaims?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black">Validation Center</h2>
        <p className="mt-2 text-sm text-slate-600">Review queues for ingredients, products, manufacturers, prices, and ownership claims.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {queuesConfig.map((q) => (
          <div key={q.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold">{q.label}</h3>
            <p className="mt-2 text-3xl font-black text-emerald-700">{q.count}</p>
            <p className="text-xs text-slate-500">pending reviews</p>
          </div>
        ))}
      </div>
    </div>
  );
}