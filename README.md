# aba. — painel do time de design

Painel para organizar o time de design: cada cliente vira um card, o designer marca o que fez, os pontos são somados sozinhos e o fechamento em R$ já sai calculado, com bônus para quem fica mais tempo online. Também mostra quem disse que ficaria na escala noturna e quem realmente ficou.

> **Modo demonstração.** Por enquanto tudo fica salvo no navegador de quem abre (localStorage). Serve para mostrar à empresa e testar as regras. Para o time inteiro usar de verdade, veja "Próximos passos".

## Telas

| Tela | O que mostra |
|---|---|
| **Designers** | Tela inicial da gestão. Em cima ficam as métricas: gasto no período, clientes atendidos, tempo online do time, custo por ponto e os rankings de quem fica mais tempo online, quem faz mais cards, quanto cada um recebe e quem faz mais pontos por cliente. Embaixo vem uma tabela tipo planilha para cada designer, com data, hora, card (cliente), atividade, pontos e valor em R$, mais o total. Dá para ordenar clicando no cabeçalho, filtrar por designer e período, buscar e exportar para o Excel (.csv). O designer vê só a própria tabela. |
| **Painel** | Pontos, clientes atendidos, tempo online e quanto pagar no período (hoje, semana, mês, mês passado). Lista de quem está online agora, onde o admin pode desligar quem parou de responder. Gráfico de pontos por dia, fechamento por designer (pontos, clientes, clientes/dia, pts/cliente, horas online, bônus, R$) e resumo da escala noturna. O designer vê os próprios números em destaque e não vê quanto os outros vão receber. |
| **Cards** | Um card por cliente, no formato de etiqueta. Os cards que chegam do lulu já vêm com a logo "aguardando": o designer marca **✓ fiz** ou **✕ não fiz** e adiciona variações e mudanças. Tem as abas "Sem designer" (fila), "Em andamento" e "Entregues". |
| **Turno** | Para cada dia, o contorno mostra o que cada pessoa combinou (expediente e escala da noite) e a barra mostra quanto ela ficou online de verdade. Abaixo fica a escala da semana: o designer clica para dizer "eu fico" e o admin escolhe quem fica. Nos dias que já passaram aparece quem ficou, quem ficou só uma parte e quem não ficou. |
| **Pontuação** | Tabela de pontos, valor do ponto em R$, faixas de bônus por tempo online e um simulador. Só o admin edita. |
| **Equipe** | Só para o admin. Cadastro de pessoas (CLT, PJ ou admin, e-mail, se recebe por pontos), ligar/desligar online, teste da integração com o lulu, exportar/importar dados e registro das ações da gestão. |

Para testar como cada pessoa enxerga o painel, troque o usuário no canto superior direito.

## Regras que vêm configuradas (todas editáveis em **Pontuação**)

| Tarefa | Pontos | Regra |
|---|---|---|
| Logo | 1 | |
| Variação livre | 0,5 | até 4 por cliente, só na 1ª entrega (ideias a mais, sem o cliente pedir) |
| Variação pedida | 0,5 | o cliente pediu outra versão |
| Mudança na logo | 0,5 | |
| Mudança no layout do boné | 0,5 | |

Exemplo: logo + 4 variações livres = **3 pontos** no primeiro envio. Quando o cliente pede ajuste, o designer clica em **"cliente pediu ajuste"**, o card passa para a 2ª entrega e as variações livres deixam de contar. Variações pedidas e mudanças continuam pontuando.

**Valor a receber** = pontos × valor do ponto × bônus.

O **bônus** depende da média de horas online por dia trabalhado no período:

| Média por dia | Bônus |
|---|---|
| até 6h | ×1,0 |
| a partir de 6h | ×1,1 |
| a partir de 8h | ×1,2 |
| a partir de 10h | ×1,3 |

**Online e offline:** o designer clica em "ficar online" e "sair". O admin pode ligar ou desligar qualquer pessoa no Painel ou na Equipe. Quando o admin desliga alguém, a ação fica registrada e aparece marcada no Turno.

Os horários (CLT 8h–18h com almoço 12h–13h, PJ 8h–18h direto, noite 18h–23h) ficam em `js/store.js → DEFAULT_SETTINGS.hours`.

## Publicar no GitHub Pages

1. Suba esta pasta num repositório (`index.html`, `css/`, `js/`, `README.md`, `.nojekyll`).
2. Vá em **Settings → Pages → Deploy from a branch**, escolha `main` e a pasta `/ (root)`.
3. O endereço fica `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Integração com o lulu

O painel já tem uma porta de entrada pronta. Quando um designer pega um cliente no lulu, o lulu só precisa mandar isto:

```json
{
  "lulu_id": 48311,
  "cliente": "Academia Ponta Negra",
  "vendedor": "Rafa",
  "modelo": "Trucker",
  "designer": "lia@seubone.com",
  "itens": [{ "tipo": "logo", "qtd": 1 }]
}
```

- `designer` pode ser o e-mail ou o nome cadastrado na Equipe. Se não bater com ninguém, o cliente cai em "Sem designer".
- `lulu_id` evita card duplicado.
- `tipo` usa os códigos da tabela: `logo`, `var_livre`, `var_pedida`, `mud_logo`, `mud_layout`.

**Hoje, para testar:** em **Equipe → Integração com o lulu**, cole o JSON e clique em "receber". Também dá para chamar `aba.receberDoLulu({...})` no console do navegador.

**Para ligar de verdade**, existem três caminhos, conforme o acesso ao lulu:
1. **A TI mexe no lulu:** o lulu chama um endereço (webhook) do banco do painel sempre que um designer pega um cliente. É o melhor caminho.
2. **O lulu tem API:** o painel consulta de tempos em tempos quais clientes cada designer pegou.
3. **Sem acesso nenhum:** uma extensão do Chrome lê o cliente na tela do lulu e manda para o painel.

## Próximos passos (sair da demonstração)

Para vários designers e o admin usarem ao mesmo tempo, os dados precisam ficar num banco online. A sugestão é o **Supabase** (tem plano gratuito e funciona com o GitHub Pages). Ele dá:
- login por e-mail para cada designer e para a gestão;
- dados compartilhados e atualizados em tempo real, de modo que o admin desliga alguém e a pessoa vê na hora;
- um endereço para o lulu mandar os clientes (webhook).

Todo o acesso aos dados fica em `js/store.js` (`load`, `save`, `goOnline`, `goOffline`, `addEntry`, `receiveFromLulu`…). Basta trocar o armazenamento ali, sem mexer nas telas.
