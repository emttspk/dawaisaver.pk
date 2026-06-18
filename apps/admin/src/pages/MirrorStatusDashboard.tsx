import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiClient, type MirrorStatusResponse } from "../services/api-client";

export default function MirrorStatusDashboard() {
  const [data, setData] = useState<MirrorStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await apiClient.getMirrorStatus();
        if (!mounted) return;
        setData(response);
        setError("");
        setLastUpdated(new Date().toISOString());
      } catch (caught) {
        if (!mounted) return;
        setError(caught instanceof Error ? caught.message : "Could not load mirror status.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 10000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const metrics = useMemo(() => {
    if (!data) return [];
    const remainingTarget = Math.max((data.total_rows || 0) - data.processed_count, 0);
    const progressPercent = data.total_rows > 0 ? Math.min((data.processed_count / data.total_rows) * 100, 100) : 0;

    return [
      { label: "Status", value: data.status, tone: toneForStatus(data.status) },
      { label: "Processed", value: formatNumber(data.processed_count), tone: "slate" as const },
      { label: "Remaining target", value: formatNumber(remainingTarget), tone: "amber" as const },
      { label: "Progress", value: `${progressPercent.toFixed(1)}%`, tone: "blue" as const },
      { label: "Success", value: formatNumber(data.success_count), tone: "emerald" as const },
      { label: "Failed", value: formatNumber(data.failed_count), tone: data.failed_count > 0 ? "amber" as const : "emerald" as const },
      { label: "Duplicates", value: formatNumber(data.duplicates), tone: data.duplicates > 0 ? "amber" as const : "emerald" as const },
      { label: "Throughput", value: `${data.throughput.toFixed(2)} / sec`, tone: "blue" as const },
      { label: "Workers", value: formatNumber(data.worker_count), tone: "slate" as const },
      { label: "Archive uploads", value: formatNumber(data.archive_uploads), tone: "amber" as const },
      { label: "ETA", value: data.eta_at ? new Date(data.eta_at).toLocaleString() : "Calculating", tone: "blue" as const },
      {
        label: "Completed",
        value: data.completed_at ? new Date(data.completed_at).toLocaleString() : "In progress",
        tone: data.completed_at ? "emerald" as const : "slate" as const,
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0fff7,_#f7fafc_40%,_#eef6ff_100%)] px-4 py-6 text-slate-950 md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-xl shadow-emerald-950/5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
                Live mirror telemetry
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">DRAP mirror status</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Auto-refreshes every 10 seconds and reads the active batched archive run directly from the admin API.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-[20rem]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="font-semibold text-slate-700">Last updated</p>
                <p className="mt-1 text-slate-600">{lastUpdated ? new Date(lastUpdated).toLocaleString() : "Waiting for first refresh"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/#/admin"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-700"
                >
                  Back to admin home
                </a>
                <a
                  href="/#/admin/mirror-status"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Refresh mirror page
                </a>
              </div>
            </div>
          </div>
        </div>

        {loading && <StatusBanner tone="slate" title="Loading mirror status" body="Waiting for the first live response." />}
        {error && <StatusBanner tone="red" title="Status load failed" body={error} />}

        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Mirror progress</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatNumber(data.processed_count)} processed of {formatNumber(data.total_rows)} total registrations.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneBadge(data.status)}`}>{data.status}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {data.total_rows > 0 ? `${Math.max(data.total_rows - data.processed_count, 0)} remaining` : "Target pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>Completion</span>
                    <span>{data.total_rows > 0 ? `${((data.processed_count / data.total_rows) * 100).toFixed(1)}%` : "0.0%"}</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-sky-500"
                      style={{ width: `${data.total_rows > 0 ? Math.min((data.processed_count / data.total_rows) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Remaining target: {formatNumber(Math.max(data.total_rows - data.processed_count, 0))}</p>
                    <p>Archive uploads: {formatNumber(data.archive_uploads)}</p>
                    <p>Last registration: {data.last_registration ?? "pending"}</p>
                    <p>Workers active: {formatNumber(data.worker_count)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {data.batches.map((batch) => (
                    <article key={batch.batch_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{batch.batch_id}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Worker {batch.worker_id ?? "?"} · Last registration {batch.last_registration ?? "pending"}
                          </p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${toneBadge(batch.status)}`}>{batch.status}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>Processed: {formatNumber(batch.processed_count)}</p>
                        <p>Success: {formatNumber(batch.success_count)}</p>
                        <p>Failed: {formatNumber(batch.failed_count)}</p>
                        <p>Retries: {formatNumber(batch.retries)}</p>
                        <p>Throughput: {batch.throughput.toFixed(2)} / sec</p>
                        <p>Archive uploads: {formatNumber(batch.archive_uploads)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <Panel
                  title="Admin home"
                  body={
                    <div className="space-y-3">
                      <p className="text-sm leading-6 text-slate-600">
                        Use this quick link to return to the main admin console for reviews, health, and operations.
                      </p>
                      <a
                        href="/#/admin"
                        className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15"
                      >
                        Open admin home
                      </a>
                    </div>
                  }
                />
                <Panel title="Integrity" body={<IntegrityList data={data} />} />
                <Panel
                  title="Example live response"
                  body={
                    <pre className="max-h-[28rem] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  }
                />
              </section>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "blue" | "amber" | "slate" | "red" }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-black ${valueStyle(tone)}`}>{value}</p>
    </article>
  );
}

function StatusBanner({ tone, title, body }: { tone: "slate" | "red"; title: string; body: string }) {
  return (
    <div className={`rounded-[1.75rem] border p-5 ${tone === "red" ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-700"}`}>
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  );
}

function Panel({ title, body }: { title: string; body: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{body}</div>
    </section>
  );
}

function IntegrityList({ data }: { data: MirrorStatusResponse }) {
  const rows = [
    ["Checkpoint", data.checkpoint_integrity],
    ["Archive", data.archive_integrity],
    ["R2", data.r2_integrity],
    ["Coverage", `${data.success_rate.toFixed(2)}% success`],
    ["Duplicates", formatNumber(data.duplicates)],
    ["ETA", data.eta_at ? new Date(data.eta_at).toLocaleString() : "Pending"],
  ];

  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="text-slate-600">{value}</span>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function toneForStatus(status: string): "emerald" | "blue" | "amber" | "slate" | "red" {
  if (status === "COMPLETED") return "emerald";
  if (status === "COMPLETED_WITH_ERRORS") return "amber";
  if (status === "FAILED") return "red";
  if (status === "RUNNING") return "blue";
  return "slate";
}

function toneBadge(status: string) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "COMPLETED_WITH_ERRORS") return "bg-amber-100 text-amber-900";
  if (status === "FAILED") return "bg-red-100 text-red-800";
  if (status === "RUNNING") return "bg-sky-100 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

function valueStyle(tone: "emerald" | "blue" | "amber" | "slate" | "red") {
  return {
    emerald: "text-emerald-700",
    blue: "text-sky-700",
    amber: "text-amber-700",
    slate: "text-slate-800",
    red: "text-red-700",
  }[tone];
}
