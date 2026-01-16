'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Save, User, Phone, Calendar, MapPin, Hash } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function AddPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('patient');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Other',
    city: '',
    uhid: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeType !== 'patient') return;
    setLoading(true);
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];

      if (!workspaceId) {
        throw new Error('Workspace ID not found in user attributes');
      }

      await client.models.Patient.create({
        workspaceId,
        name: formData.name,
        phone: formData.phone || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender,
        city: formData.city || undefined,
        uhid: formData.uhid || undefined,
      });

      router.push('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Failed to save patient. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="flex justify-between items-center p-4 border-b">
        <button onClick={() => router.back()} className="text-gray-500">
          <X size={24} />
        </button>
        <h1 className="text-xl font-bold">Quick Actions</h1>
        <div className="w-6"></div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {[
          { id: 'patient', label: 'New Patient', icon: User, color: 'bg-blue-100 text-blue-600' },
          { id: 'visit', label: 'Start Visit', icon: Calendar, color: 'bg-green-100 text-green-600', href: '/patients' },
          { id: 'invoice', label: 'New Invoice', icon: Hash, color: 'bg-purple-100 text-purple-600', href: '/billing/new' },
        ].map((item) => (
          item.href ? (
            <Link key={item.id} href={item.href} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50">
              <div className={`${item.color} p-3 rounded-xl`}><item.icon size={24} /></div>
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </Link>
          ) : (
            <button 
              key={item.id} 
              onClick={() => setActiveType(item.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${activeType === item.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 shadow-sm active:bg-gray-50'}`}
            >
              <div className={`${item.color} p-3 rounded-xl`}><item.icon size={24} /></div>
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </button>
          )
        ))}
      </div>

      {activeType === 'patient' && (
        <form id="patient-form" onSubmit={handleSubmit} className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-4">
            <h2 className="font-bold text-gray-400 text-xs uppercase tracking-widest ml-1">Patient Details</h2>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="text-gray-400" size={20} />
              <input 
                required
                placeholder="Full Name"
                className="bg-transparent w-full outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            {/* ... rest of the form ... */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone className="text-gray-400" size={20} />
              <input 
                placeholder="Phone Number"
                className="bg-transparent w-full outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="text-gray-400" size={20} />
              <input 
                type="date"
                className="bg-transparent w-full outline-none"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
              />
            </div>

            <div className="flex gap-4 p-1">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({...formData, gender: g})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.gender === g 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="text-gray-400" size={20} />
              <input 
                placeholder="City"
                className="bg-transparent w-full outline-none"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Hash className="text-gray-400" size={20} />
              <input 
                placeholder="UHID (Optional)"
                className="bg-transparent w-full outline-none"
                value={formData.uhid}
                onChange={(e) => setFormData({...formData, uhid: e.target.value})}
              />
            </div>
          </div>

          <p className="text-xs text-center text-gray-400">
            All records are securely stored and encrypted.
          </p>
          
          <div className="pb-20">
            <button 
              type="submit"
              disabled={loading}
              className={`w-full text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
