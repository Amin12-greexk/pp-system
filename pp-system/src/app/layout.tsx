import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'PP System - Purchase Request Management',
  description: 'Modern internal purchase request management system',
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
        {children}
      </body>
    </html>
  );
}
