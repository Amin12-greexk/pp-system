// Halaman karyawan untuk membuat & melihat permintaan pembelian
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type RequestItem = {
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
};

type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  totalEstimatedAmount?: number | null;
  createdAt: string;
};

type Vendor = {
  id: number;
  name: string;
  brand?: string | null;
};

export default function EmployeeRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [purpose, setPurpose] = useState('');
  const [neededAt, setNeededAt] = useState('');
  const [suggestedVendorId, setSuggestedVendorId] = useState('');
  const [items, setItems] = useState<RequestItem[]>([
    { description: '', quantity: 1, unit: '', estimatedUnitPrice: 0 },
  ]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

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
      loadRequests();
      // do not load vendors until user searches
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRequests() {
    const res = await fetch('/api/requests?mine=1');
    const data = await res.json();
    setRequests(data);
  }

  async function loadVendors(q: string) {
    const url = q ? `/api/vendors?q=${encodeURIComponent(q)}` : '/api/vendors';
    const res = await fetch(url);
    if (!res.ok) {
      setVendors([]);
      return;
    }
    try {
      const data = await res.json();
      setVendors(data);
    } catch {
      setVendors([]);
    }
  }

  function searchByFirstItem() {
    const keyword = items.find((i) => i.description.trim())?.description.trim();
    if (!keyword) return;
    setVendorSearch(keyword);
    if (userId) loadVendors(keyword);
    setSuggestedVendorId('');
  }

  function updateItem(idx: number, key: keyof RequestItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              [key]:
                key === 'quantity' || key === 'estimatedUnitPrice'
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) =>
      prev.length >= 3
        ? prev
        : [...prev, { description: '', quantity: 1, unit: '', estimatedUnitPrice: 0 }]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanedItems = items
      .map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        estimatedUnitPrice:
          i.estimatedUnitPrice === undefined || i.estimatedUnitPrice === null
            ? undefined
            : Number(i.estimatedUnitPrice),
      }))
      .filter((i) => i.description && i.quantity > 0 && i.unit);

    if (!cleanedItems.length) return;

    await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        purpose,
        neededAt: neededAt || undefined,
        suggestedVendorId: suggestedVendorId ? Number(suggestedVendorId) : undefined,
        items: cleanedItems,
      }),
    });

    setPurpose('');
    setNeededAt('');
    setSuggestedVendorId('');
    setItems([{ description: '', quantity: 1, unit: '', estimatedUnitPrice: 0 }]);
    if (userId) await loadRequests();
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Permintaan Pembelian (Karyawan)</h1>
      {userName && userId && (
        <div style={{ marginBottom: 8 }}>Masuk sebagai {userName} (id {userId})</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
        <input
          placeholder="Tujuan pembelian"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
        />
        <input
          type="date"
          value={neededAt}
          onChange={(e) => setNeededAt(e.target.value)}
        />
        <input
          placeholder="ID Vendor (opsional)"
          value={suggestedVendorId}
          onChange={(e) => setSuggestedVendorId(e.target.value)}
        />

        <div style={{ border: '1px solid #ccc', padding: 8 }}>
          <strong>Item (1-3)</strong>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px', gap: 8, marginTop: 4 }}>
              <input
                placeholder="Deskripsi"
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
              />
              <input
                placeholder="Satuan"
                value={item.unit}
                onChange={(e) => updateItem(idx, 'unit', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Perkiraan harga/unit"
                value={item.estimatedUnitPrice ?? ''}
                onChange={(e) => updateItem(idx, 'estimatedUnitPrice', e.target.value)}
              />
            </div>
          ))}
          <button type="button" onClick={addItem} disabled={items.length >= 3} style={{ marginTop: 6 }}>
            Tambah Item
          </button>
        </div>

        <button type="submit">Kirim Permintaan</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Vendor</h2>
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Cari vendor (mis: pulpen)"
          value={vendorSearch}
          onChange={(e) => setVendorSearch(e.target.value)}
        />
        <button onClick={() => loadVendors(vendorSearch)}>Cari</button>
        <button
          onClick={() => {
            setVendorSearch('');
            loadVendors('');
          }}
          style={{ marginLeft: 6 }}
        >
          Reset
        </button>
        <button onClick={searchByFirstItem} style={{ marginLeft: 6 }}>
          Gunakan deskripsi item pertama
        </button>
      </div>
      <table border={1} cellPadding={6} style={{ width: '100%', maxWidth: 800 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Brand</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.name}</td>
              <td>{v.brand ?? '-'}</td>
            </tr>
          ))}
          {vendors.length === 0 && (
            <tr>
              <td colSpan={3}>No vendors found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: 24 }}>Permintaan Saya</h2>
      <table border={1} cellPadding={6} style={{ width: '100%', maxWidth: 800 }}>
        <thead>
          <tr>
            <th>Nomor</th>
            <th>Status</th>
            <th>Total Estimasi</th>
            <th>Dibuat</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.number}</td>
              <td>{r.status}</td>
              <td>{r.totalEstimatedAmount ?? '-'}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
