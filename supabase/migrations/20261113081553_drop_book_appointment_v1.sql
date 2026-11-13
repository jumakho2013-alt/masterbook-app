-- Старая book_appointment (без буфера, паузы, закрытых дат и часового пояса
-- города) больше не вызывается: edge-функция book v6 зовёт book_appointment_v2.
drop function if exists public.book_appointment(text, uuid, text, text, text, text, text, numeric, text, timestamptz);
