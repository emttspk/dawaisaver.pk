import { useState } from "react";
import { useAuth } from "../contexts/AdminAuthContext";
import DiscoveryReviewDashboard from "./DiscoveryReviewDashboard";
import MedicineMatchReview from "./MedicineMatchReview";
import OcrReviewDashboard from "./OcrReviewDashboard";
import PrescriptionReviewDashboard from "./PrescriptionReviewDashboard";
import PriceAnomalyDashboard from "./PriceAnomalyDashboard";
import SourceHealthDashboard from "./SourceHealthDashboard";
import SystemHealthDashboard from "./SystemHealthDashboard";
import UserActivityDashboard from "./UserActivityDashboard";

type ReviewTab = "overview" | "ocr" | "prescriptions" | "matching" | "discovery" | "prices" | "sources" | "users" | "system";

const tabs: Array<{ key: ReviewTab; label: string }> = [
  { key: "overview", label: "Dashboard" },
  { key: "ocr", label: "OCR" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "matching", label: "Medicine Match" },
  { key: "discovery", label: "Discovery" },
  { key: "prices", label: "Price Anomalies" },
  { key: "sources", label: "Sources" },
  { key: "users", label: "User Activity" },
  { key: "system", label: "System Health" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">DawaiSaver.pk Admin</h1>
            <p className="text-sm text-slate-600">{user?.email} · {user?.role}</p>
          </div>
          <button onClick={logout} className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium">Logout</button>
        </div>
      </header>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
                activeTab === tab.key ? "border-slate-900 text-slate-950" : "border-transparent text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <DashboardContent tab={activeTab} />
      </main>
    </div>
  );
}

function DashboardContent({ tab }: { tab: ReviewTab }) {
  switch (tab) {
    case "overview":
      return <AdminOverview />;
    case "ocr":
      return <OcrReviewDashboard />;
    case "prescriptions":
      return <PrescriptionReviewDashboard />;
    case "matching":
      return <MedicineMatchReview />;
    case "discovery":
      return <DiscoveryReviewDashboard />;
    case "prices":
      return <PriceAnomalyDashboard />;
    case "sources":
      return <SourceHealthDashboard />;
    case "users":
      return <UserActivityDashboard />;
    case "system":
      return <SystemHealthDashboard />;
    default:
      return <AdminOverview />;
  }
}

function AdminOverview() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Review queues", "OCR, prescriptions, medicine matching, discovery candidates, and price anomalies."],
          ["Evidence first", "Each review screen exposes confidence scores, source evidence, and audit-friendly action notes."],
          ["Beta operations", "Health, source status, and user activity views are available for public beta monitoring."],
        ].map(([title, body]) => (
          <section key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
