import type { ReactNode } from 'react';

export const metadata = {
  title: 'PP System',
  description: 'Internal purchase request playground',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'Arial, sans-serif',
          margin: 0,
          padding: 0,
          background: '#f7f7f7',
        }}
      >
        {children}
      </body>
    </html>
  );
}
