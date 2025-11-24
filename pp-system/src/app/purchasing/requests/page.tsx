'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// --- Tipe Data Sesuai Backend ---
type Vendor = {
  id: number;
  name: string;
  contact?: string;
};

type RequestItem = {
  id: number;
  description: string; // atau itemName tergantung isi DB
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
};

type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  totalEstimatedAmount?: number | null;
  createdAt: string;
  requester?: { name: string };
  department?: { name: string };
  items: RequestItem[];
};

// --- Komponen Utama ---
export default function PurchasingPage() {
  const router = useRouter();
  
  // State Data
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Processing
  const [selectedReq, setSelectedReq] = useState<PurchaseRequest | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State User
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  // 1. Bootstrap & Load Data
  useEffect(() => {
    async function init() {
      try {
        // Cek Auth
        const authRes = await fetch('/api/auth/me');
        if (authRes.status === 401) {
          router.push('/login');
          return;
        }
        const userData = await authRes.json();
        setUser(userData);

        // Load Requests & Vendors
        await loadData();
      } catch (err) {
        console.error("Gagal memuat data", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function loadData() {
    // Fetch Vendors
    const resVendors = await fetch('/api/vendors');
    const dataVendors = await resVendors.json();
    setVendors(dataVendors);

    // Fetch Requests (Ambil semua dulu, filter di client karena API terbatas)
    const resReq = await fetch('/api/requests');
    const dataReq = await resReq.json();
    
    // FILTER PENTING: Hanya tampilkan yang sudah diapprove Direktur/Manajer
    // Atau yang sedang dalam review purchasing
    const filtered = dataReq.filter((r: PurchaseRequest) => 
      r.status === 'APPROVED' || 
      r.status === 'PURCHASING_REVIEW'
    );
    
    setRequests(filtered);
  }

  // 2. Handle Submit PO
  async function handleSubmitPO(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReq || !selectedVendorId || !finalAmount) return;

    setIsSubmitting(true);
    try {
      const payload = {
        vendorId: Number(selectedVendorId),
        totalFinalAmount: Number(finalAmount),
        createPO: true, // Flag untuk generate nomor PO
      };

      const res = await fetch(`/api/requests/${selectedReq.id}/purchasing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal membuat PO');

      alert("Purchase Order Berhasil Dibuat!");
      closeModal();
      await loadData(); // Reload data tabel
    } catch (error) {
      alert("Terjadi kesalahan saat memproses PO.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModal(req: PurchaseRequest) {
    setSelectedReq(req);
    // Jika user edit request yg sudah ada di purchasing review, bisa pre-fill disini
    setSelectedVendorId('');
    // Default total final = total estimasi (untuk memudahkan edit)
    setFinalAmount(req.totalEstimatedAmount ? req.totalEstimatedAmount.toString() : '');
  }

  function closeModal() {
    setSelectedReq(null);
    setSelectedVendorId('');
    setFinalAmount('');
  }

  // Helper Warna Status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PURCHASING_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat Data Purchasing...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard Purchasing</h1>
          <p className="text-sm text-gray-500">Kelola Permintaan & Pembuatan PO</p>
        </div>
        <div className="text-right text-sm">
          <p>Petugas: <span className="font-semibold">{user?.name}</span></p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TABEL REQUEST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Daftar Permintaan Masuk (Approved)</h2>
            <button onClick={loadData} className="text-sm text-blue-600 hover:underline">Refresh Data</button>
          </div>

          {requests.length === 0 ? (
             <div className="p-12 text-center text-gray-500">
                <p className="mb-2">Tidak ada permintaan yang perlu diproses saat ini.</p>
                <p className="text-xs">(Pastikan Manager/Direktur sudah menyetujui permintaan)</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No. Request</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Departemen</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pemohon</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Harga</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{r.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.department?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.requester?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        Rp {(r.totalEstimatedAmount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openModal(r)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors shadow-sm"
                        >
                          Proses PO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PROSES PO */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">Buat Purchase Order (PO)</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                 &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Detail Barang */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Barang yang diminta:</h4>
                <ul className="space-y-2">
                  {selectedReq.items.map((item, i) => (
                    <li key={i} className="text-sm flex justify-between border-b border-gray-200 pb-1 last:border-0">
                      <span>{item.description} <span className="text-gray-500">({item.quantity} {item.unit})</span></span>
                      <span className="font-mono">~Rp {((item.estimatedUnitPrice || 0) * item.quantity).toLocaleString('id-ID')}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-right text-sm font-bold text-gray-600">
                  Total Estimasi: Rp {(selectedReq.totalEstimatedAmount || 0).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Form Input PO */}
              <form id="po-form" onSubmit={handleSubmitPO} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Vendor Supplier</label>
                  <select
                    required
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  >
                    <option value="">-- Pilih Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Vendor belum ada? Tambahkan di menu Master Vendor.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Final (Deal dengan Vendor)</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">Rp</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={finalAmount}
                      onChange={(e) => setFinalAmount(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan total harga akhir setelah negosiasi (termasuk pajak/diskon jika ada).
                  </p>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                form="po-form"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Generate PO'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}