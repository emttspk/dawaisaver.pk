import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Upload, FileText, Shield, Clock, Users, HelpCircle, Phone, Mail, MapPin } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">DS</div>
            <span className="text-xl font-bold text-slate-900">DawaiSaver.pk</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <a href="#how-it-works" className="text-slate-600 hover:text-emerald-700">How It Works</a>
            <a href="#savings" className="text-slate-600 hover:text-emerald-700">Savings</a>
            <a href="#features" className="text-slate-600 hover:text-emerald-700">Features</a>
            <a href="#faq" className="text-slate-600 hover:text-emerald-700">FAQ</a>
            <Link to="/search" className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">Search Medicines</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Save Money on Medicines in Pakistan
                </h1>
                <p className="text-lg text-slate-600">
                  Compare prices across pharmacies and find cheaper generic alternatives. Save up to 80% on your monthly prescriptions.
                </p>
                <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search medicine or upload prescription"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 h-14 text-base outline-none ring-emerald-500/20 focus:ring-4"
                    />
                  </div>
                  <button className="rounded-xl bg-emerald-600 px-6 h-14 font-semibold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700">
                    Find Cheapest Price
                  </button>
                </form>
                <div className="flex gap-4 text-sm">
                  <Link to="/prescription/upload" className="flex items-center gap-2 text-emerald-700 font-medium hover:underline">
                    <Upload className="h-4 w-4" /> Upload Prescription
                  </Link>
                  <Link to="/prescription/text" className="flex items-center gap-2 text-emerald-700 font-medium hover:underline">
                    <FileText className="h-4 w-4" /> Enter Text
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1584308668378-3785c4c2b63d?w=600&h=400&fit=crop&crop=faces" alt="Medicines" className="rounded-2xl shadow-2xl w-full" />
                <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-4 shadow-lg">
                  <p className="text-xs text-slate-500">Starting at</p>
                  <p className="text-2xl font-bold text-emerald-700">Rs. 5.99</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">How It Works</h2>
              <p className="text-slate-600">Get your prescription reviewed and find the cheapest options in 3 simple steps.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-lg">Upload or Enter Prescription</h3>
                <p className="text-slate-500">Take a photo or type your medicine names manually</p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <HelpCircle className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-lg">Review & Compare</h3>
                <p className="text-slate-500">See equivalent generics and compare prices across pharmacies</p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-lg">Save Money Safely</h3>
                <p className="text-slate-500">Get safety alerts and choose the cheapest verified option</p>
              </div>
            </div>
          </div>
        </section>

        <section id="savings" className="bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Real Savings Examples</h2>
              <p className="text-slate-600">See how much people save by switching to generic alternatives</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:max-w-4xl mx-auto">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-500">Before DawaiSaver.pk</p>
                <p className="text-2xl font-bold text-red-600 mt-1">Rs. 2,450</p>
                <p className="text-sm text-slate-500 mt-1">Brand name: Calpol 500mg (24 tablets)</p>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-medium text-emerald-600">After DawaiSaver.pk</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">Rs. 149</p>
                <p className="text-sm text-emerald-600 mt-1">Generic: Paracetamol 500mg (24 tablets) - 94% savings!</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:max-w-4xl mx-auto">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-500">Before DawaiSaver.pk</p>
                <p className="text-2xl font-bold text-red-600 mt-1">Rs. 5,800</p>
                <p className="text-sm text-slate-500 mt-1">Brand name: Augmentin 625mg (15 capsules)</p>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-medium text-emerald-600">After DawaiSaver.pk</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">Rs. 890</p>
                <p className="text-sm text-emerald-600 mt-1">Generic: Amoxicillin 625mg (15 capsules) - 85% savings!</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Our Features</h2>
              <p className="text-slate-600">Everything you need to save on your medicines</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="font-semibold mb-2">Prescription Scan</h3>
                <p className="text-sm text-slate-500">Upload photos of your prescriptions and get instant analysis</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-teal-700" />
                </div>
                <h3 className="font-semibold mb-2">Medicine Comparison</h3>
                <p className="text-sm text-slate-500">Compare prices and availability across multiple pharmacies</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-cyan-700" />
                </div>
                <h3 className="font-semibold mb-2">Generic Alternatives</h3>
                <p className="text-sm text-slate-500">Find safe generic equivalents that cost significantly less</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <HelpCircle className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-semibold mb-2">Medicine Information</h3>
                <p className="text-sm text-slate-500">Access detailed information about your medications</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-indigo-700" />
                </div>
                <h3 className="font-semibold mb-2">Price Tracking</h3>
                <p className="text-sm text-slate-500">Monitor price changes and get alerts for better deals</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-700" />
                </div>
                <h3 className="font-semibold mb-2">Verified Sources</h3>
                <p className="text-sm text-slate-500">All data sourced from DRAP registered pharmacies</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 text-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center space-y-4">
              <h2 className="text-3xl font-bold sm:text-4xl">Trusted by Patients Across Pakistan</h2>
              <p className="text-slate-300">DRAP registered data • Privacy protected • Verified sources</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-emerald-400">50,000+</div>
                <p className="text-slate-300">Prescriptions Reviewed</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-emerald-400">Rs. 2.5M+</div>
                <p className="text-slate-300">Total Savings Generated</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-emerald-400">200+</div>
                <p className="text-slate-300">Partner Pharmacies</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Frequently Asked Questions</h2>
              <p className="text-slate-600">Everything you need to know about DawaiSaver.pk</p>
            </div>
            <div className="mt-12 max-w-3xl mx-auto space-y-4">
              {[
                { q: "Is DawaiSaver.pk free to use?", a: "Yes, our service is completely free for patients. We may earn a small commission from pharmacy partners, but this never affects the prices you see." },
                { q: "Are generic medicines safe alternatives?", a: "Absolutely. Generic medicines contain the same active ingredients and are regulated by DRAP. They meet the same safety and efficacy standards as brand-name drugs." },
                { q: "How accurate is the prescription OCR?", a: "Our OCR technology is 95% accurate for standard prescriptions. We always recommend reviewing the extracted text before proceeding." },
                { q: "Can I trust the prices shown?", a: "All prices are sourced directly from DRAP-registered pharmacies. We verify each price point regularly to ensure accuracy." },
              ].map((item) => (
                <details key={item.q} className="rounded-lg border border-slate-200 p-4">
                  <summary className="font-semibold cursor-pointer">{item.q}</summary>
                  <p className="mt-2 text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-slate-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">DS</div>
                  <span className="font-bold">DawaiSaver.pk</span>
                </div>
                <p className="text-sm text-slate-500">Saving lives through affordable medicines.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quick Links</h4>
                <ul className="space-y-1 text-sm text-slate-500">
                  <li><a href="#how-it-works" className="hover:text-emerald-700">How It Works</a></li>
                  <li><a href="#savings" className="hover:text-emerald-700">Savings</a></li>
                  <li><a href="#features" className="hover:text-emerald-700">Features</a></li>
                  <li><a href="#faq" className="hover:text-emerald-700">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Contact</h4>
                <ul className="space-y-1 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@dawaisaver.pk</li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +92 300 1234567</li>
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Lahore, Pakistan</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Legal</h4>
                <ul className="space-y-1 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-emerald-700">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-emerald-700">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-emerald-700">DRAP Compliance</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-4 text-center text-sm text-slate-400">
              <p>© 2026 DawaiSaver.pk. All rights reserved. Medicine intelligence only. Confirm changes with a licensed professional.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}