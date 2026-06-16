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
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Invalid admin credentials.");
    }
  };

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">DawaiSaver.pk Admin</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="mt-1 w-full px-3 py-2 border rounded"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-1 w-full px-3 py-2 border rounded"
            required
          />
        </label>
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login
        </button>
      </form>
    </main>
  );
}

export default App;
