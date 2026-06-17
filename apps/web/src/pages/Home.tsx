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
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/10">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
          <p className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">Public beta medicine intelligence</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
            Safer medicine comparison with savings clarity.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            DawaiSaver.pk compares medicines using active ingredient, strength, dosage form, price signals, and source evidence.
          </p>
          <form onSubmit={submit} className="flex max-w-2xl flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-2 shadow-inner sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by brand or generic name"
              className="min-h-14 flex-1 rounded-xl border border-white bg-white px-4 outline-none ring-emerald-500/20 focus:ring-4"
            />
            <button className="min-h-14 rounded-xl bg-emerald-700 px-6 font-semibold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800">
              Find options
            </button>
          </form>
          <div className="grid max-w-2xl grid-cols-3 gap-3 text-sm">
            <TrustMetric value="Same" label="ingredient checks" />
            <TrustMetric value="Live" label="API pricing flows" />
            <TrustMetric value="Review" label="safety flags" />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Prescription assistant</p>
          <h2 className="mt-3 text-2xl font-bold">Upload or type a prescription.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Review OCR text, see equivalent options, and flag high-risk medicines before any switching decision.</p>
          <div className="mt-5 grid gap-3">
            <Link className="rounded-2xl border border-white/10 bg-white/10 p-4 font-semibold hover:bg-white/15" to="/prescription/text">
              Enter prescription text
            </Link>
            <Link className="rounded-2xl bg-emerald-500 p-4 font-semibold text-emerald-950 hover:bg-emerald-400" to="/prescription/upload">
              Upload prescription image
            </Link>
            <Link className="rounded-2xl border border-white/10 bg-white/10 p-4 font-semibold hover:bg-white/15" to="/history">
              View search history
            </Link>
          </div>
          {installPrompt && (
            <button
              onClick={() => void installPrompt.prompt()}
              className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
            >
              Install app
            </button>
          )}
        </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Equivalent options", "Equivalent options with same active ingredient, strength, and dosage form."],
          ["High-risk warnings", "Insulin, blood thinners, thyroid, psychiatric, cancer, steroid, pregnancy, and controlled medicines are flagged."],
          ["Review-first safety", "Low confidence matches and high-risk medicines are marked for pharmacist/admin review."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard value="3" label="seed beta medicines" />
        <StatCard value="24/7" label="frontend availability" />
        <StatCard value="JWT" label="protected accounts" />
        <StatCard value="R2" label="upload storage path" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Trending searches</h2>
          <Link to="/search" className="text-sm font-medium text-emerald-700">Open search</Link>
        </div>
        {trending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Trending medicines will appear after more beta searches.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {trending.map((item) => (
              <Link key={item.query} to={`/search?q=${encodeURIComponent(item.query)}`} className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {item.query}
              </Link>
            ))}
          </div>
        )}
      </section>
      <footer className="border-t border-emerald-100 py-6 text-sm text-slate-500">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>DawaiSaver.pk public beta</span>
          <span>Medicine intelligence only. Confirm changes with a licensed professional.</span>
        </div>
      </footer>
    </div>
  );
}

function TrustMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
      <p className="font-bold text-emerald-800">{value}</p>
      <p className="text-slate-500">{label}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
