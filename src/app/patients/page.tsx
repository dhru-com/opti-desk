'use client';

import { Search, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Schema['Patient']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      
      if (workspaceId) {
        const { data: items } = await client.models.Patient.list({
          filter: {
            workspaceId: { eq: workspaceId }
          }
        });
        setPatients(items);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link 
          href="/add" 
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg"
        >
          <Plus size={24} />
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Search name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading patients...</div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map(patient => (
            <Link 
              key={patient.id} 
              href={`/patients/${patient.id}`}
              className="block bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-500">{patient.phone || 'No phone'}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'No patients match your search.' : 'No patients found. Add your first patient!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
