# Leo Parceiros - Cliente Avaliações

Use esta skill ao trabalhar na aba Avaliações do Cliente individual em `/parceiros/clientes/[id]?tab=avaliacoes`.

## Contexto

- A tela segue o Figma `1:9498`, adaptado às regras do perfil Parceiros.
- A linguagem visível é sempre `Clientes`.
- `Cardio` não aparece como aba ou módulo separado.
- A aba é técnica: avaliações corporais, dobras cutâneas, circunferências, cálculo calórico, gráficos e histórico.

## Fontes

1. `docs/page-profiles/parceiros-cliente-avaliacoes.md`
2. `src/app/parceiros/clientes/[id]/partner-client-assessments-view.tsx`
3. `src/lib/partners/client-assessments-data.ts`
4. `src/lib/partners/client-assessments-metrics.ts`
5. `supabase/migrations/20260701113000_partner_client_assessments.sql`
6. `supabase/migrations/20260701194500_partner_client_assessment_physical_metrics.sql`

## Regras

- Não consultar tabelas clínicas diretamente no browser; usar data layer server-side.
- Manter cálculos em `client-assessments-metrics.ts`, não embutidos na UI.
- Se salvar avaliação, preservar a sincronização com `partner_client_body_measurements`.
- Dobras cutâneas ficam em `partner_client_assessment_skinfolds`; circunferências ficam em `partner_client_assessment_circumferences`.
- Gráficos de projeção/composição/dobras/circunferências devem usar domínio Y dinâmico quando os valores estiverem próximos.
- `Aplicar ao plano` deve continuar sendo snapshot aplicado, sem criar editor de dieta.
- Ao alterar banco, atualizar SQL tests, seeds e tipos Supabase.
