// Halaman persetujuan manajer/direktur
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type RequestWithRelations = {
  id: number;
  number: string;
  status: string;
  totalEstimatedAmount?: number | null;
  requester?: { name: string };
  department?: { name: string };
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
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
      load();
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const res = await fetch('/api/requests?status=PENDING_APPROVAL');
    const data = await res.json();
    setRequests(data);
  }

  async function act(id: number, action: 'APPROVE' | 'REJECT' | 'REVISE') {
    await fetch(`/api/requests/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (userId) await load();
  }

  const pending = requests.filter((r) => r.status === 'PENDING_APPROVAL');

  return (
    <div style={{ padding: 16 }}>
      <h1>Persetujuan Manajer/Direktur</h1>
      {userName && userId && <div style={{ marginBottom: 8 }}>Masuk sebagai {userName} (id {userId})</div>}
      <table border={1} cellPadding={6} style={{ width: '100%', maxWidth: 900 }}>
        <thead>
          <tr>
            <th>No</th>
            <th>Pemohon</th>
            <th>Departemen</th>
            <th>Total Est.</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((r) => (
            <tr key={r.id}>
              <td>{r.number}</td>
              <td>{r.requester?.name ?? '-'}</td>
              <td>{r.department?.name ?? '-'}</td>
              <td>{r.totalEstimatedAmount ?? '-'}</td>
              <td>
                <button onClick={() => act(r.id, 'APPROVE')}>Setujui</button>{' '}
                <button onClick={() => act(r.id, 'REJECT')}>Tolak</button>{' '}
                <button onClick={() => act(r.id, 'REVISE')}>Minta Revisi</button>
              </td>
            </tr>
          ))}
          {pending.length === 0 && (
            <tr>
              <td colSpan={5}>Tidak ada permintaan menunggu.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
