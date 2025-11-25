import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'PP System - Purchase Request Management',
  description: 'Modern internal purchase request management system',
};

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const userRole = cookieStore.get('userRole')?.value;
  const userName = cookieStore.get('userName')?.value;

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-[Inter]">
        <AppLayout userRole={userRole} userId={userId} userName={userName}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
