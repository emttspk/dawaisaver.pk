import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import MedicineSearch from "./pages/MedicineSearch";
import MedicineDetails from "./pages/MedicineDetails";
import PrescriptionUpload from "./pages/PrescriptionUpload";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            DawaiSaver.pk
          </Link>
          <nav className="flex gap-4">
            <Link to="/search" className="text-gray-700 hover:text-primary-600">Search</Link>
            <Link to="/upload" className="text-gray-700 hover:text-primary-600">Upload</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">Dashboard</Link>
            <Link to="/login" className="text-gray-700 hover:text-primary-600">Login</Link>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<MedicineSearch />} />
          <Route path="/medicine/:id" element={<MedicineDetails />} />
          <Route path="/upload" element={<PrescriptionUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;