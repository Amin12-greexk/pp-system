// Halaman purchasing untuk pilih vendor dan membuat PO
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Vendor = {
  id: number;
  name: string;
};

type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  totalEstimatedAmount?: number | null;
};

type Selection = {
  vendorId?: number;
  totalFinalAmount?: number;
};

export default function PurchasingRequestsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [selection, setSelection] = useState<Record<number, Selection>>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const [search, setSearch] = useState('');

  async function load(currentUserId: number, vendorQuery = '') {
    const reqUrl = '/api/requests';
    const vendorsUrl = vendorQuery
      ? `/api/vendors?q=${encodeURIComponent(vendorQuery)}`
      : '/api/vendors';

    const resReq = await fetch(reqUrl);
    const resVendors = await fetch(vendorsUrl);
    const dataReq = await resReq.json();
    const dataVendors = await resVendors.json();
    setRequests(
      dataReq.filter(
        (r: PurchaseRequest) =>
          r.status === 'APPROVED' || r.status === 'PURCHASING_REVIEW'
      )
    );
    setVendors(dataVendors);
  }

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
      load(data.id);
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSelection(id: number, key: keyof Selection, value: string) {
    const parsed = value === '' ? undefined : Number(value);
    setSelection((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: parsed,
      },
    }));
  }

  async function submit(id: number) {
    const sel = selection[id];
    if (!sel?.vendorId) return;

    await fetch(`/api/requests/${id}/purchasing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorId: sel.vendorId,
        totalFinalAmount: sel.totalFinalAmount ?? 0,
        createPO: true,
      }),
    });

    if (userId) await load(userId, search);
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Permintaan untuk Purchasing</h1>
      {userName && userId && <div style={{ marginBottom: 8 }}>Masuk sebagai {userName} (id {userId})</div>}
      <table border={1} cellPadding={6} style={{ width: '100%', maxWidth: 900 }}>
        <thead>
          <tr>
            <th>No</th>
            <th>Status</th>
            <th>Total Est.</th>
            <th>Vendor</th>
            <th>Total Final</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={6} style={{ textAlign: 'left' }}>
              <input
                placeholder="Cari vendor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={() => userId && load(userId, search)}>Cari Vendor</button>
              <button
                onClick={() => {
                  setSearch('');
                  if (userId) load(userId, '');
                }}
                style={{ marginLeft: 6 }}
              >
                Reset Vendor
              </button>
            </td>
          </tr>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.number}</td>
              <td>{r.status}</td>
              <td>{r.totalEstimatedAmount ?? '-'}</td>
              <td>
                <select
                  value={selection[r.id]?.vendorId ?? ''}
                  onChange={(e) => updateSelection(r.id, 'vendorId', e.target.value)}
                >
                  <option value="">Pilih vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={selection[r.id]?.totalFinalAmount ?? ''}
                  onChange={(e) => updateSelection(r.id, 'totalFinalAmount', e.target.value)}
                  placeholder="Total akhir"
                />
              </td>
              <td>
                <button onClick={() => submit(r.id)}>Buat PO</button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6}>Tidak ada permintaan untuk purchasing.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
