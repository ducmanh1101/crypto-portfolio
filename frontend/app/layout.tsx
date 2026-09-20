import './globals.css';
import { Providers } from './providers';
import { TopNav } from '../components/TopNav';

export const metadata = {
  title: 'KRYPTON | Crypto Portfolio Analytics',
  description: 'Senior-engineered cryptocurrency portfolio valuation, weighted-average cost basis, and P&L analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('krypton-theme');
                const isDark = t === 'dark' || ((!t || t === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200 transition-colors duration-200">
        <Providers>
          {/* Ambient Web3 Glow */}
          <div className="ambient-glow" aria-hidden="true" />

          <div className="relative z-10 flex flex-col min-h-screen">
            <TopNav />
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/60 backdrop-blur py-6 mt-12 text-center text-xs text-slate-500 font-mono transition-colors">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>KRYPTON Terminal • Avant-Garde Crypto Analytics</span>
                <span>Weighted-Average Cost Basis • Arbitrary Decimal Precision</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
