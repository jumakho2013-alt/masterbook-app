import Link from 'next/link';

export const metadata = {
  title: 'Страница не найдена — MasterBook',
  robots: { index: false, follow: false },
};

/** Брендовый 404 вместо дефолтного некстовского — с возвратом в каталог. */
export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="serif" style={{ fontSize: 72, lineHeight: 1, color: 'var(--plum)' }}>404</div>
      <h1 className="serif" style={{ fontSize: 28, margin: '12px 0 8px' }}>Такой страницы нет</h1>
      <p className="muted" style={{ margin: '0 auto 28px', maxWidth: 420 }}>
        Возможно, мастер снял страницу с публикации или ссылка устарела.
      </p>
      <div className="row" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/catalog" className="btn btn-primary">В каталог мастеров</Link>
        <Link href="/" className="btn">На главную</Link>
      </div>
    </div>
  );
}
