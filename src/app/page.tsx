'use client';

import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function TodayPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
//
  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: appts } = await client.models.Appointment.list({
        filter: {
          workspaceId: { eq: workspaceId },
          startAt: { between: [startOfDay.toISOString(), endOfDay.toISOString()] }
        }
      });

      // Fetch patient names for each appointment
      const apptsWithPatients = await Promise.all(appts.map(async (appt) => {
        const { data: patient } = await client.models.Patient.get({ id: appt.patientId });
        return { ...appt, patientName: patient?.name || 'Unknown' };
      }));

      setAppointments(apptsWithPatients);
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'COMPLETED' | 'NO_SHOW' | 'SCHEDULED') => {
    try {
      await client.models.Appointment.update({ id, status });
      fetchTodayData(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-gray-500">{todayStr}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-blue-600 font-bold text-3xl">{appointments.length}</p>
          <p className="text-blue-800 text-sm font-medium">Appointments</p>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
          <p className="text-green-600 font-bold text-3xl">{completedCount}</p>
          <p className="text-green-800 text-sm font-medium">Completed</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={20} className="text-gray-400" />
          Queue
        </h2>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading queue...</div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map(appt => (
              <div key={appt.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{appt.patientName}</h3>
                      <p className="text-xs text-gray-500">{new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.reason || 'Routine Checkup'}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    appt.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {appt.status}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/visits/new?patientId=${appt.patientId}&appointmentId=${appt.id}`}
                    className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg text-center"
                  >
                    Start Visit
                  </Link>
                  {appt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'NO_SHOW')}
                      className="px-3 border border-gray-200 text-gray-500 text-xs font-bold py-2 rounded-lg"
                    >
                      No-Show
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Calendar className="mx-auto text-gray-200 mb-4" size={56} />
            <p className="text-gray-500 font-medium">No appointments for today.</p>
            <Link href="/patients" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md">
              Schedule Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
