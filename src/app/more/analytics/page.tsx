'use client';

import { BarChart3, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full">
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
          <BarChart3 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
          <p className="text-gray-500">
            We're working on advanced analytics and insights for your clinic.
          </p>
        </div>
      </div>
    </div>
  );
}
