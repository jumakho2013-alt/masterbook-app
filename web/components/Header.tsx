import Link from 'next/link';

export function Header() {
  return (
    <header className="hdr">
      <div className="container hdr-row">
        <Link href="/" className="brand">
          MasterBook<small>ATELIER</small>
        </Link>
        <nav className="nav">
          <Link href="/">Главная</Link>
          <Link href="/catalog">Каталог</Link>
          <span className="muted">📍 Душанбе</span>
        </nav>
        <Link href="/catalog" className="btn btn-primary">Найти мастера</Link>
      </div>
    </header>
  );
}
