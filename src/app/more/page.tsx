'use client';

import { Settings, LogOut, User, Building, Shield, HelpCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

const client = generateClient<Schema>();

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showClinicProfile, setShowClinicProfile] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetchUserAttributes().then(setUser);
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data } = await client.models.UsageMeter.list({
        filter: {
          workspaceId: { eq: workspaceId },
          monthYear: { eq: currentMonth }
        }
      });

      if (data.length > 0) {
        setUsage(data[0]);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (showClinicProfile) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowClinicProfile(false)} className="p-2 bg-gray-100 rounded-full">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Clinic Profile</h1>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Clinic Name</label>
            <p className="font-medium text-gray-900">Vision Eye Care Centre</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Primary Doctor</label>
            <p className="font-medium text-gray-900">{user?.name || 'Dr. Smith'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Workspace ID</label>
            <p className="font-mono text-xs text-blue-600 font-bold">{user?.['custom:workspace_id']}</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-800 text-sm">
          <p className="font-bold mb-1">Clinic Management</p>
          <p>These settings are managed by the Clinic Owner. To update your clinic name or subscription, please contact support.</p>
        </div>

        <button 
          onClick={() => router.push('/settings')}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <Settings size={20} />
          Edit Clinic Settings
        </button>
      </div>
    )
  }

  if (showUsage) {
    const limits = { patients: 500, visits: 1000, invoices: 200 };
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowUsage(false)} className="p-2 bg-gray-100 rounded-full">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Usage Meter</h1>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Patients', current: usage?.patientCount || 0, max: limits.patients, color: 'bg-blue-600' },
            { label: 'Visits', current: usage?.visitCount || 0, max: limits.visits, color: 'bg-green-600' },
            { label: 'Invoices', current: usage?.invoiceCount || 0, max: limits.invoices, color: 'bg-purple-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-700">{item.label}</span>
                <span className="text-xs text-gray-400 font-bold">{item.current} / {item.max}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-500`}
                  style={{ width: `${Math.min(100, (item.current / item.max) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-orange-800 text-sm">
          <p className="font-bold mb-1">Trial Plan</p>
          <p>You are currently on the trial plan. Limits reset every month. Upgrade to Pro for unlimited records.</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { title: 'Clinic Profile', icon: Building, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Insights', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Staff Management', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Usage & Billing', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'My Profile', icon: User, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
    { title: 'Help & Support', icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">More</h1>

      {/* User Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="bg-blue-600 text-white p-4 rounded-2xl font-bold text-xl">
          {user?.name?.[0] || user?.email?.[0] || 'U'}
        </div>
        <div>
          <h2 className="font-bold text-lg text-gray-900">{user?.name || 'Doctor'}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
            {user?.['custom:role'] || 'Admin'} • ID: {user?.['custom:workspace_id']}
          </p>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              if (item.title === 'Clinic Profile') setShowClinicProfile(true);
              if (item.title === 'Usage & Billing') setShowUsage(true);
              if (item.title === 'Settings') router.push('/settings');
              if (item.title === 'Staff Management') router.push('/more/staff');
              if (item.title === 'Insights') router.push('/more/analytics');
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className={`${item.bg} ${item.color} p-2 rounded-xl`}>
                <item.icon size={20} />
              </div>
              <span className="font-medium text-gray-700">{item.title}</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
      >
        <LogOut size={20} />
        Logout
      </button>

      <p className="text-center text-xs text-gray-400 pt-4">
        OptiDesk v0.1.0 • Built for Ophthalmology
      </p>
    </div>
  );
}
