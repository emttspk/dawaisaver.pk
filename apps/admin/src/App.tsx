import { FormEvent, useState } from "react";
import { AdminAuthProvider, useAuth } from "./contexts/AdminAuthContext";
import Dashboard from "./pages/Dashboard";
import MirrorStatusDashboard from "./pages/MirrorStatusDashboard";

function App() {
  return (
    <AdminAuthProvider>
      <AdminRoot />
    </AdminAuthProvider>
  );
}

function AdminRoot() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pathname = window.location.pathname;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return pathname === "/admin/mirror-status" ? <MirrorStatusDashboard /> : <Dashboard />;
  }

  return (
    <main className="grid min-h-screen bg-[#eef7f4] px-4 py-8 lg:grid-cols-[1fr_440px] lg:p-0">
      <section className="hidden items-center justify-center p-10 lg:flex">
        <div className="max-w-xl">
          <p className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
            Clinical operations console
          </p>
          <h1 className="mt-5 text-5xl font-bold leading-tight text-slate-950">
            Review queues, source health, and safety signals.
          </h1>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["OCR", "Matching", "Health"].map((item) => (
              <div key={item} className="rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
                <p className="font-bold text-emerald-800">{item}</p>
                <p className="mt-1 text-xs text-slate-500">review-ready</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-3xl border border-emerald-100 bg-white p-7 shadow-2xl shadow-emerald-950/10">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">DS</div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Admin login</h1>
            <p className="mt-1 text-sm text-slate-600">Admin or reviewer access required.</p>
          </div>
          {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
              required
            />
          </label>
          <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/20 disabled:opacity-60">
            {loading ? "Signing in..." : "Login"}
          </button>
          <a href="/admin/mirror-status" className="block text-center text-sm font-semibold text-emerald-800 underline underline-offset-4">
            Open mirror monitoring
          </a>
        </form>
      </section>
    </main>
  );
}

export default App;
