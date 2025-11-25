import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import LogoutButton from '@/components/LogoutButton';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- CONFIGURATION ---
const roleMenus: Record<string, { title: string; links: { label: string; href: string; icon: string }[] }> = {
  EMPLOYEE: {
    title: 'Karyawan',
    links: [{ label: 'Permintaan Saya', href: '/employee/requests', icon: '📝' }],
  },
  MANAGER: {
    title: 'Manajer',
    links: [{ label: 'Persetujuan', href: '/manager/approvals', icon: '✓' }],
  },
  DIRECTOR: {
    title: 'Direktur',
    links: [{ label: 'Persetujuan', href: '/manager/approvals', icon: '✓' }],
  },
  PURCHASING: {
    title: 'Purchasing',
    links: [
      { label: 'Vendor', href: '/purchasing/vendors', icon: '🏢' },
      { label: 'Permintaan & PO', href: '/purchasing/requests', icon: '📋' },
      { label: 'Riwayat Pengajuan', href: '/purchasing/riwayat', icon: '📜' },
      { label: 'Laporan', href: '/purchasing/reports', icon: '📊' },
    ],
  },
  FINANCE: {
    title: 'Keuangan',
    links: [{ label: 'Laporan', href: '/purchasing/reports', icon: '📊' }],
  },
  ADMIN: {
    title: 'Admin',
    links: [
      { label: 'Kelola Pengguna', href: '/manager/users', icon: '👥' },
      { label: 'Vendor', href: '/purchasing/vendors', icon: '🏢' },
      { label: 'Permintaan & PO', href: '/purchasing/requests', icon: '📋' },
      { label: 'Riwayat Pengajuan', href: '/purchasing/riwayat', icon: '📜' },
      { label: 'Laporan', href: '/purchasing/reports', icon: '📊' },
    ],
  },
};

function getMenuForRole(role: string | undefined) {
  if (!role) return null;
  return roleMenus[role] ?? null;
}

async function getSummary() {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [approvedCount, approvedTotal, pendingCount] = await Promise.all([
      prisma.purchaseRequest.count({
        where: { status: 'APPROVED', createdAt: { gte: start, lt: end } },
      }),
      prisma.purchaseRequest.aggregate({
        _sum: { totalEstimatedAmount: true },
        where: { status: 'APPROVED', createdAt: { gte: start, lt: end } },
      }),
      prisma.purchaseRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    return {
      approvedCount,
      approvedTotal: approvedTotal._sum.totalEstimatedAmount ?? 0,
      pendingCount,
    };
  } catch {
    return { approvedCount: 0, approvedTotal: 0, pendingCount: 0 };
  }
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const userRole = cookieStore.get('userRole')?.value;
  const userName = cookieStore.get('userName')?.value;
  const menu = getMenuForRole(userRole);
  const summary = await getSummary();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Tunas Esta Indonesia"
                  width={48}
                  height={48}
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tunas Esta Indonesia</h1>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sistem Portal</p>
              </div>
            </div>

            {/* User Profile Area */}
            <div className="flex items-center gap-4">
              {userId && userRole ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-semibold text-gray-900">{userName || `User #${userId}`}</div>
                    <div className="text-xs font-medium uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                      {userRole}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-md ring-2 ring-white">
                    {userName ? userName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 shadow-lg shadow-gray-200"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* --- SYSTEM SELECTOR (PORTAL) --- */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-6 w-1 bg-indigo-600 rounded-full"></span>
            Pilih Sistem
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1: Purchasing (Active) */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-1 ring-2 ring-indigo-600 shadow-xl transition-all">
              <div className="absolute top-0 right-0 p-4">
                 <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    ● Aktif
                 </span>
              </div>
              <div className="h-full rounded-xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-3xl text-white shadow-lg shadow-indigo-200">
                  🛒
                </div>
                <h3 className="text-xl font-bold text-gray-900">Sistem Pembelian</h3>
                <p className="text-sm text-gray-500 mt-1">Manajemen Permintaan, Vendor, dan Laporan.</p>
                <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600">
                  Sedang Diakses <span className="ml-2 animate-pulse">●</span>
                </div>
              </div>
            </div>

            {/* Card 2: Warehouse (Coming Soon) */}
            <div className="group relative overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 p-1 opacity-90 transition hover:opacity-100 cursor-not-allowed">
              {/* Pattern Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
              
              <div className="absolute top-0 right-0 p-4">
                 <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600 border border-gray-300 shadow-sm">
                    🚀 Segera Hadir
                 </span>
              </div>
              
              <div className="h-full rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 grayscale transition group-hover:grayscale-0">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-300 text-3xl text-gray-500 shadow-inner group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-orange-200 transition-colors duration-300">
                  📦
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900">Warehouse Management</h3>
                <p className="text-sm text-gray-500 mt-1">Manajemen Stok, Masuk/Keluar Barang, dan Opname.</p>
                
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Terkunci
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PURCHASING DASHBOARD CONTENT --- */}
        {!menu ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-white border border-dashed border-gray-300">
            <div className="text-center p-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Akses Terbatas</h2>
              <p className="text-gray-500">
                Silakan <Link href="/login" className="font-semibold text-indigo-600 hover:underline">masuk</Link> untuk melihat dashboard.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Visual Separator */}
            <div className="relative mb-8">
               <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200"></div>
               </div>
               <div className="relative flex justify-center">
                  <span className="bg-gray-50 px-4 text-sm text-gray-500 font-medium">Dashboard Pembelian</span>
               </div>
            </div>

            {/* Welcome Banner */}
            <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-2xl relative">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">Halo, {userName || 'Rekan Kerja'}!</h2>
                  <p className="text-slate-300">Berikut adalah ringkasan aktivitas pembelian Anda.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
               {/* Left Col: Menu */}
               <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Menu Utama</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {menu.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg hover:-translate-y-1 hover:ring-indigo-500/50"
                        >
                          <div className="flex items-start justify-between">
                             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {link.icon}
                             </div>
                             <span className="text-gray-300 group-hover:text-indigo-600 transition-colors">↗</span>
                          </div>
                          <div className="mt-4">
                             <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{link.label}</h4>
                             <p className="text-sm text-gray-500">Akses modul {link.label.toLowerCase()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
               </div>

               {/* Right Col: Stats */}
               <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900">Statistik Bulan Ini</h3>
                  
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="p-2 bg-blue-50 rounded-lg text-blue-600 text-xl">⏳</div>
                       <div>
                          <p className="text-sm font-medium text-gray-500">Menunggu Persetujuan</p>
                          <p className="text-2xl font-bold text-gray-900">{summary.pendingCount}</p>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(summary.pendingCount * 10, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="p-2 bg-green-50 rounded-lg text-green-600 text-xl">✅</div>
                       <div>
                          <p className="text-sm font-medium text-gray-500">Disetujui (Bulan Ini)</p>
                          <p className="text-2xl font-bold text-gray-900">{summary.approvedCount}</p>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Total Nilai Transaksi</p>
                    <p className="text-2xl font-bold">Rp {summary.approvedTotal.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-indigo-200 mt-2">*Akumulasi bulan ini</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}