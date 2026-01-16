'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Building, Globe, CreditCard, Type, Image as ImageIcon } from 'lucide-react';
import { client } from '@/lib/amplifyClient';
import type { Schema } from '@/../amplify/data/resource';
import { fetchUserAttributes } from 'aws-amplify/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('');

  const [settings, setSettings] = useState({
    clinicName: '',
    address: '',
    phone: '',
    currency: 'INR',
    pdfHeader: '',
    pdfFooter: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const attributes = await fetchUserAttributes();
      const wsId = attributes['custom:workspace_id'];
      if (!wsId) return;
      setWorkspaceId(wsId);

      const { data: configs } = await client.models.ClinicSetting.list({
        filter: { workspaceId: { eq: wsId } }
      });

      const newSettings = { ...settings };
      configs.forEach(c => {
        if (c.key in newSettings) {
          (newSettings as any)[c.key] = c.value;
        }
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys = Object.keys(settings);

      await Promise.all(keys.map(async (key) => {
        const value = (settings as any)[key];

        // Find existing setting
        const { data: existing } = await client.models.ClinicSetting.list({
          filter: {
            workspaceId: { eq: workspaceId },
            key: { eq: key }
          }
        });

        if (existing.length > 0) {
          await client.models.ClinicSetting.update({
            id: existing[0].id,
            value: value
          });
        } else {
          await client.models.ClinicSetting.create({
            workspaceId,
            key,
            value
          });
        }
      }));

      alert('Settings saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-0 z-10 flex justify-between items-center">
        <button onClick={() => router.back()}><X size={24} /></button>
        <h1 className="font-bold text-lg">Clinic Settings</h1>
        <button
          disabled={saving}
          onClick={handleSave}
          className="text-blue-600 font-bold"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Building size={14} /> Basic Information
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Clinic Name</label>
              <input
                className="w-full mt-1 outline-none font-medium text-gray-900"
                placeholder="Vision Eye Care"
                value={settings.clinicName}
                onChange={(e) => setSettings({...settings, clinicName: e.target.value})}
              />
            </div>
            <div className="p-4 border-b border-gray-50">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
              <input
                className="w-full mt-1 outline-none font-medium text-gray-900"
                placeholder="+91 9876543210"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
              />
            </div>
            <div className="p-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Address</label>
              <textarea
                className="w-full mt-1 outline-none font-medium text-gray-900 resize-none"
                placeholder="123 Clinic St, City"
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Globe size={14} /> Localization
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Currency Symbol/Code</label>
            <div className="flex items-center gap-3 mt-1">
              <CreditCard size={18} className="text-gray-400" />
              <input
                className="w-full outline-none font-medium text-gray-900"
                placeholder="INR or $"
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* PDF Customization */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Type size={14} /> Prescription/Invoice Layout
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                <ImageIcon size={12} /> Custom Header Text
              </label>
              <textarea
                className="w-full mt-1 outline-none font-medium text-gray-900 resize-none"
                placeholder="Dr. Smith, MBBS, MS (Ophthal)&#10;Consultant Ophthalmologist"
                rows={3}
                value={settings.pdfHeader}
                onChange={(e) => setSettings({...settings, pdfHeader: e.target.value})}
              />
            </div>
            <div className="p-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Footer / Terms</label>
              <textarea
                className="w-full mt-1 outline-none font-medium text-gray-900 resize-none"
                placeholder="Valid for 7 days. Please follow up on scheduled date."
                rows={2}
                value={settings.pdfFooter}
                onChange={(e) => setSettings({...settings, pdfFooter: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-800 text-xs">
          <p className="font-bold mb-1">Preview</p>
          <p>These details will appear on all digital prescriptions and invoices shared with patients.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
