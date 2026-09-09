# Publicação e recuperação

1. Confirmar o projeto `ltporrxlugkspjfbqvga`, histórico remoto de migrations e build revisado. Não usar reset remoto.
2. Aplicar `20260909120000_partner_client_profile_editor.sql` e `20260909121000_exercise_muscle_classification.sql`, preservando migrations anteriores.
3. Como operador autorizado, executar `select public.repair_exercise_muscle_classifications(true);` e registrar os totais. O retorno não inclui dados pessoais. Revisar as 35 entradas `pending_review` separadamente.
4. Executar `select public.repair_exercise_muscle_classifications(false);` após revisar o relatório. A operação é transacional, grava antes/depois e só altera classificações vazias/padrão com origem identificada.
5. Repetir a simulação: os três totais de candidatos devem ser zero. Conferir auditoria e um exemplo de catálogo, cópia privada e snapshot; verificar que séries, cargas e publicação não mudaram.
6. Publicar o código após ambas as migrations. Seguir o fluxo de release documentado (`dev` → `homolog` → `main`), com revisão do PR de produção.
7. Validar em produção: drawer em todas as abas e na lista, busca por alimentos/exercícios sem POST ao digitar, imagens e intensidades musculares.

## Recuperação

- Código: retornar ao build anterior se houver regressão; as novas RPCs são aditivas e a operação de bio antiga permanece válida.
- Cadastro: transação garante que nome, telefones e bio sejam atualizados em conjunto; e-mail e credenciais ficam fora da operação.
- Classificação: usar `exercise_muscle_repair_audit` como fonte de antes/depois para uma migration corretiva. Só restaurar registros cujo estado atual ainda coincide com `after_values`, preservando edições posteriores. Usar os nomes `primary`/`secondary` do JSON com as colunas de cada tabela. No catálogo global, a restauração de um valor vazio requer tratar o trigger na mesma transação; não desabilitar proteções fora da correção revisada.
- Uma classificação manual já identificada é preservada. O valor padrão `outros` com lista secundária vazia, sem histórico de autoria, é indistinguível de uma escolha manual equivalente; revisar candidatos antes da aplicação remota.
