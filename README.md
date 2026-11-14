# Dedé · SeuBoné

Painel do time de design da SeuBoné. Os designers lançam o que fizeram no dia. A gestão confere, aprova, aponta erros, lança as horas online e acompanha quanto cada um tem a receber.

> **Modo demonstração.** Por enquanto os dados ficam salvos no navegador de quem abre (localStorage). Serve para testar o fluxo e as regras. Para o time inteiro usar ao mesmo tempo, veja "Próximos passos".

## Menus

Admin e designers usam **as mesmas telas**. O admin só ganha o menu **Configurações** e os botões de conferência nos cards.

| Menu | Quem vê | O que tem |
|---|---|---|
| **Atividades** | todos | Indicadores do período (pontuação validada, em revisão, horas registradas, Buff e remuneração prevista), o botão **+** no canto inferior direito (atalho **N**), que abre uma janela com o recibo de pontos calculado na hora, e a lista de cards de cada designer. O admin valida, solicita ajuste, reprova, edita, ajusta pontos e registra as horas. |
| **Ranking** | todos | Pódio da semana e do mês (o mês já conta o Buff) e a área **Buff** com a média de horas por dia de cada PJ e quanto falta para a próxima faixa. |
| **Métricas** | todos | Gasto, pontos, horas, rankings (tempo online, cards, cards difíceis), gráfico por dia, pontos por tipo de atividade e a tabela de fechamento com exportação para o Excel. O designer não vê quanto os outros recebem. |
| **Configurações** | só admin | Equipe, Pontuação (tipos, logo recebida, adicionais, dificuldade, valor do ponto e faixas do Buff), Horas online e Dados. |

## O card

Designer · dia · hora · cliente · nome do card · nº do lulu · tipo de atividade · logo recebida · adicionais · dificuldade · tempo gasto · detalhes da pontuação · pontos · valor.

| Tipo de atividade | Pontos |
|---|---|
| Logo / layout | 1 |
| Catálogo / PDF | 4 |
| Atividade pequena | 6 |
| Atividade média | 8 |
| Atividade grande | 12 |

| Logo recebida | Soma |
|---|---|
| Alta ou média qualidade | 0 |
| Baixa qualidade | +1 |
| Não tinha, teve que recriar | +1 |
| Criou a logo do zero | +1 |

Adicionais (cada um): variação da logo +0,5 · mudança na logo +0,5 · mudança no layout +0,5.

Dificuldade (leve, moderado, difícil) não muda os pontos: vira a linha azul, amarela ou vermelha do card.

**Status:** Em revisão → Validado (entra no valor), Ajuste solicitado (volta com parecer) ou Reprovado.

## Buff (só PJ)

Média de horas registradas por dia **no mês, contando todos os dias corridos (inclusive fins de semana)**:

| Média por dia | Buff nos pontos do mês |
|---|---|
| menos de 8h | ×1,0 |
| de 8h a 12h | ×1,5 |
| mais de 12h | ×2,0 |

**Remuneração prevista** = pontos validados × valor do ponto (R$ 3,00) × Buff.

## Publicar no GitHub Pages

Suba os arquivos (`index.html`, `css/`, `js/`, `img/`) num repositório e vá em **Settings → Pages → Deploy from a branch → main / (root)**.

## Próximos passos

- **Banco online (Supabase):** login por e-mail para cada designer e para a gestão, e dados compartilhados em tempo real. Todo o acesso aos dados fica em `js/store.js`.
- **Integração com o lulu:** a função `receiveFromLulu` já cria atividades "aguardando" quando o lulu mandar `{ lulu_id, cliente, designer, itens:[{tipo, qtd}] }`.
