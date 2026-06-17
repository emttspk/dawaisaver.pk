import { Link, useLocation, useParams } from "react-router-dom";
import { SearchResult } from "../services/api-client";
import { formatMoney, formatPercent } from "./MedicineSearch";

export default function MedicineDetails() {
  const { id } = useParams();
  const location = useLocation();
  const product = (location.state as { product?: SearchResult } | null)?.product;

  return (
    <div className="space-y-6">
      <Link to="/search" className="text-sm font-medium text-emerald-700">Back to search</Link>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold">{product?.brandName || "Medicine Details"}</h1>
        <p className="mt-2 text-slate-600">{product?.genericName || `Product ID: ${id}`}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Detail label="Lowest price" value={formatMoney(product?.lowestPrice)} />
          <Detail label="Average price" value={formatMoney(product?.averagePrice)} />
          <Detail label="Confidence" value={formatPercent(product?.confidenceScore)} />
          <Detail label="Availability" value={formatPercent(product?.availabilityScore)} />
          <Detail label="Manufacturer" value={product?.manufacturer || "Pending source evidence"} />
          <Detail label="Registration" value={product?.registrationNumber || "Not available"} />
          <Detail label="Medicine signature" value={product?.medicineSignature || "Not available"} />
        </div>
      </section>
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Equivalent options are compared only when active ingredient, strength, and dosage form match. Ask a pharmacist or doctor before switching any medicine.
      </section>
      {id && (
        <Link to={`/medicine/${id}/alternatives`} className="inline-flex rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
          View alternatives
        </Link>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
