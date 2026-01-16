'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { X, Save, Eye, Activity, ClipboardList, Stethoscope } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function VisitEMRPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Schema['Patient']['type'] | null>(null);
  const [activeTab, setActiveTab] = useState('vision');
  
  const [clinicalData, setClinicalData] = useState<any>({
    chiefComplaint: '',
    vision: { od: '', os: '' },
    iop: { od: '', os: '' },
    slitLamp: '',
    fundus: '',
    diagnosis: '',
    advice: '',
  });

  useEffect(() => {
    if (patientId) {
      client.models.Patient.get({ id: patientId }).then(({ data }) => setPatient(data));
    }
    // Load draft if exists
    const draft = localStorage.getItem(`draft_visit_${patientId}`);
    if (draft) {
      try {
        setClinicalData(JSON.parse(draft));
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId && clinicalData) {
      localStorage.setItem(`draft_visit_${patientId}`, JSON.stringify(clinicalData));
    }
  }, [clinicalData, patientId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      
      if (!workspaceId || !patientId) return;

      const appointmentId = searchParams.get('appointmentId');

      const visit = await client.models.Visit.create({
        workspaceId,
        patientId,
        doctorId: attributes.sub || 'unknown',
        appointmentId: appointmentId || undefined,
        visitAt: new Date().toISOString(),
        status: 'COMPLETED',
        clinicalData,
      });

      if (appointmentId) {
        await client.models.Appointment.update({
          id: appointmentId,
          status: 'COMPLETED'
        });
      }

      // Clear draft
      localStorage.removeItem(`draft_visit_${patientId}`);

      router.push(`/visits/${visit.data?.id}/prescription`);
    } catch (error) {
      console.error('Error saving visit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-0 z-10 flex justify-between items-center">
        <button onClick={() => router.back()}><X size={24} /></button>
        <div className="text-center">
          <h1 className="font-bold">Clinical Visit</h1>
          <p className="text-xs text-gray-500">{patient?.name || 'Loading...'}</p>
        </div>
        <button 
          disabled={loading}
          onClick={handleSave}
          className="text-blue-600 font-bold"
        >
          {loading ? '...' : 'Done'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto bg-white border-b sticky top-[65px] z-10 no-scrollbar">
        {[
          { id: 'vision', label: 'Vision/IOP', icon: Eye },
          { id: 'exam', label: 'Exam', icon: Stethoscope },
          { id: 'dx', label: 'Diagnosis', icon: Activity },
          { id: 'advice', label: 'Advice', icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'vision' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-700">Vision (VA)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold ml-1">OD (Right)</label>
                  <input 
                    placeholder="6/6"
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                    value={clinicalData.vision.od}
                    onChange={(e) => setClinicalData({...clinicalData, vision: {...clinicalData.vision, od: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold ml-1">OS (Left)</label>
                  <input 
                    placeholder="6/6"
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                    value={clinicalData.vision.os}
                    onChange={(e) => setClinicalData({...clinicalData, vision: {...clinicalData.vision, os: e.target.value}})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-700">IOP (Pressure)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold ml-1">OD</label>
                  <input 
                    placeholder="15 mmHg"
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                    value={clinicalData.iop.od}
                    onChange={(e) => setClinicalData({...clinicalData, iop: {...clinicalData.iop, od: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold ml-1">OS</label>
                  <input 
                    placeholder="15 mmHg"
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                    value={clinicalData.iop.os}
                    onChange={(e) => setClinicalData({...clinicalData, iop: {...clinicalData.iop, os: e.target.value}})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exam' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-700">Slit Lamp Examination</h3>
              <textarea 
                rows={4}
                placeholder="Notes on Cornea, Lens, Anterior Chamber..."
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                value={clinicalData.slitLamp}
                onChange={(e) => setClinicalData({...clinicalData, slitLamp: e.target.value})}
              />
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-700">Fundus Examination</h3>
              <textarea 
                rows={4}
                placeholder="Notes on Retina, Optic Nerve, Macula..."
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                value={clinicalData.fundus}
                onChange={(e) => setClinicalData({...clinicalData, fundus: e.target.value})}
              />
            </div>
          </div>
        )}

        {activeTab === 'dx' && (
          <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-gray-100">
            <h3 className="font-bold text-gray-700">Diagnosis / Impressions</h3>
            <textarea 
              rows={6}
              placeholder="Primary Diagnosis & Notes..."
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              value={clinicalData.diagnosis}
              onChange={(e) => setClinicalData({...clinicalData, diagnosis: e.target.value})}
            />
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-gray-100">
            <h3 className="font-bold text-gray-700">Advice & Plan</h3>
            <textarea 
              rows={6}
              placeholder="Treatment plan, medicines, follow-up..."
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              value={clinicalData.advice}
              onChange={(e) => setClinicalData({...clinicalData, advice: e.target.value})}
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
         <button 
           onClick={handleSave}
           disabled={loading}
           className={`w-full text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
         >
           <Save size={20} />
           {loading ? 'Saving Visit...' : 'Save Visit'}
         </button>
      </div>
    </div>
  );
}
