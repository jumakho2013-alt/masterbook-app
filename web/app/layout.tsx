import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

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
        <footer className="footer">
          <div className="footer-inner">
            <span>
              <span className="serif" style={{ fontSize: 19, fontWeight: 600 }}>MasterBook</span>
              <span style={{ color: 'var(--gold)', fontSize: 10, fontWeight: 700, letterSpacing: 1.6, marginLeft: 7 }}>ATELIER</span>
            </span>
            <span>Душанбе · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
