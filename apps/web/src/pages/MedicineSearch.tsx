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
      <div>
        <h1 className="text-2xl font-bold">Medicine Search</h1>
        <p className="mt-1 text-sm text-slate-600">Search by brand, generic, manufacturer, signature, or registration number.</p>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto]">
        <div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Augmentin, paracetamol, insulin..."
            className="w-full rounded-md border border-slate-300 px-3 py-3"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={`${item.suggestion}-${item.suggestionType}`} type="button" onClick={() => setQuery(item.suggestion)} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                  {item.suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className="rounded-md border border-slate-300 px-3 py-3" />
        <button className="rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white">Search</button>
      </form>

      {loading && <p className="rounded-lg border border-slate-200 bg-white p-4 text-slate-600">Loading medicine results...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && query && results.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-slate-600">No medicines found. Try a generic name or remove city filtering.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((product) => (
          <article key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{product.brandName}</h2>
                <p className="text-sm text-slate-600">{product.genericName || "Generic not listed"}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                {formatPercent(product.confidenceScore)}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Lowest" value={formatMoney(product.lowestPrice)} />
              <Stat label="Average" value={formatMoney(product.averagePrice)} />
              <Stat label="Availability" value={formatPercent(product.availabilityScore)} />
              <Stat label="Source" value={product.manufacturer || "Pending"} />
            </dl>
            <div className="mt-4 flex gap-2">
              <Link to={`/medicine/${product.id}`} state={{ product }} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium">
                Details
              </Link>
              <Link to={`/medicine/${product.id}/alternatives`} className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white">
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
    <div>
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
