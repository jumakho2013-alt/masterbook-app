alter table appointments add column if not exists deposit numeric;
alter table appointments add column if not exists deposit_paid boolean not null default false;
