create table if not exists public.partner_products (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120),
  description text,
  category text not null default 'integrado',
  billing_cycle text not null check (billing_cycle in ('unico','mensal','bimestral','trimestral','semestral','anual')),
  price_cents integer not null check (price_cents >= 0),
  duration_months integer check (duration_months is null or duration_months > 0),
  includes_diet boolean not null default false,
  includes_training boolean not null default false,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_client_plans (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.partner_products(id) on delete set null,
  product_name text not null,
  agreed_price_cents integer not null check (agreed_price_cents >= 0),
  billing_cycle text not null,
  start_date date not null,
  end_date date,
  next_due_date date,
  status text not null default 'active' check (status in ('active','paused','completed','cancelled','overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_plan_installments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  client_plan_id uuid not null references public.partner_client_plans(id) on delete cascade,
  due_date date not null,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled','refunded')),
  paid_at timestamptz,
  payment_method text,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_products_partner_idx on public.partner_products(partner_id, status);
create index if not exists partner_client_plans_partner_idx on public.partner_client_plans(partner_id, status);
create index if not exists partner_plan_installments_partner_due_idx on public.partner_plan_installments(partner_id, due_date, status);

alter table public.partner_products enable row level security;
alter table public.partner_client_plans enable row level security;
alter table public.partner_plan_installments enable row level security;

create policy "partner manages own products" on public.partner_products
for all using (exists (select 1 from public.partners p where p.id = partner_id and p.profile_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.profile_id = auth.uid()));

create policy "partner manages own client plans" on public.partner_client_plans
for all using (exists (select 1 from public.partners p where p.id = partner_id and p.profile_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.profile_id = auth.uid()));

create policy "partner manages own installments" on public.partner_plan_installments
for all using (exists (select 1 from public.partners p where p.id = partner_id and p.profile_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.profile_id = auth.uid()));

comment on table public.partner_products is 'Catalogo manual de produtos/planos do profissional; nao representa produtos de gateway.';
comment on table public.partner_client_plans is 'Vinculos comerciais registrados manualmente entre profissional e cliente.';
comment on table public.partner_plan_installments is 'Contas a receber manuais; sem checkout, cobranca automatica ou gateway de pagamento.';