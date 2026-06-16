import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Cheaper Medicine Alternatives in Pakistan
        </h1>
        <p className="text-gray-600">
          Upload a prescription or search for medicines to find equivalent options with savings.
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search medicine name..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Search
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <button className="p-6 bg-white rounded-lg shadow text-left hover:shadow-lg">
          <h3 className="font-semibold mb-2">Upload Prescription</h3>
          <p className="text-sm text-gray-600">Get instant savings estimate</p>
        </button>
        <button className="p-6 bg-white rounded-lg shadow text-left hover:shadow-lg">
          <h3 className="font-semibold mb-2">Compare Prices</h3>
          <p className="text-sm text-gray-600">Find best prices across pharmacies</p>
        </button>
        <button className="p-6 bg-white rounded-lg shadow text-left hover:shadow-lg">
          <h3 className="font-semibold mb-2">Track Orders</h3>
          <p className="text-sm text-gray-600">Monitor your medicine orders</p>
        </button>
      </div>
    </div>
  );
}
