begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

select has_table('public', 'system_foods', 'catálogo global de alimentos existe');
select has_table('public', 'system_exercises', 'catálogo global de exercícios existe');
select has_table('public', 'system_exercise_media', 'versões de mídia oficiais de exercícios existem');
select has_table('public', 'catalog_import_batches', 'lotes de importação existem');
select has_table('public', 'catalog_import_items', 'itens de importação existem');

select has_column('public', 'partner_protocol_foods', 'system_food_id', 'alimento privado referencia origem global');
select has_column('public', 'partner_protocol_exercises', 'system_exercise_id', 'exercício privado referencia origem global');
select has_column('public', 'system_exercises', 'source_gif_storage_path', 'exercício global preserva GIF original');
select has_column('public', 'system_exercises', 'preview_storage_path', 'exercício global aponta preview otimizado');
select has_column('public', 'system_exercises', 'media_checksum', 'exercício global registra checksum da mídia');
select has_column('public', 'system_exercise_media', 'poster_storage_path', 'mídia oficial registra poster');
select has_column('public', 'system_exercise_media', 'preview_storage_path', 'mídia oficial registra preview');
select has_index('public', 'partner_protocol_foods', 'partner_protocol_foods_partner_system_food_key', 'importação de alimento é idempotente por parceiro');
select has_index('public', 'partner_protocol_exercises', 'partner_protocol_exercises_partner_system_exercise_key', 'importação de exercício é idempotente por parceiro');
select has_index('public', 'catalog_import_items', 'catalog_import_items_partner_idx', 'auditoria de importação indexa parceiro');
select has_index('public', 'catalog_import_items', 'catalog_import_items_system_food_idx', 'auditoria de importação indexa alimento global');
select has_index('public', 'catalog_import_items', 'catalog_import_items_partner_food_idx', 'auditoria de importação indexa alimento privado');
select has_index('public', 'catalog_import_items', 'catalog_import_items_system_exercise_idx', 'auditoria de importação indexa exercício global');
select has_index('public', 'catalog_import_items', 'catalog_import_items_partner_exercise_idx', 'auditoria de importação indexa exercício privado');
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'system_exercise_media_select_public'
  ),
  0,
  'bucket público de exercícios não expõe listagem ampla por policy'
);

select ok(
  has_table_privilege('authenticated', 'public.system_foods', 'select')
  and not has_table_privilege('authenticated', 'public.system_foods', 'insert')
  and not has_table_privilege('authenticated', 'public.system_foods', 'update')
  and has_table_privilege('authenticated', 'public.system_exercises', 'select')
  and not has_table_privilege('authenticated', 'public.system_exercises', 'insert')
  and not has_table_privilege('authenticated', 'public.system_exercises', 'update')
  and has_table_privilege('authenticated', 'public.system_exercise_media', 'select')
  and not has_table_privilege('authenticated', 'public.system_exercise_media', 'insert')
  and not has_table_privilege('authenticated', 'public.system_exercise_media', 'update'),
  'parceiro consulta globais, mas não edita catálogo do sistema'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'catalog-partner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'ac100000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'catalog-partner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, user_id, email, display_name, role, status)
values
  ('ac100000-0000-4000-8000-000000000101', 'ac100000-0000-4000-8000-000000000001', 'catalog-partner-a@example.invalid', 'Catalog Parceiro A', 'parceiro', 'active'),
  ('ac100000-0000-4000-8000-000000000102', 'ac100000-0000-4000-8000-000000000002', 'catalog-partner-b@example.invalid', 'Catalog Parceiro B', 'parceiro', 'active');

insert into public.partners (id, profile_id, professional_name, professional_type)
values
  ('ac100000-0000-4000-8000-000000000201', 'ac100000-0000-4000-8000-000000000101', 'Catalog Parceiro A', 'nutricionista'),
  ('ac100000-0000-4000-8000-000000000202', 'ac100000-0000-4000-8000-000000000102', 'Catalog Parceiro B', 'personal_trainer');

insert into public.system_foods (
  id, source_key, food_number, description, category_taco, partner_category,
  predominant_macro, energy_kcal_100g, carbohydrate_g_100g, protein_g_100g,
  lipids_g_100g, fiber_g_100g, carbohydrate_g_per_g, protein_g_per_g,
  fat_g_per_g, fiber_g_per_g, energy_kcal_per_g, source_name, source_version,
  source_checksum, source_row_hash, publication_status
)
values
  (
    'ac100000-0000-4000-8000-000000000301',
    'taco-test-1',
    9001,
    'Alimento global publicado',
    'Cereais e derivados',
    'cereal',
    'Carboidrato',
    120,
    20,
    3,
    1,
    null,
    0.2,
    0.03,
    0.01,
    null,
    1.2,
    'TACO 4a ed. (2011) - NEPA/UNICAMP',
    'TACO 4a ed. (2011)',
    'checksum-test',
    'rowhash-test-1',
    'published'
  ),
  (
    'ac100000-0000-4000-8000-000000000302',
    'taco-test-2',
    9002,
    'Alimento global rascunho',
    'Cereais e derivados',
    'cereal',
    'Carboidrato',
    100,
    18,
    2,
    0,
    null,
    0.18,
    0.02,
    0,
    null,
    1,
    'TACO 4a ed. (2011) - NEPA/UNICAMP',
    'TACO 4a ed. (2011)',
    'checksum-test',
    'rowhash-test-2',
    'draft'
  );

insert into public.system_exercises (
  id, source_key, name, slug, description, instructions, primary_muscle_group,
  secondary_muscle_groups, category, equipment, difficulty_level, movement_pattern,
  laterality, source_name, source_version, source_checksum, publication_status,
  source_gif_storage_path, poster_storage_path, preview_storage_path, media_checksum,
  media_version, media_width, media_height, media_frame_count, media_is_animated,
  source_size_bytes, poster_size_bytes, preview_size_bytes, source_mime_type,
  poster_mime_type, preview_mime_type, media_status, media_published_at
)
values
  (
    'ac100000-0000-4000-8000-000000000401',
    'exercise-test-1',
    'Exercício global publicado',
    'exercicio-global-publicado',
    'Descrição segura.',
    'Executar com controle.',
    'pernas',
    array['gluteos', 'core'],
    'forca',
    'barra',
    'intermediario',
    'agachar',
    'bilateral',
    'Biblioteca oficial',
    'v0',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'published',
    'exercise-library/EX-TESTE/a1b2c3d4/source.gif',
    'exercise-library/EX-TESTE/a1b2c3d4/poster.webp',
    'exercise-library/EX-TESTE/a1b2c3d4/preview.webp',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'v0',
    480,
    480,
    12,
    true,
    1000,
    200,
    300,
    'image/gif',
    'image/webp',
    'image/webp',
    'published',
    now()
  ),
  (
    'ac100000-0000-4000-8000-000000000402',
    'exercise-test-2',
    'Exercício global rascunho',
    'exercicio-global-rascunho',
    'Descrição segura.',
    'Executar com controle.',
    null,
    '{}',
    null,
    null,
    null,
    'agachar',
    null,
    'Biblioteca oficial',
    'v0',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'draft',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'pending',
    null
  );

insert into public.system_exercise_media (
  system_exercise_id, source_key, exercise_code, media_version, source_checksum,
  source_file_name, source_relative_path, source_storage_path, poster_storage_path,
  preview_storage_path, original_width, original_height, frame_count, is_animated,
  duration_ms, original_size_bytes, poster_size_bytes, preview_size_bytes,
  source_mime_type, poster_mime_type, preview_mime_type, status, published_at
)
values (
  'ac100000-0000-4000-8000-000000000401',
  'exercise-test-1',
  'EX-TESTE',
  'v0',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'Teste.gif',
  'Teste.gif',
  'exercise-library/EX-TESTE/a1b2c3d4/source.gif',
  'exercise-library/EX-TESTE/a1b2c3d4/poster.webp',
  'exercise-library/EX-TESTE/a1b2c3d4/preview.webp',
  480,
  480,
  12,
  true,
  1200,
  1000,
  200,
  300,
  'image/gif',
  'image/webp',
  'image/webp',
  'published',
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.system_foods where source_key like 'taco-test-%'),
  1,
  'parceiro lê somente alimento global publicado'
);

select is(
  (select count(*)::integer from public.system_exercises where source_key like 'exercise-test-%'),
  1,
  'parceiro lê somente exercício global publicado'
);

select is(
  (select count(*)::integer from public.system_exercise_media where source_key = 'exercise-test-1'),
  1,
  'parceiro lê mídia oficial apenas de exercício publicado'
);

select is(
  (public.partner_import_system_foods(array['ac100000-0000-4000-8000-000000000301'::uuid], false, null, null, null)->>'imported')::integer,
  1,
  'parceiro importa alimento global publicado'
);

select is(
  (public.partner_import_system_foods(array['ac100000-0000-4000-8000-000000000301'::uuid], false, null, null, null)->>'alreadyImported')::integer,
  1,
  'reimportação de alimento não duplica'
);

select is(
  (select count(*)::integer from public.partner_protocol_foods where system_food_id = 'ac100000-0000-4000-8000-000000000301'),
  1,
  'constraint mantém uma cópia privada do alimento por parceiro'
);

select ok(
  (select source_snapshot->>'fiberG100g' from public.partner_protocol_foods where system_food_id = 'ac100000-0000-4000-8000-000000000301') is null,
  'snapshot preserva fibra nula da fonte'
);

select is(
  (public.partner_import_system_exercises(array['ac100000-0000-4000-8000-000000000401'::uuid], false, null, null, null)->>'imported')::integer,
  1,
  'parceiro importa exercício global publicado'
);

select is(
  (select thumbnail_url from public.partner_protocol_exercises where system_exercise_id = 'ac100000-0000-4000-8000-000000000401'),
  '/storage/v1/object/public/system-exercise-media/exercise-library/EX-TESTE/a1b2c3d4/poster.webp',
  'importação privada usa poster oficial como thumbnail'
);

select is(
  (select video_url from public.partner_protocol_exercises where system_exercise_id = 'ac100000-0000-4000-8000-000000000401'),
  '/storage/v1/object/public/system-exercise-media/exercise-library/EX-TESTE/a1b2c3d4/preview.webp',
  'importação privada usa preview oficial como mídia'
);

select is(
  (public.partner_import_system_exercises(array['ac100000-0000-4000-8000-000000000401'::uuid], false, null, null, null)->>'alreadyImported')::integer,
  1,
  'reimportação de exercício não duplica'
);

select throws_ok(
  $$ update public.system_foods set description = 'Alteração indevida' where id = 'ac100000-0000-4000-8000-000000000301' $$,
  '42501',
  null,
  'parceiro não edita alimento global'
);

select throws_ok(
  $$ update public.system_exercises set name = 'Alteração indevida' where id = 'ac100000-0000-4000-8000-000000000401' $$,
  '42501',
  null,
  'parceiro não edita exercício global'
);

select throws_ok(
  $$ insert into public.system_exercise_media (
    system_exercise_id, source_key, exercise_code, media_version, source_checksum,
    source_file_name, source_relative_path, source_storage_path, poster_storage_path,
    original_width, original_height, frame_count, is_animated, original_size_bytes,
    poster_size_bytes
  ) values (
    'ac100000-0000-4000-8000-000000000401', 'exercise-test-1', 'EX-TESTE-2', 'v0',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    'Teste 2.gif', 'Teste 2.gif', 'exercise-library/EX-TESTE-2/cccccccc/source.gif',
    'exercise-library/EX-TESTE-2/cccccccc/poster.webp', 480, 480, 1, false, 1000, 200
  ) $$,
  '42501',
  null,
  'parceiro não cria versão de mídia oficial'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner, metadata) values ('system-exercise-media', 'pernas/teste.gif', auth.uid(), '{"mimetype":"image/gif"}') $$,
  '42501',
  null,
  'parceiro comum não envia mídia oficial de exercício'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.partner_protocol_foods where system_food_id = 'ac100000-0000-4000-8000-000000000301'),
  0,
  'outro parceiro não lê alimento privado importado'
);

select is(
  (select count(*)::integer from public.partner_protocol_exercises where system_exercise_id = 'ac100000-0000-4000-8000-000000000401'),
  0,
  'outro parceiro não lê exercício privado importado'
);

select is(
  (public.partner_import_system_foods(array['ac100000-0000-4000-8000-000000000301'::uuid], false, null, null, null)->>'imported')::integer,
  1,
  'segundo parceiro importa sua própria cópia sem acessar tenant alheio'
);

select * from finish();

rollback;
