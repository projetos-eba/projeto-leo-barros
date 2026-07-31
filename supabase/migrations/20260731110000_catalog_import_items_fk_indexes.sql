create index if not exists catalog_import_items_partner_idx
  on public.catalog_import_items (partner_id);

create index if not exists catalog_import_items_system_food_idx
  on public.catalog_import_items (system_food_id)
  where system_food_id is not null;

create index if not exists catalog_import_items_partner_food_idx
  on public.catalog_import_items (partner_food_id, partner_id)
  where partner_food_id is not null;

create index if not exists catalog_import_items_system_exercise_idx
  on public.catalog_import_items (system_exercise_id)
  where system_exercise_id is not null;

create index if not exists catalog_import_items_partner_exercise_idx
  on public.catalog_import_items (partner_exercise_id, partner_id)
  where partner_exercise_id is not null;
