'use client';

import { Shield, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full">
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-2xl font-bold">Staff Management</h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
        <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
          <Shield size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
          <p className="text-gray-500">
            Staff management features are currently under development.
          </p>
        </div>
      </div>
    </div>
  );
}
