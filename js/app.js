'use strict';
/* =========================================================
   Dedé — telas: Atividades · Equipe · Métricas
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
const firstName = n => String(n || '').trim().split(/\s+/)[0] || n;
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WDL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtPts = n => (Math.round(n * 100) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const fmtNum = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtBRL = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDur = min => { min = Math.max(0, Math.round(min)); const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h${pad(m)}` : `${m}min`; };
const fmtMult = m => `×${fmtNum(m, Math.round(m * 100) % 10 ? 2 : 1)}`;
const fmtDay = k => { const d = parseKey(k); return `${WD[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
const parseHM = v => { v = String(v || '').trim().replace(',', '.'); if (!v) return 0; if (v.includes(':') || v.includes('h')) { const [h, m] = v.split(/[:h]/); return (+h || 0) * 60 + (+m || 0); } return Math.round(parseFloat(v) * 60) || 0; };
const toHM = min => min ? `${Math.floor(min / 60)}:${pad(Math.round(min % 60))}` : '';

const STATUS = {
  pendente: { label: 'Aguardando', cls: 'st-pend' },
  aprovada: { label: 'Aprovada', cls: 'st-ok' },
  erro: { label: 'Erro apontado', cls: 'st-err' },
  recusada: { label: 'Recusada', cls: 'st-no' },
};

const ui = {
  view: 'atividades',
  meId: localStorage.getItem('dede.me') || 'adm',
  period: 'dia',
  day: new Date(),
  who: 'all',
  status: 'todas',
  q: '',
  closed: {},
};
const me = () => person(ui.meId) || S.people.find(p => p.role === 'admin');
const isAdmin = () => me().role === 'admin';
const avatar = (p, size = '') => p ? `<span class="av ${size}" style="--pc:${p.color}" title="${esc(p.name)}">${esc(initials(p.name))}</span>` : '';

const I = {
  atividades: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  equipe: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  metricas: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  star: '<path d="M12 2l2.9 6.26 6.6.74-4.9 4.6 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9l6.6-.74z"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

/* ---------- período ---------- */
function period() {
  const d = startOfDay(ui.day);
  if (ui.period === 'semana') { const a = startOfWeek(d), b = addDays(a, 6); return { from: dkey(a), to: dkey(b), label: `semana de ${a.getDate()} ${MES[a.getMonth()]} a ${b.getDate()} ${MES[b.getMonth()]}` }; }
  if (ui.period === 'mes') { const a = new Date(d.getFullYear(), d.getMonth(), 1), b = new Date(d.getFullYear(), d.getMonth() + 1, 0); return { from: dkey(a), to: dkey(b), label: `${MESL[d.getMonth()]} de ${d.getFullYear()}` }; }
  return { from: dkey(d), to: dkey(d), label: `${WDL[d.getDay()]}, ${d.getDate()} de ${MESL[d.getMonth()]}` };
}
function shiftPeriod(n) {
  if (!n) { ui.day = new Date(); return; }
  if (ui.period === 'semana') ui.day = addDays(ui.day, 7 * n);
  else if (ui.period === 'mes') ui.day = new Date(ui.day.getFullYear(), ui.day.getMonth() + n, 1);
  else ui.day = addDays(ui.day, n);
}
const periodCtl = () => `<div class="period-ctl">
  <div class="seg">${[['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']].map(([v, l]) => `<button data-period="${v}" class="${ui.period === v ? 'on' : ''}">${l}</button>`).join('')}</div>
  <button class="icon" data-shift="-1" aria-label="anterior">${ico('left')}</button>
  <button class="ghost sm" data-shift="0">hoje</button>
  <button class="icon" data-shift="1" aria-label="próximo">${ico('right')}</button>
</div>`;

/* ---------- shell ---------- */
function render() {
  if (!person(ui.meId)) ui.meId = me().id;
  const items = [['atividades', 'Atividades']];
  if (isAdmin()) items.push(['equipe', 'Equipe'], ['metricas', 'Métricas']);
  if (!items.some(i => i[0] === ui.view)) ui.view = 'atividades';
  const pend = S.activities.filter(a => a.status === 'pendente').length;
  $('#nav').innerHTML = items.map(([v, l]) => `<button data-view="${v}" class="${ui.view === v ? 'on' : ''}" aria-label="${l}">${ico(v)}${v === 'atividades' && isAdmin() && pend ? `<i class="nav-badge">${pend > 99 ? '99+' : pend}</i>` : ''}<span class="lbl">${l}</span></button>`).join('');
  const sub = ui.view === 'equipe' ? `${designers().length} designer${designers().length === 1 ? '' : 's'}` : period().label;
  $('#title').innerHTML = `<span>${Object.fromEntries(items)[ui.view]}</span><i class="sep"></i><span class="sub">${esc(sub)}</span>`;
  renderMe();
  document.body.dataset.view = ui.view;
  $('#main').innerHTML = ({ atividades: viewAtividades, equipe: viewEquipe, metricas: viewMetricas })[ui.view]();
}
function renderMe() {
  const m = me();
  const opts = `<optgroup label="Admin">${S.people.filter(p => p.role === 'admin').map(p => `<option value="${p.id}" ${p.id === m.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>` +
    (designers().length ? `<optgroup label="Designers">${designers().map(p => `<option value="${p.id}" ${p.id === m.id ? 'selected' : ''}>${esc(p.name)} · ${p.regime}</option>`).join('')}</optgroup>` : '');
  $('#me').innerHTML = `<span class="role-tag ${isAdmin() ? 'adm' : ''}">${isAdmin() ? 'admin' : 'designer'}</span><label class="whoami" title="Modo demonstração: troque de usuário para ver como cada um enxerga">${avatar(m, 'sm')}<select id="meSel" aria-label="Entrar como">${opts}</select></label>`;
}

/* ============================================================
   ATIVIDADES
   ============================================================ */
function viewAtividades() {
  const admin = isAdmin(), m = me();
  if (admin && !designers().length) return welcome();
  const { from, to } = period();
  const ppl = admin ? (ui.who === 'all' ? designers() : [person(ui.who)].filter(Boolean)) : [m];
  const pool = S.activities.filter(a => inRange(a.date, from, to) && ppl.some(p => p.id === a.designerId));
  const countBy = st => st === 'todas' ? pool.length : pool.filter(a => a.status === st).length;
  const tabs = [['todas', 'Todas'], ['pendente', 'Aguardando'], ['aprovada', 'Aprovadas'], ['erro', 'Com erro'], ['recusada', 'Recusadas']];

  const head = `<div class="page-head">
    <button class="solid big" data-new>${ico('plus')}${admin ? 'Atividade extra' : 'Nova atividade'}</button><span class="vsep"></span>
    ${periodCtl()}
    <span class="sp"></span>
    <div class="tab-row">${tabs.map(([v, l]) => `<button class="tab-pill ${ui.status === v ? 'on' : ''} ${v === 'pendente' && countBy(v) ? 'warn' : ''}" data-status="${v}"><span>${l}</span><b>${countBy(v)}</b></button>`).join('')}</div>
  </div>`;

  const top = admin ? onlinePanel() : mySummary(m) + quickAdd(m);

  const toolbar = `<div class="sheet-toolbar">
    <h2>${admin ? 'Atividades do time' : 'Suas atividades'}</h2><span class="sp"></span>
    ${admin ? `<select class="pill-select" data-who>${[['all', 'Todos os designers'], ...designers().map(p => [p.id, p.name])].map(([v, l]) => `<option value="${v}" ${ui.who === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>` : ''}
    <input class="search" type="search" placeholder="buscar cliente, nº lulu, atividade…" value="${esc(ui.q)}" data-q>
  </div>`;

  return `<section class="page">${head}${top}${toolbar}${ppl.map(p => activityBlock(p, from, to)).join('')}</section>`;
}

function welcome() {
  return `<section class="page"><div class="welcome">
    <img src="img/seubone-logo-branco.png" alt="SeuBoné" class="w-logo">
    <h2>Bem-vindo ao <b>Dedé</b></h2>
    <p>Aqui os designers lançam o que fizeram no dia, você confere, aprova e acompanha os pontos, as horas online e quanto cada um tem a receber.</p>
    <div class="w-steps">
      <div><b>1</b><span>Cadastre os designers</span></div>
      <div><b>2</b><span>Confira a tabela de pontos e o valor do ponto</span></div>
      <div><b>3</b><span>Os designers entram e lançam as atividades</span></div>
    </div>
    <div class="btns"><button class="solid big light-solid" data-add-person>${ico('plus')}Cadastrar primeiro designer</button><button class="ghost light" data-io="demo">ver com dados de exemplo</button></div>
  </div></section>`;
}

function mySummary(p) {
  const { from, to, label } = period();
  const s = stats(p.id, from, to);
  return `<div class="my-sum" style="--pc:${p.color}">
    <div class="ms-main"><span>${esc(label)}</span><b>${fmtPts(s.points)}</b><small>pontos aprovados</small></div>
    <div><span>aguardando</span><b>${fmtPts(s.pendingPts)}</b><small>${s.pending} atividade${s.pending === 1 ? '' : 's'}</small></div>
    <div><span>tempo online</span><b>${fmtDur(s.minutes)}</b><small>lançado pela gestão</small></div>
    <div><span>bônus</span><b>${fmtMult(s.mult)}</b><small>${fmtNum(s.avgH)}h por dia</small></div>
    <div class="ms-pay"><span>a receber</span><b>${s.pay == null ? 'fixo' : fmtBRL(s.pay)}</b><small>só o que foi aprovado</small></div>
  </div>`;
}

/* linha de lançamento rápido, estilo planilha */
function quickAdd(p) {
  const now = new Date(), k = dkey(ui.period === 'dia' ? ui.day : now);
  const t = S.settings.itemTypes[0];
  return `<form class="quick" id="quickForm" autocomplete="off">
    <div class="q-title">${ico('plus')}<b>Lançar atividade</b><span>preencha e aperte Enter</span></div>
    <div class="q-row">
      <label class="q-date">Data<input type="date" name="date" value="${k}" max="${dkey(now)}"></label>
      <label class="q-time">Hora<input type="time" name="time" value="${hm(now)}"></label>
      <label class="q-client">Cliente<input name="client" placeholder="Nome do cliente" required list="clientList"></label>
      <label class="q-lulu">Nº lulu<input name="luluId" placeholder="opcional" inputmode="numeric"></label>
      <label class="q-type">Atividade<select name="type">${S.settings.itemTypes.map(x => `<option value="${x.id}">${esc(x.label)} · ${fmtPts(x.pts)} pt</option>`).join('')}</select></label>
      <label class="q-qty">Qtd<input type="number" name="qty" min="1" max="50" value="1"></label>
      <div class="q-pts"><span>Pontos</span><b id="qPts">${fmtPts(t.pts)}</b></div>
      <button class="solid" type="submit">${ico('plus')}Adicionar</button>
    </div>
    <datalist id="clientList">${[...new Set(S.activities.filter(a => a.designerId === p.id && a.client).slice(-60).map(a => a.client))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <p class="q-warn" id="qWarn"></p>
  </form>`;
}

/* horas online lançadas pelo admin */
function onlinePanel() {
  const ds = designers();
  if (ui.period === 'mes') return `<div class="card hint-card">${ico('clock')}<span>Para lançar as horas online, mude para <b>Dia</b> ou <b>Semana</b>.</span></div>`;
  const days = ui.period === 'semana' ? range(0, 7).map(i => addDays(startOfWeek(ui.day), i)) : [startOfDay(ui.day)];
  const today = dkey(new Date());
  return `<div class="card online-card">
    <div class="card-head"><h3>${ico('clock')} Horas online</h3><span>quanto tempo cada designer ficou online · digite como 8:30 ou 8,5</span></div>
    <div class="table-wrap"><table class="hours-grid">
      <thead><tr><th>Designer</th>${days.map(d => `<th class="${dkey(d) === today ? 'today' : ''} ${isWeekendDate(d) ? 'we' : ''}">${WD[d.getDay()]} ${d.getDate()}</th>`).join('')}${days.length > 1 ? '<th>Total</th>' : ''}</tr></thead>
      <tbody>${ds.map(p => {
        const tot = days.reduce((s, d) => s + onlineMin(p.id, dkey(d)), 0);
        return `<tr><td class="hg-who">${avatar(p, 'sm')}<span>${esc(p.name)}</span><small>${p.regime}</small></td>
          ${days.map(d => { const k = dkey(d), v = onlineMin(p.id, k); return `<td class="${isWeekendDate(d) ? 'we' : ''}"><input class="hm-in ${v ? 'has' : ''}" data-online="${p.id}|${k}" value="${toHM(v)}" placeholder="—" inputmode="decimal"></td>`; }).join('')}
          ${days.length > 1 ? `<td class="hg-tot">${fmtDur(tot)}</td>` : ''}</tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>`;
}

function activityBlock(p, from, to) {
  const admin = isAdmin();
  const s = stats(p.id, from, to);
  const rate = p.payByPoints ? S.settings.pointValue * s.mult : null;
  let rows = s.acts.slice();
  if (ui.status !== 'todas') rows = rows.filter(a => a.status === ui.status);
  if (ui.q) { const q = ui.q.toLowerCase(); rows = rows.filter(a => `${a.client} ${a.luluId} ${typeOf(a.type).label} ${a.desc}`.toLowerCase().includes(q)); }
  rows.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const closed = ui.closed[p.id];
  const pendN = s.acts.filter(a => a.status === 'pendente').length;
  let lastDay = '', n = 0;
  const body = rows.map(a => {
    const t = typeOf(a.type), st = STATUS[a.status], warn = a.status !== 'recusada' && !a.extra ? ruleWarnings(a) : '';
    const sug = a.extra ? null : suggestedPts(a.type, a.qty);
    const adjusted = sug != null && Math.abs(sug - a.pts) > 0.001;
    const newDay = a.date !== lastDay; lastDay = a.date;
    const mine = a.designerId === me().id;
    const canEdit = admin || (mine && a.status !== 'aprovada' && a.status !== 'recusada');
    const val = rate == null ? null : a.pts * rate;
    let actions = '';
    if (admin) {
      actions = `${a.status !== 'aprovada' ? `<button class="act-btn ok" data-approve="${a.id}" title="Aprovar">${ico('check')}</button>` : ''}
        ${a.status !== 'erro' ? `<button class="act-btn err" data-mark="${a.id}|erro" title="Apontar erro">${ico('alert')}</button>` : ''}
        ${a.status !== 'recusada' ? `<button class="act-btn no" data-mark="${a.id}|recusada" title="Recusar">${ico('x')}</button>` : ''}
        <button class="act-btn" data-edit-act="${a.id}" title="Editar">${ico('edit')}</button>`;
    } else if (canEdit) {
      actions = `<button class="act-btn" data-edit-act="${a.id}" title="${a.status === 'erro' ? 'Corrigir e reenviar' : 'Editar'}">${ico('edit')}</button><button class="act-btn no" data-del-act="${a.id}" title="Excluir">${ico('trash')}</button>`;
    }
    return `<tr class="${newDay ? 'newday' : ''} row-${a.status}">
      <td class="rn">${++n}</td>
      <td class="c-date">${fmtDay(a.date)}</td>
      <td class="c-time">${esc(a.time || '')}</td>
      <td class="c-client"><b>${esc(a.client || '—')}</b><small>${a.luluId ? `lulu #${esc(a.luluId)}` : a.extra ? 'criada pela gestão' : 'sem nº lulu'}${a.desc && a.desc !== a.client ? ' · ' + esc(a.desc) : ''}</small></td>
      <td class="c-act"><span class="act" style="--tc:${t.color}"><i></i>${a.extra ? 'Extra' : esc(t.label)}</span>${a.qty > 1 ? `<em>×${a.qty}</em>` : ''}${warn ? `<span class="rule-warn" title="${esc(warn)}">${ico('alert')}</span>` : ''}</td>
      <td class="num c-pts">${admin ? `<input class="pts-in ${adjusted ? 'adj' : ''}" type="number" step="0.25" min="0" value="${a.pts}" data-pts="${a.id}" title="${adjusted ? `sugerido: ${fmtPts(sug)}` : 'pontuação'}">` : `${fmtPts(a.pts)}${adjusted ? `<small class="adj-note">era ${fmtPts(sug)}</small>` : ''}`}</td>
      <td class="num money ${a.status === 'aprovada' ? '' : 'faded'}">${val == null ? '—' : fmtBRL(val)}</td>
      <td class="c-status"><span class="st ${st.cls}">${st.label}</span>${a.note ? `<small class="st-note">${esc(a.note)}</small>` : ''}</td>
      <td class="c-actions">${actions}</td>
    </tr>`;
  }).join('');
  const okPts = rows.filter(a => a.status === 'aprovada').reduce((x, a) => x + a.pts, 0);
  return `<section class="sheet-block" style="--pc:${p.color}">
    <header class="sb-head" data-toggle="${p.id}">
      ${avatar(p)}
      <div class="sb-name"><b>${esc(p.name)}</b><span>${p.regime}${p.email ? ' · ' + esc(p.email) : ''}</span></div>
      <div class="sb-stats">
        <span><small>clientes</small><b>${s.clients}</b></span>
        <span><small>aprovados</small><b>${fmtPts(s.points)} pts</b></span>
        <span class="${pendN ? 'warn' : ''}"><small>aguardando</small><b>${pendN}</b></span>
        <span><small>online</small><b>${fmtDur(s.minutes)}</b></span>
        <span><small>bônus</small><b>${fmtMult(s.mult)}</b></span>
        <span class="sb-pay"><small>a receber</small><b>${s.pay == null ? 'fixo' : fmtBRL(s.pay)}</b></span>
      </div>
      ${admin && pendN ? `<button class="solid sm approve-all" data-approve-all="${p.id}">${ico('check')}Aprovar ${pendN}</button>` : ''}
      <span class="sb-chev ${closed ? '' : 'open'}">⌄</span>
    </header>
    ${closed ? '' : `<div class="sheet-wrap"><table class="sheet acts">
      <thead><tr><th class="rn">#</th><th>Data</th><th>Hora</th><th>Cliente</th><th>Atividade</th><th class="num">Pontos</th><th class="num">Valor</th><th>Status</th><th></th></tr></thead>
      <tbody>${body || `<tr><td colspan="9" class="empty-row">${admin ? 'Nenhuma atividade' : 'Você ainda não lançou nada'} ${ui.status !== 'todas' ? 'com esse status ' : ''}neste período.</td></tr>`}</tbody>
      ${rows.length ? `<tfoot><tr><td></td><td colspan="4">${rows.length} atividade${rows.length === 1 ? '' : 's'} · aprovadas somam ${fmtPts(okPts)} pts${rate != null ? ` · ponto a ${fmtBRL(rate)} (${fmtBRL(S.settings.pointValue)} × ${fmtNum(s.mult, 2)})` : ''}</td><td class="num">${fmtPts(okPts)}</td><td class="num money">${rate == null ? '—' : fmtBRL(okPts * rate)}</td><td colspan="2"></td></tr></tfoot>` : ''}
    </table></div>`}
  </section>`;
}

/* ============================================================
   EQUIPE (admin)
   ============================================================ */
function viewEquipe() {
  const st = S.settings;
  const ppl = designers().map(p => `<article class="person" style="--pc:${p.color}">
      ${avatar(p, 'xl')}
      <div class="p-info">
        <span class="reg ${p.regime}">${p.regime}</span>
        <h3>${esc(p.name)}</h3>
        <p>${p.email ? esc(p.email) : 'sem e-mail'}</p>
        <label class="switch sm"><input type="checkbox" data-pay="${p.id}" ${p.payByPoints ? 'checked' : ''}><i></i>recebe por pontos</label>
        <div class="p-act"><button class="ghost sm" data-edit-person="${p.id}">editar</button><button class="ghost sm danger" data-del-person="${p.id}">remover</button></div>
      </div>
    </article>`).join('');

  const rows = st.itemTypes.map(t => `<li class="menu-row" style="--tc:${t.color}">
    <span class="mr-dot"></span>
    <div class="mr-main">
      <input class="mr-label" data-tf="${t.id}|label" value="${esc(t.label)}">
      <input class="mr-hint" data-tf="${t.id}|hint" value="${esc(t.hint || '')}" placeholder="descrição">
      <div class="mr-rules"><label>limite por cliente <input type="number" min="0" step="1" data-tf="${t.id}|max" value="${t.max || ''}" placeholder="∞"></label>
        <label class="clr"><input type="color" data-tf="${t.id}|color" value="${t.color}"></label>
        ${t.id === 'logo' ? '' : `<button class="ghost sm danger" data-del-type="${t.id}">remover</button>`}</div>
    </div>
    <div class="mr-pts"><input type="number" min="0" step="0.25" data-tf="${t.id}|pts" value="${t.pts}"><span>pt</span></div>
  </li>`).join('');
  const tiers = [...st.tiers].sort((a, b) => a.h - b.h).map((t, i, arr) => `<div class="tier" style="--lvl:${i}">
    <label>a partir de<input type="number" min="0" step="0.5" data-tier="${i}|h" value="${t.h}">h/dia</label>
    <label class="tm">×<input type="number" min="0" step="0.05" data-tier="${i}|mult" value="${t.mult}"></label>
    ${arr.length > 1 ? `<button class="x sm" data-del-tier="${i}" aria-label="remover faixa">×</button>` : ''}
  </div>`).join('');

  return `<section class="page">
    <div class="page-head"><button class="solid big" data-add-person>${ico('plus')}Novo designer</button><span class="vsep"></span><span class="pill-note">Tudo aqui é editável e vale na hora</span></div>
    <div class="team">${ppl || '<div class="empty-state"><p>Nenhum designer cadastrado ainda.</p></div>'}</div>
    <div class="grid-pts">
      <div class="card menu">
        <div class="card-head"><h3>Tabela de pontos</h3><span>o designer escolhe a atividade e o ponto já vem calculado</span></div>
        <ul class="menu-list">${rows}</ul>
        <button class="ghost sm add-type" data-add-type>${ico('plus')}novo tipo de atividade</button>
      </div>
      <div class="col">
        <div class="card ink-card">
          <div class="card-head"><h3>Valor do ponto</h3><span>antes do bônus</span></div>
          <div class="pv"><span>R$</span><input type="number" min="0" step="0.1" data-setting="pointValue" value="${st.pointValue}"><small>por ponto</small></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Bônus por horas online</h3><span>média de horas por dia trabalhado</span></div>
          <div class="tiers">${tiers}</div>
          <button class="ghost sm" data-add-tier>${ico('plus')}faixa</button>
          <p class="muted small">Valor a receber = pontos aprovados × ${fmtBRL(st.pointValue)} × bônus.</p>
        </div>
        <div class="card">
          <div class="card-head"><h3>Dados</h3><span>modo demonstração · salvos neste navegador</span></div>
          <div class="btns"><button class="ghost sm" data-io="export">exportar .json</button><button class="ghost sm" data-io="import">importar</button><button class="ghost sm" data-io="demo">carregar exemplo</button><button class="ghost sm danger" data-io="reset">zerar tudo</button></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Registro da gestão</h3><span>últimas ações</span></div>
      <ul class="log">${S.log.slice(0, 12).map(l => { const d = new Date(l.at); return `<li><span>${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hm(d)}</span>${esc(l.text)}</li>`; }).join('') || '<li class="muted">nada ainda</li>'}</ul>
    </div>
  </section>`;
}

/* ============================================================
   MÉTRICAS (admin)
   ============================================================ */
function viewMetricas() {
  const { from, to, label } = period();
  const all = designers().map(p => ({ p, s: stats(p.id, from, to) }));
  if (!all.length) return `<section class="page"><div class="page-head">${periodCtl()}</div><div class="empty-state"><p>Cadastre designers em Equipe para ver as métricas.</p></div></section>`;
  const tot = all.reduce((t, { s }) => ({ pay: t.pay + (s.pay || 0), pts: t.pts + s.points, pend: t.pend + s.pending, pendPts: t.pendPts + s.pendingPts, clients: t.clients + s.clients, min: t.min + s.minutes, err: t.err + s.errors + s.refused, acts: t.acts + s.acts.length }), { pay: 0, pts: 0, pend: 0, pendPts: 0, clients: 0, min: 0, err: 0, acts: 0 });
  const kpi = (l, v, sub, tone = '') => `<div class="kpi ${tone}"><span>${l}</span><b>${v}</b><small>${sub}</small></div>`;
  const lb = (title, sub, key, fmt) => {
    const list = [...all].sort((a, b) => key(b.s) - key(a.s)), max = Math.max(1e-9, ...list.map(x => key(x.s)));
    return `<div class="card lb"><div class="card-head"><h3>${title}</h3><span>${sub}</span></div><ol>${list.map(({ p, s }, i) => `<li class="${i === 0 && key(s) > 0 ? 'first' : ''}"><span class="lb-pos">${i + 1}</span>${avatar(p, 'sm')}<span class="lb-name">${esc(firstName(p.name))}</span><span class="lb-bar"><i style="width:${key(s) / max * 100}%;background:${p.color}"></i></span><b>${fmt(s)}</b></li>`).join('')}</ol></div>`;
  };
  const table = `<div class="card flush">
    <div class="card-head"><h3>Fechamento</h3><span>${esc(label)} · só atividades aprovadas entram no valor</span></div>
    <div class="table-wrap"><table class="sheet close-t">
      <thead><tr><th>Designer</th><th class="num">Pontos</th><th class="num">Aguardando</th><th class="num">Clientes</th><th class="num">Clientes/dia</th><th class="num">Pts/cliente</th><th class="num">Online</th><th class="num">Média/dia</th><th class="num">Bônus</th><th class="num">Erros</th><th class="num">A pagar</th></tr></thead>
      <tbody>${[...all].sort((a, b) => b.s.points - a.s.points).map(({ p, s }) => `<tr>
        <td><div class="who-cell">${avatar(p, 'sm')}<span><b>${esc(p.name)}</b><small>${p.regime}</small></span></div></td>
        <td class="num"><b>${fmtPts(s.points)}</b></td><td class="num ${s.pending ? 'warn-t' : ''}">${s.pending ? `${s.pending} (${fmtPts(s.pendingPts)} pts)` : '—'}</td>
        <td class="num">${s.clients}</td><td class="num">${fmtNum(s.clientsPerDay)}</td><td class="num">${fmtNum(s.ptsPerClient)}</td>
        <td class="num">${fmtDur(s.minutes)}</td><td class="num">${fmtNum(s.avgH)}h</td><td class="num"><span class="mult">${fmtMult(s.mult)}</span></td>
        <td class="num">${s.errors + s.refused || '—'}</td><td class="num money">${s.pay == null ? 'fixo' : fmtBRL(s.pay)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td class="num">${fmtPts(tot.pts)}</td><td class="num">${tot.pend || '—'}</td><td class="num">${tot.clients}</td><td></td><td></td><td class="num">${fmtDur(tot.min)}</td><td></td><td></td><td class="num">${tot.err || '—'}</td><td class="num money">${fmtBRL(tot.pay)}</td></tr></tfoot>
    </table></div>
  </div>`;
  return `<section class="page">
    <div class="page-head"><button class="solid big" data-export-csv>${ico('sheet')}Exportar planilha</button><span class="vsep"></span>${periodCtl()}</div>
    ${tot.pend ? `<button class="alert-bar" data-go-pending>${ico('alert')}<span><b>${tot.pend} atividade${tot.pend === 1 ? '' : 's'} aguardando aprovação</b> · ${fmtPts(tot.pendPts)} pts que ainda não entram no valor</span><em>conferir agora →</em></button>` : ''}
    <div class="kpis">
      ${kpi('gasto no período', fmtBRL(tot.pay), `${fmtBRL(tot.clients ? tot.pay / tot.clients : 0)} por cliente`, 'ink')}
      ${kpi('pontos aprovados', fmtPts(tot.pts), `${tot.acts} atividades lançadas`)}
      ${kpi('clientes atendidos', tot.clients, `${fmtNum(tot.clients ? tot.pts / tot.clients : 0)} pts por cliente`)}
      ${kpi('horas online', fmtDur(tot.min), `${fmtNum(all.length ? tot.min / 60 / all.length : 0)}h por designer`)}
    </div>
    <div class="lb-grid">
      ${lb('Mais tempo online', 'horas lançadas', s => s.minutes, s => fmtDur(s.minutes))}
      ${lb('Mais clientes', 'clientes atendidos', s => s.clients, s => `${s.clients}`)}
      ${lb('Gasto por designer', 'a receber', s => s.pay || 0, s => s.pay == null ? 'fixo' : fmtBRL(s.pay))}
      ${lb('Mais pontos por cliente', 'capricho na entrega', s => s.ptsPerClient, s => fmtNum(s.ptsPerClient))}
    </div>
    <div class="grid-2">
      <div class="card">${chart(all, from, to)}</div>
      <div class="card">${breakdown(all)}</div>
    </div>
    ${table}
  </section>`;
}

function chart(all, from, to) {
  const days = [];
  for (let d = parseKey(from); dkey(d) <= to; d = addDays(d, 1)) if (!isWeekendDate(d) || all.some(({ s }) => s.perDay[dkey(d)])) days.push(dkey(d));
  const sums = days.map(k => all.reduce((s, x) => s + (x.s.perDay[k] || 0), 0));
  const max = Math.max(1, ...sums);
  const mag = Math.pow(10, Math.floor(Math.log10(max / 4)));
  const step = [1, 2, 2.5, 5, 10, 20].map(x => x * mag).find(x => Math.ceil(max / x) <= 5);
  const lines = Math.max(1, Math.ceil(max / step)), top = step * lines;
  const W = 640, Hh = 240, pl = 34, pb = 24, pt = 8, iw = W - pl - 6, ih = Hh - pb - pt, bw = iw / Math.max(1, days.length), gap = Math.min(10, bw * .3);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none">`;
  for (let g = 0; g <= lines; g++) { const y = pt + ih - ih * g / lines; svg += `<line x1="${pl}" x2="${W - 6}" y1="${y}" y2="${y}" class="grid-l"/><text x="${pl - 6}" y="${y + 3}" class="ax" text-anchor="end">${fmtPts(step * g)}</text>`; }
  days.forEach((k, i) => {
    let y = pt + ih; const x = pl + i * bw + gap / 2, w = Math.max(2, bw - gap);
    all.forEach(({ p, s }) => { const v = s.perDay[k] || 0; if (!v) return; const h = ih * v / top; y -= h; svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, h - 1.5).toFixed(1)}" rx="3" fill="${p.color}"><title>${esc(p.name)} · ${fmtDay(k)}: ${fmtPts(v)} pts</title></rect>`; });
    if (days.length <= 16 || i % Math.ceil(days.length / 16) === 0) svg += `<text x="${(x + w / 2).toFixed(1)}" y="${Hh - 6}" class="ax" text-anchor="middle">${days.length <= 7 ? WD[parseKey(k).getDay()] : parseKey(k).getDate()}</text>`;
  });
  svg += '</svg>';
  return `<div class="card-head"><h3>Pontos aprovados por dia</h3></div>${svg}<div class="chart-leg">${all.map(({ p }) => `<span><i style="background:${p.color}"></i>${esc(firstName(p.name))}</span>`).join('')}</div>`;
}
function breakdown(all) {
  const by = {}; all.forEach(({ s }) => Object.entries(s.byType).forEach(([k, v]) => { by[k] = (by[k] || 0) + v; }));
  const total = Object.values(by).reduce((a, b) => a + b, 0);
  const keys = Object.keys(by).sort((a, b) => by[b] - by[a]);
  return `<div class="card-head"><h3>De onde vêm os pontos</h3><span>por tipo de atividade</span></div>
    ${total ? `<div class="stackbar">${keys.map(k => `<i style="width:${by[k] / total * 100}%;background:${typeOf(k).color}"></i>`).join('')}</div>
    <ul class="bd-list">${keys.map(k => `<li style="--tc:${typeOf(k).color}"><i></i><span>${k === 'extra' ? 'Atividades extras' : esc(typeOf(k).label)}</span><small></small><b>${fmtPts(by[k])} pts</b><em>${Math.round(by[k] / total * 100)}%</em></li>`).join('')}</ul>` : '<p class="muted">Nenhum ponto aprovado no período.</p>'}`;
}

function exportCSV() {
  const { from, to, label } = period();
  const n = v => String(v).replace('.', ','), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Designer', 'Regime', 'Data', 'Hora', 'Cliente', 'Nº lulu', 'Atividade', 'Qtd', 'Pontos', 'Status', 'Comentário da gestão', 'Valor (R$)'].join(';')];
  for (const p of designers()) {
    const s = stats(p.id, from, to), rate = p.payByPoints ? S.settings.pointValue * s.mult : null;
    for (const a of s.acts.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) {
      const d = parseKey(a.date);
      lines.push([q(p.name), p.regime, `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, a.time, q(a.client), a.luluId, q(a.extra ? 'Extra: ' + a.desc : typeOf(a.type).label), a.qty, n(a.pts), STATUS[a.status].label, q(a.note), rate != null && a.status === 'aprovada' ? n((a.pts * rate).toFixed(2)) : ''].join(';'));
    }
  }
  const el = document.createElement('a');
  el.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  el.download = `dede-${label.replace(/[^\wÀ-ú]+/g, '-')}.csv`;
  document.body.appendChild(el); el.click(); el.remove();
  toast(`Planilha exportada · ${lines.length - 1} linhas`);
}

/* ============================================================
   dialogs
   ============================================================ */
let actCtx = null, editingPerson = null;
function openAct(mode, a) {
  const admin = isAdmin(), m = me();
  actCtx = { mode, id: a ? a.id : null };
  const F = $('#actForm').elements;
  const types = S.settings.itemTypes.map(t => `<option value="${t.id}">${esc(t.label)} · ${fmtPts(t.pts)} pt</option>`).join('') + (admin ? '<option value="extra">Atividade extra (pontos livres)</option>' : '');
  F.type.innerHTML = types;
  F.designerId.innerHTML = designers().map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#actWho').hidden = !admin;
  $('#actAdmin').hidden = !admin;
  const now = new Date();
  const x = a || { designerId: admin ? (ui.who !== 'all' ? ui.who : designers()[0]?.id) : m.id, date: dkey(ui.period === 'dia' ? ui.day : now), time: hm(now), client: '', luluId: '', type: admin && mode === 'extra' ? 'extra' : 'logo', qty: 1, pts: admin && mode === 'extra' ? 1 : suggestedPts('logo', 1), status: admin ? 'aprovada' : 'pendente', note: '', desc: '' };
  F.designerId.value = x.designerId || ''; F.date.value = x.date; F.time.value = x.time || ''; F.client.value = x.client || ''; F.luluId.value = x.luluId || '';
  F.type.value = x.extra ? 'extra' : x.type; F.qty.value = x.qty || 1; F.pts.value = x.pts; F.desc.value = x.desc || '';
  F.status.value = x.status; F.note.value = x.note || '';
  F.pts.readOnly = !admin;
  const titles = { new: 'Nova atividade', extra: 'Atividade extra', edit: admin ? 'Editar atividade' : (a && a.status === 'erro' ? 'Corrigir e reenviar' : 'Editar atividade'), erro: 'Apontar erro', recusada: 'Recusar atividade' };
  $('#actTitle').textContent = titles[mode] || 'Atividade';
  if (mode === 'erro' || mode === 'recusada') { F.status.value = mode; }
  $('#actErr').textContent = '';
  $('#actHint').textContent = mode === 'erro' ? 'Explique o erro. Se quiser, já corrija a pontuação. O designer vê o comentário e pode reenviar.' : mode === 'recusada' ? 'Diga o motivo. Atividade recusada não entra no valor.' : (!admin ? 'A pontuação vem da tabela. A gestão confere e aprova.' : '');
  $('#delAct').hidden = !(admin && a);
  syncActPts();
  $('#actDlg').showModal();
  (mode === 'erro' || mode === 'recusada' ? F.note : F.client).focus();
}
function syncActPts(force) {
  const F = $('#actForm').elements;
  const extra = F.type.value === 'extra';
  if (!isAdmin() || force) F.pts.value = extra ? (F.pts.value || 1) : suggestedPts(F.type.value, +F.qty.value || 1);
}

function openPerson(p) {
  editingPerson = p || null;
  const F = $('#personForm').elements;
  const used = new Set(S.people.map(x => x.color));
  const color = p ? p.color : (PALETTE.find(c => !used.has(c)) || PALETTE[0]);
  $('#swatches').innerHTML = PALETTE.map(c => `<label><input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''}><i style="--c:${c}"></i></label>`).join('');
  F.name.value = p ? p.name : ''; F.regime.value = p ? p.regime : 'PJ'; F.email.value = p ? (p.email || '') : ''; F.payByPoints.checked = p ? !!p.payByPoints : true;
  $('#pEyebrow').textContent = p ? 'editar designer' : 'novo designer';
  $('#personErr').textContent = '';
  $('#personDlg').showModal(); F.name.focus();
}

/* ============================================================
   eventos
   ============================================================ */
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2800); }
const act = id => S.activities.find(a => a.id === id);
function setStatus(a, status, note) {
  a.status = status; if (note != null) a.note = note;
  const p = person(a.designerId);
  addLog(`${STATUS[status].label.toLowerCase()}: ${p ? firstName(p.name) : '?'} · ${a.client || 'extra'} · ${typeOf(a.type).label} (${fmtPts(a.pts)} pts)`);
}
function rerenderKeepFocus(sel) {
  const el = document.activeElement, pos = el && el.selectionStart;
  render();
  const n = $(sel); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
}

function bind() {
  document.addEventListener('click', e => {
    const t = e.target; let el;
    if (t.closest('dialog')) return;
    if ((el = t.closest('#nav [data-view]'))) { ui.view = el.dataset.view; render(); scrollTo(0, 0); return; }
    if ((el = t.closest('[data-period]'))) { ui.period = el.dataset.period; render(); return; }
    if ((el = t.closest('[data-shift]'))) { shiftPeriod(+el.dataset.shift); render(); return; }
    if ((el = t.closest('[data-status]'))) { ui.status = el.dataset.status; render(); return; }
    if (t.closest('[data-new]')) { if (isAdmin() && !designers().length) { openPerson(); return; } openAct(isAdmin() ? 'extra' : 'new'); return; }
    if ((el = t.closest('[data-approve-all]'))) {
      const { from, to } = period();
      const list = S.activities.filter(a => a.designerId === el.dataset.approveAll && a.status === 'pendente' && inRange(a.date, from, to));
      list.forEach(a => { a.status = 'aprovada'; });
      addLog(`aprovou ${list.length} atividades de ${firstName(person(el.dataset.approveAll).name)}`);
      save(); render(); toast(`${list.length} atividades aprovadas`); return;
    }
    if ((el = t.closest('[data-toggle]'))) { if (t.closest('button') && t.closest('button') !== el) return; const id = el.dataset.toggle; ui.closed[id] = !ui.closed[id]; render(); return; }
    if ((el = t.closest('[data-approve]'))) { const a = act(el.dataset.approve); if (a) { setStatus(a, 'aprovada', ''); save(); render(); toast('Aprovada'); } return; }
    if ((el = t.closest('[data-mark]'))) { const [id, st] = el.dataset.mark.split('|'); const a = act(id); if (a) openAct(st, a); return; }
    if ((el = t.closest('[data-edit-act]'))) { const a = act(el.dataset.editAct); if (a) openAct('edit', a); return; }
    if ((el = t.closest('[data-del-act]'))) { const a = act(el.dataset.delAct); if (a && confirm('Excluir esta atividade?')) { S.activities = S.activities.filter(x => x !== a); save(); render(); toast('Excluída'); } return; }
    if (t.closest('[data-go-pending]')) { ui.view = 'atividades'; ui.status = 'pendente'; ui.who = 'all'; render(); scrollTo(0, 0); return; }
    if (t.closest('[data-export-csv]')) { exportCSV(); return; }
    // equipe
    if (t.closest('[data-add-person]')) { openPerson(); return; }
    if ((el = t.closest('[data-edit-person]'))) { openPerson(person(el.dataset.editPerson)); return; }
    if ((el = t.closest('[data-del-person]'))) {
      const p = person(el.dataset.delPerson); if (!p) return;
      const n = S.activities.filter(a => a.designerId === p.id).length;
      if (!confirm(`Remover ${p.name}?${n ? ` As ${n} atividades dele(a) também serão apagadas.` : ''}`)) return;
      S.people = S.people.filter(x => x !== p); S.activities = S.activities.filter(a => a.designerId !== p.id);
      Object.values(S.online).forEach(d => delete d[p.id]);
      addLog(`removeu ${p.name}`); save(); render(); return;
    }
    if (t.closest('[data-add-type]')) { S.settings.itemTypes.push({ id: 't' + uid().slice(0, 5), label: 'Nova atividade', pts: 0.5, max: null, color: PALETTE[S.settings.itemTypes.length % PALETTE.length], hint: '' }); save(); render(); return; }
    if ((el = t.closest('[data-del-type]'))) {
      const id = el.dataset.delType;
      if (S.activities.some(a => a.type === id) && !confirm('Já existem atividades desse tipo. Remover mesmo assim? (elas continuam com os pontos que têm)')) return;
      S.settings.itemTypes = S.settings.itemTypes.filter(x => x.id !== id); save(); render(); return;
    }
    if (t.closest('[data-add-tier]')) { const l = [...S.settings.tiers].sort((a, b) => a.h - b.h).pop() || { h: 0, mult: 1 }; S.settings.tiers.push({ h: l.h + 2, mult: Math.round((l.mult + .1) * 100) / 100 }); save(); render(); return; }
    if ((el = t.closest('[data-del-tier]'))) { const s = [...S.settings.tiers].sort((a, b) => a.h - b.h); s.splice(+el.dataset.delTier, 1); S.settings.tiers = s; save(); render(); return; }
    if ((el = t.closest('[data-io]'))) { io(el.dataset.io); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'meSel') { ui.meId = t.value; localStorage.setItem('dede.me', ui.meId); ui.who = 'all'; render(); toast(`Agora você está como ${me().name}`); return; }
    if (t.matches('[data-who]')) { ui.who = t.value; render(); return; }
    if (t.matches('[data-online]')) {
      const [pid, k] = t.dataset.online.split('|'), min = parseHM(t.value);
      if (min > 24 * 60) { toast('Mais de 24h num dia? Confere o valor.'); t.value = toHM(onlineMin(pid, k)); return; }
      setOnline(pid, k, min); addLog(`lançou ${fmtDur(min)} online para ${firstName(person(pid).name)} em ${fmtDay(k)}`);
      save(); render(); toast(`${firstName(person(pid).name)}: ${min ? fmtDur(min) : 'sem horas'} em ${fmtDay(k)}`); return;
    }
    if (t.matches('[data-pts]')) {
      const a = act(t.dataset.pts), v = parseFloat(String(t.value).replace(',', '.'));
      if (a && !isNaN(v) && v >= 0) { const old = a.pts; a.pts = v; addLog(`ajustou pontos de ${firstName(person(a.designerId).name)} · ${a.client}: ${fmtPts(old)} → ${fmtPts(v)}`); save(); render(); toast('Pontuação ajustada'); }
      return;
    }
    if (t.matches('[data-pay]')) { const p = person(t.dataset.pay); if (p) { p.payByPoints = t.checked; save(); render(); } return; }
    if (t.matches('[data-setting]')) { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) { S.settings[t.dataset.setting] = v; save(); render(); } return; }
    if (t.matches('[data-tf]')) {
      const [id, f] = t.dataset.tf.split('|'), ty = S.settings.itemTypes.find(x => x.id === id); if (!ty) return;
      if (f === 'pts') { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) ty.pts = v; }
      else if (f === 'max') { const v = parseInt(t.value, 10); ty.max = v > 0 ? v : null; }
      else ty[f] = t.value;
      save(); render(); return;
    }
    if (t.matches('[data-tier]')) { const [i, f] = t.dataset.tier.split('|'), s = [...S.settings.tiers].sort((a, b) => a.h - b.h), v = parseFloat(t.value); if (isNaN(v) || v < 0) return; s[+i][f] = v; S.settings.tiers = s; save(); render(); return; }
    if (t.closest('#quickForm')) quickPreview();
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-q]')) { ui.q = e.target.value; rerenderKeepFocus('[data-q]'); return; }
    if (e.target.closest('#quickForm')) quickPreview();
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'quickForm') return;
    e.preventDefault();
    const F = e.target.elements, client = F.client.value.trim();
    if (!client) { $('#qWarn').textContent = 'Qual o cliente?'; F.client.focus(); return; }
    const qty = Math.max(1, parseInt(F.qty.value, 10) || 1);
    const a = { id: uid(), designerId: me().id, date: F.date.value || dkey(new Date()), time: F.time.value || hm(new Date()), client, luluId: F.luluId.value.trim(), type: F.type.value, qty, pts: suggestedPts(F.type.value, qty), status: 'pendente', note: '', extra: false, desc: '', createdAt: new Date().toISOString(), by: 'designer' };
    S.activities.push(a); save();
    const keepType = F.type.value, keepClient = client, keepLulu = F.luluId.value;
    render();
    const N = $('#quickForm').elements; N.client.value = keepClient; N.luluId.value = keepLulu; N.type.value = keepType === 'logo' ? 'var_livre' : keepType; quickPreview(); N.type.focus();
    toast(`Lançado: ${typeOf(a.type).label}${qty > 1 ? ' ×' + qty : ''} · ${fmtPts(a.pts)} ${a.pts === 1 ? 'ponto' : 'pontos'} · aguardando aprovação`);
  });

  $$('dialog').forEach(dl => dl.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === dl) dl.close(); }));

  $('#actForm').addEventListener('change', e => { if (['type', 'qty'].includes(e.target.name)) syncActPts(true); });
  $('#actForm').addEventListener('input', e => { if (e.target.name === 'qty') syncActPts(true); });
  $('#actForm').addEventListener('submit', e => {
    e.preventDefault();
    const F = e.target.elements, admin = isAdmin();
    const extra = F.type.value === 'extra';
    const client = F.client.value.trim();
    if (!client && !extra) { $('#actErr').textContent = 'Qual o cliente?'; return; }
    if (extra && !F.desc.value.trim()) { $('#actErr').textContent = 'Descreva a atividade extra.'; return; }
    const qty = Math.max(1, parseInt(F.qty.value, 10) || 1);
    const pts = admin ? Math.max(0, parseFloat(String(F.pts.value).replace(',', '.')) || 0) : suggestedPts(F.type.value, qty);
    if ((actCtx.mode === 'erro' || actCtx.mode === 'recusada') && !F.note.value.trim()) { $('#actErr').textContent = 'Escreva um comentário para o designer.'; return; }
    const data = { designerId: admin ? F.designerId.value : me().id, date: F.date.value, time: F.time.value, client: client || F.desc.value.trim(), luluId: F.luluId.value.trim(), type: F.type.value, qty, pts, desc: F.desc.value.trim(), extra };
    if (admin) { data.status = F.status.value; data.note = F.note.value.trim(); }
    if (actCtx.id) {
      const a = act(actCtx.id);
      if (!admin && a.status === 'erro') { data.status = 'pendente'; }
      Object.assign(a, data);
      if (admin) addLog(`${actCtx.mode === 'edit' ? 'editou' : STATUS[a.status].label.toLowerCase()}: ${firstName(person(a.designerId).name)} · ${a.client} (${fmtPts(a.pts)} pts)${a.note ? ' — ' + a.note : ''}`);
    } else {
      const a = { id: uid(), ...data, status: admin ? data.status : 'pendente', note: admin ? data.note : '', createdAt: new Date().toISOString(), by: admin ? 'admin' : 'designer' };
      S.activities.push(a);
      if (admin) addLog(`criou atividade ${extra ? 'extra' : ''} para ${firstName(person(a.designerId).name)}: ${a.client} (${fmtPts(a.pts)} pts)`);
    }
    save(); $('#actDlg').close(); render();
    toast(actCtx.mode === 'erro' ? 'Erro apontado' : actCtx.mode === 'recusada' ? 'Recusada' : 'Salvo');
  });
  $('#delAct').onclick = () => { if (!actCtx.id || !confirm('Excluir esta atividade?')) return; S.activities = S.activities.filter(a => a.id !== actCtx.id); addLog('excluiu uma atividade'); save(); $('#actDlg').close(); render(); };

  $('#personForm').addEventListener('submit', e => {
    e.preventDefault();
    const F = e.target.elements, name = F.name.value.trim();
    if (!name) { $('#personErr').textContent = 'Qual o nome?'; return; }
    const data = { name, regime: F.regime.value, role: 'designer', email: F.email.value.trim(), color: F.color.value || PALETTE[0], payByPoints: F.payByPoints.checked };
    if (editingPerson) Object.assign(editingPerson, data); else { if (!designers().length) ui.view = 'equipe'; S.people.push({ id: uid(), ...data }); addLog(`cadastrou ${name}`); }
    save(); $('#personDlg').close(); render(); toast(editingPerson ? 'Atualizado' : `${firstName(name)} entrou na equipe`);
  });

  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const s = normalize(JSON.parse(await f.text())); if (!confirm('Substituir todos os dados por este arquivo?')) return; S = s; save(); render(); toast('Importado'); } catch (err) { toast('Arquivo inválido'); }
  });
}

function quickPreview() {
  const f = $('#quickForm'); if (!f) return;
  const F = f.elements, qty = Math.max(1, parseInt(F.qty.value, 10) || 1);
  $('#qPts').textContent = fmtPts(suggestedPts(F.type.value, qty));
  const w = ruleWarnings({ designerId: me().id, type: F.type.value, client: F.client.value, qty, status: 'pendente' });
  // conta também o que está sendo lançado agora
  const t = typeOf(F.type.value);
  let msg = '';
  if (t.max && F.client.value.trim()) {
    const used = S.activities.filter(x => x.designerId === me().id && x.type === t.id && x.status !== 'recusada' && norm(x.client) === norm(F.client.value)).reduce((s, x) => s + (x.qty || 1), 0);
    if (used + qty > t.max) msg = `Atenção: ${t.label.toLowerCase()} tem limite de ${t.max} por cliente (já lançou ${used}). A gestão pode recusar o excedente.`;
  }
  $('#qWarn').textContent = msg || (w ? 'Atenção: ' + w : '');
}

function io(kind) {
  if (kind === 'export') {
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    el.download = `dede-${dkey(new Date())}.json`; document.body.appendChild(el); el.click(); el.remove();
    return toast('Exportado');
  }
  if (kind === 'import') return $('#importFile').click();
  if (kind === 'demo') { if (designers().length && !confirm('Carregar o exemplo substitui os dados atuais. Continuar?')) return; S = demoState(); save(); ui.view = 'atividades'; ui.period = 'semana'; render(); return toast('Exemplo carregado: 3 designers e 2 semanas'); }
  if (kind === 'reset') { if (!confirm('Zerar tudo? Designers, atividades e horas serão apagados.')) return; S = normalize({ settings: S.settings }); ui.meId = 'adm'; localStorage.setItem('dede.me', 'adm'); save(); render(); return toast('Tudo zerado'); }
}

window.dede = { receberDoLulu: p => { const r = receiveFromLulu(p); save(); render(); return r; } };

(function init() {
  S = load() || normalize({});
  save(); bind(); render();
})();
