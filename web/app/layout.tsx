import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const SITE_URL = 'https://masterbook-app.vercel.app';
const TITLE = 'MasterBook — мастера в твоём городе';
const DESC = 'Найди мастера маникюра, барбера, бровиста и запишись за минуту — без регистрации.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  applicationName: 'MasterBook',
  openGraph: {
    type: 'website',
    siteName: 'MasterBook',
    locale: 'ru_RU',
    url: SITE_URL,
    title: TITLE,
    description: DESC,
  },
  twitter: { card: 'summary', title: TITLE, description: DESC },
};

// Применяем сохранённую тему до первой отрисовки, чтобы не было вспышки
// светлой темы у тех, кто выбрал Noir. По умолчанию — светлая (Atelier).
const themeScript = `(function(){try{var t=localStorage.getItem('mb-theme');if(t==='noir'){document.documentElement.dataset.theme='noir';}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
