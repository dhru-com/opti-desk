'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Save, Plus, Trash2, Search, User } from 'lucide-react';
import { client } from '@/lib/amplifyClient';
import type { Schema } from '@/../amplify/data/resource';
import { fetchUserAttributes } from 'aws-amplify/auth';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');
  const visitId = searchParams.get('visitId');

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Schema['Patient']['type'][]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Schema['Patient']['type'] | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(!patientIdFromUrl);
  const [searchTerm, setSearchTerm] = useState('');

  const [items, setItems] = useState<any[]>([{ title: 'Consultation', qty: 1, price: 500, amount: 500 }]);
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    fetchClinicSettings();
    if (patientIdFromUrl) {
      client.models.Patient.get({ id: patientIdFromUrl }).then(({ data }) => setSelectedPatient(data));
    }
  }, [patientIdFromUrl]);

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

  const fetchPatients = async (term: string) => {
    if (term.length < 2) return;
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const { data } = await client.models.Patient.list({
        filter: { 
          workspaceId: { eq: workspaceId },
          name: { contains: term }
        }
      });
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { title: '', qty: 1, price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'qty' || field === 'price') {
      newItems[index].amount = newItems[index].qty * newItems[index].price;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.05; // 5% GST placeholder
  const total = subtotal + tax;

  const handleSave = async (status: 'PENDING' | 'PAID') => {
    if (!selectedPatient) return alert('Please select a patient');
    setLoading(true);
    try {
      const attributes = await fetchUserAttributes();
      const workspaceId = attributes['custom:workspace_id'];
      if (!workspaceId) return;

      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

      const res = await client.models.Invoice.create({
        workspaceId,
        patientId: selectedPatient.id,
        visitId: visitId || undefined,
        invoiceNo,
        currency,
        subtotal,
        tax,
        total,
        status,
        items,
      });

      if (status === 'PAID') {
        // Trigger PDF generation in background
        await client.queries.generatePDF({
          type: 'INVOICE',
          id: res.data?.id || ''
        });
      }

      router.push('/billing');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <div className="bg-white p-4 border-b sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <button onClick={() => router.back()}><X size={24} /></button>
        <h1 className="font-bold">New Invoice</h1>
        <div className="w-6"></div>
      </div>

      <div className="p-4 space-y-6">
        {/* Patient Selection */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            Patient
          </h3>
          
          {selectedPatient ? (
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div>
                <p className="font-bold text-blue-900">{selectedPatient.name}</p>
                <p className="text-xs text-blue-700">{selectedPatient.phone}</p>
              </div>
              {!patientIdFromUrl && (
                <button onClick={() => setSelectedPatient(null)} className="text-blue-600 text-xs font-bold underline">Change</button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  placeholder="Search patient name..."
                  className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    fetchPatients(e.target.value);
                  }}
                />
              </div>
              {patients.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {patients.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 text-sm"
                    >
                      {p.name} ({p.phone})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Services / Items</h3>
            <button onClick={addItem} className="text-blue-600 text-sm font-bold flex items-center gap-1">
              <Plus size={16} /> Add
            </button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex justify-between gap-2">
                  <input 
                    placeholder="Item title"
                    className="flex-1 bg-gray-50 p-2 rounded-lg text-sm outline-none"
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                  />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(index)} className="text-red-400 p-1">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">QTY</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-50 p-2 rounded-lg text-sm outline-none"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">PRICE</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-50 p-2 rounded-lg text-sm outline-none"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">AMOUNT</label>
                    <div className="w-full bg-gray-100 p-2 rounded-lg text-sm text-gray-500 font-bold">
                      {item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{currency} {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax (5% GST)</span>
            <span>{currency} {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
            <span>Total Amount</span>
            <span>{currency} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto flex gap-3">
        <button 
          onClick={() => handleSave('PENDING')}
          disabled={loading}
          className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-sm"
        >
          Draft
        </button>
        <button 
          onClick={() => handleSave('PAID')}
          disabled={loading}
          className={`flex-[2] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-green-400' : 'bg-green-600'}`}
        >
          <Save size={20} />
          {loading ? 'Processing...' : 'Mark as Paid'}
        </button>
      </div>
    </div>
  );
}
