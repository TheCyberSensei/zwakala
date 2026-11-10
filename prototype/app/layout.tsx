import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Digital safety · Private reporting demo', description: 'Local fictional demonstration. Not a real incident-reporting service.', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
