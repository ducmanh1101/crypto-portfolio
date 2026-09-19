import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'Crypto Portfolio Analytics' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="top-nav">
          <Link href="/">Dashboard</Link>
          <Link href="/transactions">Transactions</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
