'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data';
import { X, FileText, Share2, Plus, Trash2, Save } from 'lucide-react';
import { fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function PrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Schema['Patient']['type'] | null>(null);
  const [visit, setVisit] = useState<Schema['Visit']['type'] | null>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '' });

  useEffect(() => {
    if (visitId) {
      fetchVisitData();
    }
  }, [visitId]);

  const fetchVisitData = async () => {
    try {
      const { data: visitData } = await client.models.Visit.get({ id: visitId });
      if (visitData) {
        setVisit(visitData);
        const { data: patientData } = await client.models.Patient.get({ id: visitData.patientId });
        setPatient(patientData);

        // Fetch existing prescription if any
        const { data: existingRx } = await client.models.Prescription.list({
          filter: { visitId: { eq: visitId } }
        });
        if (existingRx.length > 0) {
          setMedicines(existingRx[0].rxJson as any[]);
        }
      }
    } catch (error) {
      console.error('Error fetching visit/prescription:', error);
    }
  };

  const addMedicine = () => {
    if (!newMed.name) return;
    setMedicines([...medicines, newMed]);
    setNewMed({ name: '', dosage: '', frequency: '', duration: '' });
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId || !visit || !patient) return;

      // Check if prescription already exists
      const { data: existingRx } = await client.models.Prescription.list({
        filter: { visitId: { eq: visitId } }
      });

      let rxId = '';
      if (existingRx.length > 0) {
        rxId = existingRx[0].id;
        await client.models.Prescription.update({
          id: rxId,
          rxJson: medicines
        });
      } else {
        const res = await client.models.Prescription.create({
          workspaceId,
          visitId,
          patientId: patient.id,
          doctorId: attributes.sub || 'unknown',
          rxJson: medicines
        });
        rxId = res.data?.id || '';
      }

      router.push(`/patients/${patient.id}`);
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription.');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = async () => {
    if (!patient || medicines.length === 0) return;
    
    setLoading(true);
    try {
      // Fetch clinic settings for branding
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      let clinicName = 'OptiDesk';
      if (workspaceId) {
        const { data: configs } = await client.models.ClinicSetting.list({
          filter: { workspaceId: { eq: workspaceId } }
        });
        const nameSetting = configs.find(c => c.key === 'clinicName');
        if (nameSetting?.value) clinicName = nameSetting.value;
      }

      // Trigger PDF generation in background
      await client.queries.generatePDF({
        type: 'PRESCRIPTION',
        id: visitId
      });

      let text = `*Prescription from ${clinicName}*\n`;
      text += `*Patient:* ${patient.name}\n`;
      text += `*Date:* ${new Date().toLocaleDateString()}\n\n`;
      
      medicines.forEach((m, i) => {
        text += `${i+1}. *${m.name}*\n   Dosage: ${m.dosage}\n   Frequency: ${m.frequency}\n   Duration: ${m.duration}\n\n`;
      });
      
      text += `_You can download the digital PDF from the link sent via SMS._\n`;
      text += `_Generated via OptiDesk_`;
      
      const url = `https://wa.me/${patient.phone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error in PDF generation/sharing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <button onClick={() => router.back()}><X size={24} /></button>
        <div className="text-center">
          <h1 className="font-bold">Prescription (Rx)</h1>
          <p className="text-xs text-gray-500">{patient?.name || 'Loading...'}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-blue-600 font-bold"
        >
          {loading ? '...' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Medicine Builder */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            Add Medicine
          </h3>
          <div className="space-y-3">
            <input
              placeholder="Medicine Name (e.g. Moxifloxacin)"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
              value={newMed.name}
              onChange={(e) => setNewMed({...newMed, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Dosage (e.g. 1 drop)"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none"
                value={newMed.dosage}
                onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
              />
              <input
                placeholder="Freq (e.g. 4 times/day)"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none"
                value={newMed.frequency}
                onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
              />
            </div>
            <div className="flex gap-3">
              <input
                placeholder="Duration (e.g. 7 days)"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none flex-1"
                value={newMed.duration}
                onChange={(e) => setNewMed({...newMed, duration: e.target.value})}
              />
              <button
                onClick={addMedicine}
                className="bg-blue-600 text-white px-6 rounded-xl font-bold"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Prescription List */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 px-1">
            <FileText size={18} className="text-gray-400" />
            Prescribed Medicines
          </h3>

          {medicines.length > 0 ? (
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{med.name}</h4>
                    <p className="text-sm text-gray-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                  </div>
                  <button
                    onClick={() => removeMedicine(index)}
                    className="text-red-400 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
              No medicines added yet.
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto flex gap-3">
        <button
          className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
          onClick={shareWhatsApp}
        >
          <Share2 size={20} />
          Share
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex-[2] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Rx'}
        </button>
      </div>
    </div>
  );
}
