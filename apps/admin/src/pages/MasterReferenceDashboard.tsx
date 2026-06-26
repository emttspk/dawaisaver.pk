import { useEffect, useMemo, useState } from "react";
import { apiClient, type MasterReferenceResource } from "../services/api-client";

type ColumnConfig = {
  label: string;
  render: (item: any) => string | number | JSX.Element | null | undefined;
};

type DetailFieldConfig = {
  label: string;
  render: (item: any) => string | number | JSX.Element | null | undefined;
};

type MasterReferenceDashboardProps = {
  title: string;
  description: string;
  resource: MasterReferenceResource;
  columns: ColumnConfig[];
  detailFields?: DetailFieldConfig[];
  searchPlaceholder: string;
  statusOptions?: string[];
  approvalStatusOptions?: string[];
  pageSize?: number;
};

export default function MasterReferenceDashboard({
  title,
  description,
  resource,
  columns,
  detailFields = [],
  searchPlaceholder,
  statusOptions = [],
  approvalStatusOptions = [],
  pageSize = 25,
}: MasterReferenceDashboardProps) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<any[]>([]);

  const limit = pageSize;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, search, status, approvalStatus, offset, limit]);

  const listTitle = useMemo(() => title, [title]);

  async function loadList() {
    setLoading(true);
    try {
      setSelectedItem(null);
      setLinkedProducts([]);
      const response = await apiClient.getMasterReferenceList(resource, {
        limit,
        offset,
        search: search.trim() || undefined,
        status: status || undefined,
        approvalStatus: approvalStatus || undefined,
      });
      setItems(response.items || []);
      setTotal(response.total || 0);
      if (!selectedItem && response.items?.length) {
        await loadDetail(response.items[0].id);
      }
      if (response.items?.length === 0) {
        setSelectedItem(null);
        setLinkedProducts([]);
      }
    } catch (error) {
      console.error(error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    try {
      const response = await apiClient.getMasterReferenceDetail(resource, id);
      setSelectedItem(response.item);
      setLinkedProducts(response.linkedProducts || []);
    } catch (error) {
      console.error(error);
      const fallback = items.find((item) => item.id === id) || null;
      setSelectedItem(fallback);
      setLinkedProducts([]);
    } finally {
      setDetailLoading(false);
    }
  }

  const canGoPrev = offset > 0;
  const canGoNext = offset + limit < total;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Master reference data</p>
            <h2 className="mt-2 text-3xl font-black">{listTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <div className="text-sm text-slate-500">
            <p>{total.toLocaleString()} records</p>
            <p>
              Showing {pageStart.toLocaleString()}-{pageEnd.toLocaleString()} of {total.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
            <input
              value={search}
              onChange={(event) => {
                setOffset(0);
                setSearch(event.target.value);
              }}
              placeholder={searchPlaceholder}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
            />
          </label>
          {statusOptions.length > 0 && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                value={status}
                onChange={(event) => {
                  setOffset(0);
                  setStatus(event.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white"
              >
                <option value="">All</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
          {approvalStatusOptions.length > 0 && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval</span>
              <select
                value={approvalStatus}
                onChange={(event) => {
                  setOffset(0);
                  setApprovalStatus(event.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white"
              >
                <option value="">All</option>
                {approvalStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!canGoPrev}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!canGoNext}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button
            onClick={() => void loadList()}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-bold">Records</h3>
            <p className="text-sm text-slate-500">Select a row to inspect the live master record and linked products.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.label} className="px-4 py-3">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                      No records matched the current filters.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer hover:bg-slate-50 ${selectedItem?.id === item.id ? "bg-emerald-50/60" : ""}`}
                      onClick={() => void loadDetail(item.id)}
                    >
                      {columns.map((column) => (
                        <td key={`${item.id}-${column.label}`} className="px-4 py-3 align-top">
                          {column.render(item)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">Detail</h3>
              {detailLoading && <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loading</span>}
            </div>
            {selectedItem ? (
              <div className="mt-4 space-y-4">
                {detailFields.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailFields.map((field) => (
                      <InfoBlock key={field.label} label={field.label} value={field.render(selectedItem)} />
                    ))}
                  </div>
                )}
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-700">
                    {JSON.stringify(selectedItem.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a record to inspect its live master data.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Linked products</h3>
            <div className="mt-4 space-y-3">
              {linkedProducts.length > 0 ? (
                linkedProducts.map((product) => (
                  <div key={product.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-900">{product.brandName || product.canonicalName || product.displayName || "Product"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.registrationNumber || "n/a"} {product.manufacturer?.name ? `· ${product.manufacturer.name}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.dosageForm || "-"} {product.packSize ? `· ${product.packSize}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No linked products available for the selected master record.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string | number | JSX.Element | null | undefined }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value ?? "n/a"}</div>
    </div>
  );
}
