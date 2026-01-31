import Link from 'next/link';
import Image from 'next/image';
import { Hospital, ShieldCheck, LayoutDashboard, Search, Smartphone, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Hospital className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">MediFind</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition shadow-md shadow-emerald-100"
          >
            Launch Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-8 py-20 md:py-32 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center md:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-100">
              <Shield className="w-4 h-4" />
              Enterprise Administration
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Empowering <br />
              <span className="text-emerald-600">Pharmacy Excellence</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
              The next-generation health-tech ecosystem. Oversee pharmacies, monitor global order flows, and ensure medical accessibility with MediFind's core administrative hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start pt-6">
              <Link
                href="/login"
                className="group px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Enter Admin Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#ecosystem"
                className="px-10 py-4 bg-white text-slate-700 font-bold border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition flex items-center justify-center"
              >
                Explore Ecosystem
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="flex-1 relative w-full max-w-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-100/50 rounded-full blur-[120px] -z-10"></div>
            <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
              <Image
                src="/hero.png"
                alt="MediFind Dashboard Analytics"
                width={800}
                height={600}
                className="rounded-2xl shadow-inner w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </header>

      {/* Purpose Section */}
      <section id="ecosystem" className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Unified Health Ecosystem</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">Bridging the gap between pharmacies and patients with enterprise-grade oversight.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Pharmacy Card */}
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all group">
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-200 group-hover:scale-110 transition-transform">
                <Hospital className="text-white w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-6">Pharmacy Partners</h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                Streamline operations with inventory synchronization, real-time order processing, and comprehensive revenue analytics. Verified pharmacies gain instant access to a global patient network.
              </p>
              <ul className="space-y-4 mb-10 text-slate-700 font-bold">
                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Smart Inventory Management</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Priority Fulfillment Routing</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Direct Patient Communication</li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="bg-slate-900 p-12 rounded-[2.5rem] shadow-2xl border border-slate-800 hover:-translate-y-2 transition-all group">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-white w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-white mb-6">System Management</h3>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed font-medium">
                Complete oversight of the MediFind platform. Verify credentials, oversee financial settlements via Paystack, and manage security protocols across the entire medical network.
              </p>
              <ul className="space-y-4 mb-10 text-slate-400 font-bold">
                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Credentials Verification</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Financial Settlement Hub</li>
                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> System-Wide Security Audit</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
              <Hospital className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">MediFind</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">&copy; {new Date().getFullYear()} MediFind Cloud Services. Authorized and Regulated.</p>
        </div>
      </footer>
    </div>
  );
}
