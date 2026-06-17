import { Link } from "react-router-dom";
import { getPrescriptionHistory, getSearchHistory } from "../services/api-client";
import { formatMoney } from "./MedicineSearch";

export default function SearchHistory() {
  const searches = getSearchHistory();
  const prescriptions = getPrescriptionHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search History</h1>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Medicine searches</h2>
        {searches.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No search history yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {searches.map((item) => (
              <Link key={`${item.query}-${item.createdAt}`} to={`/search?q=${encodeURIComponent(item.query)}`} className="rounded-md border p-3 text-sm hover:border-emerald-500">
                <span className="font-medium">{item.query}</span>
                <span className="ml-2 text-slate-500">{item.resultCount} results</span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Prescription reports</h2>
        {prescriptions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No prescription history yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {prescriptions.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{item.medicineCount} medicines · saved {formatMoney(item.estimatedSaving)}</p>
                <p className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
