import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Кабинет мастера — MasterBook',
  robots: { index: false, follow: false },
};

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return <div className="container" style={{ maxWidth: 720, paddingBottom: 60 }}>{children}</div>;
}
