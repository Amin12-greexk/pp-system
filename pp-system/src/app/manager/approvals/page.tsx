// Halaman persetujuan manajer/direktur dengan tanda tangan digital
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from 'signature_pad';

type Item = {
  description: string;
  remarks?: string | null;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number | null;
};

type RequestData = {
  id: number;
  number: string;
  status: string;
  purpose?: string | null;
  neededAt?: string | null;
  createdAt: string;
  requester?: { name: string };
  department?: { name: string };
  items: Item[];
  totalEstimatedAmount?: number | null;
};

export default function ApprovalsPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [selected, setSelected] = useState<RequestData | null>(null);
  const [note, setNote] = useState('');
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function bootstrap() {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUserId(data.id);
      setUserName(data.name);
      setUserRole(data.role);
      setSignatureName(data.name);
      load();
    }
    bootstrap();
  }, [router]);

  async function load() {
    const res = await fetch('/api/requests?status=PENDING_APPROVAL');
    const data = await res.json();
    setRequests(data);
  }

  useEffect(() => {
    if (selected && canvasRef.current) {
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          const pad = new SignaturePad(canvasRef.current, { backgroundColor: 'rgb(255,255,255)' });
          setSignaturePad(pad);
          pad.clear();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selected]);

  function total(items: Item[]) {
    return items.reduce((sum, i) => sum + (i.quantity * (i.estimatedUnitPrice ?? 0)), 0);
  }

  async function act(action: 'APPROVE' | 'REJECT' | 'REVISE') {
    if (!selected) return;
    setErrorMsg('');
    setIsProcessing(true);

    const idNum = Number(selected.id);
    if (!idNum || Number.isNaN(idNum)) {
      setErrorMsg('ID permintaan tidak valid.');
      setIsProcessing(false);
      return;
    }

    let finalImage = signatureImage;
    if (signaturePad && !signaturePad.isEmpty()) {
      finalImage = signaturePad.toDataURL();
      setSignatureImage(finalImage);
    }
    if (action === 'APPROVE' && !finalImage) {
      setErrorMsg('Mohon tanda tangan terlebih dahulu.');
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch(`/api/requests/${idNum}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          note,
          signature: signatureName || undefined,
          signatureImage: finalImage || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memproses');
      }
      setSelected(null);
      setNote('');
      setSignatureImage(null);
      setSignaturePad(null);
      await load();
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">
            Persetujuan {userRole === 'DIRECTOR' ? 'Direktur' : 'Manajer'}
          </h1>
          <div className="text-sm text-gray-500">
            {userName ? `Login sebagai ${userName}` : 'Memuat pengguna...'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Menunggu Persetujuan Anda</h2>
          </div>
          {requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada permintaan pending.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Dokumen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemohon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departemen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Estimasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Diperlukan</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{req.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.requester?.name ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.department?.name ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                      Rp {(req.totalEstimatedAmount ?? 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.neededAt ? new Date(req.neededAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button
                        onClick={() => setSelected(req)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md font-medium transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-800">Detail Permintaan</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6 bg-white">
              {errorMsg && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nomor Permintaan</p>
                  <p className="font-medium text-gray-900">{selected.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pemohon</p>
                  <p className="font-medium text-gray-900">{selected.requester?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departemen</p>
                  <p className="font-medium text-gray-900">{selected.department?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal Dibutuhkan</p>
                  <p className="font-medium text-gray-900">
                    {selected.neededAt ? new Date(selected.neededAt).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Daftar Item</h4>
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">No</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Barang/Jasa</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">Qty</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">Satuan</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Harga</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Total</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">{item.unit}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          Rp {(item.estimatedUnitPrice ?? 0).toLocaleString('id-ID')}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          Rp {(item.quantity * (item.estimatedUnitPrice ?? 0)).toLocaleString('id-ID')}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{item.remarks ?? '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 text-right font-semibold" colSpan={5}>
                        TOTAL
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right font-bold text-blue-700">
                        Rp {(total(selected.items)).toLocaleString('id-ID')}
                      </td>
                      <td className="border border-gray-300 px-2 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan (opsional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                    placeholder="Tambahkan catatan jika perlu revisi/penolakan..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanda Tangan Anda</label>
                  <div className="border-2 border-dashed border-gray-400 bg-white rounded-md cursor-crosshair">
                    <canvas ref={canvasRef} width={400} height={150} className="w-full h-32"></canvas>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <button onClick={() => signaturePad?.clear()} className="text-xs text-red-600 underline">
                      Bersihkan
                    </button>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="text-xs border-b border-gray-300 focus:outline-none text-right w-1/2"
                      placeholder="Nama Penandatangan"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => act('REVISE')}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                  Minta Revisi
                </button>
                <button
                  onClick={() => act('REJECT')}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                  Tolak
                </button>
                <button
                  onClick={() => act('APPROVE')}
                  disabled={isProcessing}
                  className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transform active:scale-95 transition-all"
                >
                  {isProcessing ? 'Memproses...' : 'Setujui & TTD'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
