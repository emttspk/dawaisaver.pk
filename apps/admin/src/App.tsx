import { FormEvent, useState } from "react";
import { AdminAuthProvider, useAuth } from "./contexts/AdminAuthContext";
import Dashboard from "./pages/Dashboard";

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

  if (isAuthenticated) return <Dashboard />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-950">DawaiSaver.pk Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Admin or reviewer access required.</p>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1 w-full rounded-md border px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1 w-full rounded-md border px-3 py-2" required />
        </label>
        <button disabled={loading} className="w-full rounded-md bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}

export default App;
