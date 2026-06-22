import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Админка — MasterBook',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="container" style={{ maxWidth: 720, paddingBottom: 60 }}>{children}</div>;
}
