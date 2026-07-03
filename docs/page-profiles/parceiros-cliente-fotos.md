# Parceiros / Cliente / Fotos

## Rota
- `/parceiros/clientes/[id]?tab=fotos`

## Regras
- A interface usa `Cliente`/`Clientes`, nunca `Paciente`/`Pacientes`.
- CPF não aparece na UI, RPC, PDF ou metadados retornados.
- Fotos clínicas ficam no bucket privado `partner-client-photos`; o legado público `patient-photos` não é usado.
- O perfil superior vem de `PartnerClientProfileHeader` e deve ficar idêntico às demais abas implementadas.

## Funcionalidades
- Nova sessão com data, observações e quatro ângulos: frente, costas, lado esquerdo e lado direito.
- Upload client-side para Storage privado e registro por server action.
- Linha do tempo com miniaturas, status completo/rascunho, visualizar e remover sessão.
- Comparação antes/depois com seleção de sessões, troca de ordem, tabs por ângulo, zoom e abertura em tela cheia.
- Resumo comparativo usa medidas reais das avaliações físicas mais próximas das sessões.
- Observações do profissional são salvas por par de sessões.
- Exportação inicial gera PDF simples com datas, deltas, observações e disponibilidade de ângulos.

## Dados
- Tabelas principais:
  - `partner_client_photo_sessions`
  - `partner_client_photo_items`
  - `partner_client_photo_comparison_notes`
  - `partner_client_photo_events`
- RPC:
  - `partner_client_photos(patient_id)`
- Seed:
  - Ana tem 2 sessões e 8 fotos registradas.
  - Arquivos locais de teste ficam em `docs/Fotos-teste-Evolucao`.
  - Após reset local, executar `npm run dev:seed-client-photos-storage` para subir os PNGs ao Storage.
