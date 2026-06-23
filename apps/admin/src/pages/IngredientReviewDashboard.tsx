import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiClient, IngredientReviewQueueItem, IngredientReviewStatsEntry } from "../services/api-client";

type ReviewStatusFilter = "ALL" | "AUTO_APPROVE" | "REVIEW_REQUIRED" | "MANUAL_REVIEW" | "APPROVED" | "REJECTED";

type PatternFilter =
  | "ALL"
  | "exact_normalization"
  | "salt_variant"
  | "hydrate"
  | "hydrochloride"
  | "sodium_salt"
  | "potassium_salt"
  | "mesylate"
  | "fumarate"
  | "eq_to"
  | "spelling_variant"
  | "combination_product"
  | "descriptor_noise";

const reviewStatuses: ReviewStatusFilter[] = ["ALL", "AUTO_APPROVE", "REVIEW_REQUIRED", "MANUAL_REVIEW", "APPROVED", "REJECTED"];
const patternFilters: PatternFilter[] = [
  "ALL",
  "exact_normalization",
  "salt_variant",
  "hydrate",
  "hydrochloride",
  "sodium_salt",
  "potassium_salt",
  "mesylate",
  "fumarate",
  "eq_to",
  "spelling_variant",
  "combination_product",
  "descriptor_noise",
];

export default function IngredientReviewDashboard() {
  const [items, setItems] = useState<IngredientReviewQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<IngredientReviewStatsEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<IngredientReviewQueueItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>("ALL");
  const [patternFilter, setPatternFilter] = useState<PatternFilter>("ALL");
  const [minConfidence, setMinConfidence] = useState("0.8");
  const limit = 40;
  const [actionBusy, setActionBusy] = useState(false);
  const [backfillBusy, setBackfillBusy] = useState(false);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, patternFilter, minConfidence, limit]);

  const statsMap = useMemo(() => {
    const map = new Map<string, IngredientReviewStatsEntry>();
    for (const entry of stats) {
      map.set(entry.reviewStatus, entry);
    }
    return map;
  }, [stats]);

  const summaryCards = useMemo(() => {
    const count = (statuses: string[]) =>
      statuses.reduce((sum, status) => sum + (statsMap.get(status)?.rows || 0), 0);
    return [
      { label: "Pending", value: count(["REVIEW_REQUIRED", "MANUAL_REVIEW"]), tone: "amber" as const },
      { label: "Approved", value: count(["APPROVED"]), tone: "emerald" as const },
      { label: "Rejected", value: count(["REJECTED"]), tone: "red" as const },
      { label: "Auto-approved", value: count(["AUTO_APPROVE"]), tone: "blue" as const },
      { label: "Manual-review", value: count(["MANUAL_REVIEW"]), tone: "slate" as const },
    ];
  }, [statsMap]);

  const selectedCount = selectedIds.length;

  const handleToggle = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((item) => item.id));
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [queue, reviewStats] = await Promise.all([
        apiClient.getIngredientReviewQueue({
          search: search.trim() || undefined,
          reviewStatus: statusFilter === "ALL" ? undefined : statusFilter,
          patternClass: patternFilter === "ALL" ? undefined : patternFilter,
          minConfidence: minConfidence ? Number(minConfidence) : undefined,
          limit,
          offset: 0,
        }),
        apiClient.getIngredientReviewStats(),
      ]);
      setItems(queue.items);
      setTotal(queue.total);
      setStats(reviewStats);
      if (!selectedItem && queue.items.length > 0) {
        await refreshSelectedItem(queue.items[0].id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load ingredient review queue.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedItem = async (id: string) => {
    const item = await apiClient.getIngredientReviewItem(id);
    setSelectedItem(item);
    setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
  };

  const handleApprove = async (id: string, notes?: string) => {
    setActionBusy(true);
    try {
      const item = await apiClient.approveIngredientReviewItem(id, notes);
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      setSelectedItem(item);
      await loadData();
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (id: string, notes?: string) => {
    setActionBusy(true);
    try {
      const item = await apiClient.rejectIngredientReviewItem(id, notes);
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      setSelectedItem(item);
      await loadData();
    } finally {
      setActionBusy(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setActionBusy(true);
    try {
      await apiClient.bulkApproveIngredientReviewItems(selectedIds, "Bulk approved from admin queue.");
      setSelectedIds([]);
      await loadData();
    } finally {
      setActionBusy(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setActionBusy(true);
    try {
      await apiClient.bulkRejectIngredientReviewItems(selectedIds, "Bulk rejected from admin queue.");
      setSelectedIds([]);
      await loadData();
    } finally {
      setActionBusy(false);
    }
  };

  const handleBackfill = async () => {
    setBackfillBusy(true);
    try {
      await apiClient.backfillIngredientReviewQueue();
      await loadData();
    } finally {
      setBackfillBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Ingredient review</p>
            <h2 className="mt-2 text-3xl font-black">Canonical molecule review queue</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review AI-suggested ingredient mappings, approve canonical aliases, and keep the WHO-backed seed stream visible for every decision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBackfill}
              disabled={backfillBusy}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-60"
            >
              {backfillBusy ? "Backfilling..." : "Run backfill"}
            </button>
            <button
              onClick={() => void loadData()}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="block lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search raw ingredient, normalized ingredient, or reasoning"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReviewStatusFilter)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white"
            >
              {reviewStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pattern</span>
            <select
              value={patternFilter}
              onChange={(event) => setPatternFilter(event.target.value as PatternFilter)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white"
            >
              {patternFilters.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min confidence</span>
            <input
              value={minConfidence}
              onChange={(event) => setMinConfidence(event.target.value)}
              type="number"
              min={0}
              max={1}
              step={0.01}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {selectedIds.length === items.length ? "Clear selection" : "Select all visible"}
          </button>
          <button
            onClick={handleBulkApprove}
            disabled={selectedCount === 0 || actionBusy}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Bulk approve
          </button>
          <button
            onClick={handleBulkReject}
            disabled={selectedCount === 0 || actionBusy}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Bulk reject
          </button>
          <p className="text-sm text-slate-500">
            {selectedCount} selected · {total} queue items
          </p>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {loading && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading queue...</div>}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-bold">Queue items</h3>
            <p className="text-sm text-slate-500">Click a row to inspect source evidence, confidence, and reasoning.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.length === items.length && items.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Pattern</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Suggested canonical molecule</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`cursor-pointer hover:bg-slate-50 ${selectedItem?.id === item.id ? "bg-emerald-50/60" : ""}`}
                    onClick={() => void refreshSelectedItem(item.id)}
                  >
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggle(item.id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900">{item.rawIngredient}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.normalizedIngredient}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.occurrenceCount} occurrences</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone="slate">{item.matchPattern || "unknown"}</Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone={confidenceTone(Number(item.confidenceScore || 0))}>{formatConfidence(item.confidenceScore)}</Badge>
                      <div className="mt-1 text-xs text-slate-500">{item.reviewStatus}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900">{item.suggestedGeneric?.name || item.resolvedGeneric?.name || "Pending review"}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.aiReasoning || "No reasoning available."}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-xs text-slate-500">{item.sourceType || "SYSTEM"}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.sourceUrl || "seeded from queue"}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                        <button
                          onClick={() => void handleApprove(item.id)}
                          disabled={actionBusy}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void handleReject(item.id)}
                          disabled={actionBusy}
                          className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      No queue items matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Selected item</h3>
            {selectedItem ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw ingredient</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedItem.rawIngredient}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock label="Confidence" value={formatConfidence(selectedItem.confidenceScore)} />
                  <InfoBlock label="Status" value={selectedItem.reviewStatus} />
                  <InfoBlock label="Pattern" value={selectedItem.matchPattern || "unknown"} />
                  <InfoBlock label="Occurrences" value={String(selectedItem.occurrenceCount)} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested canonical molecule</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedItem.suggestedGeneric?.name || selectedItem.resolvedGeneric?.name || "Pending review"}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedItem.aiReasoning || "No reasoning available."}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock label="Source" value={selectedItem.sourceType || "SYSTEM"} />
                  <InfoBlock label="Source URL" value={selectedItem.sourceUrl || "n/a"} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleApprove(selectedItem.id, "Approved from detail panel.")}
                    disabled={actionBusy}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => void handleReject(selectedItem.id, "Rejected from detail panel.")}
                    disabled={actionBusy}
                    className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => void refreshSelectedItem(selectedItem.id)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Refresh item
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a queue row to inspect the review evidence.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">WHO alias seed review</h3>
            <p className="mt-2 text-sm text-slate-600">
              WHO-backed candidates remain visible here through the canonical suggestion and review reasoning fields.
            </p>
            <div className="mt-4 space-y-3">
              {selectedItem?.aliases?.length ? (
                selectedItem.aliases.slice(0, 5).map((alias) => (
                  <div key={alias.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{alias.aliasValue}</p>
                      <Badge tone={confidenceTone(Number(alias.confidenceScore || 0))}>{formatConfidence(alias.confidenceScore)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{alias.aliasType}</p>
                    <p className="mt-1 text-xs text-slate-500">{alias.sourceType || "SYSTEM"} · {alias.sourceUrl || "no source url"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No approved aliases are attached to the selected item yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Review history</h3>
            <div className="mt-4 space-y-3">
              {selectedItem?.history?.length ? (
                selectedItem.history.map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{entry.newStatus}</span>
                      <span className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{entry.reasoning || "No reasoning"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No review history recorded yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "blue" | "amber" | "slate" | "red" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-black ${toneClass(tone)}`}>{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "blue" | "amber" | "slate" | "red"; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass(tone)}`}>{children}</span>;
}

function formatConfidence(value: number | string | null | undefined) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(4)}`;
}

function confidenceTone(value: number) {
  if (value >= 0.95) return "emerald" as const;
  if (value >= 0.9) return "blue" as const;
  if (value >= 0.8) return "amber" as const;
  return "red" as const;
}

function toneClass(tone: "emerald" | "blue" | "amber" | "slate" | "red") {
  return {
    emerald: "text-emerald-700",
    blue: "text-sky-700",
    amber: "text-amber-700",
    slate: "text-slate-800",
    red: "text-red-700",
  }[tone];
}

function badgeClass(tone: "emerald" | "blue" | "amber" | "slate" | "red") {
  return {
    emerald: "bg-emerald-100 text-emerald-800",
    blue: "bg-sky-100 text-sky-800",
    amber: "bg-amber-100 text-amber-900",
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-100 text-red-800",
  }[tone];
}
