import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'MasterBook — мастера в твоём городе',
  description: 'Найди мастера маникюра, барбера, бровиста и запишись за минуту — без регистрации.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="footer">
          <div className="container spread">
            <span>MasterBook · Atelier</span>
            <span>Душанбе · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
