# Parceiros - Materiais

## Rota

- Biblioteca: `/parceiros/materiais`
- Detalhe: `/parceiros/materiais/[id]`
- Arquivo protegido: `/parceiros/materiais/[id]/arquivo`
- Acesso: perfil `parceiro` ativo.

## Objetivo

Permitir que o parceiro organize arquivos e vídeos de apoio, encontre conteúdos rapidamente e registre compartilhamentos com Clientes vinculados.

## Referência Visual

Não há frame Figma dedicado. A composição segue as quatro referências fornecidas no ciclo de implementação e os tokens já usados em Clientes e Agenda: fundo `#0b1720`, painéis escuros, bordas discretas, azul primário e alta densidade.

## Fontes de Dados

- `partner_materials`: metadados, organização, status e favorito.
- `partner_material_shares`: vínculos do material com Clientes.
- `partner_material_events`: histórico auditável.
- RPC `partner_clients_list`: Clientes disponíveis para compartilhamento.
- Bucket privado `partner-materials`: arquivos e capas.

## Experiência

- Métricas de materiais ativos, compartilhamentos, formulários e favoritos.
- Categorias: Nutrição, Treino, Médico, Educativo, Formulários e Outros.
- Busca por título, descrição e tags; filtros de tipo/status; ordenação e grade/lista.
- Novo material por arquivo ou link de vídeo.
- Arquivos: PDF, JPG, PNG, DOCX, XLSX e PPTX, até 50 MB.
- Vídeos: somente YouTube ou Vimeo.
- Detalhe com preview de PDF/imagem/vídeo, download de Office, metadados, Clientes e histórico.
- Favoritar, editar, arquivar/restaurar, compartilhar e revogar compartilhamento.

## Privacidade

- Interface usa sempre `Clientes`.
- CPF e `Cardio` não aparecem.
- Bucket é privado; acesso ocorre por URL assinada de curta duração.
- Parceiro acessa somente seus materiais e compartilha apenas com Cliente vinculado.
- Cliente e Admin não leem materiais nesta versão.
- Não há envio real de e-mail nem status de leitura.

## Smoke

- `Plano Alimentar Low Carb - 7 Dias`: Nutrição, compartilhado com Ana Ribeiro.
- `Plano de Treino ABC`: Treino, favorito e não compartilhado.
- Binários: `supabase/seed-assets/materials`.
- Após reset local, executar `npm run dev:seed-partner-materials-storage`.

## Validação

- `src/lib/partners/materials-metrics.test.ts`
- `src/app/parceiros/materiais/partner-materials-view.test.tsx`
- `supabase/tests/014_partner_materials.test.sql`
- Smoke: filtros, layouts, drawers, detalhe dos PDFs, vídeo, favorito, compartilhamento, arquivamento, desktop/mobile e console limpo.
