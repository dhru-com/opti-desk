'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Calendar, Phone, MapPin, Hash, Plus, FileText, Receipt, Upload, Image as ImageIcon } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import Link from 'next/link';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Schema['Patient']['type'] | null>(null);
  const [visits, setVisits] = useState<Schema['Visit']['type'][]>([]);
  const [files, setFiles] = useState<Schema['FileRecord']['type'][]>([]);
  const [invoices, setInvoices] = useState<Schema['Invoice']['type'][]>([]);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPatientAndVisits(params.id as string);
      fetchClinicSettings();
    }
  }, [params.id]);

  const fetchClinicSettings = async () => {
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const { data: configs } = await client.models.ClinicSetting.list({
        filter: { workspaceId: { eq: workspaceId } }
      });

      const currencySetting = configs.find(c => c.key === 'currency');
      if (currencySetting?.value) {
        setCurrency(currencySetting.value);
      }
    } catch (error) {
      console.error('Error fetching clinic settings:', error);
    }
  };

  const fetchPatientAndVisits = async (id: string) => {
    try {
      const [patientRes, visitsRes, filesRes, invoicesRes] = await Promise.all([
        client.models.Patient.get({ id }),
        client.models.Visit.list({
          filter: { patientId: { eq: id } }
        }),
        client.models.FileRecord.list({
          filter: { patientId: { eq: id } }
        }),
        client.models.Invoice.list({
          filter: { patientId: { eq: id } }
        })
      ]);
      setPatient(patientRes.data);
      setVisits(visitsRes.data.sort((a, b) => new Date(b.visitAt).getTime() - new Date(a.visitAt).getTime()));
      setFiles(filesRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setInvoices(invoicesRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patient) return;

    setUploading(true);
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const entityId = patient.id;
      const fileName = `${Date.now()}-${file.name}`;
      const s3Path = `reports/${entityId}/${fileName}`;

      await uploadData({
        path: s3Path,
        data: file,
      }).result;

      await client.models.FileRecord.create({
        workspaceId,
        patientId: patient.id,
        name: file.name,
        s3Path: s3Path,
        type: file.type.includes('image') ? 'IMAGE' : 'PDF',
      });

      fetchPatientAndVisits(patient.id);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (!patient) return <div className="p-8 text-center text-gray-500">Patient not found.</div>;

  return (
    <div className="pb-24">
      {/* Header / Info Card */}
      <div className="bg-blue-600 text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-blue-100 opacity-90">{patient.gender}, {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'Age N/A'} yrs</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm bg-white/10 p-2 rounded-lg">
            <Phone size={16} />
            {patient.phone || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/10 p-2 rounded-lg">
            <Hash size={16} />
            {patient.uhid || 'No UHID'}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={`/visits/new?patientId=${patient.id}`}
            className="flex flex-col items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
              <Plus size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-700">Visit</span>
          </Link>
          <Link
            href={`/billing/new?patientId=${patient.id}`}
            className="flex flex-col items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Receipt size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-700">Invoice</span>
          </Link>
          <Link
            href={`/add?type=appointment&patientId=${patient.id}`}
            className="flex flex-col items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm opacity-50 pointer-events-none"
          >
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-700">Appt</span>
          </Link>
        </div>

        {/* Timeline */}
        {/* Combined Clinical Timeline */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <FileText size={20} className="text-gray-400" />
              Clinical Timeline
            </h2>
            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 active:bg-blue-100 cursor-pointer'}`}>
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {[
            ...visits.map(v => ({ type: 'VISIT', date: v.visitAt, data: v })),
            ...invoices.map(i => ({ type: 'INVOICE', date: i.createdAt, data: i })),
            ...files.map(f => ({ type: 'FILE', date: f.createdAt, data: f }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, idx) => (
            <div key={idx} className="relative pl-6 border-l-2 border-gray-100 py-1">
              <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white border-2 border-blue-600"></div>

              {item.type === 'VISIT' && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Clinical Visit</span>
                    <span className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">
                    {(item.data as any).clinicalData?.diagnosis || 'Routine Checkup'}
                  </p>
                  <div className="flex gap-4">
                    <Link href={`/visits/${item.data.id}/prescription`} className="text-xs text-green-600 font-bold">
                      View Rx →
                    </Link>
                  </div>
                </div>
              )}

              {item.type === 'INVOICE' && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Invoice {(item.data as any).invoiceNo}</span>
                    <span className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{currency} {(item.data as any).total.toFixed(2)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${(item.data as any).status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {(item.data as any).status}
                    </span>
                  </div>
                </div>
              )}

              {item.type === 'FILE' && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{(item.data as any).type}</span>
                    <span className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                      {(item.data as any).type === 'IMAGE' ? <ImageIcon size={18} /> : <FileText size={18} />}
                    </div>
                    <button
                      onClick={async () => {
                        const url = await getUrl({ path: (item.data as any).s3Path });
                        window.open(url.url.toString(), '_blank');
                      }}
                      className="text-sm font-bold text-gray-700 truncate flex-1 text-left"
                    >
                      {(item.data as any).name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {visits.length === 0 && invoices.length === 0 && files.length === 0 && (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
              No history found for this patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
