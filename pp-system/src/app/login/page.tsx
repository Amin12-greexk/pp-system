// Minimal login selector for test users (no real auth)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const testEmails = [
  'employee@example.com',
  'manager@example.com',
  'purchasing@example.com',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(testEmails[0]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? 'Login failed');
      return;
    }
    router.push('/');
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Masuk</h1>
      <p>Gunakan salah satu email pengguna uji yang sudah di-seed.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <select value={email} onChange={(e) => setEmail(e.target.value)}>
          {testEmails.map((em) => (
            <option key={em} value={em}>
              {em}
            </option>
          ))}
        </select>
        <input
          type="email"
          placeholder="Atau ketik email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Masuk</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
      <div style={{ marginTop: 12 }}>
        <Link href="/">Kembali ke beranda</Link>
      </div>
    </main>
  );
}
