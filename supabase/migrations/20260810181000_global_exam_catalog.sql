create table if not exists public.system_exam_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon_key text not null default 'activity',
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_exam_categories_slug_check check (slug ~ '^[a-z0-9_]+$'),
  constraint system_exam_categories_name_check check (length(btrim(name)) between 2 and 120),
  constraint system_exam_categories_status_check check (status in ('active', 'archived'))
);

create table if not exists public.system_exam_definitions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.system_exam_categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  default_unit text not null,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_exam_definitions_slug_check check (slug ~ '^[a-z0-9_]+$'),
  constraint system_exam_definitions_name_check check (length(btrim(name)) between 2 and 160),
  constraint system_exam_definitions_unit_check check (length(btrim(default_unit)) between 1 and 30),
  constraint system_exam_definitions_status_check check (status in ('active', 'archived'))
);

create table if not exists public.system_exam_reference_ranges (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.system_exam_definitions(id) on delete cascade,
  sex text not null default 'unisex',
  low_value numeric(14,4),
  high_value numeric(14,4),
  label text,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_exam_reference_ranges_sex_check check (sex in ('unisex', 'male', 'female')),
  constraint system_exam_reference_ranges_bounds_check check ((low_value is not null or high_value is not null) and (low_value is null or high_value is null or low_value <= high_value)),
  constraint system_exam_reference_ranges_status_check check (status in ('active', 'archived'))
);

create unique index if not exists system_exam_reference_ranges_exam_sex_active_key
  on public.system_exam_reference_ranges (exam_id, sex)
  where status = 'active';

create table if not exists public.system_exam_alternative_units (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.system_exam_definitions(id) on delete cascade,
  unit text not null,
  factor_from_default numeric(18,8) not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_exam_alternative_units_unit_check check (length(btrim(unit)) between 1 and 30),
  constraint system_exam_alternative_units_factor_check check (factor_from_default > 0),
  constraint system_exam_alternative_units_status_check check (status in ('active', 'archived'))
);

create unique index if not exists system_exam_alternative_units_exam_unit_active_key
  on public.system_exam_alternative_units (exam_id, lower(unit))
  where status = 'active';

alter table public.partner_exam_categories
  add column if not exists system_exam_category_id uuid references public.system_exam_categories(id) on delete set null;

alter table public.partner_exam_definitions
  add column if not exists system_exam_definition_id uuid references public.system_exam_definitions(id) on delete set null;

create unique index if not exists partner_exam_categories_partner_system_category_key
  on public.partner_exam_categories (partner_id, system_exam_category_id)
  where system_exam_category_id is not null;

create unique index if not exists partner_exam_definitions_partner_system_definition_key
  on public.partner_exam_definitions (partner_id, system_exam_definition_id)
  where system_exam_definition_id is not null;

create index if not exists system_exam_definitions_category_status_idx
  on public.system_exam_definitions (category_id, status, sort_order);

revoke all on table public.system_exam_categories, public.system_exam_definitions, public.system_exam_reference_ranges, public.system_exam_alternative_units
  from public, anon, authenticated;
grant select on table public.system_exam_categories, public.system_exam_definitions, public.system_exam_reference_ranges, public.system_exam_alternative_units to authenticated;
grant all on table public.system_exam_categories, public.system_exam_definitions, public.system_exam_reference_ranges, public.system_exam_alternative_units to service_role;

alter table public.system_exam_categories enable row level security;
alter table public.system_exam_definitions enable row level security;
alter table public.system_exam_reference_ranges enable row level security;
alter table public.system_exam_alternative_units enable row level security;

drop policy if exists system_exam_categories_select_active on public.system_exam_categories;
create policy system_exam_categories_select_active
on public.system_exam_categories for select to authenticated
using (status = 'active');

drop policy if exists system_exam_definitions_select_active on public.system_exam_definitions;
create policy system_exam_definitions_select_active
on public.system_exam_definitions for select to authenticated
using (status = 'active');

drop policy if exists system_exam_reference_ranges_select_active on public.system_exam_reference_ranges;
create policy system_exam_reference_ranges_select_active
on public.system_exam_reference_ranges for select to authenticated
using (status = 'active');

drop policy if exists system_exam_alternative_units_select_active on public.system_exam_alternative_units;
create policy system_exam_alternative_units_select_active
on public.system_exam_alternative_units for select to authenticated
using (status = 'active');

drop table if exists pg_temp.tmp_system_exam_seed;
create temporary table tmp_system_exam_seed (
  category_slug text,
  category_name text,
  category_icon text,
  category_order integer,
  exam_slug text,
  exam_name text,
  default_unit text,
  exam_order integer,
  refs jsonb,
  units jsonb
) on commit drop;

insert into tmp_system_exam_seed (
  category_slug, category_name, category_icon, category_order, exam_slug, exam_name, default_unit, exam_order, refs, units
)
values
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'colesterol_total', 'Colesterol total', 'mg/dL', 10, '[{"sex":"unisex","low":0,"high":200}]', '[{"unit":"mmol/L","factor":0.02586}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'ldl_colesterol', 'LDL-colesterol', 'mg/dL', 20, '[{"sex":"unisex","low":0,"high":100}]', '[{"unit":"mmol/L","factor":0.02586}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'hdl_colesterol', 'HDL-colesterol', 'mg/dL', 30, '[{"sex":"male","low":40,"high":100},{"sex":"female","low":50,"high":100}]', '[{"unit":"mmol/L","factor":0.02586}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'vldl_colesterol', 'VLDL-colesterol', 'mg/dL', 40, '[{"sex":"unisex","low":0,"high":30}]', '[]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'triglicerideos', 'Triglicerídeos', 'mg/dL', 50, '[{"sex":"unisex","low":0,"high":150}]', '[{"unit":"mmol/L","factor":0.01129}]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'apolipoproteina_a1', 'Apolipoproteína A1 (ApoA1)', 'mg/dL', 60, '[{"sex":"male","low":120,"high":160},{"sex":"female","low":140,"high":180}]', '[]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'apolipoproteina_b', 'Apolipoproteína B (ApoB)', 'mg/dL', 70, '[{"sex":"unisex","low":0,"high":90}]', '[]'),
    ('perfil_lipidico', 'Perfil lipídico', 'droplet', 10, 'lipoproteina_a', 'Lipoproteína(a) - Lp(a)', 'mg/dL', 80, '[{"sex":"unisex","low":0,"high":30}]', '[{"unit":"nmol/L","factor":2.4}]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'hemoglobina', 'Hemoglobina', 'g/dL', 10, '[{"sex":"male","low":13.5,"high":17.5},{"sex":"female","low":12,"high":15.5}]', '[{"unit":"mmol/L","factor":0.6206}]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'hematocrito', 'Hematócrito', '%', 20, '[{"sex":"male","low":40,"high":52},{"sex":"female","low":36,"high":46}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'leucocitos', 'Leucócitos', '/μL', 30, '[{"sex":"unisex","low":4000,"high":11000}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'plaquetas', 'Plaquetas', '/μL', 40, '[{"sex":"unisex","low":150000,"high":400000}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'ferritina', 'Ferritina', 'ng/mL', 50, '[{"sex":"male","low":30,"high":300},{"sex":"female","low":15,"high":150}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'ferro_serico', 'Ferro sérico', 'μg/dL', 60, '[{"sex":"male","low":65,"high":175},{"sex":"female","low":50,"high":170}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'transferrina', 'Transferrina', 'mg/dL', 70, '[{"sex":"unisex","low":200,"high":360}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'saturacao_transferrina', 'Saturação de transferrina', '%', 80, '[{"sex":"unisex","low":20,"high":50}]', '[]'),
    ('hematologia', 'Hematologia', 'syringe', 20, 'tibc', 'TIBC (capacidade total de ligação do ferro)', 'μg/dL', 90, '[{"sex":"unisex","low":250,"high":450}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'glicemia_jejum', 'Glicemia de jejum', 'mg/dL', 10, '[{"sex":"unisex","low":70,"high":99}]', '[{"unit":"mmol/L","factor":0.0555}]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'hemoglobina_glicada', 'Hemoglobina glicada (HbA1c)', '%', 20, '[{"sex":"unisex","low":4,"high":5.7}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'insulina_jejum', 'Insulina de jejum', 'μU/mL', 30, '[{"sex":"unisex","low":2,"high":25}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'peptideo_c', 'Peptídeo C', 'ng/mL', 40, '[{"sex":"unisex","low":0.8,"high":3.1}]', '[]'),
    ('metabolismo_da_glicose', 'Metabolismo da glicose', 'activity', 30, 'totg_2h', 'TOTG (2h)', 'mg/dL', 50, '[{"sex":"unisex","low":0,"high":140}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'tgo_ast', 'TGO (AST)', 'U/L', 10, '[{"sex":"male","low":0,"high":40},{"sex":"female","low":0,"high":32}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'tgp_alt', 'TGP (ALT)', 'U/L', 20, '[{"sex":"male","low":0,"high":40},{"sex":"female","low":0,"high":32}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'ggt', 'GGT', 'U/L', 30, '[{"sex":"unisex","low":0,"high":75}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'fosfatase_alcalina', 'Fosfatase alcalina', 'U/L', 40, '[{"sex":"unisex","low":30,"high":120}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'bilirrubina_total', 'Bilirrubina total', 'mg/dL', 50, '[{"sex":"unisex","low":0.3,"high":1.2}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'bilirrubina_direta', 'Bilirrubina direta', 'mg/dL', 60, '[{"sex":"unisex","low":0,"high":0.3}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'bilirrubina_indireta', 'Bilirrubina indireta', 'mg/dL', 70, '[{"sex":"unisex","low":0.2,"high":0.9}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'albumina', 'Albumina', 'g/dL', 80, '[{"sex":"unisex","low":3.5,"high":5}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'proteinas_totais', 'Proteínas totais', 'g/dL', 90, '[{"sex":"unisex","low":6,"high":8.3}]', '[]'),
    ('funcao_hepatica', 'Função hepática', 'flask', 40, 'inr', 'INR', '—', 100, '[{"sex":"unisex","low":0.8,"high":1.2}]', '[]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'creatinina', 'Creatinina', 'mg/dL', 10, '[{"sex":"male","low":0.7,"high":1.2},{"sex":"female","low":0.6,"high":1}]', '[{"unit":"μmol/L","factor":88.4}]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'ureia', 'Ureia', 'mg/dL', 20, '[{"sex":"unisex","low":15,"high":40}]', '[]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'acido_urico', 'Ácido úrico', 'mg/dL', 30, '[{"sex":"male","low":3.4,"high":7},{"sex":"female","low":2.4,"high":6}]', '[]'),
    ('funcao_renal', 'Função renal', 'droplet', 50, 'cistatina_c', 'Cistatina C', 'mg/L', 40, '[{"sex":"male","low":0.56,"high":1.25},{"sex":"female","low":0.49,"high":0.98}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'sodio', 'Sódio', 'mmol/L', 10, '[{"sex":"unisex","low":135,"high":145}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'potassio', 'Potássio', 'mmol/L', 20, '[{"sex":"unisex","low":3.5,"high":5}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'cloro', 'Cloro', 'mmol/L', 30, '[{"sex":"unisex","low":98,"high":107}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'calcio_total', 'Cálcio total', 'mg/dL', 40, '[{"sex":"unisex","low":8.5,"high":10.5}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'magnesio', 'Magnésio', 'mg/dL', 50, '[{"sex":"unisex","low":1.7,"high":2.2}]', '[]'),
    ('eletrolitos', 'Eletrólitos', 'activity', 60, 'fosforo', 'Fósforo', 'mg/dL', 60, '[{"sex":"unisex","low":2.5,"high":4.5}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'tsh', 'TSH', 'mIU/L', 10, '[{"sex":"unisex","low":0.4,"high":5}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 't4_livre', 'T4 livre', 'ng/dL', 20, '[{"sex":"unisex","low":0.9,"high":1.7}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 't3_livre', 'T3 livre', 'pg/mL', 30, '[{"sex":"unisex","low":2.3,"high":4.2}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'anti_tpo', 'Anti-TPO', 'IU/mL', 40, '[{"sex":"unisex","low":0,"high":35}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'anti_tireoglobulina', 'Anti-tireoglobulina', 'IU/mL', 50, '[{"sex":"unisex","low":0,"high":40}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'trab', 'TRAb', 'IU/L', 60, '[{"sex":"unisex","low":0,"high":1.75}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'testosterona_total', 'Testosterona total', 'ng/dL', 70, '[{"sex":"male","low":300,"high":1000},{"sex":"female","low":15,"high":70}]', '[{"unit":"ng/mL","factor":0.01}]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'testosterona_livre', 'Testosterona livre', 'pg/mL', 80, '[{"sex":"male","low":50,"high":210},{"sex":"female","low":1,"high":8.5}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'shbg', 'SHBG', 'nmol/L', 90, '[{"sex":"male","low":10,"high":57},{"sex":"female","low":18,"high":114}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'estradiol', 'Estradiol', 'pg/mL', 100, '[{"sex":"male","low":10,"high":40},{"sex":"female","low":30,"high":400}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'progesterona', 'Progesterona', 'ng/mL', 110, '[{"sex":"male","low":0,"high":1},{"sex":"female","low":0,"high":20}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'lh', 'LH', 'mIU/mL', 120, '[{"sex":"male","low":1.5,"high":9.3},{"sex":"female","low":0.5,"high":76.3}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'fsh', 'FSH', 'mIU/mL', 130, '[{"sex":"male","low":1.4,"high":18.1},{"sex":"female","low":1.5,"high":116.3}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'prolactina', 'Prolactina', 'ng/mL', 140, '[{"sex":"male","low":2,"high":18},{"sex":"female","low":2,"high":29}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'dhea_s', 'DHEA-S', 'μg/dL', 150, '[{"sex":"male","low":80,"high":560},{"sex":"female","low":35,"high":430}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'igf_1', 'IGF-1', 'ng/mL', 160, '[{"sex":"unisex","low":115,"high":358}]', '[]'),
    ('painel_hormonal', 'Painel hormonal', 'flask', 70, 'gh', 'GH', 'ng/mL', 170, '[{"sex":"unisex","low":0,"high":5}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_d', 'Vitamina D', 'ng/mL', 10, '[{"sex":"unisex","low":30,"high":100}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_b12', 'Vitamina B12', 'pg/mL', 20, '[{"sex":"unisex","low":300,"high":900}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'acido_folico', 'Ácido fólico (vitamina B9)', 'ng/mL', 30, '[{"sex":"unisex","low":3,"high":20}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_a', 'Vitamina A', 'μmol/L', 40, '[{"sex":"unisex","low":0.7,"high":3}]', '[]'),
    ('vitaminas', 'Vitaminas', 'pill', 80, 'vitamina_c', 'Vitamina C', 'mg/dL', 50, '[{"sex":"unisex","low":0.4,"high":2}]', '[]'),
    ('minerais_e_oligoelementos', 'Minerais e oligoelementos', 'bone', 90, 'zinco', 'Zinco', 'μg/dL', 10, '[{"sex":"unisex","low":65,"high":120}]', '[]'),
    ('minerais_e_oligoelementos', 'Minerais e oligoelementos', 'bone', 90, 'cobre', 'Cobre', 'μg/dL', 20, '[{"sex":"unisex","low":75,"high":155}]', '[]'),
    ('minerais_e_oligoelementos', 'Minerais e oligoelementos', 'bone', 90, 'selenio', 'Selênio', 'μg/L', 30, '[{"sex":"unisex","low":60,"high":95}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'pcr_us', 'PCR-us', 'mg/L', 10, '[{"sex":"unisex","low":0,"high":1}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'vhs', 'Velocidade de hemossedimentação (VHS)', 'mm/h', 20, '[{"sex":"male","low":0,"high":15},{"sex":"female","low":0,"high":20}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'homocisteina', 'Homocisteína', 'μmol/L', 30, '[{"sex":"unisex","low":0,"high":15}]', '[]'),
    ('marcadores_inflamatorios', 'Marcadores inflamatórios', 'heartPulse', 100, 'fibrinogenio', 'Fibrinogênio', 'mg/dL', 40, '[{"sex":"unisex","low":200,"high":400}]', '[]'),
    ('marcadores_musculares', 'Marcadores musculares', 'activity', 110, 'cpk', 'CPK', 'U/L', 10, '[{"sex":"male","low":38,"high":174},{"sex":"female","low":26,"high":140}]', '[]');

insert into public.system_exam_categories (slug, name, icon_key, sort_order, status)
select distinct on (category_slug) category_slug, category_name, category_icon, category_order, 'active'
from tmp_system_exam_seed
order by category_slug, category_order
on conflict (slug) do update
set name = excluded.name, icon_key = excluded.icon_key, sort_order = excluded.sort_order, status = 'active';

insert into public.system_exam_definitions (category_id, slug, name, default_unit, sort_order, status)
select category.id, seed.exam_slug, seed.exam_name, seed.default_unit, seed.exam_order, 'active'
from tmp_system_exam_seed seed
join public.system_exam_categories category on category.slug = seed.category_slug
on conflict (slug) do update
set category_id = excluded.category_id, name = excluded.name, default_unit = excluded.default_unit, sort_order = excluded.sort_order, status = 'active';

insert into public.system_exam_reference_ranges (exam_id, sex, low_value, high_value, sort_order, status)
select definition.id, reference.sex, reference.low, reference.high, row_number() over (partition by definition.id order by reference.sex)::integer, 'active'
from tmp_system_exam_seed seed
join public.system_exam_definitions definition on definition.slug = seed.exam_slug
cross join lateral jsonb_to_recordset(seed.refs) as reference(sex text, low numeric, high numeric)
on conflict (exam_id, sex) where status = 'active' do update
set low_value = excluded.low_value, high_value = excluded.high_value, sort_order = excluded.sort_order;

insert into public.system_exam_alternative_units (exam_id, unit, factor_from_default, status)
select definition.id, unit.unit, unit.factor, 'active'
from tmp_system_exam_seed seed
join public.system_exam_definitions definition on definition.slug = seed.exam_slug
cross join lateral jsonb_to_recordset(seed.units) as unit(unit text, factor numeric)
on conflict (exam_id, (lower(unit))) where status = 'active' do update
set factor_from_default = excluded.factor_from_default;

create or replace function public.sync_partner_system_exam_catalog(p_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.partner_exam_categories (partner_id, slug, name, icon_key, sort_order, status, system_exam_category_id)
  select p_partner_id, category.slug, category.name, category.icon_key, category.sort_order, 'active', category.id
  from public.system_exam_categories category
  where category.status = 'active'
  on conflict (partner_id, slug) do update
  set name = excluded.name, icon_key = excluded.icon_key, sort_order = excluded.sort_order, status = 'active', system_exam_category_id = excluded.system_exam_category_id;

  insert into public.partner_exam_definitions (partner_id, category_id, slug, name, default_unit, sort_order, status, system_exam_definition_id)
  select p_partner_id, partner_category.id, definition.slug, definition.name, definition.default_unit, definition.sort_order, 'active', definition.id
  from public.system_exam_definitions definition
  join public.system_exam_categories system_category on system_category.id = definition.category_id
  join public.partner_exam_categories partner_category
    on partner_category.partner_id = p_partner_id
   and partner_category.system_exam_category_id = system_category.id
  where definition.status = 'active'
  on conflict (partner_id, slug) do update
  set category_id = excluded.category_id, name = excluded.name, default_unit = excluded.default_unit, sort_order = excluded.sort_order, status = 'active', system_exam_definition_id = excluded.system_exam_definition_id;

  insert into public.partner_exam_reference_ranges (partner_id, exam_id, sex, low_value, high_value, label, sort_order, status)
  select p_partner_id, partner_definition.id, reference.sex, reference.low_value, reference.high_value, reference.label, reference.sort_order, 'active'
  from public.system_exam_reference_ranges reference
  join public.partner_exam_definitions partner_definition
    on partner_definition.partner_id = p_partner_id
   and partner_definition.system_exam_definition_id = reference.exam_id
  where reference.status = 'active'
  on conflict (partner_id, exam_id, sex) where status = 'active' do update
  set low_value = excluded.low_value, high_value = excluded.high_value, label = excluded.label, sort_order = excluded.sort_order;

  insert into public.partner_exam_alternative_units (partner_id, exam_id, unit, factor_from_default, status)
  select p_partner_id, partner_definition.id, unit.unit, unit.factor_from_default, 'active'
  from public.system_exam_alternative_units unit
  join public.partner_exam_definitions partner_definition
    on partner_definition.partner_id = p_partner_id
   and partner_definition.system_exam_definition_id = unit.exam_id
  where unit.status = 'active'
  on conflict (partner_id, exam_id, (lower(unit))) where status = 'active' do update
  set factor_from_default = excluded.factor_from_default;
end;
$$;

revoke all on function public.sync_partner_system_exam_catalog(uuid) from public;
grant execute on function public.sync_partner_system_exam_catalog(uuid) to service_role;

do $$
declare
  partner_row record;
begin
  for partner_row in select id from public.partners loop
    perform public.sync_partner_system_exam_catalog(partner_row.id);
  end loop;
end $$;

create or replace function public.sync_partner_system_exam_catalog_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.sync_partner_system_exam_catalog(new.id);
  return new;
end;
$$;

drop trigger if exists partners_sync_system_exam_catalog on public.partners;
create trigger partners_sync_system_exam_catalog
after insert on public.partners
for each row execute function public.sync_partner_system_exam_catalog_on_insert();

comment on table public.system_exam_definitions is 'Catálogo global versionado de exames padrão do Projeto Leo Barros. Fonte inicial: seed estrutural existente, promovida para migration em 2026-08-10.';
comment on function public.sync_partner_system_exam_catalog(uuid) is 'Materializa exames globais no catálogo do parceiro de forma idempotente, preservando exames customizados e FKs existentes de resultados.';
