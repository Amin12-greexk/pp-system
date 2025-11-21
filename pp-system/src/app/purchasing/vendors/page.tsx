/* eslint-disable @next/next/no-img-element */
// Halaman purchasing untuk daftar dan tambah vendor
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [search, setSearch] = useState('');
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
      loadVendors();
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVendors(q?: string) {
    const url = q ? `/api/vendors?q=${encodeURIComponent(q)}` : '/api/vendors';
    const res = await fetch(url);
    const data = await res.json();
    setVendors(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({});
    await loadVendors();
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Vendor (Purchasing)</h1>
      {userName && userId && <div style={{ marginBottom: 8 }}>Masuk sebagai {userName} (id {userId})</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Name"
          value={form.name ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          placeholder="Brand"
          value={form.brand ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
        />
        <input
          placeholder="URL Website"
          value={form.websiteUrl ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
        />
        <input
          placeholder="URL Katalog"
          value={form.catalogUrl ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, catalogUrl: e.target.value }))}
        />
        <input
          placeholder="URL Gambar"
          value={form.imageUrl ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
        <input
          placeholder="Kota"
          value={form.city ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />
        <input
          placeholder="Kontak"
          value={form.contactPerson ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
        />
        <input
          placeholder="Rekening"
          value={form.bankAccount ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
        />
        <button type="submit">Simpan Vendor</button>
      </form>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <input
          placeholder="Cari vendor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => loadVendors(search)}>Cari</button>
        <button
          onClick={() => {
            setSearch('');
            loadVendors();
          }}
          style={{ marginLeft: 6 }}
        >
          Reset
        </button>
      </div>

      <table border={1} cellPadding={6} style={{ marginTop: 24, width: '100%', maxWidth: 900 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Brand</th>
            <th>Kota</th>
            <th>Kontak</th>
            <th>Rekening</th>
            <th>Gambar</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td>{v.brand}</td>
              <td>{v.city}</td>
              <td>{v.contactPerson}</td>
              <td>{v.bankAccount}</td>
              <td>
                {v.imageUrl ? (
                  <img src={v.imageUrl} width={50} height={50} alt={v.name} />
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
          {vendors.length === 0 && (
            <tr>
              <td colSpan={6}>No vendors found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
