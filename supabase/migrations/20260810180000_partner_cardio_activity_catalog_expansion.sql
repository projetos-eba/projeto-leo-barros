do $$
begin
  alter table public.partner_client_cardio_plans
    drop constraint if exists partner_client_cardio_plans_primary_activity_check,
    drop constraint if exists partner_client_cardio_plans_comparison_activity_check;

  alter table public.partner_client_cardio_plans
    add constraint partner_client_cardio_plans_primary_activity_check
      check (primary_activity_key in (
        'bicicleta_leve', 'caminhada_leve', 'caminhada_moderada', 'corrida_forte', 'corrida_moderada', 'eliptico',
        'caminhada_leve_32', 'caminhada_leve_40', 'caminhada_moderada_48', 'caminhada_moderada_60',
        'corrida_moderada_65', 'corrida_intenso_97',
        'natacao_leve_lento', 'natacao_moderado_livre', 'natacao_intenso_competicao',
        'ciclismo_leve_16', 'ciclismo_moderado_20', 'ciclismo_intenso_25',
        'musculacao_leve_baixo_esforco', 'musculacao_moderado_esforco', 'musculacao_intenso_vigoroso',
        'futebol_geral_recreacional', 'jiu_jitsu_intenso_competicao',
        'assistir_tv_sedentario', 'dormir_descanso', 'sexo_variavel_tipica'
      )),
    add constraint partner_client_cardio_plans_comparison_activity_check
      check (comparison_activity_key in (
        'bicicleta_leve', 'caminhada_leve', 'caminhada_moderada', 'corrida_forte', 'corrida_moderada', 'eliptico',
        'caminhada_leve_32', 'caminhada_leve_40', 'caminhada_moderada_48', 'caminhada_moderada_60',
        'corrida_moderada_65', 'corrida_intenso_97',
        'natacao_leve_lento', 'natacao_moderado_livre', 'natacao_intenso_competicao',
        'ciclismo_leve_16', 'ciclismo_moderado_20', 'ciclismo_intenso_25',
        'musculacao_leve_baixo_esforco', 'musculacao_moderado_esforco', 'musculacao_intenso_vigoroso',
        'futebol_geral_recreacional', 'jiu_jitsu_intenso_competicao',
        'assistir_tv_sedentario', 'dormir_descanso', 'sexo_variavel_tipica'
      ));

  alter table public.partner_client_cardio_calculations
    drop constraint if exists partner_client_cardio_calculations_activity_check,
    drop constraint if exists partner_client_cardio_calculations_comparison_activity_check;

  alter table public.partner_client_cardio_calculations
    add constraint partner_client_cardio_calculations_activity_check
      check (activity_key in (
        'bicicleta_leve', 'caminhada_leve', 'caminhada_moderada', 'corrida_forte', 'corrida_moderada', 'eliptico',
        'caminhada_leve_32', 'caminhada_leve_40', 'caminhada_moderada_48', 'caminhada_moderada_60',
        'corrida_moderada_65', 'corrida_intenso_97',
        'natacao_leve_lento', 'natacao_moderado_livre', 'natacao_intenso_competicao',
        'ciclismo_leve_16', 'ciclismo_moderado_20', 'ciclismo_intenso_25',
        'musculacao_leve_baixo_esforco', 'musculacao_moderado_esforco', 'musculacao_intenso_vigoroso',
        'futebol_geral_recreacional', 'jiu_jitsu_intenso_competicao',
        'assistir_tv_sedentario', 'dormir_descanso', 'sexo_variavel_tipica'
      )),
    add constraint partner_client_cardio_calculations_comparison_activity_check
      check (comparison_activity_key in (
        'bicicleta_leve', 'caminhada_leve', 'caminhada_moderada', 'corrida_forte', 'corrida_moderada', 'eliptico',
        'caminhada_leve_32', 'caminhada_leve_40', 'caminhada_moderada_48', 'caminhada_moderada_60',
        'corrida_moderada_65', 'corrida_intenso_97',
        'natacao_leve_lento', 'natacao_moderado_livre', 'natacao_intenso_competicao',
        'ciclismo_leve_16', 'ciclismo_moderado_20', 'ciclismo_intenso_25',
        'musculacao_leve_baixo_esforco', 'musculacao_moderado_esforco', 'musculacao_intenso_vigoroso',
        'futebol_geral_recreacional', 'jiu_jitsu_intenso_competicao',
        'assistir_tv_sedentario', 'dormir_descanso', 'sexo_variavel_tipica'
      ));

  alter table public.partner_client_cardio_sessions
    drop constraint if exists partner_client_cardio_sessions_activity_check;

  alter table public.partner_client_cardio_sessions
    add constraint partner_client_cardio_sessions_activity_check
      check (activity_key in (
        'bicicleta_leve', 'caminhada_leve', 'caminhada_moderada', 'corrida_forte', 'corrida_moderada', 'eliptico',
        'caminhada_leve_32', 'caminhada_leve_40', 'caminhada_moderada_48', 'caminhada_moderada_60',
        'corrida_moderada_65', 'corrida_intenso_97',
        'natacao_leve_lento', 'natacao_moderado_livre', 'natacao_intenso_competicao',
        'ciclismo_leve_16', 'ciclismo_moderado_20', 'ciclismo_intenso_25',
        'musculacao_leve_baixo_esforco', 'musculacao_moderado_esforco', 'musculacao_intenso_vigoroso',
        'futebol_geral_recreacional', 'jiu_jitsu_intenso_competicao',
        'assistir_tv_sedentario', 'dormir_descanso', 'sexo_variavel_tipica'
      ));
end $$;

comment on constraint partner_client_cardio_plans_primary_activity_check on public.partner_client_cardio_plans
  is 'Permite chaves do catálogo Cardio v2; cálculo segue bloqueado no app até MET aprovado quando metStatus=pending.';

comment on constraint partner_client_cardio_calculations_activity_check on public.partner_client_cardio_calculations
  is 'Permite chaves do catálogo Cardio v2; linhas calculadas continuam exigindo met > 0.';

comment on constraint partner_client_cardio_sessions_activity_check on public.partner_client_cardio_sessions
  is 'Permite chaves do catálogo Cardio v2; sessões persistidas continuam exigindo met > 0.';
