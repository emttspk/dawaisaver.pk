import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiClient } from "../services/api-client";

export default function MedicineSearch() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [query, setQuery] = useState(queryParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      searchMedicine();
    }
  }, [query]);

  const searchMedicine = async () => {
    setLoading(true);
    try {
      const response = await apiClient.searchProducts(query);
      setResults(response.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Search Medicines</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand or generic name..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((product: any) => (
            <div key={product.id} className="border rounded-lg p-4 hover:shadow">
              <h3 className="font-semibold">{product.brandName}</h3>
              <p className="text-sm text-gray-600">{product.genericName}</p>
              <p className="text-primary-600 font-bold mt-2">PKR {product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}