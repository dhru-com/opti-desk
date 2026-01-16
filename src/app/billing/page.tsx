'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Receipt, Search, Plus, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Schema['Invoice']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    fetchInvoices();
    fetchClinicSettings();
  }, []);

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

  const fetchInvoices = async () => {
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const { data: items } = await client.models.Invoice.list({
        filter: { workspaceId: { eq: workspaceId } }
      });

      // Fetch patient names for each invoice
      const invoicesWithPatients = await Promise.all(items.map(async (inv) => {
        const { data: patient } = await client.models.Patient.get({ id: inv.patientId });
        return { ...inv, patientName: patient?.name || 'Unknown' };
      }));

      setInvoices(invoicesWithPatients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    (inv as any).patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNo.includes(searchTerm)
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Link
          href="/billing/new"
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg"
        >
          <Plus size={24} />
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by patient or invoice #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading invoices...</div>
        ) : filteredInvoices.length > 0 ? (
          <div className="space-y-3">
            {filteredInvoices.map(inv => (
              <div key={inv.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{(inv as any).patientName}</h3>
                    <p className="text-xs text-gray-500">{inv.invoiceNo} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{currency} {inv.total.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Receipt className="mx-auto text-gray-200 mb-4" size={56} />
            <p className="text-gray-500 font-medium">No invoices found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
