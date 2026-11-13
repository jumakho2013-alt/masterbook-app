import type { Metadata } from 'next';
import { ReviewForm } from '@/components/ReviewForm';

// Личная одноразовая ссылка клиента — в поиск ей незачем.
export const metadata: Metadata = {
  title: 'Отзыв о визите — MasterBook',
  robots: { index: false, follow: false },
};

export default function ReviewPage({ params }: { params: { token: string } }) {
  return <ReviewForm token={params.token} />;
}
