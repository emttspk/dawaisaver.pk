import { useEffect, useState } from "react";
import { apiClient } from "../services/api-client";

export default function Dashboard() {
  const [stats, setStats] = useState({ prescriptions: 0, savings: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const response = await apiClient.getStats();
    setStats(response.data);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Prescriptions</p>
          <p className="text-2xl font-bold">{stats.prescriptions}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Savings</p>
          <p className="text-2xl font-bold">PKR {stats.savings}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Prescriptions</h2>
      <p className="text-gray-600">No recent prescriptions found.</p>
    </div>
  );
}