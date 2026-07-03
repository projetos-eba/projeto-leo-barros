# Leo Parceiros / Cliente / Fotos

Use esta skill ao trabalhar na aba `Fotos` em `/parceiros/clientes/[id]?tab=fotos`.

## Invariantes
- UI sempre usa `Cliente`/`Clientes`; não usar `Paciente`/`Pacientes`.
- CPF não aparece em tela, PDF, RPC ou exportações.
- Perfil superior deve continuar sendo `PartnerClientProfileHeader`.
- Fotos ficam em Storage privado `partner-client-photos`; não reutilizar `patient-photos`.
- Banco, RLS, grants, triggers, bucket e RPC ficam em migrations.
- Seeds/metadados de smoke ficam em `supabase/seed.sql`; arquivos de teste são enviados pelo script `npm run dev:seed-client-photos-storage`.

## Dados
- Sessões: `partner_client_photo_sessions`.
- Arquivos por ângulo: `partner_client_photo_items`.
- Observações por comparação: `partner_client_photo_comparison_notes`.
- Auditoria: `partner_client_photo_events`.
- RPC: `partner_client_photos(patient_id)`.

## UI esperada
- Nova sessão com 4 ângulos: frente, costas, lado esquerdo e lado direito.
- Linha do tempo com miniaturas e ações.
- Comparação A/B com seleção de sessões, troca de ordem, zoom, tabs por ângulo e painel lateral.
- Medidas do resumo vêm das avaliações físicas mais próximas de cada sessão.
