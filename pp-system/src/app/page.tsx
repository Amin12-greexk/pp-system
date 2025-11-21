import Link from 'next/link';
import { cookies } from 'next/headers';

const roleMenus: Record<string, { title: string; links: { label: string; href: string }[] }> = {
  EMPLOYEE: {
    title: 'Karyawan',
    links: [{ label: 'Permintaan Saya', href: '/employee/requests' }],
  },
  MANAGER: {
    title: 'Manajer',
    links: [{ label: 'Persetujuan', href: '/manager/approvals' }],
  },
  DIRECTOR: {
    title: 'Direktur',
    links: [{ label: 'Persetujuan', href: '/manager/approvals' }],
  },
  PURCHASING: {
    title: 'Purchasing',
    links: [
      { label: 'Vendor', href: '/purchasing/vendors' },
      { label: 'Permintaan & PO', href: '/purchasing/requests' },
      { label: 'Laporan', href: '/purchasing/reports' },
    ],
  },
  FINANCE: {
    title: 'Keuangan',
    links: [{ label: 'Laporan', href: '/purchasing/reports' }],
  },
  ADMIN: {
    title: 'Admin',
    links: [
      { label: 'Vendor', href: '/purchasing/vendors' },
      { label: 'Permintaan & PO', href: '/purchasing/requests' },
      { label: 'Laporan', href: '/purchasing/reports' },
    ],
  },
};

function getMenuForRole(role: string | undefined) {
  if (!role) return null;
  return roleMenus[role] ?? null;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const userRole = cookieStore.get('userRole')?.value;
  const menu = getMenuForRole(userRole);

  return (
    <main
      style={{
        padding: '32px',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Sistem PP</h1>
          <div style={{ color: '#444' }}>
            {userId && userRole ? (
              <>Masuk sebagai #{userId} ({userRole})</>
            ) : (
              <>Belum masuk</>
            )}
          </div>
        </div>
        <div>
          {userId ? (
            <form action="/api/auth/logout" method="post">
              <button type="submit">Keluar</button>
            </form>
          ) : (
            <Link href="/login">Masuk</Link>
          )}
        </div>
      </div>

      {!menu && (
        <div style={{ marginTop: 24, color: '#444' }}>
          Masuk melalui <Link href="/login">halaman login</Link> untuk melihat menu sesuai peran.
        </div>
      )}

      {menu && (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            marginTop: 24,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>{menu.title}</h2>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {menu.links.map((link) => (
                <li key={link.href} style={{ marginBottom: 6 }}>
                  <Link href={link.href} style={{ color: '#0b6bcb', textDecoration: 'none' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
