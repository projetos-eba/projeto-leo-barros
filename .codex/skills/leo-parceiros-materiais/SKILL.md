---
name: leo-parceiros-materiais
description: Use ao criar, revisar ou alterar a biblioteca, uploads, compartilhamentos, previews, histórico ou Storage da rota /parceiros/materiais do Projeto Leo Barros.
---

# Parceiros - Materiais

Antes de alterar Materiais, ler:

1. `AGENTS.md`
2. `docs/page-profiles/parceiros-materiais.md`
3. `src/app/parceiros/materiais/partner-materials-view.tsx`
4. `src/app/parceiros/materiais/actions.ts`
5. `src/lib/partners/materials-data.ts`
6. `src/lib/partners/materials-metrics.ts`
7. `supabase/migrations/20260630233000_partner_materials.sql`

Regras obrigatórias:

- Usar `Clientes`, nunca `Pacientes`, na interface.
- Não exibir CPF ou `Cardio`.
- Manter o bucket `partner-materials` privado e usar URLs assinadas temporárias.
- Restringir objetos pelo primeiro segmento do caminho, que deve ser o `partner_id`.
- Compartilhar apenas com Clientes ativos vinculados ao parceiro.
- Não simular envio de e-mail nem leitura pelo Cliente.
- Vídeos aceitam somente links HTTPS do YouTube ou Vimeo.
- Arquivar é reversível; não adicionar exclusão definitiva sem decisão explícita.
- Manter fixtures binárias em `supabase/seed-assets/materials` e metadados em `supabase/seed.sql`.
- Validar alterações com testes unitários, SQL, build e smoke visual.
