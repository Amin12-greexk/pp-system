'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

type MenuItem = {
  label: string;
  href: string;
  icon?: string;
};

type RoleMenu = {
  title: string;
  links: MenuItem[];
};

const roleMenus: Record<string, RoleMenu> = {
  EMPLOYEE: {
    title: 'Karyawan',
    links: [
      { label: 'Dashboard', href: '/', icon: '🏠' },
      { label: 'Permintaan Saya', href: '/employee/requests', icon: '📝' },
    ],
  },
  MANAGER: {
    title: 'Manajer',
    links: [
      { label: 'Dashboard', href: '/', icon: '🏠' },
      { label: 'Persetujuan', href: '/manager/approvals', icon: '✓' },
      { label: 'Kelola Pengguna', href: '/manager/users', icon: '👥' },
    ],
  },
  DIRECTOR: {
    title: 'Direktur',
    links: [
      { label: 'Dashboard', href: '/', icon: '🏠' },
      { label: 'Persetujuan', href: '/manager/approvals', icon: '✓' },
      { label: 'Kelola Pengguna', href: '/manager/users', icon: '👥' },
    ],
  },
  PURCHASING: {
    title: 'Purchasing',
    links: [
      { label: 'Dashboard', href: '/', icon: '🏠' },
      { label: 'Vendor', href: '/purchasing/vendors', icon: '🏢' },
      { label: 'Permintaan & PO', href: '/purchasing/requests', icon: '📋' },
      { label: 'Riwayat Pengajuan', href: '/purchasing/riwayat', icon: '📜' },
      { label: 'Laporan', href: '/purchasing/reports', icon: '📊' },
    ],
  },
  FINANCE: {
    title: 'Keuangan',
    links: [
      { label: 'Dashboard', href: '/', icon: '🏠' },
      { label: 'Laporan', href: '/purchasing/reports', icon: '📊' },
    ],
  },
  ADMIN: {
    title: 'Admin',
    links: [
      { label: 'Dashboard', href: '/', icon: '🏠' },
      { label: 'Kelola Pengguna', href: '/manager/users', icon: '👥' },
      { label: 'Vendor', href: '/purchasing/vendors', icon: '🏢' },
      { label: 'Permintaan & PO', href: '/purchasing/requests', icon: '📋' },
      { label: 'Riwayat Pengajuan', href: '/purchasing/riwayat', icon: '📜' },
      { label: 'Laporan', href: '/purchasing/reports', icon: '📊' },
    ],
  },
};

type SidebarProps = {
  userRole?: string;
  userId?: string;
  userName?: string;
};

export default function Sidebar({ userRole, userId, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menu = userRole ? roleMenus[userRole] : null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!menu) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-indigo-600 p-2 text-white shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white shadow-xl transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200">
                  <Image
                    src="/logo.png"
                    alt="TEI Logo"
                    fill
                    className="object-contain p-1"
                    sizes="40px"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">TEI</span>
                  <span className="text-xs text-gray-500">PP System</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden rounded-lg p-1 hover:bg-gray-100 lg:block"
              aria-label="Toggle sidebar"
            >
              <svg
                className={`h-5 w-5 text-gray-600 transition-transform ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                  {userName ? userName.charAt(0).toUpperCase() : userId?.charAt(0) || '?'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {userName || `User #${userId}`}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    {menu.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menu.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? link.label : undefined}
                    >
                      <span className="text-lg">{link.icon || '•'}</span>
                      {!isCollapsed && <span>{link.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Keluar' : undefined}
            >
              <span className="text-lg">🚪</span>
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
