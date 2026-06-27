import type { Metadata } from 'next';
import Link from 'next/link';

const APP_STORE = 'https://apps.apple.com/app/id6781701643';

export const metadata: Metadata = {
  title: 'Для мастеров — MasterBook',
  description:
    'Бесплатное приложение для мастеров: ведите клиентов и записи, получайте свою страницу на сайте и онлайн-записи. Без комиссии. Платно — только продвижение в каталоге.',
  alternates: { canonical: '/dlya-masterov' },
  openGraph: {
    title: 'MasterBook для мастеров — бесплатно вести записи и получать клиентов',
    description: 'CRM + страница на сайте + онлайн-записи. Без комиссии. Платно только продвижение.',
    type: 'website',
    siteName: 'MasterBook',
    locale: 'ru_RU',
    url: '/dlya-masterov',
  },
};

const VALUES = [
  {
    t: 'Бесплатное приложение-CRM',
    d: 'Клиенты, записи, напоминания, доход — всё в одном месте. Работает офлайн, данные синхронизируются в облако.',
  },
  {
    t: 'Бесплатная страница на сайте',
    d: 'Клиенты находят вас в каталоге своего города и записываются онлайн — заявка сразу падает вам в приложение.',
  },
  {
    t: 'Продвижение — по желанию',
    d: 'Хотите выше в каталоге и метку VIP? Оплатите продвижение локальным переводом. Никакой комиссии с ваших записей.',
  },
];

const STEPS = [
  { n: '1', t: 'Установите приложение', d: 'Скачайте MasterBook и заполните профиль: имя, город, услуги с ценами.' },
  { n: '2', t: 'Включите страницу на сайте', d: 'Нажмите «Показать на сайте» — ваша анкета появится в каталоге города.' },
  { n: '3', t: 'Получайте записи', d: 'Делитесь ссылкой в Instagram/WhatsApp. Клиенты записываются — вы подтверждаете.' },
];

export default function ForMastersPage() {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* hero */}
      <div style={{ maxWidth: 680, marginBottom: 40 }}>
        <div className="hero-eyebrow">ДЛЯ МАСТЕРОВ</div>
        <h1 className="serif" style={{ fontSize: 'clamp(34px, 6vw, 52px)', lineHeight: 1.05, margin: '14px 0 0' }}>
          Записи, клиенты и доход — в одном бесплатном приложении
        </h1>
        <p className="muted" style={{ fontSize: 18, lineHeight: 1.5, margin: '18px 0 26px', maxWidth: 560 }}>
          MasterBook ведёт вашу базу клиентов и даёт страницу на сайте, куда клиенты
          записываются онлайн. Бесплатно. Платите только за продвижение — и только если захотите.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href={APP_STORE} target="_blank" rel="noreferrer" className="btn btn-primary">Скачать в App Store</a>
          <Link href="/cabinet" className="btn">Войти в кабинет</Link>
        </div>
        <p className="faint" style={{ fontSize: 13, marginTop: 12 }}>Android — скоро в Google Play (идёт закрытый тест).</p>
      </div>

      {/* values */}
      <div className="trust-grid" style={{ marginBottom: 48 }}>
        {VALUES.map((v) => (
          <div key={v.t} className="trust-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div className="trust-t" style={{ fontSize: 17 }}>{v.t}</div>
            <div className="trust-d" style={{ fontSize: 14.5, lineHeight: 1.5 }}>{v.d}</div>
          </div>
        ))}
      </div>

      {/* steps */}
      <div className="sec-head"><h2 className="serif">Как начать</h2></div>
      <div className="trust-grid" style={{ marginBottom: 48 }}>
        {STEPS.map((s) => (
          <div key={s.n} className="trust-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <span className="serif" style={{ fontSize: 34, color: 'var(--plum)', lineHeight: 1 }}>{s.n}</span>
            <div className="trust-t" style={{ fontSize: 16 }}>{s.t}</div>
            <div className="trust-d" style={{ fontSize: 14, lineHeight: 1.5 }}>{s.d}</div>
          </div>
        ))}
      </div>

      {/* pricing */}
      <div className="sec-head"><h2 className="serif">Сколько это стоит</h2></div>
      <div
        style={{
          background: 'var(--plum-soft)', border: '1px solid var(--line)', borderRadius: 20,
          padding: '26px 28px', maxWidth: 640,
        }}
      >
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--text)' }}>
          <b>Приложение, страница на сайте и онлайн-записи — бесплатно.</b> Мы не берём
          процент с ваших записей. Платно только <b>продвижение</b> — место выше в каталоге
          и метка VIP, чтобы вас видели первым. Оплата локальным переводом, по желанию.
        </p>
      </div>

      <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <a href={APP_STORE} target="_blank" rel="noreferrer" className="btn btn-primary">Скачать в App Store</a>
        <Link href="/catalog" className="btn">Посмотреть каталог</Link>
      </div>
    </div>
  );
}
