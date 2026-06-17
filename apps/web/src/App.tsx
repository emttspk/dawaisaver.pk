import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Alternatives from "./pages/Alternatives";
import CostSavingsReport from "./pages/CostSavingsReport";
import Dashboard from "./pages/Dashboard";
import HelpFaq from "./pages/HelpFaq";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MedicineDetails from "./pages/MedicineDetails";
import MedicineSearch from "./pages/MedicineSearch";
import OcrResultReview from "./pages/OcrResultReview";
import PrescriptionTextEntry from "./pages/PrescriptionTextEntry";
import PrescriptionUpload from "./pages/PrescriptionUpload";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import SearchHistory from "./pages/SearchHistory";

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6fbf9] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-800">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-sm font-black text-white">DS</span>
            <span>DawaiSaver.pk</span>
          </NavLink>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <NavItem to="/search">Search</NavItem>
            <NavItem to="/prescription/text">Prescription</NavItem>
            <NavItem to="/prescription/upload">Upload</NavItem>
            <NavItem to="/help">Help</NavItem>
            {isAuthenticated ? (
              <>
                <NavItem to="/dashboard">Dashboard</NavItem>
                <NavItem to="/profile">{user?.name || "Profile"}</NavItem>
                <button onClick={logout} className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavItem to="/login">Login</NavItem>
                <NavLink to="/register" className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800">
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<MedicineSearch />} />
          <Route path="/medicine/:id" element={<MedicineDetails />} />
          <Route path="/medicine/:id/alternatives" element={<Alternatives />} />
          <Route path="/prescription/text" element={<PrescriptionTextEntry />} />
          <Route path="/prescription/upload" element={<PrescriptionUpload />} />
          <Route path="/prescription/review" element={<OcrResultReview />} />
          <Route path="/prescription/report" element={<CostSavingsReport />} />
          <Route path="/history" element={<SearchHistory />} />
          <Route path="/help" element={<HelpFaq />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-2 ${
          isActive ? "bg-emerald-50 font-semibold text-emerald-800" : "font-medium text-slate-700 hover:bg-emerald-50"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default App;
