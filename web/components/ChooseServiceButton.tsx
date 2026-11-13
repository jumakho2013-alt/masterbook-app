'use client';

/** «Выбрать» у услуги: раньше это была ссылка #book — форма прокручивалась,
 *  но в ней оставалась первая услуга, и клиент записывался не на то. */
export const CHOOSE_SERVICE_EVENT = 'mb:choose-service';

export function ChooseServiceButton({ serviceId }: { serviceId: string }) {
  return (
    <a
      href="#book"
      className="svc-choose"
      onClick={() => window.dispatchEvent(new CustomEvent(CHOOSE_SERVICE_EVENT, { detail: serviceId }))}
    >
      Выбрать
    </a>
  );
}
