import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AutocompleteSuggestion, SearchResult, apiClient } from "../services/api-client";

export default function MedicineSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("q") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextQuery = params.get("q") || "";
    const nextCity = params.get("city") || "";
    setQuery(nextQuery);
    setCity(nextCity);
    if (nextQuery) {
      void runSearch(nextQuery, nextCity);
    }
  }, [location.search]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      apiClient.autocomplete(query, city || undefined).then(setSuggestions).catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [query, city]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (city.trim()) next.set("city", city.trim());
    navigate(`/search?${next.toString()}`);
  };

  const runSearch = async (value: string, selectedCity?: string) => {
    setLoading(true);
    setError("");
    try {
      setResults(await apiClient.searchProducts(value, selectedCity || undefined));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-950/5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Medicine intelligence</p>
        <h1 className="mt-2 text-3xl font-bold">Premium medicine search</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Search by brand, generic, manufacturer, signature, or registration number. Results preserve safety wording and confidence signals.</p>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-emerald-100 bg-white p-3 shadow-xl shadow-emerald-950/5 md:grid-cols-[1fr_180px_auto]">
        <div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Augmentin, paracetamol, insulin..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none ring-emerald-500/20 focus:bg-white focus:ring-4"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={`${item.suggestion}-${item.suggestionType}`} type="button" onClick={() => setQuery(item.suggestion)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  {item.suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none focus:bg-white" />
        <button className="rounded-2xl bg-emerald-700 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800">Search</button>
      </form>

      {loading && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">Loading medicine results...</p>}
      {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</p>}
      {!loading && !error && query && results.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">No medicines found. Try a generic name or remove city filtering.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((product) => (
          <article key={product.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{product.brandName}</h2>
                <p className="text-sm text-slate-600">{product.genericName || "Generic not listed"}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {formatPercent(product.confidenceScore)}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Lowest" value={formatMoney(product.lowestPrice)} />
              <Stat label="Average" value={formatMoney(product.averagePrice)} />
              <Stat label="Availability" value={formatPercent(product.availabilityScore)} />
              <Stat label="Source" value={product.manufacturer || "Pending"} />
            </dl>
            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Equivalent options require same active ingredient, strength, and dosage form.
            </div>
            <div className="mt-4 flex gap-2">
              <Link to={`/medicine/${product.id}`} state={{ product }} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold">
                Details
              </Link>
              <Link to={`/medicine/${product.id}/alternatives`} className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white">
                Alternatives
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export function formatMoney(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `PKR ${value.toFixed(0)}` : "Not available";
}

export function formatPercent(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 100)}%` : "Review";
}
