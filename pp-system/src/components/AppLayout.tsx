'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

type AppLayoutProps = {
  children: React.ReactNode;
  userRole?: string;
  userId?: string;
  userName?: string;
};

export default function AppLayout({ children, userRole, userId, userName }: AppLayoutProps) {
  const pathname = usePathname();

  // Don't show sidebar on login page or home page
  const showSidebar = pathname !== '/login' && pathname !== '/' && userRole;

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} userId={userId} userName={userName} />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
