# Dedé · SeuBoné

Painel do time de design da SeuBoné. Os designers lançam o que fizeram no dia. A gestão confere, aprova, aponta erros, lança as horas online e acompanha quanto cada um tem a receber.

> **Modo demonstração.** Por enquanto os dados ficam salvos no navegador de quem abre (localStorage). Serve para testar o fluxo e as regras. Para o time inteiro usar ao mesmo tempo, veja "Próximos passos".

## Menus

Admin e designers usam **as mesmas telas**. O admin só ganha o menu **Configurações** e os botões de conferência nas linhas.

| Menu | Quem vê | O que tem |
|---|---|---|
| **Atividades** | todos | Um resumo do período (pontos aprovados, o que está aguardando, horas online, bônus e quanto vai receber), uma linha para lançar atividades (o ponto já vem calculado pela tabela) e uma tabela por designer com o status de cada lançamento. O designer edita, exclui e corrige o que é dele. O admin também escolhe para qual designer está lançando, cria **atividade extra** com pontos livres, aprova (uma por uma ou todas de uma vez), pede correção com comentário, recusa, ajusta os pontos direto na célula e lança as **horas online** clicando no campo "Online" de cada designer. |
| **Métricas** | todos | Gasto e valor a receber, pontos, clientes, horas, rankings, gráfico por dia, de onde vêm os pontos e a tabela de fechamento com exportação para o Excel. O designer não vê quanto os outros recebem. |
| **Configurações** | só admin | Equipe (cadastro dos designers), Pontuação (tabela de pontos, valor do ponto e bônus), Horas online (grade da semana) e Dados (exportar, importar, exemplo, zerar e registro da gestão). |

## Status de uma atividade

**Aguardando** (o designer lançou) → **Aprovada** (entra no valor), **Corrigir** (volta para o designer com o comentário, e ele corrige e reenvia) ou **Recusada** (não entra no valor).

## Regras que vêm configuradas (editáveis em Configurações → Pontuação)

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
