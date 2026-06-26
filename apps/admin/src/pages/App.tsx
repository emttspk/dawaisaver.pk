import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AdminAuthContext";
import { apiClient } from "../services/api-client";
import IngredientReviewDashboard from "./IngredientReviewDashboard";
import MedicineMatchReview from "./MedicineMatchReview";
import OcrReviewDashboard from "./OcrReviewDashboard";
import PrescriptionReviewDashboard from "./PrescriptionReviewDashboard";
import PriceAnomalyDashboard from "./PriceAnomalyDashboard";
import SourceHealthDashboard from "./SourceHealthDashboard";
import SystemHealthDashboard from "./SystemHealthDashboard";
import UserActivityDashboard from "./UserActivityDashboard";
import DiscoveryReviewDashboard from "./DiscoveryReviewDashboard";
import ProductsDashboard from "./ProductsDashboard";
import ManufacturersDashboard from "./ManufacturersDashboard";
import DistributorsDashboard from "./DistributorsDashboard";
import PharmaciesDashboard from "./PharmaciesDashboard";
import SubmissionCenterDashboard from "./SubmissionCenterDashboard";
import ReportsDashboard from "./ReportsDashboard";
import AuditLogsDashboard from "./AuditLogsDashboard";
import ValidationCenterDashboard from "./ValidationCenterDashboard";
import ScraperCenterDashboard from "./ScraperCenterDashboard";
import MasterProductsDashboard from "./MasterProductsDashboard";
import MasterManufacturersDashboard from "./MasterManufacturersDashboard";
import MasterIngredientsDashboard from "./MasterIngredientsDashboard";
import MasterApplicantsDashboard from "./MasterApplicantsDashboard";
import MasterDosageFormsDashboard from "./MasterDosageFormsDashboard";
import MasterStrengthsDashboard from "./MasterStrengthsDashboard";
import MasterPackSizesDashboard from "./MasterPackSizesDashboard";
import MasterRoutesDashboard from "./MasterRoutesDashboard";
import MasterAtcDashboard from "./MasterAtcDashboard";
import MasterTherapeuticCategoriesDashboard from "./MasterTherapeuticCategoriesDashboard";
import MasterCanonicalProductsDashboard from "./MasterCanonicalProductsDashboard";
import MasterValidationDashboard from "./MasterValidationDashboard";

type ReviewTab = "overview" | "ingredient-review" | "ocr" | "prescriptions" | "matching" | "discovery" | "prices" | "sources" | "users" | "system" | "products" | "validation" | "scraper" | "manufacturers" | "distributors" | "pharmacies" | "submissions" | "reports" | "audit" | "master-products" | "master-manufacturers" | "master-ingredients" | "master-applicants" | "master-dosage-forms" | "master-strengths" | "master-packs" | "master-routes" | "master-atc" | "master-therapeutic-categories" | "master-canonical" | "master-validation";

const tabs: Array<{ key: ReviewTab; label: string }> = [
  { key: "overview", label: "Dashboard" },
  { key: "ingredient-review", label: "Ingredient Review" },
  { key: "ocr", label: "OCR" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "matching", label: "Medicine Match" },
  { key: "discovery", label: "Discovery" },
  { key: "prices", label: "Price Anomalies" },
  { key: "sources", label: "Sources" },
  { key: "users", label: "User Activity" },
  { key: "system", label: "System Health" },
  { key: "products", label: "Products" },
  { key: "validation", label: "Validation" },
  { key: "scraper", label: "Scraper" },
  { key: "manufacturers", label: "Manufacturers" },
  { key: "distributors", label: "Distributors" },
  { key: "pharmacies", label: "Pharmacies" },
  { key: "submissions", label: "Submissions" },
  { key: "reports", label: "Reports" },
  { key: "audit", label: "Audit Logs" },
  { key: "master-products", label: "Master Products" },
  { key: "master-manufacturers", label: "Master Manufacturers" },
  { key: "master-ingredients", label: "Ingredients" },
  { key: "master-applicants", label: "Applicants" },
  { key: "master-dosage-forms", label: "Dosage Forms" },
  { key: "master-strengths", label: "Strengths" },
  { key: "master-packs", label: "Pack Sizes" },
  { key: "master-routes", label: "Routes" },
  { key: "master-atc", label: "ATC" },
  { key: "master-therapeutic-categories", label: "Therapeutic Categories" },
  { key: "master-canonical", label: "Canonical Products" },
  { key: "master-validation", label: "Master Validation" },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");

  return (
    <div className="min-h-screen bg-[#f5faf8] text-slate-950">
      <header className="border-b border-emerald-100 bg-white shadow-sm shadow-emerald-950/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">DawaiSaver.pk Admin</h1>
            <p className="text-sm text-slate-600">{user?.email} - {user?.role}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/#/admin/mirror-status" className="w-fit rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
              Mirror status
            </a>
            <button onClick={logout} className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              Logout
            </button>
          </div>
        </div>
      </header>
      <nav className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${
                activeTab === tab.key ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600"
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
    case "ingredient-review":
      return <IngredientReviewDashboard />;
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
    case "products":
      return <ProductsDashboard />;
    case "validation":
      return <ValidationCenterDashboard />;
    case "scraper":
      return <ScraperCenterDashboard />;
    case "manufacturers":
      return <ManufacturersDashboard />;
    case "distributors":
      return <DistributorsDashboard />;
    case "pharmacies":
      return <PharmaciesDashboard />;
    case "submissions":
      return <SubmissionCenterDashboard />;
    case "reports":
      return <ReportsDashboard />;
    case "audit":
      return <AuditLogsDashboard />;
    case "master-products":
      return <MasterProductsDashboard />;
    case "master-manufacturers":
      return <MasterManufacturersDashboard />;
    case "master-ingredients":
      return <MasterIngredientsDashboard />;
    case "master-applicants":
      return <MasterApplicantsDashboard />;
    case "master-dosage-forms":
      return <MasterDosageFormsDashboard />;
    case "master-strengths":
      return <MasterStrengthsDashboard />;
    case "master-packs":
      return <MasterPackSizesDashboard />;
    case "master-routes":
      return <MasterRoutesDashboard />;
    case "master-atc":
      return <MasterAtcDashboard />;
    case "master-therapeutic-categories":
      return <MasterTherapeuticCategoriesDashboard />;
    case "master-canonical":
      return <MasterCanonicalProductsDashboard />;
    case "master-validation":
      return <MasterValidationDashboard />;
    default:
      return <AdminOverview />;
  }
}

function AdminOverview() {
  const [stats, setStats] = useState<{
    totalProducts: number;
    totalManufacturers: number;
    totalIngredients: number;
    totalDosageForms: number;
    totalStrengths: number;
    totalPacks: number;
    totalRoutes: number;
    totalAtc: number;
    totalTherapeuticCategories: number;
    totalImportBatches: number;
    totalNormalizedRecords: number;
  } | null>(null);

  useEffect(() => {
    apiClient.getDashboardStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-950/5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Operations overview</p>
        <h2 className="mt-2 text-3xl font-bold">Admin Dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Premium beta console for review queues, health checks, and audit-friendly decision support.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-6">
        <Kpi value={String(stats?.totalProducts ?? 0)} label="Products" tone="emerald" />
        <Kpi value={String(stats?.totalManufacturers ?? 0)} label="Manufacturers" tone="blue" />
        <Kpi value={String(stats?.totalIngredients ?? 0)} label="Ingredients" tone="amber" />
        <Kpi value={String(stats?.totalRoutes ?? 0)} label="Routes" tone="slate" />
        <Kpi value={String(stats?.totalNormalizedRecords ?? 0)} label="Normalized" tone="red" />
        <Kpi value={String(stats?.totalImportBatches ?? 0)} label="Imports" tone="blue" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold">Review volume</h3>
          <div className="mt-5 flex h-56 items-end gap-3 rounded-2xl bg-slate-50 p-4">
            {[42, 68, 35, 75, 58, 88, 64].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col justify-end">
                <div className="rounded-t-xl bg-emerald-600" style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold">Health monitoring</h3>
          <div className="mt-5 space-y-3">
            {["API availability", "Database checks", "Source monitoring", "OCR queue"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                <span className="font-medium">{item}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Ready</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Review queues", "OCR, prescriptions, medicine matching, discovery candidates, and price anomalies."],
          ["Evidence first", "Each review screen exposes confidence scores, source evidence, and audit-friendly action notes."],
          ["Beta operations", "Health, source status, and user activity views are available for public beta monitoring."],
        ].map(([title, body]) => (
          <section key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function Kpi({ value, label, tone }: { value: string; label: string; tone: "emerald" | "blue" | "amber" | "slate" | "red" }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-800",
    blue: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-900",
    slate: "bg-slate-100 text-slate-800",
    red: "bg-red-50 text-red-800",
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${toneClass}`}>{value}</p>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}
