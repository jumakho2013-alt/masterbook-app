import Link from 'next/link';
import { catalogHref } from '@/lib/categories';

const APP_STORE = 'https://apps.apple.com/app/id6781701643';
const PRIVACY = 'https://jumakho2013-alt.github.io/masterbook-privacy/';

const FOR_CLIENTS: Array<[string, string]> = [
  ['Все мастера', catalogHref()],
  ['Маникюр', catalogHref({ spec: 'nails' })],
  ['Парикмахеры', catalogHref({ spec: 'hair' })],
  ['Брови', catalogHref({ spec: 'brows' })],
  ['Ресницы', catalogHref({ spec: 'lashes' })],
  ['Массаж', catalogHref({ spec: 'massage' })],
];

const CITIES = ['Душанбе', 'Худжанд', 'Бохтар', 'Куляб'];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>MasterBook</span>
            <span className="footer-atelier">ATELIER</span>
          </div>
          <p>Мастера красоты и услуг в вашем городе. Запись онлайн за минуту — без регистрации и предоплаты.</p>
          <a href={APP_STORE} target="_blank" rel="noreferrer" className="footer-store">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.62c.03 2.93 2.57 3.9 2.6 3.92-.02.07-.4 1.39-1.34 2.75-.81 1.18-1.65 2.35-2.97 2.38-1.3.02-1.72-.77-3.21-.77-1.49 0-1.95.75-3.18.8-1.28.04-2.25-1.27-3.07-2.45-1.67-2.41-2.95-6.82-1.23-9.8.85-1.48 2.38-2.42 4.04-2.44 1.26-.02 2.45.85 3.22.85.77 0 2.21-1.05 3.73-.9.64.03 2.42.26 3.57 1.94-.09.06-2.13 1.25-2.1 3.72M13.9 5.43c.68-.83 1.14-1.97 1.01-3.12-.98.04-2.17.65-2.87 1.48-.63.73-1.18 1.89-1.03 3.01 1.09.08 2.21-.56 2.89-1.37"/></svg>
            Приложение для мастеров
          </a>
        </div>
        <nav className="footer-col" aria-label="Клиентам">
          <div className="footer-h">Клиентам</div>
          {FOR_CLIENTS.map(([label, href]) => <Link key={label} href={href} className="footer-link">{label}</Link>)}
        </nav>
        <nav className="footer-col" aria-label="Мастерам">
          <div className="footer-h">Мастерам</div>
          <Link href="/dlya-masterov" className="footer-link">Как это работает</Link>
          <Link href="/cabinet" className="footer-link">Зарегистрироваться</Link>
          <Link href="/cabinet?login" className="footer-link">Войти в кабинет</Link>
          <a href={APP_STORE} target="_blank" rel="noreferrer" className="footer-link">App Store</a>
        </nav>
        <nav className="footer-col" aria-label="Города">
          <div className="footer-h">Города</div>
          {CITIES.map((c) => <Link key={c} href={catalogHref({ city: c })} className="footer-link">{c}</Link>)}
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MasterBook</span>
        <a href={PRIVACY} target="_blank" rel="noreferrer" className="footer-link">Политика конфиденциальности</a>
      </div>
    </footer>
  );
}
