'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from 'signature_pad';

type RequestItem = {
  itemName: string;
  remarks: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
};

type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  department?: { name?: string } | null;
  totalEstimatedAmount?: number | null;
  createdAt: string;
};

export default function PurchaseRequestForm() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);

  // State Form Utama
  const [department, setDepartment] = useState('Departemen Umum');
  const [neededAt, setNeededAt] = useState('');

  // State Items (Baris tabel)
  const [items, setItems] = useState<RequestItem[]>([
    { itemName: '', remarks: '', quantity: 1, unit: 'Pcs', estimatedUnitPrice: 0 },
  ]);

  const [signatureImage, setSignatureImage] = useState('');
  const [signerName, setSignerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalRequest, setTotalRequest] = useState(0);
  const [existingRequests, setExistingRequests] = useState<PurchaseRequest[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Init Signature Pad
  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, { backgroundColor: 'rgb(255,255,255)' });
      setSignaturePad(pad);
    }
  }, [showForm]);

  // Load existing requests
  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setExistingRequests(data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  }

  // Hitung Total Otomatis setiap ada perubahan item
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitPrice), 0);
    setTotalRequest(total);
  }, [items]);

  // Fungsi Update Item
  function updateItem(idx: number, field: keyof RequestItem, value: string | number) {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  }

  // Tambah Baris
  function addItem() {
    setItems([...items, { itemName: '', remarks: '', quantity: 1, unit: 'Pcs', estimatedUnitPrice: 0 }]);
  }

  // Hapus Baris
  function removeItem(idx: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // Ambil tanda tangan
    let finalSignature = signatureImage;
    if (signaturePad && !signaturePad.isEmpty()) {
      finalSignature = signaturePad.toDataURL();
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: `Departemen: ${department}`,
          neededAt: neededAt || undefined,
          items,
          signature: signerName || undefined,
          signatureImage: finalSignature || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menyimpan permintaan');
      }
      const data = await res.json();
      alert('Permintaan Pembelian Berhasil Dibuat!');
      if (data?.id) {
        window.open(`/api/requests/${data.id}/pdf`, '_blank');
      }
      setIsSubmitting(false);
      setShowForm(false);
      loadRequests();
    } catch (err) {
      alert((err as Error).message || 'Terjadi kesalahan');
      setIsSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'PENDING_APPROVAL': return 'Menunggu Persetujuan';
      case 'APPROVED': return 'Disetujui';
      case 'REJECTED': return 'Ditolak';
      case 'NEEDS_REVISION': return 'Perlu Revisi';
      default: return status;
    }
  };

  if (!showForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permintaan Pembelian Saya</h1>
            <p className="mt-1 text-sm text-gray-600">Kelola dan buat permintaan pembelian baru</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Permintaan Baru
          </button>
        </div>

        {/* Request List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {existingRequests.map((req) => (
            <div
              key={req.id}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => router.push(`/api/requests/${req.id}/pdf`)}
            >
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-50 blur-xl transition group-hover:scale-150"></div>
              <div className="relative">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{req.number}</h3>
                      <p className="text-sm text-gray-600">{req.department?.name ?? '-'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Estimasi</span>
                    <span className="font-semibold text-gray-900">
                      Rp {(req.totalEstimatedAmount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tanggal</span>
                    <span className="text-gray-900">
                      {new Date(req.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {existingRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Belum Ada Permintaan</h3>
            <p className="mb-6 text-gray-600">Mulai dengan membuat permintaan pembelian pertama Anda</p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Buat Permintaan Baru
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => setShowForm(false)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar
      </button>

      {/* Form */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">PT Tunas Esta Indonesia</h1>
              <p className="mt-1 text-indigo-100">Formulir Permintaan Pembelian</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold">PERMINTAAN PEMBELIAN</h2>
              <p className="text-xs text-indigo-100">Ref: FR/KN/UM/001/a</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* BAGIAN 1: INFORMASI UMUM */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Informasi Umum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">DEPARTEMEN</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 uppercase"
                  placeholder="Contoh: UMUM"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">TANGGAL DIPERLUKAN</label>
                <input
                  type="date"
                  value={neededAt}
                  onChange={(e) => setNeededAt(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: TABEL BARANG */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Daftar Barang / Jasa</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-green-700 hover:scale-105 transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Baris
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">No</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Barang / Jasa</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Jumlah</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Satuan</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Harga Satuan</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Total</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Keterangan</th>
                      <th className="px-4 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-center text-gray-500 font-medium">{idx + 1}</td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm transition-all duration-200"
                            placeholder="Nama Barang..."
                            value={item.itemName}
                            onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                            required
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full text-right px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                            value={item.estimatedUnitPrice || ''}
                            placeholder="0"
                            onChange={(e) => updateItem(idx, 'estimatedUnitPrice', Number(e.target.value))}
                          />
                        </td>

                        <td className="px-4 py-3 text-right text-sm font-bold text-indigo-600 bg-indigo-50">
                          Rp {(item.quantity * item.estimatedUnitPrice).toLocaleString('id-ID')}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                            placeholder="Merk/Spec..."
                            value={item.remarks}
                            onChange={(e) => updateItem(idx, 'remarks', e.target.value)}
                          />
                        </td>

                        <td className="px-4 py-3">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-800 hover:scale-110 transition-all duration-200"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 flex justify-end">
              <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-white shadow-lg">
                <div className="text-sm font-medium opacity-90">TOTAL ESTIMASI</div>
                <div className="text-3xl font-bold">Rp {totalRequest.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: TANDA TANGAN */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Tanda Tangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pemohon</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanda Tangan Digital</label>
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-2">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-32 rounded-lg"
                    width="400"
                    height="128"
                  />
                </div>
                {signaturePad && (
                  <button
                    type="button"
                    onClick={() => signaturePad.clear()}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Hapus Tanda Tangan
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border-2 border-gray-300 px-8 py-4 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-4 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Download PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
