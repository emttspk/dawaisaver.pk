import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../services/api-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [trending, setTrending] = useState<Array<{ query: string; searchCount: number }>>([]);

  useEffect(() => {
    const listener = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", listener);
    apiClient.getTrending().then(setTrending).catch(() => setTrending([]));
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Public beta medicine intelligence</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Find equivalent medicine options and estimated savings in Pakistan.
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            DawaiSaver.pk compares medicines using active ingredient, strength, dosage form, price signals, and source evidence.
          </p>
          <form onSubmit={submit} className="flex max-w-2xl flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by brand or generic name"
              className="min-h-12 flex-1 rounded-md border border-slate-300 px-4 outline-none focus:border-emerald-600"
            />
            <button className="min-h-12 rounded-md bg-emerald-700 px-5 font-semibold text-white hover:bg-emerald-800">
              Search
            </button>
          </form>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Prescription tools</h2>
          <div className="mt-4 grid gap-3">
            <Link className="rounded-md border border-slate-200 p-4 hover:border-emerald-500" to="/prescription/text">
              Enter prescription text
            </Link>
            <Link className="rounded-md border border-slate-200 p-4 hover:border-emerald-500" to="/prescription/upload">
              Upload prescription image
            </Link>
            <Link className="rounded-md border border-slate-200 p-4 hover:border-emerald-500" to="/history">
              View search history
            </Link>
          </div>
          {installPrompt && (
            <button
              onClick={() => void installPrompt.prompt()}
              className="mt-4 w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white"
            >
              Install app
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Equivalent options", "Equivalent options with same active ingredient, strength, and dosage form."],
          ["High-risk warnings", "Insulin, blood thinners, thyroid, psychiatric, cancer, steroid, pregnancy, and controlled medicines are flagged."],
          ["Review-first safety", "Low confidence matches and high-risk medicines are marked for pharmacist/admin review."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Trending searches</h2>
          <Link to="/search" className="text-sm font-medium text-emerald-700">Open search</Link>
        </div>
        {trending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Trending medicines will appear after more beta searches.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {trending.map((item) => (
              <Link key={item.query} to={`/search?q=${encodeURIComponent(item.query)}`} className="rounded-full bg-slate-100 px-3 py-2 text-sm">
                {item.query}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
