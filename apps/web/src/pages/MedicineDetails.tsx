import { useParams } from "react-router-dom";

export default function MedicineDetails() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Medicine Details</h1>
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold">Product ID: {id}</h2>
        <p className="text-gray-600 mt-4">Medicine details will be displayed here.</p>
      </div>
    </div>
  );
}