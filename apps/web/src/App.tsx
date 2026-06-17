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
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">DS</span>
            <span>DawaiSaver.pk</span>
          </NavLink>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <a href="#how-it-works" className="text-slate-600 hover:text-emerald-700">How It Works</a>
            <a href="#savings" className="text-slate-600 hover:text-emerald-700">Savings</a>
            <a href="#features" className="text-slate-600 hover:text-emerald-700">Features</a>
            <a href="#faq" className="text-slate-600 hover:text-emerald-700">FAQ</a>
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50">Dashboard</NavLink>
                <NavLink to="/profile" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50">{user?.name || "Profile"}</NavLink>
                <button onClick={logout} className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50">Login</NavLink>
                <NavLink to="/register" className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700">Register</NavLink>
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
        </Routes>
      </main>
    </div>
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