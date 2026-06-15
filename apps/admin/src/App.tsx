import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <AdminAuthProvider>
      <Dashboard />
    </AdminAuthProvider>
  );
}

export default App;