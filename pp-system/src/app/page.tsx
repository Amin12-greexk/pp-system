import Image from 'next/image';
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
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-white/80 p-6 shadow-md backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <Image
                src="/logo.png"
                alt="Tunas Esta Indonesia"
                fill
                className="object-contain p-2"
                sizes="56px"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Internal Portal
              </span>
              <h1 className="text-2xl font-semibold text-foreground">Tunas Esta Indonesia</h1>
              <p className="text-sm text-muted-foreground">Sistem Permintaan Pembelian (PP)</p>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              {userId && userRole ? (
                <div className="text-sm text-muted-foreground">
                  Masuk sebagai <span className="font-semibold text-foreground">#{userId}</span>{' '}
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    {userRole}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Belum masuk</div>
              )}
              {userId ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg border border-indigo-100 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                  >
                    Keluar
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-indigo-100 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </header>

        {!menu && (
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Masuk melalui{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                halaman login
              </Link>{' '}
              untuk melihat menu sesuai peran Anda.
            </p>
          </div>
        )}

        {menu && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Menu</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{menu.title}</h2>
              <ul className="mt-4 space-y-3">
                {menu.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-indigo-700 transition hover:border-indigo-100 hover:bg-indigo-50"
                    >
                      <span>{link.label}</span>
                      <span className="text-xs text-indigo-500">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dashed border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6 shadow-inner md:col-span-1 lg:col-span-2">
              <h3 className="text-lg font-semibold text-indigo-700">Disetujui Bulan Ini</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ringkasan singkat status PP Anda akan tampil di sini (lengkapi modul sesuai
                kebutuhan).
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-indigo-900">
                <div className="rounded-lg bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-xs text-muted-foreground">Menunggu</div>
                  <div className="text-lg font-bold">–</div>
                </div>
                <div className="rounded-lg bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-xs text-muted-foreground">Disetujui</div>
                  <div className="text-lg font-bold">–</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
