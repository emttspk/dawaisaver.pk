import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

export default function UserActivityDashboard() {
  const [health, setHealth] = useState<string>("Loading");

  useEffect(() => {
    apiClient.raw("/health/application").then(() => setHealth("API reachable")).catch(() => setHealth("API health unavailable"));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">User Activity Dashboard</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Dedicated user activity endpoints are not exposed in the current backend contract. Public beta operators can use authenticated dashboard stats and search logs once an admin activity endpoint is added.</p>
        <p className="mt-3 font-medium">{health}</p>
      </section>
    </div>
  );
}
