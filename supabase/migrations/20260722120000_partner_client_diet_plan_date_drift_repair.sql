-- Repara drift de ambientes que registraram 20260701213000 sem as datas do plano.
-- Colunas opcionais, sem backfill e sem impacto destrutivo em dados existentes.

alter table public.partner_client_diet_plans
  add column if not exists starts_on date,
  add column if not exists review_on date;
