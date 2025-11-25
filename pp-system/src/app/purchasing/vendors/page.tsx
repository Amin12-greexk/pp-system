'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Tipe data
type Vendor = {
  id: number;
  name: string;
  brand?: string | null;
  websiteUrl?: string | null;
  catalogUrl?: string | null;
  imageUrl?: string | null;
  city?: string | null;
  contactPerson?: string | null;
  bankAccount?: string | null;
};

export default function VendorsPage() {
  const router = useRouter();
  
  // State Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [search, setSearch] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // State UI
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      loadVendors();
    }
    bootstrap();
  }, [router]);

  async function loadVendors(q?: string) {
    setIsLoading(true);
    try {
      const url = q ? `/api/vendors?q=${encodeURIComponent(q)}` : '/api/vendors';
      const res = await fetch(url);
      const data = await res.json();
      setVendors(data);
      setCurrentPage(1); // Reset to first page when loading new data
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setIsLoading(true);

    await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    
    setForm({});
    setImagePreview('');
    setIsModalOpen(false); // Tutup modal setelah simpan
    await loadVendors();
  }
  
  // Pagination calculations
  const totalPages = Math.ceil(vendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = vendors.slice(startIndex, endIndex);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Generate page numbers
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    
    if (currentPage - delta > 1) {
      range.unshift('...');
      range.unshift(1);
    }
    if (currentPage + delta < totalPages) {
      range.push('...');
      range.push(totalPages);
    }
    
    return range;
  };
  
  // Handle image preview
  const handleImageUrlChange = (url: string) => {
    setForm((f) => ({ ...f, imageUrl: url }));
    setImagePreview(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* --- Header --- */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Master Vendor</h1>
            {userName && (
              <p className="text-sm text-gray-500 mt-1">
                Halo, <span className="font-medium text-gray-700">{userName}</span> (ID: {userId})
              </p>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Vendor
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Search Bar --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari nama vendor, brand, atau kota..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadVendors(search)}
            />
          </div>
          <button 
            onClick={() => loadVendors(search)} 
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Cari
          </button>
          <button 
            onClick={() => { setSearch(''); loadVendors(''); }}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* --- Table List --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
             <div className="p-12 text-center text-gray-500">Memuat data...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Info</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontak</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rekening</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gambar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentVendors.length > 0 ? (
                      currentVendors.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{v.name}</span>
                              {v.brand && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">{v.brand}</span>}
                              <div className="flex gap-2 mt-1">
                                {v.websiteUrl && <a href={v.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Website</a>}
                                {v.catalogUrl && <a href={v.catalogUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Katalog</a>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                             {v.contactPerson || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                             {v.city || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                             {v.bankAccount || '-'}
                          </td>
                          <td className="px-6 py-4">
                            {v.imageUrl ? (
                              <img 
                                src={v.imageUrl} 
                                alt={v.name} 
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDEyQzIwLjc5NTcgMTIgMjEuNTU4NyAxMi4zMTYxIDIyLjEyMTMgMTIuODc4N0MyMi42ODM5IDEzLjQ0MTMgMjMgMTQuMjA0NCAyMyAxNUMyMyAxNS43OTU2IDIyLjY4MzkgMTYuNTU4NyAyMi4xMjEzIDE3LjEyMTNDMjEuNTU4NyAxNy42ODM5IDIwLjc5NTcgMTggMjAgMThDMTkuMjA0NCAxOCAxOC40NDEzIDE3LjY4MzkgMTcuODc4NyAxNy4xMjEzQzE3LjMxNjEgMTYuNTU4NyAxNyAxNS43OTU2IDE3IDE1QzE3IDE0LjIwNDQgMTcuMzE2MSAxMy40NDEzIDE3Ljg3ODcgMTIuODc4N0MxOC40NDEzIDEyLjMxNjEgMTkuMjA0NCAxMiAyMCAxMlpNMjAgMjBDMjMuMzEgMjAgMjYgMjEuMTIgMjYgMjIuNVYyOEgyNlYyMi41QzI2IDIyLjUgMjYgMjggMTQgMjhWMjIuNUMxNCAyMS4xMiAxNi42OSAyMCAyMCAyMFoiIGZpbGw9IiM5Q0E3QjEiLz4KPC9zdmc+';
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          Belum ada data vendor yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* --- Pagination --- */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Menampilkan{' '}
                        <span className="font-medium">{startIndex + 1}</span> hingga{' '}
                        <span className="font-medium">
                          {Math.min(endIndex, vendors.length)}
                        </span>{' '}
                        dari <span className="font-medium">{vendors.length}</span> vendor
                      </p>
                    </div>
                    <div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* --- Modal Form --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                        Tambah Vendor Baru
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Nama Vendor <span className="text-red-500">*</span></label>
                          <input
                            required
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.name ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Brand / Merk</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.brand ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Kota</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.city ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                          />
                        </div>

                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700">Nama Kontak (PIC)</label>
                           <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.contactPerson ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website URL</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.websiteUrl ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Katalog URL</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.catalogUrl ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, catalogUrl: e.target.value }))}
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">URL Gambar / Logo</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.imageUrl ?? ''}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                          />
                          
                          {/* Image Preview */}
                          {imagePreview && (
                            <div className="mt-2 flex items-center space-x-2">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-20 w-20 rounded-lg object-cover border border-gray-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  setImagePreview('');
                                }}
                                onLoad={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'block';
                                }}
                              />
                              <p className="text-sm text-gray-500">Preview gambar</p>
                            </div>
                          )}
                        </div>

                         <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Nomor Rekening</label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={form.bankAccount ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setIsModalOpen(false);
                      setImagePreview('');
                      setForm({});
                    }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}