import { useState } from "react";
import { useAuth } from "../contexts/AdminAuthContext";

type ReviewTab = "ocr" | "prescriptions" | "discovery" | "prices" | "sources";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ReviewTab>("ocr");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">DawaiSaver.pk Admin Panel</h1>
          <div className="flex items-center gap-4">
            {user && <span className="text-gray-700">{user.name}</span>}
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
          {[
            { key: "ocr", label: "OCR Review" },
            { key: "prescriptions", label: "Prescription Review" },
            { key: "discovery", label: "Discovery Review" },
            { key: "prices", label: "Price Anomalies" },
            { key: "sources", label: "Source Health" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ReviewTab)}
              className={`px-4 py-2 border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <DashboardContent tab={activeTab} />
      </main>
    </div>
  );
}

function DashboardContent({ tab }: { tab: ReviewTab }) {
  switch (tab) {
    case "ocr":
      return <OcrReviewDashboard />;
    case "prescriptions":
      return <PrescriptionReviewDashboard />;
    case "discovery":
      return <DiscoveryReviewDashboard />;
    case "prices":
      return <PriceAnomalyDashboard />;
    case "sources":
      return <SourceHealthDashboard />;
    default:
      return <OcrReviewDashboard />;
  }
}