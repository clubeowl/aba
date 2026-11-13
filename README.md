# Dedé · SeuBoné

Painel do time de design da SeuBoné. Os designers lançam o que fizeram no dia. A gestão confere, aprova, aponta erros, lança as horas online e acompanha quanto cada um tem a receber.

> **Modo demonstração.** Por enquanto os dados ficam salvos no navegador de quem abre (localStorage). Serve para testar o fluxo e as regras. Para o time inteiro usar ao mesmo tempo, veja "Próximos passos".

## Os 3 menus

| Menu | Quem vê | O que tem |
|---|---|---|
| **Atividades** | todos | **Designer:** um resumo do período (pontos aprovados, o que está aguardando, horas online, bônus e quanto vai receber), uma linha para lançar atividades (data, hora, cliente, nº lulu, tipo e quantidade, com a pontuação já calculada pela tabela) e uma tabela com o status de cada lançamento. Pode editar ou excluir o que ainda não foi aprovado e corrigir o que voltou com erro. **Admin:** a tabela do time inteiro, onde pode aprovar (uma por uma ou todas de uma vez), apontar erro com comentário, recusar, mudar a pontuação direto na célula, editar, criar atividade extra com pontos livres e lançar as **horas online** de cada designer (por dia ou pela grade da semana). |
| **Equipe** | só admin | Cadastro dos designers (nome, CLT/PJ, e-mail, cor, se recebe por pontos), tabela de pontos (nome, pontos, limite por cliente), valor do ponto, faixas de bônus por horas online, exportar/importar dados e registro do que a gestão fez. |
| **Métricas** | só admin | Gasto no período, pontos aprovados, clientes atendidos, horas online, aviso de atividades aguardando aprovação, rankings (mais tempo online, mais clientes, gasto por designer, mais pontos por cliente), gráfico de pontos por dia, de onde vêm os pontos e a tabela de fechamento, com exportação para o Excel (.csv). |

O sistema começa zerado, só com a conta da gestão. No primeiro acesso, o admin cadastra os designers. Em **Equipe → carregar exemplo** dá para ver o sistema funcionando com dados de teste.

Para testar como cada pessoa enxerga, troque o usuário no canto superior direito.

## Status de uma atividade

**Aguardando** (o designer lançou) → **Aprovada** (entra no valor), **Erro apontado** (volta para o designer com o comentário e ele corrige e reenvia) ou **Recusada** (não entra no valor).

## Regras que vêm configuradas (editáveis em Equipe)

| Atividade | Pontos | Regra |
|---|---|---|
| Logo | 1 | |
| Variação livre | 0,5 | até 4 por cliente, só no 1º envio |
| Variação pedida | 0,5 | |
| Mudança na logo | 0,5 | |
| Mudança no layout do boné | 0,5 | |

**Valor a receber** = pontos aprovados × valor do ponto (R$ 3,00) × bônus.

O bônus usa a média das horas online lançadas pela gestão, por dia trabalhado: a partir de 6h ×1,1, de 8h ×1,2 e de 10h ×1,3.

## Publicar no GitHub Pages

Suba os arquivos (`index.html`, `css/`, `js/`, `img/`) num repositório e vá em **Settings → Pages → Deploy from a branch → main / (root)**.

## Próximos passos

- **Banco online (Supabase):** login por e-mail para cada designer e para a gestão, e dados compartilhados em tempo real. Todo o acesso aos dados fica em `js/store.js`.
- **Integração com o lulu:** a função `receiveFromLulu` já cria atividades "aguardando" quando o lulu mandar `{ lulu_id, cliente, designer, itens:[{tipo, qtd}] }`.
