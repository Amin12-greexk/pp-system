'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from 'signature_pad';

// Tipe data disesuaikan dengan Kolom di Gambar
type RequestItem = {
  itemName: string;       // Sesuai kolom "Barang/Jasa"
  remarks: string;        // Sesuai kolom "Keterangan" (misal: Merk AMP)
  quantity: number;       // Sesuai kolom "Jumlah"
  unit: string;           // Sesuai kolom "Satuan" (box, pcs)
  estimatedUnitPrice: number; // Sesuai kolom "Harga Satuan"
};

// ... type definitions lainnya ...
type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  department: string;
  totalEstimatedAmount?: number | null;
  createdAt: string;
};

export default function PurchaseRequestForm() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);

  // State Form Utama
  const [department, setDepartment] = useState('Departemen Umum'); // Default sesuai gambar
  const [neededAt, setNeededAt] = useState('');
  
  // State Items (Baris tabel)
  const [items, setItems] = useState<RequestItem[]>([
    { itemName: '', remarks: '', quantity: 1, unit: 'Pcs', estimatedUnitPrice: 0 },
  ]);

  const [signatureImage, setSignatureImage] = useState('');
  const [signerName, setSignerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalRequest, setTotalRequest] = useState(0);

  // Init Signature Pad
  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, { backgroundColor: 'rgb(255,255,255)' });
      setSignaturePad(pad);
    }
  }, []);

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

    const payload = {
      department,
      neededAt,
      items, // Kirim struktur item baru (itemName, remarks, dll)
      signatureImage: finalSignature,
      signerName
    };

    console.log("Mengirim data sesuai form fisik:", payload);
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
    } catch (err) {
      alert((err as Error).message || 'Terjadi kesalahan');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
        
        {/* HEADER FORM - Disesuaikan dengan Header Gambar (PT ESTA...) */}
        <div className="bg-white border-b-2 border-gray-800 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">PT Tunas Esta Indonesia</h1>
              <p className="text-sm text-gray-500">Formulir Digital</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Permintaan Pembelian</h2>
              <p className="text-xs text-gray-500">Ref: FR/KN/UM/001/a</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* BAGIAN 1: INFORMASI UMUM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">DEPARTEMEN</label>
              <input 
                type="text" 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="Contoh: UMUM"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">TANGGAL DIPERLUKAN</label>
              <input 
                type="date" 
                value={neededAt}
                onChange={(e) => setNeededAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* BAGIAN 2: TABEL BARANG (GRID LAYOUT SEPERTI GAMBAR) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Mohon dibantu untuk pengadaan barang/jasa sebagai berikut :</h3>
            
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">No</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Barang / Jasa</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Jumlah</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Satuan</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Harga Satuan</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Total</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Keterangan</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-sm text-center text-gray-500">{idx + 1}</td>
                      
                      {/* Kolom Barang/Jasa */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className="w-full border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 text-sm"
                          placeholder="Nama Barang..."
                          value={item.itemName}
                          onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                          required
                        />
                      </td>

                      {/* Kolom Jumlah */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        />
                      </td>

                      {/* Kolom Satuan (Box, Pcs, Unit) */}
                      <td className="px-3 py-2">
                         <input
                          type="text"
                          className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        />
                      </td>

                      {/* Kolom Harga Satuan */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-full text-right border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          value={item.estimatedUnitPrice || ''}
                          placeholder="0"
                          onChange={(e) => updateItem(idx, 'estimatedUnitPrice', Number(e.target.value))}
                        />
                      </td>

                      {/* Kolom Total (Auto Calc) */}
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 bg-gray-50">
                        Rp {(item.quantity * item.estimatedUnitPrice).toLocaleString('id-ID')}
                      </td>

                      {/* Kolom Keterangan (Merk, Spec, dll) */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className="w-full border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 text-sm"
                          placeholder="Merk/Spec..."
                          value={item.remarks}
                          onChange={(e) => updateItem(idx, 'remarks', e.target.value)}
                        />
                      </td>

                      <td className="px-3 py-2 text-center">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                             &times;
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                    <tr>
                        <td colSpan={5} className="px-3 py-3 text-right font-bold text-gray-700">GRAND TOTAL:</td>
                        <td className="px-3 py-3 text-right font-bold text-blue-600">
                             Rp {totalRequest.toLocaleString('id-ID')}
                        </td>
                        <td colSpan={2}></td>
                    </tr>
                </tfoot>
              </table>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
            >
              + Tambah Baris Barang
            </button>
          </div>

          {/* BAGIAN 3: TANDA TANGAN (PEMOHON) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-gray-200">
            <div className="md:col-start-1">
               <label className="block text-sm font-bold text-gray-700 mb-2 text-center">PEMOHON</label>
               <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <canvas ref={canvasRef} className="w-full h-32 cursor-crosshair" width={300} height={128}></canvas>
               </div>
               <div className="flex justify-between mt-2">
                 <button type="button" onClick={() => signaturePad?.clear()} className="text-xs text-red-500 hover:text-red-700">Hapus</button>
                 <span className="text-xs text-gray-400">Tanda tangan di kotak</span>
               </div>
               <input 
                 type="text" 
                 placeholder="Nama Jelas Pemohon"
                 className="mt-3 w-full text-center border-b border-gray-300 focus:border-black focus:ring-0 px-2 py-1 outline-none font-medium"
                 value={signerName}
                 onChange={(e) => setSignerName(e.target.value)}
                 required
               />
            </div>
            
            {/* Kolom Approval lainnya dikosongkan karena diisi oleh atasan nanti */}
            <div className="hidden md:block md:col-start-2 opacity-50 pointer-events-none">
                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">KEPALA DEPARTEMEN</label>
                <div className="h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400 italic">Menunggu Approval</span>
                </div>
                <div className="mt-8 border-b border-gray-300 w-full h-1"></div>
            </div>

             <div className="hidden md:block md:col-start-3 opacity-50 pointer-events-none">
                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">KEPALA BAGIAN UMUM</label>
                <div className="h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400 italic">Menunggu Approval</span>
                </div>
                <div className="mt-8 border-b border-gray-300 w-full h-1"></div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end pt-6">
             <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
             >
                {isSubmitting ? 'Memproses...' : 'Simpan Permintaan'}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}
