import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient, getPrescriptionHistory, getSearchHistory, PrescriptionHistoryItem, SearchHistoryItem } from "../services/api-client";
import { formatMoney } from "./MedicineSearch";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ prescriptions: 0, savings: 0 });
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistoryItem[]>([]);
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPrescriptions(getPrescriptionHistory());
    setSearches(getSearchHistory());
    apiClient.getStats().then(setStats).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load dashboard stats.");
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as {user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/prescription/text" className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white">New prescription</Link>
          <Link to="/search" className="rounded-md border border-slate-300 px-4 py-2 font-medium">Search</Link>
        </div>
      </div>
      {error && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Backend prescriptions" value={loading ? "Loading..." : String(stats.prescriptions)} />
        <Metric label="Backend savings" value={loading ? "Loading..." : formatMoney(stats.savings)} />
        <Metric label="Local reports" value={String(prescriptions.length)} />
        <Metric label="Searches" value={String(searches.length)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent prescriptions" empty="No prescription reports yet.">
          {prescriptions.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-medium">{item.medicineCount} medicines · {item.source}</span>
                <span>{formatMoney(item.estimatedSaving)}</span>
              </div>
              <p className="mt-1 text-slate-500">{new Date(item.createdAt).toLocaleString()} {item.city ? `· ${item.city}` : ""}</p>
            </div>
          ))}
        </Panel>
        <Panel title="Recent searches" empty="No searches yet.">
          {searches.map((item) => (
            <Link key={`${item.query}-${item.createdAt}`} to={`/search?q=${encodeURIComponent(item.query)}`} className="block rounded-md border border-slate-200 p-3 text-sm hover:border-emerald-500">
              <span className="font-medium">{item.query}</span>
              <span className="ml-2 text-slate-500">{item.resultCount} results</span>
            </Link>
          ))}
        </Panel>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">{hasChildren ? children : <p className="text-sm text-slate-600">{empty}</p>}</div>
    </section>
  );
}
