'use strict';
/* =========================================================
   Dedé — telas
   Todos veem as mesmas telas (Atividades e Métricas).
   O admin ganha o menu Configurações e as ações de conferência.
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
const parseHM = v => { v = String(v || '').trim().replace(',', '.'); if (!v) return 0; if (/[:h]/.test(v)) { const [h, m] = v.split(/[:h]/); return (+h || 0) * 60 + (+m || 0); } return Math.round(parseFloat(v) * 60) || 0; };
const toHM = min => min ? `${Math.floor(min / 60)}:${pad(Math.round(min % 60))}` : '';
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

const STATUS = {
  pendente: { label: 'Aguardando', cls: 'st-pend' },
  aprovada: { label: 'Aprovada', cls: 'st-ok' },
  erro: { label: 'Corrigir', cls: 'st-err' },
  recusada: { label: 'Recusada', cls: 'st-no' },
};

const ui = {
  view: 'atividades', cfg: 'equipe',
  meId: localStorage.getItem('dede.me') || 'adm',
  period: 'dia', day: new Date(),
  who: 'all', status: 'todas', q: '',
  closed: {}, enter: true, flash: {}, limit: {},
};
const me = () => person(ui.meId) || S.people.find(p => p.role === 'admin');
const isAdmin = () => me().role === 'admin';
const avatar = (p, size = '') => p ? `<span class="av ${size}" style="--pc:${p.color}" title="${esc(p.name)}">${esc(initials(p.name))}</span>` : '';

const I = {
  atividades: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  metricas: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  star: '<path d="M12 2l2.9 6.26 6.6.74-4.9 4.6 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9l6.6-.74z"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;
/* número que conta ao entrar na tela */
const num = (v, kind = 'pts') => `<span class="count" data-count="${+v || 0}" data-kind="${kind}">${kind === 'brl' ? fmtBRL(+v || 0) : kind === 'dur' ? fmtDur(+v || 0) : kind === 'int' ? Math.round(v) : fmtPts(+v || 0)}</span>`;

/* ---------- período ---------- */
function period() {
  const d = startOfDay(ui.day);
  if (ui.period === 'semana') { const a = startOfWeek(d), b = addDays(a, 6); return { from: dkey(a), to: dkey(b), label: `${a.getDate()} ${MES[a.getMonth()]} – ${b.getDate()} ${MES[b.getMonth()]}`, days: range(0, 7).map(i => addDays(a, i)) }; }
  if (ui.period === 'mes') { const a = new Date(d.getFullYear(), d.getMonth(), 1), b = new Date(d.getFullYear(), d.getMonth() + 1, 0); return { from: dkey(a), to: dkey(b), label: `${MESL[d.getMonth()]} ${d.getFullYear()}`, days: range(0, b.getDate()).map(i => addDays(a, i)) }; }
  return { from: dkey(d), to: dkey(d), label: `${WDL[d.getDay()]}, ${d.getDate()} de ${MESL[d.getMonth()]}`, days: [d] };
}
function shiftPeriod(n) {
  if (!n) { ui.day = new Date(); return; }
  if (ui.period === 'semana') ui.day = addDays(ui.day, 7 * n);
  else if (ui.period === 'mes') ui.day = new Date(ui.day.getFullYear(), ui.day.getMonth() + n, 1);
  else ui.day = addDays(ui.day, n);
}
const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l, extra]) => `<button data-${name}="${v}" class="${cur === v ? 'on' : ''}">${l}${extra != null ? `<b>${extra}</b>` : ''}</button>`).join('')}<i class="thumb"></i></div>`;
const periodCtl = () => `<div class="period-ctl">
  ${seg('period', [['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']], ui.period)}
  <div class="stepper"><button class="icon-btn" data-shift="-1" aria-label="anterior">${ico('left')}</button><button class="today-btn" data-shift="0">Hoje</button><button class="icon-btn" data-shift="1" aria-label="próximo">${ico('right')}</button></div>
</div>`;

/* ---------- shell ---------- */
const MENU = [['atividades', 'Atividades'], ['metricas', 'Métricas'], ['config', 'Configurações']];
function render() {
  if (!person(ui.meId)) ui.meId = me().id;
  const items = MENU.filter(([v]) => v !== 'config' || isAdmin());
  if (!items.some(i => i[0] === ui.view)) ui.view = 'atividades';
  const pend = S.activities.filter(a => a.status === 'pendente' && (isAdmin() || a.designerId === me().id)).length;
  $('#nav').innerHTML = items.map(([v, l]) => `<button data-view="${v}" class="${ui.view === v ? 'on' : ''}" aria-label="${l}">${ico(v)}<span class="lbl">${l}</span>${v === 'atividades' && pend ? `<i class="nav-badge">${pend > 99 ? '99+' : pend}</i>` : ''}</button>`).join('') + '<i class="rail-ind"></i>';
  const titles = { atividades: 'Atividades', metricas: 'Métricas', config: 'Configurações' };
  const sub = ui.view === 'config' ? 'só a gestão vê' : period().label;
  $('#title').innerHTML = `<h1>${titles[ui.view]}</h1><span>${esc(sub)}</span>`;
  $('#topctl').innerHTML = ui.view === 'config' && ui.cfg !== 'horas' ? '' : periodCtl();
  renderMe();
  const html = ({ atividades: viewAtividades, metricas: viewMetricas, config: viewConfig })[ui.view]();
  const main = $('#main');
  main.innerHTML = html;
  main.classList.toggle('enter', ui.enter);
  after();
}
const lastPos = {};
function slide(el, key, x, w, prop) {
  // começa onde estava e anima até a nova posição
  const prev = lastPos[key];
  const set = (xx, ww) => { if (prop === 'y') { el.style.transform = `translateY(${xx}px)`; el.style.height = ww + 'px'; } else { el.style.transform = `translateX(${xx}px)`; el.style.width = ww + 'px'; } };
  if (prev && (prev.x !== x || prev.w !== w)) { el.style.transition = 'none'; set(prev.x, prev.w); el.getBoundingClientRect(); el.style.transition = ''; }
  requestAnimationFrame(() => set(x, w));
  if (!prev) set(x, w);
  el.style.opacity = 1;
  lastPos[key] = { x, w };
}
function after() {
  const on = $('#nav button.on'), ind = $('.rail-ind');
  if (on && ind) slide(ind, 'nav', on.offsetTop, on.offsetHeight, 'y');
  $$('.seg').forEach(sg => { const b = sg.querySelector('button.on'), t = sg.querySelector('.thumb'); if (b && t) slide(t, 'seg-' + sg.dataset.seg, b.offsetLeft - 4, b.offsetWidth, 'x'); else if (t) t.style.opacity = 0; });
  if (ui.enter) countUp();
  ui.enter = false; ui.flash = {};
}
function renderMe() {
  const m = me();
  const opts = `<optgroup label="Gestão">${S.people.filter(p => p.role === 'admin').map(p => `<option value="${p.id}" ${p.id === m.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>` +
    (designers().length ? `<optgroup label="Designers">${designers().map(p => `<option value="${p.id}" ${p.id === m.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>` : '');
  $('#me').innerHTML = `<label class="who" title="Modo demonstração: troque de usuário para ver como cada um enxerga">${avatar(m, 'sm')}<span class="who-t"><b>${esc(firstName(m.name))}</b><small>${isAdmin() ? 'admin' : m.regime}</small></span>${ico('chev')}<select id="meSel" aria-label="Entrar como">${opts}</select></label>`;
}
function countUp() {
  $$('.count').forEach((el, i) => {
    const to = +el.dataset.count, kind = el.dataset.kind;
    if (!to) return;
    const f = kind === 'brl' ? fmtBRL : kind === 'dur' ? fmtDur : kind === 'int' ? (v => String(Math.round(v))) : fmtPts;
    const t0 = performance.now() + i * 40, dur = 700;
    const step = t => { const p = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3); el.textContent = f(kind === 'int' ? Math.round(to * e) : kind === 'pts' ? Math.round(to * e * 2) / 2 : to * e); if (p < 1) requestAnimationFrame(step); else el.textContent = f(to); };
    requestAnimationFrame(step);
  });
}
function go(view) { ui.view = view; ui.enter = true; render(); scrollTo({ top: 0, behavior: 'smooth' }); }

/* ============================================================
   ATIVIDADES (igual para todos)
   ============================================================ */
const visiblePeople = () => isAdmin() ? (ui.who === 'all' ? designers() : [person(ui.who)].filter(Boolean)) : [me()];

function viewAtividades() {
  if (!designers().length) return welcome();
  const { from, to } = period();
  const ppl = visiblePeople();
  const pool = S.activities.filter(a => inRange(a.date, from, to) && ppl.some(p => p.id === a.designerId));
  const cnt = st => st === 'todas' ? pool.length : pool.filter(a => a.status === st).length;
  return `<section class="page">
    ${summary(ppl, from, to)}
    ${quickAdd()}
    <div class="filters">
      ${seg('status', [['todas', 'Todas', cnt('todas')], ['pendente', 'Aguardando', cnt('pendente')], ['aprovada', 'Aprovadas', cnt('aprovada')], ['erro', 'Corrigir', cnt('erro')], ['recusada', 'Recusadas', cnt('recusada')]], ui.status)}
      <span class="sp"></span>
      ${isAdmin() ? `<label class="select-pill">${ico('users')}<select data-who>${[['all', 'Todos os designers'], ...designers().map(p => [p.id, p.name])].map(([v, l]) => `<option value="${v}" ${ui.who === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${ico('chev')}</label>` : ''}
      <label class="search">${ico('search')}<input type="search" placeholder="Buscar cliente, nº lulu…" value="${esc(ui.q)}" data-q></label>
    </div>
    ${ppl.map((p, i) => block(p, from, to, i)).join('')}
  </section>`;
}

function welcome() {
  const admin = isAdmin();
  return `<section class="page"><div class="welcome">
    <img src="img/seubone-logo-branco.png" alt="SeuBoné" class="w-logo">
    <h2>Bem-vindo ao <b>Dedé</b></h2>
    <p>Os designers lançam o que fizeram, a gestão confere e todo mundo acompanha pontos, horas online e quanto vai receber.</p>
    <div class="w-steps"><div><b>1</b>Cadastre os designers</div><div><b>2</b>Confira a tabela de pontos</div><div><b>3</b>O time começa a lançar</div></div>
    ${admin ? `<div class="btns"><button class="btn brand big" data-add-person>${ico('plus')}Cadastrar primeiro designer</button><button class="btn glass" data-io="demo">Ver com dados de exemplo</button></div>` : ''}
  </div></section>`;
}

function summary(ppl, from, to) {
  const admin = isAdmin();
  const st = ppl.map(p => stats(p.id, from, to));
  const t = st.reduce((a, s) => ({ pts: a.pts + s.points, pend: a.pend + s.pending, pendPts: a.pendPts + s.pendingPts, min: a.min + s.minutes, pay: a.pay + (s.pay || 0), cl: a.cl + s.clients }), { pts: 0, pend: 0, pendPts: 0, min: 0, pay: 0, cl: 0 });
  const one = ppl.length === 1 ? st[0] : null;
  const who = admin ? (ppl.length === 1 ? firstName(ppl[0].name) : 'Time') : 'Você';
  return `<div class="summary">
    <div class="sm-main"><span>${who} · pontos aprovados</span><b>${num(t.pts)}</b><small>${plural(t.cl, 'cliente atendido', 'clientes atendidos')}</small></div>
    <div><span>Aguardando aprovação</span><b>${num(t.pendPts)}</b><small>${plural(t.pend, 'atividade', 'atividades')}</small></div>
    <div><span>Tempo online</span><b>${num(t.min, 'dur')}</b><small>${one ? `${fmtNum(one.avgH)}h por dia` : 'soma do time'}</small></div>
    <div><span>Bônus</span><b>${one ? fmtMult(one.mult) : '—'}</b><small>${one ? 'pela média de horas' : 'varia por pessoa'}</small></div>
    <div class="sm-pay"><span>${admin && ppl.length > 1 ? 'A pagar' : 'A receber'}</span><b>${num(t.pay, 'brl')}</b><small>só o que foi aprovado</small></div>
  </div>`;
}

/* lançamento rápido: igual para todos; admin escolhe o designer e pode lançar extra */
function quickAdd() {
  const admin = isAdmin(), now = new Date(), k = dkey(ui.period === 'dia' ? ui.day : now);
  const who = admin ? (ui.who !== 'all' ? ui.who : (designers()[0] || {}).id) : me().id;
  const clients = [...new Set(S.activities.filter(a => a.designerId === who && a.client).slice(-80).map(a => a.client))];
  return `<form class="quick" id="quickForm" autocomplete="off">
    <div class="q-head"><span class="q-ico">${ico('plus')}</span><b>Lançar atividade</b><span class="q-tip">preencha e aperte <kbd>Enter</kbd></span></div>
    <div class="q-row ${admin ? 'adm' : ''}">
      ${admin ? `<label class="f q-who"><span>Designer</span><select name="designerId">${designers().map(p => `<option value="${p.id}" ${p.id === who ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>` : ''}
      <label class="f q-date"><span>Data</span><input type="date" name="date" value="${k}"></label>
      <label class="f q-time"><span>Hora</span><input type="time" name="time" value="${hm(now)}"></label>
      <label class="f q-client"><span>Cliente</span><input name="client" placeholder="Nome do cliente" list="clientList"></label>
      <label class="f q-lulu"><span>Nº lulu</span><input name="luluId" placeholder="opcional" inputmode="numeric"></label>
      <label class="f q-type"><span>Atividade</span><select name="type">${S.settings.itemTypes.map(x => `<option value="${x.id}">${esc(x.label)} · ${fmtPts(x.pts)} pt</option>`).join('')}${admin ? '<option value="extra">Extra · pontos livres</option>' : ''}</select></label>
      <label class="f q-qty"><span>Qtd</span><input type="number" name="qty" min="1" max="50" value="1"></label>
      <label class="f q-pts"><span>Pontos</span><input name="pts" value="${fmtPts(S.settings.itemTypes[0]?.pts || 0)}" ${admin ? '' : 'readonly tabindex="-1"'} inputmode="decimal"></label>
      <button class="btn dark q-go" type="submit">${ico('plus')}<span>Adicionar</span></button>
    </div>
    <datalist id="clientList">${clients.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <p class="q-warn" id="qWarn"></p>
  </form>`;
}

function block(p, from, to, idx) {
  const admin = isAdmin(), m = me();
  const s = stats(p.id, from, to);
  const rate = p.payByPoints ? S.settings.pointValue * s.mult : null;
  let rows = s.acts.slice();
  if (ui.status !== 'todas') rows = rows.filter(a => a.status === ui.status);
  if (ui.q) { const q = ui.q.toLowerCase(); rows = rows.filter(a => `${a.client} ${a.luluId} ${typeOf(a.type).label} ${a.desc}`.toLowerCase().includes(q)); }
  rows.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const closed = ui.closed[p.id];
  const pendN = s.acts.filter(a => a.status === 'pendente').length;
  let lastDay = '';
  const lim = ui.limit[p.id] || 25, rest = rows.length - lim;
  const body = rows.slice(0, lim).map((a, i) => {
    const t = typeOf(a.type), st = STATUS[a.status];
    const warn = a.status !== 'recusada' && !a.extra ? ruleWarnings(a) : '';
    const sug = a.extra ? null : suggestedPts(a.type, a.qty);
    const adjusted = sug != null && Math.abs(sug - a.pts) > 0.001;
    const newDay = a.date !== lastDay; lastDay = a.date;
    const mine = a.designerId === m.id;
    const canEdit = mine && (a.status === 'pendente' || a.status === 'erro');
    let actions = '';
    if (admin) {
      actions = `<span class="ab-more">
        ${a.status !== 'erro' ? `<button class="ab warn" data-mark="${a.id}|erro" data-tip="Pedir correção">${ico('alert')}</button>` : ''}
        ${a.status !== 'recusada' ? `<button class="ab no" data-mark="${a.id}|recusada" data-tip="Recusar">${ico('x')}</button>` : ''}
        <button class="ab" data-edit-act="${a.id}" data-tip="Editar">${ico('edit')}</button></span>${a.status !== 'aprovada' ? `<button class="ab ok" data-approve="${a.id}" data-tip="Aprovar">${ico('check')}</button>` : '<span class="ab-gap"></span>'}`;
    } else if (canEdit) {
      actions = `<span class="ab-more show"><button class="ab" data-edit-act="${a.id}" data-tip="${a.status === 'erro' ? 'Corrigir' : 'Editar'}">${ico('edit')}</button><button class="ab no" data-del-act="${a.id}" data-tip="Excluir">${ico('trash')}</button></span>`;
    }
    const flash = ui.flash[a.id] ? `flash-${ui.flash[a.id]}` : '';
    return `<tr class="${newDay ? 'newday' : ''} r-${a.status} ${flash}" style="--i:${Math.min(i, 14)}">
      <td class="c-date"><b>${fmtDay(a.date)}</b><small>${esc(a.time || '')}</small></td>
      <td class="c-client"><b>${esc(a.client || '—')}</b><small>${a.luluId ? `lulu #${esc(a.luluId)}` : a.extra ? 'lançada pela gestão' : 'sem nº lulu'}${a.desc && a.desc !== a.client ? ' · ' + esc(a.desc) : ''}</small></td>
      <td class="c-act"><span class="tag" style="--tc:${t.color}"><i></i>${a.extra ? 'Extra' : esc(t.label)}${a.qty > 1 ? `<em>×${a.qty}</em>` : ''}</span>${warn ? `<span class="rule-warn" data-tip="${esc(warn)}">${ico('alert')}</span>` : ''}</td>
      <td class="num c-pts">${admin ? `<input class="pts-in ${adjusted ? 'adj' : ''}" type="number" step="0.25" min="0" value="${a.pts}" data-pts="${a.id}" title="${adjusted ? `pela tabela: ${fmtPts(sug)}` : 'clique para ajustar'}">` : `<b>${fmtPts(a.pts)}</b>${adjusted ? `<small class="adj-note">tabela: ${fmtPts(sug)}</small>` : ''}`}</td>
      <td class="num money ${a.status === 'aprovada' ? '' : 'faded'}">${rate == null ? '—' : fmtBRL(a.pts * rate)}</td>
      <td class="c-status"><span class="st ${st.cls}">${st.label}</span>${a.note ? `<small class="st-note">${esc(a.note)}</small>` : ''}</td>
      <td class="c-actions">${actions}</td>
    </tr>`;
  }).join('');
  const okPts = rows.filter(a => a.status === 'aprovada').reduce((x, a) => x + a.pts, 0);
  const one = visiblePeople().length === 1;
  return `<section class="block ${closed ? 'closed' : ''}" style="--pc:${p.color};--i:${idx}">
    <header class="b-head" data-toggle="${p.id}">
      ${avatar(p, 'md')}
      <div class="b-name"><b>${esc(p.name)}</b><span>${p.regime}${p.email ? ' · ' + esc(p.email) : ''}</span></div>
      <div class="b-chips">
        <span class="chip"><small>Clientes</small><b>${s.clients}</b></span>
        <span class="chip"><small>Aprovados</small><b>${fmtPts(s.points)}</b></span>
        ${pendN ? `<span class="chip warn"><small>Aguardando</small><b>${pendN}</b></span>` : ''}
        <${admin ? 'button' : 'span'} class="chip ${admin ? 'edit' : ''}" ${admin ? `data-hours="${p.id}" data-tip="Lançar horas online"` : ''}><small>Online</small><b>${fmtDur(s.minutes)}</b>${admin ? ico('clock', 'mini') : ''}</${admin ? 'button' : 'span'}>
        <span class="chip"><small>Bônus</small><b>${fmtMult(s.mult)}</b></span>
        <span class="chip dark"><small>A receber</small><b>${s.pay == null ? 'fixo' : fmtBRL(s.pay)}</b></span>
      </div>
      ${admin && pendN ? `<button class="btn ok sm" data-approve-all="${p.id}">${ico('check')}Aprovar ${pendN}</button>` : ''}
      ${one ? '' : `<span class="b-chev">${ico('chev')}</span>`}
    </header>
    <div class="b-body"><div class="b-inner">
      <div class="table-wrap"><table class="grid">
        <thead><tr><th>Data</th><th>Cliente</th><th>Atividade</th><th class="num">Pontos</th><th class="num">Valor</th><th>Status</th><th></th></tr></thead>
        <tbody>${body || `<tr class="empty"><td colspan="7"><div>${ico('spark')}<span>${ui.q || ui.status !== 'todas' ? 'Nada com esse filtro.' : mineEmpty(p)}</span></div></td></tr>`}</tbody>
        ${rows.length ? `<tfoot><tr><td colspan="3">${plural(rows.length, 'atividade', 'atividades')}${rate != null ? ` · ponto a ${fmtBRL(rate)}` : ''}</td><td class="num">${fmtPts(okPts)}</td><td class="num money">${rate == null ? '—' : fmtBRL(okPts * rate)}</td><td colspan="2"></td></tr></tfoot>` : ''}
      </table></div>
      ${rest > 0 ? `<div class="more"><button class="btn line sm" data-more="${p.id}">Mostrar mais ${Math.min(50, rest)} <span class="muted">de ${rest}</span></button></div>` : ''}
    </div></div>
  </section>`;
}
const mineEmpty = p => p.id === me().id ? 'Nada lançado ainda. Use a linha acima para começar.' : 'Nenhuma atividade neste período.';

/* ============================================================
   MÉTRICAS (igual para todos; valores dos outros ficam ocultos para designers)
   ============================================================ */
function viewMetricas() {
  if (!designers().length) return welcome();
  const { from, to, label } = period();
  const admin = isAdmin(), m = me();
  const all = designers().map(p => ({ p, s: stats(p.id, from, to) }));
  const tot = all.reduce((t, { s }) => ({ pay: t.pay + (s.pay || 0), pts: t.pts + s.points, pend: t.pend + s.pending, pendPts: t.pendPts + s.pendingPts, cl: t.cl + s.clients, min: t.min + s.minutes, err: t.err + s.errors + s.refused, acts: t.acts + s.acts.length }), { pay: 0, pts: 0, pend: 0, pendPts: 0, cl: 0, min: 0, err: 0, acts: 0 });
  const canSee = p => admin || p.id === m.id;
  const lb = (title, sub, key, fmt, money) => {
    const list = [...all].sort((a, b) => key(b.s) - key(a.s)), max = Math.max(1e-9, ...list.map(x => key(x.s)));
    return `<div class="card lb"><div class="c-head"><h3>${title}</h3><span>${sub}</span></div><ol>${list.map(({ p, s }, i) => `<li class="${p.id === m.id ? 'me' : ''}" style="--i:${i}"><span class="lb-pos ${i === 0 && key(s) > 0 ? 'first' : ''}">${i + 1}</span>${avatar(p, 'sm')}<span class="lb-name">${esc(firstName(p.name))}</span><span class="lb-bar"><i style="--w:${key(s) / max * 100}%;background:${p.color}"></i></span><b>${money && !canSee(p) ? '•••' : fmt(s)}</b></li>`).join('')}</ol></div>`;
  };
  return `<section class="page">
    ${tot.pend ? `<button class="alert-bar" data-go-pending>${ico('alert')}<span><b>${plural(tot.pend, 'atividade aguardando', 'atividades aguardando')} aprovação</b> · ${fmtPts(tot.pendPts)} pts que ainda não entram no valor</span><em>${admin ? 'Conferir' : 'Ver'} ${ico('right')}</em></button>` : ''}
    <div class="kpis">
      <div class="kpi dark"><span>${admin ? 'Gasto no período' : 'Você recebe'}</span><b>${num(admin ? tot.pay : (all.find(x => x.p.id === m.id)?.s.pay || 0), 'brl')}</b><small>${admin ? `${fmtBRL(tot.cl ? tot.pay / tot.cl : 0)} por cliente` : 'só atividades aprovadas'}</small></div>
      <div class="kpi"><span>Pontos aprovados</span><b>${num(tot.pts)}</b><small>${plural(tot.acts, 'atividade lançada', 'atividades lançadas')}</small></div>
      <div class="kpi"><span>Clientes atendidos</span><b>${num(tot.cl, 'int')}</b><small>${fmtNum(tot.cl ? tot.pts / tot.cl : 0)} pts por cliente</small></div>
      <div class="kpi"><span>Horas online</span><b>${num(tot.min, 'dur')}</b><small>${fmtNum(all.length ? tot.min / 60 / all.length : 0)}h por designer</small></div>
    </div>
    <div class="lb-grid">
      ${lb('Mais tempo online', 'horas no período', s => s.minutes, s => fmtDur(s.minutes))}
      ${lb('Mais clientes', 'atendidos', s => s.clients, s => `${s.clients}`)}
      ${lb('Mais pontos', 'aprovados', s => s.points, s => fmtPts(s.points))}
      ${lb('A receber', 'por designer', s => s.pay || 0, s => s.pay == null ? 'fixo' : fmtBRL(s.pay), true)}
    </div>
    <div class="grid-2">
      <div class="card">${chart(all, from, to)}</div>
      <div class="card">${breakdown(all)}</div>
    </div>
    <div class="card flush">
      <div class="c-head pad"><h3>Fechamento</h3><span>${esc(label)} · só atividades aprovadas entram no valor</span><span class="sp"></span><button class="btn line sm" data-export-csv>${ico('sheet')}Exportar planilha</button></div>
      <div class="table-wrap"><table class="grid close">
        <thead><tr><th>Designer</th><th class="num">Pontos</th><th class="num">Aguardando</th><th class="num">Clientes</th><th class="num">Por dia</th><th class="num">Pts/cliente</th><th class="num">Online</th><th class="num">Média/dia</th><th class="num">Bônus</th><th class="num">Correções</th><th class="num">A receber</th></tr></thead>
        <tbody>${[...all].sort((a, b) => b.s.points - a.s.points).map(({ p, s }, i) => `<tr class="${p.id === m.id ? 'me' : ''}" style="--i:${i}">
          <td><div class="who-cell">${avatar(p, 'sm')}<span><b>${esc(p.name)}</b><small>${p.regime}</small></span></div></td>
          <td class="num"><b>${fmtPts(s.points)}</b></td><td class="num ${s.pending ? 'warn-t' : ''}">${s.pending || '—'}</td>
          <td class="num">${s.clients}</td><td class="num">${fmtNum(s.clientsPerDay)}</td><td class="num">${fmtNum(s.ptsPerClient)}</td>
          <td class="num">${fmtDur(s.minutes)}</td><td class="num">${fmtNum(s.avgH)}h</td><td class="num"><span class="mult">${fmtMult(s.mult)}</span></td>
          <td class="num">${s.errors + s.refused || '—'}</td><td class="num money">${canSee(p) ? (s.pay == null ? 'fixo' : fmtBRL(s.pay)) : '•••'}</td></tr>`).join('')}</tbody>
        ${admin ? `<tfoot><tr><td>Total</td><td class="num">${fmtPts(tot.pts)}</td><td class="num">${tot.pend || '—'}</td><td class="num">${tot.cl}</td><td></td><td></td><td class="num">${fmtDur(tot.min)}</td><td></td><td></td><td class="num">${tot.err || '—'}</td><td class="num money">${fmtBRL(tot.pay)}</td></tr></tfoot>` : ''}
      </table></div>
    </div>
  </section>`;
}

function chart(all, from, to) {
  const days = [];
  for (let d = parseKey(from); dkey(d) <= to; d = addDays(d, 1)) if (!isWeekendDate(d) || all.some(({ s }) => s.perDay[dkey(d)])) days.push(dkey(d));
  const sums = days.map(k => all.reduce((s, x) => s + (x.s.perDay[k] || 0), 0));
  const max = Math.max(1, ...sums), mag = Math.pow(10, Math.floor(Math.log10(max / 4)));
  const step = [1, 2, 2.5, 5, 10, 20].map(x => x * mag).find(x => Math.ceil(max / x) <= 5);
  const lines = Math.max(1, Math.ceil(max / step)), top = step * lines;
  const W = 640, Hh = 230, pl = 34, pb = 24, pt = 8, iw = W - pl - 6, ih = Hh - pb - pt, bw = iw / Math.max(1, days.length), gap = Math.min(12, bw * .32);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none">`;
  for (let g = 0; g <= lines; g++) { const y = pt + ih - ih * g / lines; svg += `<line x1="${pl}" x2="${W - 6}" y1="${y}" y2="${y}" class="gl"/><text x="${pl - 6}" y="${y + 3}" class="ax" text-anchor="end">${fmtPts(step * g)}</text>`; }
  days.forEach((k, i) => {
    let y = pt + ih; const x = pl + i * bw + gap / 2, w = Math.max(2, bw - gap);
    svg += `<g class="bar" style="--i:${i}">`;
    all.forEach(({ p, s }) => { const v = s.perDay[k] || 0; if (!v) return; const h = ih * v / top; y -= h; svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, h - 2).toFixed(1)}" rx="4" fill="${p.color}"><title>${esc(p.name)} · ${fmtDay(k)}: ${fmtPts(v)} pts</title></rect>`; });
    svg += '</g>';
    if (days.length <= 16 || i % Math.ceil(days.length / 16) === 0) svg += `<text x="${(x + w / 2).toFixed(1)}" y="${Hh - 6}" class="ax" text-anchor="middle">${days.length <= 7 ? WD[parseKey(k).getDay()] : parseKey(k).getDate()}</text>`;
  });
  svg += '</svg>';
  return `<div class="c-head"><h3>Pontos aprovados por dia</h3></div>${svg}<div class="legend">${all.map(({ p }) => `<span><i style="background:${p.color}"></i>${esc(firstName(p.name))}</span>`).join('')}</div>`;
}
function breakdown(all) {
  const by = {}; all.forEach(({ s }) => Object.entries(s.byType).forEach(([k, v]) => { by[k] = (by[k] || 0) + v; }));
  const total = Object.values(by).reduce((a, b) => a + b, 0), keys = Object.keys(by).sort((a, b) => by[b] - by[a]);
  return `<div class="c-head"><h3>De onde vêm os pontos</h3><span>por tipo de atividade</span></div>
    ${total ? `<div class="stackbar">${keys.map((k, i) => `<i style="--w:${by[k] / total * 100}%;background:${typeOf(k).color};--i:${i}"></i>`).join('')}</div>
    <ul class="bd">${keys.map(k => `<li style="--tc:${typeOf(k).color}"><i></i><span>${k === 'extra' ? 'Atividades extras' : esc(typeOf(k).label)}</span><b>${fmtPts(by[k])} pts</b><em>${Math.round(by[k] / total * 100)}%</em></li>`).join('')}</ul>` : '<p class="muted">Nenhum ponto aprovado no período.</p>'}`;
}

/* ============================================================
   CONFIGURAÇÕES (só admin)
   ============================================================ */
function viewConfig() {
  const tabs = [['equipe', 'Equipe'], ['pontos', 'Pontuação'], ['horas', 'Horas online'], ['dados', 'Dados']];
  const body = { equipe: cfgEquipe, pontos: cfgPontos, horas: cfgHoras, dados: cfgDados }[ui.cfg]();
  return `<section class="page"><div class="cfg-tabs">${seg('cfg', tabs, ui.cfg)}</div>${body}</section>`;
}
function cfgEquipe() {
  return `<div class="team">
    ${designers().map((p, i) => `<article class="person" style="--pc:${p.color};--i:${i}">
      ${avatar(p, 'xl')}
      <div class="p-info"><span class="reg">${p.regime}</span><h3>${esc(p.name)}</h3><p>${p.email ? esc(p.email) : 'sem e-mail'}</p>
        <label class="switch"><input type="checkbox" data-pay="${p.id}" ${p.payByPoints ? 'checked' : ''}><i></i>recebe por pontos</label>
        <div class="p-act"><button class="btn line sm" data-edit-person="${p.id}">${ico('edit')}Editar</button><button class="btn line sm danger" data-del-person="${p.id}">${ico('trash')}Remover</button></div>
      </div></article>`).join('')}
    <button class="person add" data-add-person><span>${ico('plus')}</span>Novo designer</button>
  </div>`;
}
function cfgPontos() {
  const st = S.settings;
  const rows = st.itemTypes.map((t, i) => `<li class="pt-row" style="--tc:${t.color};--i:${i}">
    <label class="clr"><input type="color" data-tf="${t.id}|color" value="${t.color}"><i></i></label>
    <div class="pt-main"><input class="pt-label" data-tf="${t.id}|label" value="${esc(t.label)}"><input class="pt-hint" data-tf="${t.id}|hint" value="${esc(t.hint || '')}" placeholder="descrição"></div>
    <label class="pt-max"><span>Limite por cliente</span><input type="number" min="0" step="1" data-tf="${t.id}|max" value="${t.max || ''}" placeholder="sem limite"></label>
    <label class="pt-val"><input type="number" min="0" step="0.25" data-tf="${t.id}|pts" value="${t.pts}"><span>pt</span></label>
    ${t.id === 'logo' ? '<span></span>' : `<button class="ab no" data-del-type="${t.id}" data-tip="Remover">${ico('trash')}</button>`}
  </li>`).join('');
  const tiers = [...st.tiers].sort((a, b) => a.h - b.h).map((t, i, arr) => `<div class="tier" style="--lvl:${i}">
    <span>a partir de</span><label><input type="number" min="0" step="0.5" data-tier="${i}|h" value="${t.h}">h/dia</label>
    <label class="tm">×<input type="number" min="0" step="0.05" data-tier="${i}|mult" value="${t.mult}"></label>
    ${arr.length > 1 ? `<button class="tier-x" data-del-tier="${i}" aria-label="remover faixa">${ico('x')}</button>` : ''}</div>`).join('');
  return `<div class="grid-pts">
    <div class="card"><div class="c-head"><h3>Tabela de pontos</h3><span>o designer escolhe a atividade e o ponto já vem calculado</span></div>
      <ul class="pt-list">${rows}</ul><button class="btn line sm" data-add-type>${ico('plus')}Novo tipo de atividade</button></div>
    <div class="col">
      <div class="card dark-card"><div class="c-head"><h3>Valor do ponto</h3><span>antes do bônus</span></div>
        <label class="pv"><span>R$</span><input type="number" min="0" step="0.1" data-setting="pointValue" value="${st.pointValue}"></label></div>
      <div class="card"><div class="c-head"><h3>Bônus por horas online</h3><span>média por dia trabalhado</span></div>
        <div class="tiers">${tiers}</div><button class="btn line sm" data-add-tier>${ico('plus')}Faixa</button>
        <p class="muted small">A receber = pontos aprovados × ${fmtBRL(st.pointValue)} × bônus.</p></div>
    </div>
  </div>`;
}
function cfgHoras() {
  const { days } = period(), today = dkey(new Date()), ds = designers();
  if (!ds.length) return '<div class="empty-card">Cadastre designers primeiro.</div>';
  return `<div class="card flush"><div class="c-head pad"><h3>Horas online</h3><span>digite como 8:30 ou 8,5 · salva sozinho</span></div>
    <div class="table-wrap"><table class="hours">
      <thead><tr><th>Designer</th>${days.map(d => `<th class="${dkey(d) === today ? 'today' : ''}">${WD[d.getDay()]}<b>${d.getDate()}</b></th>`).join('')}${days.length > 1 ? '<th>Total</th>' : ''}</tr></thead>
      <tbody>${ds.map(p => { const tot = days.reduce((s, d) => s + onlineMin(p.id, dkey(d)), 0); return `<tr><td class="h-who">${avatar(p, 'sm')}<span>${esc(firstName(p.name))}</span></td>${days.map(d => { const k = dkey(d), v = onlineMin(p.id, k); return `<td class="${isWeekendDate(d) ? 'we' : ''}"><input class="hm ${v ? 'has' : ''}" data-online="${p.id}|${k}" value="${toHM(v)}" placeholder="—" inputmode="decimal"></td>`; }).join('')}${days.length > 1 ? `<td class="h-tot">${fmtDur(tot)}</td>` : ''}</tr>`; }).join('')}</tbody>
    </table></div></div>`;
}
function cfgDados() {
  return `<div class="grid-2">
    <div class="card"><div class="c-head"><h3>Dados</h3><span>modo demonstração · salvos neste navegador</span></div>
      <div class="btns"><button class="btn line" data-io="export">${ico('db')}Exportar .json</button><button class="btn line" data-io="import">Importar</button><button class="btn line" data-io="demo">${ico('spark')}Carregar exemplo</button><button class="btn line danger" data-io="reset">${ico('trash')}Zerar tudo</button></div></div>
    <div class="card"><div class="c-head"><h3>Registro da gestão</h3><span>últimas ações</span></div>
      <ul class="log">${S.log.slice(0, 14).map(l => { const d = new Date(l.at); return `<li><span>${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hm(d)}</span>${esc(l.text)}</li>`; }).join('') || '<li class="muted">nada ainda</li>'}</ul></div>
  </div>`;
}

/* ============================================================
   dialogs
   ============================================================ */
let actCtx = null, editingPerson = null, hoursCtx = null;
function openAct(mode, a) {
  const admin = isAdmin();
  actCtx = { mode, id: a ? a.id : null };
  const F = $('#actForm').elements;
  F.type.innerHTML = S.settings.itemTypes.map(t => `<option value="${t.id}">${esc(t.label)} · ${fmtPts(t.pts)} pt</option>`).join('') + (admin ? '<option value="extra">Extra · pontos livres</option>' : '');
  F.designerId.innerHTML = designers().map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#actWho').hidden = !admin; $('#actAdmin').hidden = !admin;
  F.designerId.value = a.designerId; F.date.value = a.date; F.time.value = a.time || ''; F.client.value = a.client || ''; F.luluId.value = a.luluId || '';
  F.type.value = a.extra ? 'extra' : a.type; F.qty.value = a.qty || 1; F.pts.value = a.pts; F.desc.value = a.desc || ''; F.status.value = a.status; F.note.value = a.note || '';
  F.pts.readOnly = !admin;
  if (mode === 'erro' || mode === 'recusada') F.status.value = mode;
  $('#actTitle').textContent = { edit: admin ? 'Editar atividade' : (a.status === 'erro' ? 'Corrigir e reenviar' : 'Editar atividade'), erro: 'Pedir correção', recusada: 'Recusar atividade' }[mode];
  $('#actHint').textContent = mode === 'erro' ? 'Diga o que precisa corrigir. O designer vê o comentário e reenvia.' : mode === 'recusada' ? 'Diga o motivo. Atividade recusada não entra no valor.' : (!admin && a.note ? `Comentário da gestão: ${a.note}` : '');
  $('#actErr').textContent = '';
  $('#delAct').hidden = !admin;
  $('#actDlg').showModal();
  (mode === 'erro' || mode === 'recusada' ? F.note : F.client).focus();
}
function openPerson(p) {
  editingPerson = p || null;
  const F = $('#personForm').elements, used = new Set(S.people.map(x => x.color));
  const color = p ? p.color : (PALETTE.find(c => !used.has(c)) || PALETTE[0]);
  $('#swatches').innerHTML = PALETTE.map(c => `<label><input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''}><i style="--c:${c}"></i></label>`).join('');
  F.name.value = p ? p.name : ''; F.regime.value = p ? p.regime : 'PJ'; F.email.value = p ? (p.email || '') : ''; F.payByPoints.checked = p ? !!p.payByPoints : true;
  $('#pTitle').textContent = p ? 'Editar designer' : 'Novo designer';
  $('#personErr').textContent = '';
  $('#personDlg').showModal(); F.name.focus();
}
function openHours(pid) {
  const p = person(pid), { days, label } = period();
  hoursCtx = { pid, days: days.map(dkey) };
  $('#hTitle').innerHTML = `${avatar(p, 'sm')} Horas online · ${esc(firstName(p.name))}`;
  $('#hSub').textContent = label;
  $('#hGrid').innerHTML = days.map(d => { const k = dkey(d), v = onlineMin(pid, k); return `<label class="${isWeekendDate(d) ? 'we' : ''}"><span>${WD[d.getDay()]} ${d.getDate()}</span><input data-hk="${k}" value="${toHM(v)}" placeholder="—" inputmode="decimal"></label>`; }).join('');
  $('#hoursDlg').showModal();
  const first = $('#hGrid input'); if (first) first.focus();
}

/* ============================================================
   eventos
   ============================================================ */
let tt;
function toast(m, kind = 'ok') {
  const t = $('#toast');
  t.className = ''; void t.offsetWidth;
  t.innerHTML = `<span class="t-ico ${kind}">${ico(kind === 'ok' ? 'check' : kind === 'warn' ? 'alert' : 'spark')}</span>${esc(m)}`;
  t.classList.add('on', kind); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600);
}
const act = id => S.activities.find(a => a.id === id);
const who = a => firstName((person(a.designerId) || {}).name || '?');

/* ripple em todo botão */
function ripple(e) {
  const b = e.target.closest('.btn, .seg button, .rail-nav button, .ab, .chip.edit, .today-btn, .icon-btn, .person.add, .alert-bar');
  if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 1.6;
  const el = document.createElement('i');
  el.className = 'rip'; el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(el); setTimeout(() => el.remove(), 600);
}

function quickPreview() {
  const f = $('#quickForm'); if (!f) return;
  const F = f.elements, qty = Math.max(1, parseInt(F.qty.value, 10) || 1), extra = F.type.value === 'extra';
  if (!isAdmin() || document.activeElement !== F.pts) { if (!extra) F.pts.value = fmtPts(suggestedPts(F.type.value, qty)); else if (!F.pts.value || F.pts.dataset.auto) F.pts.value = '1'; }
  F.client.placeholder = extra ? 'Descreva a atividade extra' : 'Nome do cliente';
  const did = F.designerId ? F.designerId.value : me().id, t = typeOf(F.type.value);
  let msg = '';
  if (t.max && F.client.value.trim()) {
    const used = S.activities.filter(x => x.designerId === did && x.type === t.id && x.status !== 'recusada' && norm(x.client) === norm(F.client.value)).reduce((s, x) => s + (x.qty || 1), 0);
    if (used + qty > t.max) msg = `${t.label} tem limite de ${t.max} por cliente (já tem ${used}). O excedente pode ser recusado.`;
  }
  const w = $('#qWarn'); w.textContent = msg; w.classList.toggle('on', !!msg);
}

function bind() {
  document.addEventListener('pointerdown', ripple);
  document.addEventListener('click', e => {
    const t = e.target; let el;
    if (t.closest('dialog')) return;
    if ((el = t.closest('#nav [data-view]'))) { go(el.dataset.view); return; }
    if ((el = t.closest('[data-period]'))) { ui.limit = {}; ui.period = el.dataset.period; ui.enter = true; render(); return; }
    if ((el = t.closest('[data-shift]'))) { shiftPeriod(+el.dataset.shift); ui.enter = true; render(); return; }
    if ((el = t.closest('[data-status]'))) { ui.status = el.dataset.status; render(); return; }
    if ((el = t.closest('[data-cfg]'))) { ui.cfg = el.dataset.cfg; ui.enter = true; render(); return; }
    if ((el = t.closest('[data-more]'))) { ui.limit[el.dataset.more] = (ui.limit[el.dataset.more] || 25) + 50; render(); return; }
    if ((el = t.closest('[data-hours]'))) { e.stopPropagation(); openHours(el.dataset.hours); return; }
    if ((el = t.closest('[data-approve-all]'))) {
      const { from, to } = period();
      const list = S.activities.filter(a => a.designerId === el.dataset.approveAll && a.status === 'pendente' && inRange(a.date, from, to));
      list.forEach(a => { a.status = 'aprovada'; ui.flash[a.id] = 'ok'; });
      addLog(`aprovou ${list.length} atividades de ${firstName(person(el.dataset.approveAll).name)}`);
      save(); render(); toast(`${plural(list.length, 'atividade aprovada', 'atividades aprovadas')}`); return;
    }
    if ((el = t.closest('[data-toggle]'))) { if (t.closest('button, select, input')) return; if (visiblePeople().length === 1) return; ui.closed[el.dataset.toggle] = !ui.closed[el.dataset.toggle]; el.closest('.block').classList.toggle('closed'); return; }
    if ((el = t.closest('[data-approve]'))) { const a = act(el.dataset.approve); if (a) { a.status = 'aprovada'; a.note = ''; ui.flash[a.id] = 'ok'; addLog(`aprovou: ${who(a)} · ${a.client} (${fmtPts(a.pts)} pts)`); save(); render(); toast('Aprovada'); } return; }
    if ((el = t.closest('[data-mark]'))) { const [id, st] = el.dataset.mark.split('|'); const a = act(id); if (a) openAct(st, a); return; }
    if ((el = t.closest('[data-edit-act]'))) { const a = act(el.dataset.editAct); if (a) openAct('edit', a); return; }
    if ((el = t.closest('[data-del-act]'))) { const a = act(el.dataset.delAct); if (a && confirm('Excluir esta atividade?')) { S.activities = S.activities.filter(x => x !== a); save(); render(); toast('Excluída', 'info'); } return; }
    if (t.closest('[data-go-pending]')) { ui.status = 'pendente'; ui.who = 'all'; go('atividades'); return; }
    if (t.closest('[data-export-csv]')) { exportCSV(); return; }
    if (t.closest('[data-add-person]')) { openPerson(); return; }
    if ((el = t.closest('[data-edit-person]'))) { openPerson(person(el.dataset.editPerson)); return; }
    if ((el = t.closest('[data-del-person]'))) {
      const p = person(el.dataset.delPerson); if (!p) return;
      const n = S.activities.filter(a => a.designerId === p.id).length;
      if (!confirm(`Remover ${p.name}?${n ? ` As ${n} atividades dele(a) também serão apagadas.` : ''}`)) return;
      S.people = S.people.filter(x => x !== p); S.activities = S.activities.filter(a => a.designerId !== p.id);
      Object.values(S.online).forEach(d => delete d[p.id]); addLog(`removeu ${p.name}`); save(); render(); toast(`${firstName(p.name)} removido(a)`, 'info'); return;
    }
    if (t.closest('[data-add-type]')) { S.settings.itemTypes.push({ id: 't' + uid().slice(0, 5), label: 'Nova atividade', pts: 0.5, max: null, color: PALETTE[S.settings.itemTypes.length % PALETTE.length], hint: '' }); save(); render(); toast('Tipo criado'); return; }
    if ((el = t.closest('[data-del-type]'))) { const id = el.dataset.delType; if (S.activities.some(a => a.type === id) && !confirm('Já existem atividades desse tipo. Remover mesmo assim?')) return; S.settings.itemTypes = S.settings.itemTypes.filter(x => x.id !== id); save(); render(); return; }
    if (t.closest('[data-add-tier]')) { const l = [...S.settings.tiers].sort((a, b) => a.h - b.h).pop() || { h: 0, mult: 1 }; S.settings.tiers.push({ h: l.h + 2, mult: Math.round((l.mult + .1) * 100) / 100 }); save(); render(); return; }
    if ((el = t.closest('[data-del-tier]'))) { const s = [...S.settings.tiers].sort((a, b) => a.h - b.h); s.splice(+el.dataset.delTier, 1); S.settings.tiers = s; save(); render(); return; }
    if ((el = t.closest('[data-io]'))) { io(el.dataset.io); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'meSel') { ui.meId = t.value; localStorage.setItem('dede.me', ui.meId); ui.who = 'all'; ui.enter = true; render(); toast(`Você está como ${firstName(me().name)}`, 'info'); return; }
    if (t.matches('[data-who]')) { ui.who = t.value; ui.enter = true; render(); return; }
    if (t.matches('[data-online]')) {
      const [pid, k] = t.dataset.online.split('|'), min = parseHM(t.value);
      if (min > 24 * 60) { toast('Mais de 24h num dia? Confere.', 'warn'); t.value = toHM(onlineMin(pid, k)); return; }
      setOnline(pid, k, min); addLog(`lançou ${fmtDur(min)} online para ${firstName(person(pid).name)} em ${fmtDay(k)}`); save();
      t.value = toHM(min); t.classList.toggle('has', !!min); t.classList.add('saved'); setTimeout(() => t.classList.remove('saved'), 900);
      const row = t.closest('tr'), tot = row && row.querySelector('.h-tot'); if (tot) tot.textContent = fmtDur(hoursCtxTotal(pid));
      return;
    }
    if (t.matches('[data-pts]')) {
      const a = act(t.dataset.pts), v = parseFloat(String(t.value).replace(',', '.'));
      if (a && !isNaN(v) && v >= 0) { const old = a.pts; a.pts = v; ui.flash[a.id] = 'edit'; addLog(`ajustou pontos de ${who(a)} · ${a.client}: ${fmtPts(old)} → ${fmtPts(v)}`); save(); render(); toast('Pontuação ajustada'); }
      return;
    }
    if (t.matches('[data-pay]')) { const p = person(t.dataset.pay); if (p) { p.payByPoints = t.checked; save(); toast(t.checked ? 'Recebe por pontos' : 'Valor fixo', 'info'); } return; }
    if (t.matches('[data-setting]')) { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) { S.settings[t.dataset.setting] = v; save(); toast('Valor do ponto atualizado'); } return; }
    if (t.matches('[data-tf]')) {
      const [id, f] = t.dataset.tf.split('|'), ty = S.settings.itemTypes.find(x => x.id === id); if (!ty) return;
      if (f === 'pts') { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) ty.pts = v; } else if (f === 'max') { const v = parseInt(t.value, 10); ty.max = v > 0 ? v : null; } else ty[f] = t.value;
      save(); if (f === 'color') render(); else toast('Tabela atualizada'); return;
    }
    if (t.matches('[data-tier]')) { const [i, f] = t.dataset.tier.split('|'), s = [...S.settings.tiers].sort((a, b) => a.h - b.h), v = parseFloat(t.value); if (isNaN(v) || v < 0) return; s[+i][f] = v; S.settings.tiers = s; save(); render(); toast('Bônus atualizado'); return; }
    if (t.closest('#quickForm')) { if (t.name === 'designerId') { const keep = t.value; render(); $('#quickForm').elements.designerId.value = keep; } quickPreview(); }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-q]')) { ui.q = e.target.value; const pos = e.target.selectionStart; render(); const n = $('[data-q]'); n.focus(); n.setSelectionRange(pos, pos); return; }
    if (e.target.closest('#quickForm') && e.target.name !== 'pts') quickPreview();
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'quickForm') return;
    e.preventDefault();
    const F = e.target.elements, admin = isAdmin(), extra = F.type.value === 'extra';
    const client = F.client.value.trim();
    if (!client) { const w = $('#qWarn'); w.textContent = extra ? 'Descreva a atividade extra.' : 'Qual o cliente?'; w.classList.add('on'); F.client.focus(); F.client.closest('.f').classList.add('shake'); setTimeout(() => F.client.closest('.f').classList.remove('shake'), 500); return; }
    const qty = Math.max(1, parseInt(F.qty.value, 10) || 1);
    const pts = admin ? Math.max(0, parseFloat(String(F.pts.value).replace(',', '.')) || 0) : suggestedPts(F.type.value, qty);
    const did = admin ? F.designerId.value : me().id;
    const a = { id: uid(), designerId: did, date: F.date.value || dkey(new Date()), time: F.time.value || hm(new Date()), client, luluId: F.luluId.value.trim(), type: F.type.value, qty, pts, status: admin ? 'aprovada' : 'pendente', note: '', extra, desc: extra ? client : '', createdAt: new Date().toISOString(), by: admin ? 'admin' : 'designer' };
    S.activities.push(a); ui.flash[a.id] = 'new';
    if (admin) addLog(`lançou para ${who(a)}: ${extra ? 'extra · ' : ''}${client} (${fmtPts(pts)} pts)`);
    save();
    const keep = { type: F.type.value, client: extra ? '' : client, lulu: extra ? '' : F.luluId.value, did };
    render();
    const N = $('#quickForm').elements;
    if (N.designerId) N.designerId.value = keep.did;
    N.client.value = keep.client; N.luluId.value = keep.lulu; N.type.value = keep.type === 'logo' ? 'var_livre' : keep.type; quickPreview(); N.type.focus();
    toast(`${a.extra ? 'Extra' : typeOf(a.type).label}${qty > 1 ? ' ×' + qty : ''} · ${fmtPts(pts)} ${pts === 1 ? 'ponto' : 'pontos'}${admin ? '' : ' · aguardando aprovação'}`);
  });

  $$('dialog').forEach(dl => {
    dl.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === dl) closeDlg(dl); });
    dl.addEventListener('cancel', e => { e.preventDefault(); closeDlg(dl); });
  });

  $('#actForm').addEventListener('change', e => { if (['type', 'qty'].includes(e.target.name) && (!isAdmin() || e.target.form.elements.type.value !== 'extra')) e.target.form.elements.pts.value = suggestedPts(e.target.form.elements.type.value, +e.target.form.elements.qty.value || 1); });
  $('#actForm').addEventListener('submit', e => {
    e.preventDefault();
    const F = e.target.elements, admin = isAdmin(), extra = F.type.value === 'extra', client = F.client.value.trim();
    if (!client) { $('#actErr').textContent = 'Qual o cliente?'; return; }
    if ((actCtx.mode === 'erro' || actCtx.mode === 'recusada') && !F.note.value.trim()) { $('#actErr').textContent = 'Escreva um comentário para o designer.'; return; }
    const qty = Math.max(1, parseInt(F.qty.value, 10) || 1);
    const a = act(actCtx.id);
    Object.assign(a, { date: F.date.value, time: F.time.value, client, luluId: F.luluId.value.trim(), type: F.type.value, qty, desc: F.desc.value.trim(), extra, pts: admin ? Math.max(0, parseFloat(String(F.pts.value).replace(',', '.')) || 0) : suggestedPts(F.type.value, qty) });
    if (admin) { a.designerId = F.designerId.value; a.status = F.status.value; a.note = F.note.value.trim(); addLog(`${STATUS[a.status].label.toLowerCase()}: ${who(a)} · ${a.client} (${fmtPts(a.pts)} pts)${a.note ? ' — ' + a.note : ''}`); }
    else if (a.status === 'erro') a.status = 'pendente';
    ui.flash[a.id] = a.status === 'aprovada' ? 'ok' : a.status === 'recusada' || a.status === 'erro' ? 'warn' : 'edit';
    save(); closeDlg($('#actDlg')); render();
    toast(actCtx.mode === 'erro' ? 'Correção pedida' : actCtx.mode === 'recusada' ? 'Recusada' : (!admin ? 'Reenviada para aprovação' : 'Salvo'), actCtx.mode === 'edit' ? 'ok' : 'warn');
  });
  $('#delAct').onclick = () => { if (!actCtx.id || !confirm('Excluir esta atividade?')) return; S.activities = S.activities.filter(a => a.id !== actCtx.id); addLog('excluiu uma atividade'); save(); closeDlg($('#actDlg')); render(); toast('Excluída', 'info'); };

  $('#personForm').addEventListener('submit', e => {
    e.preventDefault();
    const F = e.target.elements, name = F.name.value.trim();
    if (!name) { $('#personErr').textContent = 'Qual o nome?'; return; }
    const data = { name, regime: F.regime.value, role: 'designer', email: F.email.value.trim(), color: F.color.value || PALETTE[0], payByPoints: F.payByPoints.checked };
    const first = !designers().length;
    if (editingPerson) Object.assign(editingPerson, data); else { S.people.push({ id: uid(), ...data }); addLog(`cadastrou ${name}`); }
    save(); closeDlg($('#personDlg'));
    if (first) { ui.view = 'config'; ui.cfg = 'equipe'; ui.enter = true; }
    render(); toast(editingPerson ? 'Atualizado' : `${firstName(name)} entrou na equipe`);
  });

  $('#hoursForm').addEventListener('submit', e => {
    e.preventDefault();
    let n = 0;
    $$('#hGrid input').forEach(i => { const min = parseHM(i.value); if (min <= 24 * 60) { if (min !== onlineMin(hoursCtx.pid, i.dataset.hk)) n++; setOnline(hoursCtx.pid, i.dataset.hk, min); } });
    if (n) addLog(`lançou horas online de ${firstName(person(hoursCtx.pid).name)} (${n} dia${n > 1 ? 's' : ''})`);
    save(); closeDlg($('#hoursDlg')); render(); toast('Horas online salvas');
  });

  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const s = normalize(JSON.parse(await f.text())); if (!confirm('Substituir todos os dados por este arquivo?')) return; S = s; save(); ui.enter = true; render(); toast('Importado'); } catch (err) { toast('Arquivo inválido', 'warn'); }
  });

  addEventListener('resize', () => after());
}
function hoursCtxTotal(pid) { const { days } = period(); return days.reduce((s, d) => s + onlineMin(pid, dkey(d)), 0); }
function closeDlg(dl) { if (!dl.open) return; dl.classList.add('closing'); setTimeout(() => { dl.classList.remove('closing'); dl.close(); }, 160); }

function exportCSV() {
  const { from, to, label } = period();
  const n = v => String(v).replace('.', ','), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Designer', 'Regime', 'Data', 'Hora', 'Cliente', 'Nº lulu', 'Atividade', 'Qtd', 'Pontos', 'Status', 'Comentário da gestão', 'Valor (R$)'].join(';')];
  for (const p of isAdmin() ? designers() : [me()]) {
    const s = stats(p.id, from, to), rate = p.payByPoints ? S.settings.pointValue * s.mult : null;
    for (const a of s.acts.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) {
      const d = parseKey(a.date);
      lines.push([q(p.name), p.regime, `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, a.time, q(a.client), a.luluId, q(a.extra ? 'Extra' : typeOf(a.type).label), a.qty, n(a.pts), STATUS[a.status].label, q(a.note), rate != null && a.status === 'aprovada' ? n((a.pts * rate).toFixed(2)) : ''].join(';'));
    }
  }
  const el = document.createElement('a');
  el.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  el.download = `dede-${label.replace(/[^\wÀ-ú]+/g, '-')}.csv`; document.body.appendChild(el); el.click(); el.remove();
  toast(`Planilha exportada · ${lines.length - 1} linhas`);
}

function io(kind) {
  if (kind === 'export') { const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); el.download = `dede-${dkey(new Date())}.json`; document.body.appendChild(el); el.click(); el.remove(); return toast('Exportado'); }
  if (kind === 'import') return $('#importFile').click();
  if (kind === 'demo') { if (designers().length && !confirm('Carregar o exemplo substitui os dados atuais. Continuar?')) return; S = demoState(); save(); ui.view = 'atividades'; ui.period = 'semana'; ui.enter = true; render(); return toast('Exemplo carregado', 'info'); }
  if (kind === 'reset') { if (!confirm('Zerar tudo? Designers, atividades e horas serão apagados.')) return; S = normalize({ settings: S.settings }); ui.meId = 'adm'; localStorage.setItem('dede.me', 'adm'); save(); ui.enter = true; render(); return toast('Tudo zerado', 'info'); }
}

window.dede = { receberDoLulu: p => { const r = receiveFromLulu(p); save(); render(); return r; } };

(function init() { S = load() || normalize({}); save(); bind(); render(); })();
