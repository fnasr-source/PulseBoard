'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-400 text-sm">Loading PulseBoard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center max-w-2xl animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse-glow">
            <BarChart3 className="w-9 h-9 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Welcome to{' '}
          <span className="gradient-text">PulseBoard</span>
        </h1>

        <p className="text-lg text-gray-400 mb-10 leading-relaxed">
          Your mission control for strategic marketing consulting.
          Track KPIs, manage funnels, generate reports, and hold agencies accountable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="px-8 py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold text-sm hover:bg-gray-800/50 hover:border-gray-600 transition-all"
          >
            Create Account
          </a>
        </div>
      </div>

      {/* Features grid */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full animate-fade-in">
        {[
          {
            title: 'KPI Truth',
            desc: 'Single source of truth for all your client KPIs with trust scoring.',
            gradient: 'from-indigo-500/10 to-blue-500/10',
            border: 'border-indigo-500/20',
          },
          {
            title: 'Accountability',
            desc: 'Issue → Decision → Action → Result tracking for every client.',
            gradient: 'from-purple-500/10 to-pink-500/10',
            border: 'border-purple-500/20',
          },
          {
            title: 'Smart Reports',
            desc: 'Auto-generated weekly reports with KPI highlights and trends.',
            gradient: 'from-emerald-500/10 to-teal-500/10',
            border: 'border-emerald-500/20',
          },
        ].map((f) => (
          <div
            key={f.title}
            className={`p-6 rounded-2xl bg-gradient-to-br ${f.gradient} border ${f.border} card-hover`}
          >
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
