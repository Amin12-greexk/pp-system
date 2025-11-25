'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Approval = {
  id: number;
  level: number;
  role: string;
  status: string;
  approver: {
    name: string;
  };
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
};

type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  totalEstimatedAmount: number | null;
  totalFinalAmount: number | null;
  createdAt: string;
  updatedAt: string;
  requester: {
    name: string;
  };
  department: {
    name: string;
  };
  approvals: Approval[];
  chosenVendor: {
    name: string;
  } | null;
};

export default function RiwayatPengajuanPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [selectedStatus, searchQuery, requests]);

  async function fetchRequests() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        // Filter semua request kecuali DRAFT dan PENDING_APPROVAL
        const historyRequests = data.filter((req: PurchaseRequest) =>
          !['DRAFT', 'PENDING_APPROVAL'].includes(req.status)
        );
        setRequests(historyRequests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterRequests() {
    let filtered = requests;

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(req => req.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.department.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }

  const statusColors: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800 border-green-300',
    NEEDS_REVISION: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    REJECTED: 'bg-red-100 text-red-800 border-red-300',
    PURCHASING_REVIEW: 'bg-blue-100 text-blue-800 border-blue-300',
    ORDERED: 'bg-purple-100 text-purple-800 border-purple-300',
    COMPLETED: 'bg-teal-100 text-teal-800 border-teal-300',
  };

  const statusLabels: Record<string, string> = {
    APPROVED: 'Disetujui',
    NEEDS_REVISION: 'Perlu Revisi',
    REJECTED: 'Ditolak',
    PURCHASING_REVIEW: 'Review Purchasing',
    ORDERED: 'Sudah Order',
    COMPLETED: 'Selesai',
  };

  const statusIcons: Record<string, string> = {
    APPROVED: '✓',
    NEEDS_REVISION: '⟳',
    REJECTED: '✗',
    PURCHASING_REVIEW: '📋',
    ORDERED: '📦',
    COMPLETED: '✓✓',
  };

  const approvalStatusColors: Record<string, string> = {
    APPROVED: 'text-green-600',
    REJECTED: 'text-red-600',
    PENDING: 'text-gray-400',
    REVISED: 'text-yellow-600',
  };

  const approvalStatusLabels: Record<string, string> = {
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    PENDING: 'Menunggu',
    REVISED: 'Direvisi',
  };

  const stats = {
    approved: requests.filter(r => r.status === 'APPROVED').length,
    needsRevision: requests.filter(r => r.status === 'NEEDS_REVISION').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
    inProcess: requests.filter(r => ['PURCHASING_REVIEW', 'ORDERED'].includes(r.status)).length,
    total: requests.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Riwayat Pengajuan Pembelian
          </h1>
          <p className="mt-2 text-gray-600">Track semua pengajuan yang sudah diproses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600 text-2xl">📊</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Riwayat</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl text-green-600 text-2xl">✓</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600 text-2xl">⟳</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Perlu Revisi</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.needsRevision}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl text-red-600 text-2xl">✗</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Ditolak</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Pengajuan
              </label>
              <input
                type="text"
                placeholder="Nomor PP, Nama Pemohon, atau Departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="APPROVED">✓ Disetujui</option>
                <option value="NEEDS_REVISION">⟳ Perlu Revisi</option>
                <option value="REJECTED">✗ Ditolak</option>
                <option value="PURCHASING_REVIEW">📋 Review Purchasing</option>
                <option value="ORDERED">📦 Sudah Order</option>
                <option value="COMPLETED">✓✓ Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600">
            <h2 className="text-xl font-bold text-white">
              Daftar Pengajuan ({filteredRequests.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-gray-600">Memuat riwayat...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600 font-medium">Tidak ada riwayat pengajuan</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || selectedStatus !== 'ALL'
                  ? 'Coba ubah filter pencarian'
                  : 'Belum ada pengajuan yang diproses'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{request.number}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[request.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                          <span>{statusIcons[request.status] || '•'}</span>
                          {statusLabels[request.status] || request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Pemohon</p>
                          <p className="font-medium text-gray-900">{request.requester.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Departemen</p>
                          <p className="font-medium text-gray-900">{request.department.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Estimasi</p>
                          <p className="font-medium text-gray-900">
                            Rp {(request.totalEstimatedAmount || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tanggal Dibuat</p>
                          <p className="font-medium text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Approval Timeline */}
                      {request.approvals && request.approvals.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Riwayat Approval
                          </p>
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {request.approvals
                              .sort((a, b) => a.level - b.level)
                              .map((approval, idx) => (
                                <div key={approval.id} className="flex items-center gap-2">
                                  <div className="flex flex-col items-center min-w-[120px]">
                                    <div className={`text-2xl mb-1 ${approvalStatusColors[approval.status]}`}>
                                      {approval.status === 'APPROVED' ? '✓' :
                                       approval.status === 'REJECTED' ? '✗' :
                                       approval.status === 'REVISED' ? '⟳' : '○'}
                                    </div>
                                    <div className="text-xs font-medium text-gray-900">{approval.approver.name}</div>
                                    <div className={`text-xs ${approvalStatusColors[approval.status]}`}>
                                      {approvalStatusLabels[approval.status]}
                                    </div>
                                    {approval.note && (
                                      <div className="text-xs text-gray-500 mt-1 text-center italic">
                                        "{approval.note}"
                                      </div>
                                    )}
                                  </div>
                                  {idx < request.approvals.length - 1 && (
                                    <div className="text-gray-300 text-xl">→</div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        Lihat Detail →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRequest(null)}>
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedRequest.number}</h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[selectedRequest.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      <span>{statusIcons[selectedRequest.status] || '•'}</span>
                      {statusLabels[selectedRequest.status] || selectedRequest.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Pemohon</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRequest.requester.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Departemen</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRequest.department.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Estimasi</p>
                    <p className="text-lg font-semibold text-gray-900">
                      Rp {(selectedRequest.totalEstimatedAmount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {selectedRequest.chosenVendor && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Vendor Dipilih</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedRequest.chosenVendor.name}</p>
                    </div>
                  )}
                </div>

                {/* Approval History */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Approval</h3>
                  <div className="space-y-4">
                    {selectedRequest.approvals
                      .sort((a, b) => a.level - b.level)
                      .map((approval) => (
                        <div key={approval.id} className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`text-3xl ${approvalStatusColors[approval.status]}`}>
                                {approval.status === 'APPROVED' ? '✓' :
                                 approval.status === 'REJECTED' ? '✗' :
                                 approval.status === 'REVISED' ? '⟳' : '○'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{approval.approver.name}</p>
                                <p className="text-sm text-gray-500">{approval.role}</p>
                                <p className={`text-sm font-medium mt-1 ${approvalStatusColors[approval.status]}`}>
                                  {approvalStatusLabels[approval.status]}
                                </p>
                                {approval.note && (
                                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Catatan:</p>
                                    <p className="text-sm text-gray-700 italic">"{approval.note}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              {approval.decidedAt ? (
                                <>
                                  <p>Diproses:</p>
                                  <p className="font-medium">
                                    {new Date(approval.decidedAt).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </>
                              ) : (
                                <p>Belum diproses</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Link
                    href={`/api/requests/${selectedRequest.id}/pdf`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Lihat PDF
                  </Link>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
