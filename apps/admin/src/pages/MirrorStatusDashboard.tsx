import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiClient, type MirrorStatusResponse } from "../services/api-client";

export default function MirrorStatusDashboard() {
  const [data, setData] = useState<MirrorStatusResponse | null>(null);
  const [runtimeState, setRuntimeState] = useState<{
    state: string;
    envState: string;
    effectiveState: string;
    mirrorEnabled: boolean;
    migrationMode: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [actionState, setActionState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [actionMessage, setActionMessage] = useState("");
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [statusResult, runtimeResult] = await Promise.allSettled([
          apiClient.getMirrorStatus(),
          apiClient.getMirrorRuntime(),
        ]);
        if (!mounted) return;
        if (statusResult.status === "fulfilled" && isMirrorStatusResponse(statusResult.value)) {
          setData(statusResult.value);
        } else {
          setError(
            statusResult.status === "rejected"
              ? safeErrorMessage(statusResult.reason, "Could not load mirror status.")
              : "Mirror status endpoint returned an unexpected response.",
          );
        }
        if (runtimeResult.status === "fulfilled" && runtimeResult.value && typeof runtimeResult.value === "object") {
          setRuntimeState(runtimeResult.value);
        }
        if (statusResult.status === "fulfilled" && isMirrorStatusResponse(statusResult.value)) setError("");
        setLastUpdated(new Date().toISOString());
      } catch (caught) {
        if (!mounted) return;
        setError(safeErrorMessage(caught, "Could not load mirror status."));
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

  const handleAction = async (action: "start" | "pause" | "resume" | "stop") => {
    if (action === "stop") {
      setShowStopConfirm(true);
      return;
    }
    await executeAction(action);
  };

  const executeAction = async (action: "start" | "pause" | "resume" | "stop") => {
    setActionState("loading");
    setActionMessage("");
    try {
      let result;
      switch (action) {
        case "start":
          result = await apiClient.startMirror();
          break;
        case "pause":
          result = await apiClient.pauseMirror();
          break;
        case "resume":
          result = await apiClient.resumeMirror();
          break;
        case "stop":
          result = await apiClient.stopMirror();
          break;
      }
      setActionState("success");
      setActionMessage(result?.message || "Action completed.");
      setShowStopConfirm(false);
      setTimeout(() => {
        setActionState("idle");
        setActionMessage("");
      }, 3000);
    } catch (err) {
      setActionState("error");
      setActionMessage(safeErrorMessage(err, "Action failed"));
    }
  };

  const canStart = data?.status === "PAUSED" || data?.status === "STOPPED" || data?.status === "INTERRUPTED" || !data?.status || (runtimeState && runtimeState.effectiveState === "PAUSED");
  const canPause = data?.status === "RUNNING" || data?.status === "PAUSED";
  const canResume = data?.status === "PAUSED" || data?.status === "STOPPED" || data?.status === "INTERRUPTED" || (runtimeState && runtimeState.effectiveState === "PAUSED");
  const canStop = data?.status === "RUNNING" || data?.status === "PAUSED";

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

        {actionState !== "idle" && (
          <div className={`rounded-2xl border p-4 ${actionState === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : actionState === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
            <p className="font-semibold">
              {actionState === "loading" ? "Processing..." : actionState === "success" ? "Success" : "Error"}: {actionMessage}
            </p>
          </div>
        )}

        {runtimeState && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Runtime State</p>
                <p className="text-xs text-slate-500">Environment controlled</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">DB State:</span>
                  <span className={`ml-1 font-semibold ${runtimeState.state === "running" ? "text-emerald-700" : "text-slate-600"}`}>{runtimeState.state}</span>
                </div>
                <div>
                  <span className="text-slate-500">ENV:</span>
                  <span className={`ml-1 font-semibold ${runtimeState.mirrorEnabled ? "text-emerald-700" : "text-slate-600"}`}>{runtimeState.mirrorEnabled ? "enabled" : "disabled"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Migration:</span>
                  <span className={`ml-1 font-semibold ${runtimeState.migrationMode ? "text-amber-700" : "text-emerald-700"}`}>{runtimeState.migrationMode ? "on" : "off"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <StatusBanner tone="slate" title="Loading mirror status" body="Waiting for the first live response." />}
        {error && <StatusBanner tone="red" title="Status load failed" body={error} />}

        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
              ))}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Mirror Controls</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleAction("start")}
                  disabled={!canStart || actionState === "loading"}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold text-white transition ${canStart && actionState !== "loading" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  Start Mirror
                </button>
                <button
                  onClick={() => handleAction("pause")}
                  disabled={!canPause || actionState === "loading"}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold text-white transition ${canPause && actionState !== "loading" ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  Pause Mirror
                </button>
                <button
                  onClick={() => handleAction("resume")}
                  disabled={!canResume || actionState === "loading"}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold text-white transition ${canResume && actionState !== "loading" ? "bg-sky-600 hover:bg-sky-700" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  Resume Mirror
                </button>
                <button
                  onClick={() => handleAction("stop")}
                  disabled={!canStop || actionState === "loading"}
                  className={`rounded-2xl px-4 py-2 text-sm font-bold text-white transition ${canStop && actionState !== "loading" ? "bg-red-600 hover:bg-red-700" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  Stop Mirror
                </button>
              </div>
              {showStopConfirm && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-800">Confirm Stop</p>
                  <p className="mt-2 text-sm text-red-700">Are you sure you want to stop the mirror? This will pause all ongoing work.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => executeAction("stop")}
                      disabled={actionState === "loading"}
                      className="rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Yes, Stop
                    </button>
                    <button
                      onClick={() => setShowStopConfirm(false)}
                      className="rounded-lg bg-slate-300 px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
                <Panel
                  title="Integrity"
                  body={<IntegrityList data={data} />}
                />
                <Panel
                  title="Archive Status"
                  body={
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-600">Archive uploads: {data?.archive_uploads || 0}</p>
                      <p className="text-slate-600">R2 integrity: {data?.r2_integrity || "unknown"}</p>
                      <button
                        onClick={async () => {
                          try {
                            const archiveStatus = await apiClient.getMirrorArchiveStatus();
                            console.log("Archive status:", archiveStatus);
                          } catch (e) {
                            console.error("Failed to fetch archive status:", e);
                          }
                        }}
                        className="text-xs text-sky-700 hover:text-sky-900"
                      >
                        Refresh archive status
                      </button>
                    </div>
                  }
                />
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

function isMirrorStatusResponse(value: unknown): value is MirrorStatusResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.status === "string" && Array.isArray(record.batches);
}

function safeErrorMessage(value: unknown, fallback: string): string {
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === "object") {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
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
