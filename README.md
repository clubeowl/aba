# Dedé · SeuBoné

Painel do time de design da SeuBoné. Os designers lançam o que fizeram no dia. A gestão confere, aprova, aponta erros, lança as horas online e acompanha quanto cada um tem a receber.

> **Modo demonstração.** Por enquanto os dados ficam salvos no navegador de quem abre (localStorage). Serve para testar o fluxo e as regras. Para o time inteiro usar ao mesmo tempo, veja "Próximos passos".

## Menus

Admin e designers usam **as mesmas telas**. O admin só ganha o menu **Configurações** e os botões de conferência nos cards.

| Menu | Quem vê | O que tem |
|---|---|---|
| **Atividades** | todos | Indicadores do período (pontuação validada, em revisão, horas registradas e a receber), o botão **+** no canto inferior direito (atalho **N**), que abre uma janela com o recibo de pontos calculado na hora, e a lista de cards de cada designer. O admin valida, solicita ajuste, reprova, edita, ajusta pontos e registra as horas. |
| **Ranking** | todos | Pódio da semana e do mês, por pontuação validada. |
| **Métricas** | todos | Gasto, pontos, horas, rankings (tempo online, cards, cards difíceis), gráfico por dia, pontos por tipo de atividade e a tabela de fechamento com exportação para o Excel. O designer não vê quanto os outros recebem. |
| **Configurações** | só admin | Equipe, Pontuação (tipos, logo recebida, adicionais, dificuldade e valor do ponto), Horas online e Dados. |

## O card

Designer · dia · hora · nome do card · vendedor · link do Lulu · tipo de atividade · logo recebida · adicionais · dificuldade · tempo gasto · observações · pontos · valor.

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

## Puxar o card do Lulu

Os cards do Lulu não têm link próprio e os dados ficam atrás do login, então o Dedé não consegue lê-los sozinho. Para isso existe o botão **Enviar pro Dedé**:

1. Abra **Registrar card** no Dedé e arraste o botão amarelo **Enviar pro Dedé** para a barra de favoritos do Chrome (só uma vez).
2. No Lulu (Pipe Design), clique no favorito e depois no card.
3. O Dedé abre com a janela já preenchida: nome do card, vendedor (quem criou o card), pedido, dia e hora do início da discussão. O resto o designer só marca; digitar, só nas observações, se precisar.

O botão só lê a tela do Lulu; não altera nada lá. O código está em `tools/lulu-bookmarklet.js`.

O Dedé também aceita ser aberto já preenchido por um link, caso o Lulu ganhe um botão próprio:
`https://clubeowl.github.io/aba/#registrar?card=…&vendedor=…&pedido=…&data=2026-11-13&hora=09:25&link=…`

## Buff

Desativado por enquanto. Para religar, troque `BUFF_ON` para `true` no início de `js/store.js`: o cálculo e as telas voltam juntos.

**A receber** = pontos validados × valor do ponto (R$ 3,00).

## Publicar no GitHub Pages

Suba os arquivos (`index.html`, `css/`, `js/`, `img/`) num repositório e vá em **Settings → Pages → Deploy from a branch → main / (root)**.

## Próximos passos

- **Banco online (Supabase):** login por e-mail para cada designer e para a gestão, e dados compartilhados em tempo real. Todo o acesso aos dados fica em `js/store.js`.
- **Integração com o lulu:** a função `receiveFromLulu` já cria atividades "aguardando" quando o lulu mandar `{ lulu_id, cliente, designer, itens:[{tipo, qtd}] }`.
