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
  closed: {}, enter: true, flash: {}, limit: {}, composer: true,
};
const me = () => person(ui.meId) || S.people.find(p => p.role === 'admin');
const isAdmin = () => me().role === 'admin';
const avatar = (p, size = '') => p ? `<span class="av ${size}" style="--pc:${p.color}" title="${esc(p.name)}">${esc(initials(p.name))}</span>` : '';

const I = {
  atividades: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  metricas: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
  ranking: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  note: '<path d="M4 4h16v12H8l-4 4z"/>',
  fire: '<path d="M12 2s4 4.5 4 8.5A4 4 0 0 1 8 10.5C8 8 10 6 10 6s-4 2.5-4 8a6 6 0 0 0 12 0c0-6-6-12-6-12z"/>',
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
const MENU = [['atividades', 'Atividades'], ['ranking', 'Ranking'], ['metricas', 'Métricas'], ['config', 'Configurações']];
function render() {
  if (!person(ui.meId)) ui.meId = me().id;
  const items = MENU.filter(([v]) => v !== 'config' || isAdmin());
  if (!items.some(i => i[0] === ui.view)) ui.view = 'atividades';
  const pend = S.activities.filter(a => a.status === 'pendente' && (isAdmin() || a.designerId === me().id)).length;
  $('#nav').innerHTML = items.map(([v, l]) => `<button data-view="${v}" class="${ui.view === v ? 'on' : ''}" aria-label="${l}">${ico(v)}<span class="lbl">${l}</span>${v === 'atividades' && pend ? `<i class="nav-badge">${pend > 99 ? '99+' : pend}</i>` : ''}</button>`).join('') + '<i class="rail-ind"></i>';
  const titles = { atividades: 'Atividades', ranking: 'Ranking', metricas: 'Métricas', config: 'Configurações' };
  const sub = ui.view === 'config' ? 'só a gestão vê' : ui.view === 'ranking' ? rankLabel() : period().label;
  $('#title').innerHTML = `<h1>${titles[ui.view]}</h1><span>${esc(sub)}</span>`;
  $('#topctl').innerHTML = ui.view === 'config' && ui.cfg !== 'horas' ? '' : ui.view === 'ranking' ? `<div class="period-ctl"><div class="stepper"><button class="icon-btn" data-rshift="-1" aria-label="semana anterior">${ico('left')}</button><button class="today-btn" data-rshift="0">Esta semana</button><button class="icon-btn" data-rshift="1" aria-label="próxima semana">${ico('right')}</button></div></div>` : periodCtl();
  renderMe();
  const html = ({ atividades: viewAtividades, ranking: viewRanking, metricas: viewMetricas, config: viewConfig })[ui.view]();
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
const MONTHL = d => `${MESL[d.getMonth()]}`;

function viewAtividades() {
  if (!designers().length) return welcome();
  const { from, to } = period();
  const ppl = visiblePeople();
  const pool = S.activities.filter(a => inRange(a.date, from, to) && ppl.some(p => p.id === a.designerId));
  const cnt = st => st === 'todas' ? pool.length : pool.filter(a => a.status === st).length;
  return `<section class="page">
    ${summary(ppl, from, to)}
    ${composer()}
    <div class="filters">
      ${seg('status', [['todas', 'Todos', cnt('todas')], ['pendente', 'Aguardando', cnt('pendente')], ['aprovada', 'Aprovados', cnt('aprovada')], ['erro', 'Corrigir', cnt('erro')], ['recusada', 'Recusados', cnt('recusada')]], ui.status)}
      <span class="sp"></span>
      ${isAdmin() ? `<label class="select-pill">${ico('users')}<select data-who>${[['all', 'Todos os designers'], ...designers().map(p => [p.id, p.name])].map(([v, l]) => `<option value="${v}" ${ui.who === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${ico('chev')}</label>` : ''}
      <label class="search">${ico('search')}<input type="search" placeholder="Buscar cliente, card, nº lulu…" value="${esc(ui.q)}" data-q></label>
    </div>
    ${ppl.map((p, i) => block(p, from, to, i)).join('')}
  </section>`;
}

function welcome() {
  return `<section class="page"><div class="welcome">
    <img src="img/seubone-logo-branco.png" alt="SeuBoné" class="w-logo">
    <h2>Bem-vindo ao <b>Dedé</b></h2>
    <p>Os designers lançam cada card que fizeram, a gestão confere e todo mundo acompanha pontos, buff, ranking e quanto vai receber.</p>
    <div class="w-steps"><div><b>1</b>Cadastre os designers</div><div><b>2</b>Confira a tabela de pontos</div><div><b>3</b>O time começa a lançar</div></div>
    ${isAdmin() ? `<div class="btns"><button class="btn brand big" data-add-person>${ico('plus')}Cadastrar primeiro designer</button><button class="btn glass" data-io="demo">Ver com dados de exemplo</button></div>` : ''}
  </div></section>`;
}

function summary(ppl, from, to) {
  const admin = isAdmin();
  const st = ppl.map(p => ({ p, s: stats(p.id, from, to) }));
  const t = st.reduce((a, { s }) => ({ pts: a.pts + s.points, pend: a.pend + s.pending, pendPts: a.pendPts + s.pendingPts, min: a.min + s.minutes, pay: a.pay + (s.pay || 0), cards: a.cards + s.cards }), { pts: 0, pend: 0, pendPts: 0, min: 0, pay: 0, cards: 0 });
  const one = ppl.length === 1 ? st[0] : null;
  const who = admin ? (one ? firstName(one.p.name) : 'Time') : 'Você';
  let buffCell;
  if (one) {
    const b = one.s.buff;
    buffCell = b.eligible
      ? `<div class="sm-buff m${String(b.mult).replace('.', '')}"><span>${ico('bolt')} Buff de ${MONTHL(parseKey(to))}</span><b>${fmtMult(b.mult)}</b><small>${fmtNum(b.avgH)}h/dia${b.next ? ` · faltam ${fmtNum(b.next.h - b.avgH)}h p/ ${fmtMult(b.next.mult)}` : ' · máximo'}</small></div>`
      : `<div class="sm-buff"><span>${ico('bolt')} Buff</span><b>—</b><small>só para PJ</small></div>`;
  } else {
    const pj = st.filter(x => x.s.buff.eligible), on = pj.filter(x => x.s.buff.mult > 1).length;
    buffCell = `<div class="sm-buff"><span>${ico('bolt')} Buff ativo</span><b>${on}<i>/${pj.length}</i></b><small>PJs com buff no mês</small></div>`;
  }
  return `<div class="summary">
    <div class="sm-main"><span>${who} · pontos aprovados</span><b>${num(t.pts)}</b><small>${plural(t.cards, 'card aprovado', 'cards aprovados')}</small></div>
    <div><span>Aguardando aprovação</span><b>${num(t.pendPts)}</b><small>${plural(t.pend, 'card', 'cards')}</small></div>
    <div><span>Tempo online</span><b>${num(t.min, 'dur')}</b><small>${one ? 'no período' : 'soma do time'}</small></div>
    ${buffCell}
    <div class="sm-pay"><span>${admin && !one ? 'A pagar' : 'A receber'}</span><b>${num(t.pay, 'brl')}</b><small>aprovados × ${fmtBRL(S.settings.pointValue)}${one && one.s.buff.mult > 1 ? ' × buff' : ''}</small></div>
  </div>`;
}

/* ---------- formulário do card (usado no lançamento e na edição) ---------- */
const emptyCard = did => { const now = new Date(); return { designerId: did, date: dkey(ui.period === 'dia' ? ui.day : now), time: hm(now), client: '', name: '', luluId: '', kind: 'logo', logoQ: 'alta', adds: { variacao: 0, mud_logo: 0, mud_layout: 0 }, diff: 'moderado', mins: 0, details: '' }; };

function cardFields(c, opts = {}) {
  const admin = isAdmin(), st = S.settings;
  return `
    <div class="cf-row r1 ${admin ? 'adm' : ''}">
      ${admin ? `<label class="f"><span>Designer</span><select name="designerId">${designers().map(p => `<option value="${p.id}" ${p.id === c.designerId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>` : ''}
      <label class="f"><span>Dia</span><input type="date" name="date" value="${c.date}"></label>
      <label class="f"><span>Hora</span><input type="time" name="time" value="${c.time || ''}"></label>
      <label class="f grow"><span>Cliente</span><input name="client" value="${esc(c.client)}" placeholder="Nome do cliente" list="clientList" autocomplete="off"></label>
      <label class="f grow"><span>Nome do card</span><input name="name" value="${esc(c.name || '')}" placeholder="ex.: Trucker evento verão" autocomplete="off"></label>
      <label class="f"><span>Nº lulu</span><input name="luluId" value="${esc(c.luluId || '')}" placeholder="opcional" inputmode="numeric"></label>
    </div>
    <div class="cf-sec">
      <div class="cf-lbl">Tipo de atividade</div>
      <div class="tiles">${st.kinds.map(k => `<label class="tile" style="--tc:${k.color}" title="${esc(k.hint || '')}"><input type="radio" name="kind" value="${k.id}" ${c.kind === k.id ? 'checked' : ''}><span><i></i><b>${esc(k.label)}</b><em>${fmtPts(k.pts)} pt${k.pts === 1 ? '' : 's'}</em></span></label>`).join('')}</div>
    </div>
    <div class="cf-two">
      <div class="cf-sec">
        <div class="cf-lbl">Logo recebida</div>
        <div class="pills">${st.logoQ.map(q => `<label class="pill"><input type="radio" name="logoQ" value="${q.id}" ${c.logoQ === q.id ? 'checked' : ''}><span>${esc(q.label)}${q.pts ? `<em>+${fmtPts(q.pts)}</em>` : ''}</span></label>`).join('')}</div>
      </div>
      <div class="cf-sec">
        <div class="cf-lbl">Adicionais</div>
        <div class="steps">${st.adds.map(ad => `<div class="step"><span>${esc(ad.label)}<em>+${fmtPts(ad.pts)} cada</em></span><div class="stepper-n"><button type="button" data-step="${ad.id}|-1" aria-label="menos">−</button><input name="add_${ad.id}" value="${(c.adds && c.adds[ad.id]) || 0}" inputmode="numeric"><button type="button" data-step="${ad.id}|1" aria-label="mais">+</button></div></div>`).join('')}</div>
      </div>
    </div>
    <div class="cf-two">
      <div class="cf-sec">
        <div class="cf-lbl">Dificuldade do card</div>
        <div class="pills diffs">${st.diffs.map(d => `<label class="pill diff" style="--dc:${d.color}"><input type="radio" name="diff" value="${d.id}" ${c.diff === d.id ? 'checked' : ''}><span><i></i>${esc(d.label)}</span></label>`).join('')}</div>
      </div>
      <div class="cf-sec">
        <div class="cf-lbl">Tempo neste card</div>
        <div class="time-row"><label class="f t-in">${ico('timer')}<input name="mins" value="${toHM(c.mins)}" placeholder="0:45" inputmode="decimal"></label>
          ${[15, 30, 45, 60, 90, 120].map(m => `<button type="button" class="qt" data-qt="${m}">${m < 60 ? m + 'min' : fmtDur(m).replace('h00', 'h')}</button>`).join('')}</div>
      </div>
    </div>
    <div class="cf-sec">
      <div class="cf-lbl">Detalhes da pontuação <span>opcional</span></div>
      <textarea name="details" rows="2" placeholder="ex.: não fiz modificações na logo, mas refiz os layouts do zero">${esc(c.details || '')}</textarea>
    </div>`;
}
function receipt(c, opts = {}) {
  const sc = scoreOf(c), admin = isAdmin();
  const pts = opts.override != null ? opts.override : sc.total;
  return `<aside class="receipt">
    <div class="rc-head">${ico('star')}<b>Pontuação</b></div>
    <ul class="rc-lines">${sc.lines.map(l => `<li><span>${esc(l.label)}</span><b>${l.pts > 0 && sc.lines[0] !== l ? '+' : ''}${fmtPts(l.pts)}</b></li>`).join('')}</ul>
    <div class="rc-total"><span>Total</span><b class="rc-pts">${fmtPts(pts)}</b><small>pts</small></div>
    ${admin ? `<label class="rc-ovr"><span>Ajustar pontos</span><input name="ptsOverride" value="${opts.override != null ? opts.override : ''}" placeholder="${fmtPts(sc.total)}" inputmode="decimal"></label>` : ''}
    <div class="rc-val">≈ ${fmtBRL(pts * S.settings.pointValue)}<small>antes do buff</small></div>
    ${opts.submit || ''}
  </aside>`;
}
function composer() {
  const admin = isAdmin();
  const did = admin ? (ui.who !== 'all' ? ui.who : (designers()[0] || {}).id) : me().id;
  const c = ui.draft && ui.draft.designerId === did ? ui.draft : emptyCard(did);
  const clients = [...new Set(S.activities.filter(a => a.designerId === did && a.client).slice(-80).map(a => a.client))];
  return `<form class="composer ${ui.composer ? '' : 'closed'}" id="quickForm" data-cardform autocomplete="off">
    <header class="cp-head" data-toggle-composer><span class="q-ico">${ico('plus')}</span><b>Lançar card</b><span class="q-tip">${admin ? 'lançado pela gestão já entra aprovado' : 'vai para aprovação da gestão'}</span><span class="sp"></span><span class="b-chev">${ico('chev')}</span></header>
    <div class="cp-body"><div class="cp-inner">
      <div class="cp-grid"><div class="cp-fields">${cardFields(c)}</div>${receipt(c, { submit: `<button class="btn dark big rc-go" type="submit">${ico('plus')}Lançar card</button>` })}</div>
    </div></div>
    <datalist id="clientList">${clients.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
  </form>`;
}
function readCard(form) {
  const F = form.elements, adds = {};
  S.settings.adds.forEach(ad => { adds[ad.id] = Math.max(0, parseInt(F['add_' + ad.id]?.value, 10) || 0); });
  const c = {
    designerId: F.designerId ? F.designerId.value : me().id,
    date: F.date.value || dkey(new Date()), time: F.time.value || hm(new Date()),
    client: F.client.value.trim(), name: F.name.value.trim(), luluId: F.luluId.value.trim(),
    kind: (F.kind && F.kind.value) || 'logo', logoQ: (F.logoQ && F.logoQ.value) || 'alta', adds,
    diff: (F.diff && F.diff.value) || 'moderado', mins: parseHM(F.mins.value), details: F.details.value.trim(),
  };
  const ov = F.ptsOverride ? String(F.ptsOverride.value).trim().replace(',', '.') : '';
  c.ptsOverride = ov !== '' && !isNaN(parseFloat(ov)) ? Math.max(0, parseFloat(ov)) : null;
  return c;
}
function refreshReceipt(form) {
  const c = readCard(form), sc = scoreOf(c), rc = form.querySelector('.receipt'); if (!rc) return;
  const pts = c.ptsOverride != null ? c.ptsOverride : sc.total;
  rc.querySelector('.rc-lines').innerHTML = sc.lines.map((l, i) => `<li><span>${esc(l.label)}</span><b>${i ? '+' : ''}${fmtPts(l.pts)}</b></li>`).join('');
  const el = rc.querySelector('.rc-pts');
  if (el.textContent !== fmtPts(pts)) { el.textContent = fmtPts(pts); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  rc.querySelector('.rc-val').innerHTML = `≈ ${fmtBRL(pts * S.settings.pointValue)}<small>antes do buff</small>`;
  const ov = form.elements.ptsOverride; if (ov) ov.placeholder = fmtPts(sc.total);
  if (form.id === 'quickForm') ui.draft = c;
}

/* ---------- lista de cards por designer ---------- */
function block(p, from, to, idx) {
  const admin = isAdmin(), m = me();
  const s = stats(p.id, from, to);
  const rate = p.payByPoints ? S.settings.pointValue : null;
  let rows = s.acts.slice();
  if (ui.status !== 'todas') rows = rows.filter(a => a.status === ui.status);
  if (ui.q) { const q = ui.q.toLowerCase(); rows = rows.filter(a => `${a.client} ${a.name} ${a.luluId} ${kindOf(a.kind).label} ${a.details}`.toLowerCase().includes(q)); }
  rows.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const pendN = s.acts.filter(a => a.status === 'pendente').length;
  const lim = ui.limit[p.id] || 25, rest = rows.length - lim;
  const one = visiblePeople().length === 1;
  const body = rows.slice(0, lim).map((a, i) => cardRow(a, i, rate, admin, m)).join('');
  const okPts = rows.filter(a => a.status === 'aprovada').reduce((x, a) => x + a.pts, 0);
  const b = s.buff;
  return `<section class="block ${ui.closed[p.id] ? 'closed' : ''}" style="--pc:${p.color};--i:${idx}">
    <header class="b-head" data-toggle="${p.id}">
      ${avatar(p, 'md')}
      <div class="b-name"><b>${esc(p.name)}</b><span>${p.regime}${p.email ? ' · ' + esc(p.email) : ''}</span></div>
      <div class="b-chips">
        <span class="chip"><small>Cards</small><b>${s.cards}</b></span>
        <span class="chip"><small>Aprovados</small><b>${fmtPts(s.points)}</b></span>
        ${pendN ? `<span class="chip warn"><small>Aguardando</small><b>${pendN}</b></span>` : ''}
        <${admin ? 'button' : 'span'} class="chip ${admin ? 'edit' : ''}" ${admin ? `data-hours="${p.id}" data-tip="Lançar horas online"` : ''}><small>Online</small><b>${fmtDur(s.minutes)}</b>${admin ? ico('clock', 'mini') : ''}</${admin ? 'button' : 'span'}>
        <span class="chip buff m${String(b.mult).replace('.', '')}" ${b.eligible ? `data-tip="${fmtNum(b.avgH)}h/dia em ${MONTHL(parseKey(to))}"` : 'data-tip="Buff só para PJ"'}><small>Buff</small><b>${b.eligible ? fmtMult(b.mult) : '—'}</b></span>
        <span class="chip dark"><small>A receber</small><b>${s.pay == null ? 'fixo' : fmtBRL(s.pay)}</b></span>
      </div>
      ${admin && pendN ? `<button class="btn ok sm" data-approve-all="${p.id}">${ico('check')}Aprovar ${pendN}</button>` : ''}
      ${one ? '' : `<span class="b-chev">${ico('chev')}</span>`}
    </header>
    <div class="b-body"><div class="b-inner">
      <div class="cards">
        <div class="ch"><span>Quando</span><span>Cliente · card</span><span>Atividade</span><span>Dificuldade · tempo</span><span class="num">Pontos</span><span class="num">Valor</span><span>Status</span><span></span></div>
        ${body || `<div class="cards-empty">${ico('spark')}<span>${ui.q || ui.status !== 'todas' ? 'Nada com esse filtro.' : p.id === m.id ? 'Nenhum card ainda. Lance o primeiro aqui em cima.' : 'Nenhum card neste período.'}</span></div>`}
        ${rows.length ? `<div class="cards-foot"><span>${plural(rows.length, 'card', 'cards')}${rate != null ? ` · ponto a ${fmtBRL(rate)}${b.mult > 1 ? ` · buff ${fmtMult(b.mult)} no fechamento` : ''}` : ''}</span><b>${fmtPts(okPts)} pts aprovados</b><b>${rate == null ? '—' : fmtBRL(okPts * rate * b.mult)}</b></div>` : ''}
      </div>
      ${rest > 0 ? `<div class="more"><button class="btn line sm" data-more="${p.id}">Mostrar mais ${Math.min(50, rest)} <span class="muted">de ${rest}</span></button></div>` : ''}
    </div></div>
  </section>`;
}
function cardRow(a, i, rate, admin, m) {
  const k = kindOf(a.kind), d = diffOf(a.diff), st = STATUS[a.status], lq = logoOf(a.logoQ);
  const sc = scoreOf(a), adjusted = Math.abs(sc.total - a.pts) > 0.001;
  const mods = [];
  if (a.logoQ && a.kind === 'logo' || lq.pts) mods.push(`<span class="mod ${lq.pts ? 'plus' : ''}">logo ${esc(lq.label.toLowerCase().replace(' qualidade', ''))}${lq.pts ? ` +${fmtPts(lq.pts)}` : ''}</span>`);
  S.settings.adds.forEach(ad => { const n = (a.adds || {})[ad.id]; if (n) mods.push(`<span class="mod plus">${n} ${esc(ad.label.toLowerCase().replace('variações da logo', 'variaç' + (n > 1 ? 'ões' : 'ão')).replace('mudanças', n > 1 ? 'mudanças' : 'mudança'))}</span>`); });
  const mine = a.designerId === m.id, canEdit = mine && (a.status === 'pendente' || a.status === 'erro');
  let actions = '';
  if (admin) {
    actions = `<span class="ab-more">
      ${a.status !== 'erro' ? `<button class="ab warn" data-mark="${a.id}|erro" data-tip="Pedir correção">${ico('alert')}</button>` : ''}
      ${a.status !== 'recusada' ? `<button class="ab no" data-mark="${a.id}|recusada" data-tip="Recusar">${ico('x')}</button>` : ''}
      <button class="ab" data-edit-act="${a.id}" data-tip="Editar">${ico('edit')}</button></span>${a.status !== 'aprovada' ? `<button class="ab ok" data-approve="${a.id}" data-tip="Aprovar">${ico('check')}</button>` : '<span class="ab-gap"></span>'}`;
  } else if (canEdit) {
    actions = `<span class="ab-more show"><button class="ab" data-edit-act="${a.id}" data-tip="${a.status === 'erro' ? 'Corrigir' : 'Editar'}">${ico('edit')}</button><button class="ab no" data-del-act="${a.id}" data-tip="Excluir">${ico('trash')}</button></span>`;
  } else actions = `<span class="ab-more show"><button class="ab" data-view-act="${a.id}" data-tip="Ver detalhes">${ico('note')}</button></span>`;
  const flash = ui.flash[a.id] ? `flash-${ui.flash[a.id]}` : '';
  return `<div class="crow r-${a.status} ${flash}" style="--dc:${d.color};--i:${Math.min(i, 14)}">
    <div class="c-when"><b>${fmtDay(a.date)}</b><small>${esc(a.time || '')}</small></div>
    <div class="c-main"><b>${esc(a.client || '—')}</b><span>${a.name ? esc(a.name) : '<i>sem nome</i>'}${a.luluId ? ` · lulu #${esc(a.luluId)}` : ''}</span>${a.details ? `<em title="${esc(a.details)}">“${esc(a.details)}”</em>` : ''}</div>
    <div class="c-kind"><span class="tag" style="--tc:${k.color}"><i></i>${esc(k.label)}</span>${mods.length ? `<div class="mods">${mods.join('')}</div>` : ''}</div>
    <div class="c-meta"><span class="dff" style="--dc:${d.color}"><i></i>${esc(d.label)}</span>${a.mins ? `<small>${ico('timer')}${fmtDur(a.mins)}</small>` : ''}</div>
    <div class="num c-pts">${admin ? `<input class="pts-in ${adjusted ? 'adj' : ''}" type="number" step="0.25" min="0" value="${a.pts}" data-pts="${a.id}" title="${adjusted ? `pelas regras: ${fmtPts(sc.total)}` : 'clique para ajustar'}">` : `<b>${fmtPts(a.pts)}</b>${adjusted ? `<small class="adj-note">regras: ${fmtPts(sc.total)}</small>` : ''}`}</div>
    <div class="num money ${a.status === 'aprovada' ? '' : 'faded'}">${rate == null ? '—' : fmtBRL(a.pts * rate)}</div>
    <div class="c-status"><span class="st ${st.cls}">${st.label}</span>${a.note ? `<small class="st-note">${esc(a.note)}</small>` : ''}</div>
    <div class="c-actions">${actions}</div>
  </div>`;
}

/* ============================================================
   RANKING + BUFF (todos)
   ============================================================ */
function rankLabel() { const w = startOfWeek(ui.day), e = addDays(w, 6); return `semana ${w.getDate()}–${e.getDate()} ${MES[e.getMonth()]} · ${MESL[ui.day.getMonth()]}`; }
function viewRanking() {
  if (!designers().length) return welcome();
  const w = startOfWeek(ui.day), wEnd = addDays(w, 6);
  const mFrom = new Date(ui.day.getFullYear(), ui.day.getMonth(), 1), mTo = new Date(ui.day.getFullYear(), ui.day.getMonth() + 1, 0);
  const week = designers().map(p => ({ p, s: stats(p.id, dkey(w), dkey(wEnd)) })).map(x => ({ ...x, score: x.s.points })).sort((a, b) => b.score - a.score);
  const month = designers().map(p => ({ p, s: stats(p.id, dkey(mFrom), dkey(mTo)) })).map(x => ({ ...x, score: round2(x.s.points * x.s.buff.mult) })).sort((a, b) => b.score - a.score);
  return `<section class="page">
    <div class="rank-grid">
      ${board('Ranking da semana', `${w.getDate()} a ${wEnd.getDate()} de ${MESL[wEnd.getMonth()]} · pontos aprovados`, week, false)}
      ${board('Ranking do mês', `${MESL[mFrom.getMonth()]} · pontos aprovados × buff`, month, true)}
    </div>
    ${buffArea(mFrom)}
  </section>`;
}
function board(title, sub, list, monthly) {
  const m = me(), top = list.slice(0, 3), rest = list.slice(3);
  const order = [top[1], top[0], top[2]];
  const medal = ['🥇', '🥈', '🥉'];
  const pod = order.map((x, i) => {
    if (!x) return '<div class="pod empty"></div>';
    const pos = list.indexOf(x);
    return `<div class="pod p${pos + 1} ${x.p.id === m.id ? 'me' : ''}" style="--pc:${x.p.color};--i:${i}">
      <div class="pod-av">${avatar(x.p, 'xl')}<span class="medal">${medal[pos]}</span></div>
      <b class="pod-name">${esc(firstName(x.p.name))}</b>
      <span class="pod-pts">${num(x.score)} <small>pts</small></span>
      ${monthly && x.s.buff.mult > 1 ? `<span class="pod-buff">${ico('bolt')}${fmtMult(x.s.buff.mult)}</span>` : `<span class="pod-sub">${plural(x.s.cards, 'card', 'cards')}</span>`}
      <div class="pod-bar"><span>${pos + 1}º</span></div>
    </div>`;
  }).join('');
  const lead = list[0] ? list[0].score : 0;
  return `<div class="card board">
    <div class="c-head"><h3>${ico('ranking')} ${title}</h3><span>${sub}</span></div>
    <div class="podium">${pod}</div>
    ${rest.length ? `<ol class="rest" start="4">${rest.map((x, i) => `<li class="${x.p.id === m.id ? 'me' : ''}" style="--i:${i}"><span class="lb-pos">${i + 4}</span>${avatar(x.p, 'sm')}<span class="lb-name">${esc(x.p.name)}</span><span class="gap">${lead - x.score > 0 ? `−${fmtPts(lead - x.score)}` : ''}</span><b>${fmtPts(x.score)}</b></li>`).join('')}</ol>` : ''}
    ${list.every(x => !x.score) ? '<p class="muted small center">Ninguém pontuou ainda nesse período. Bora!</p>' : ''}
  </div>`;
}
function buffArea(mFrom) {
  const tiers = [...S.settings.buff].sort((a, b) => a.h - b.h);
  const maxH = Math.max(14, (tiers[tiers.length - 1]?.h || 12) + 2);
  const pjs = designers().filter(p => p.regime === 'PJ');
  const cards = pjs.map((p, i) => {
    const b = monthBuff(p.id, mFrom);
    const pct = Math.min(100, b.avgH / maxH * 100);
    return `<div class="buff-card m${String(b.mult).replace('.', '')} ${p.id === me().id ? 'me' : ''}" style="--pc:${p.color};--i:${i}">
      <div class="bc-top">${avatar(p, 'md')}<div><b>${esc(p.name)}</b><small>${fmtDur(b.minutes)} em ${b.days} dias</small></div><span class="bc-mult">${ico('bolt')}${fmtMult(b.mult)}</span></div>
      <div class="bc-avg"><b>${fmtNum(b.avgH)}</b><span>h por dia em média</span></div>
      <div class="bc-track"><i class="bc-fill" style="--w:${pct}%"></i>${tiers.filter(t => t.h > 0).map(t => `<span class="bc-mark" style="left:${t.h / maxH * 100}%"><em>${t.h}h · ${fmtMult(t.mult)}</em></span>`).join('')}</div>
      <p class="bc-msg">${b.next ? `Faltam <b>${fmtNum(b.next.h - b.avgH)}h por dia</b> de média para ${fmtMult(b.next.mult)}` : 'Buff máximo! 🔥'}</p>
    </div>`;
  }).join('');
  return `<div class="buff-area">
    <div class="buff-head">
      <div><h2>${ico('bolt')} Buff de ${MESL[mFrom.getMonth()]}</h2><p>Quem fica mais tempo online multiplica a pontuação do mês. A média conta <b>todos os dias do mês, inclusive fins de semana</b>. Vale só para PJ.</p></div>
      <div class="buff-tiers">${tiers.map((t, i) => `<div class="bt m${String(t.mult).replace('.', '')}"><span>${i === 0 ? `menos de ${tiers[1]?.h ?? '—'}h/dia` : i === tiers.length - 1 ? `mais de ${t.h}h/dia` : `${t.h}h a ${tiers[i + 1].h}h/dia`}</span><b>${t.mult === 1 ? 'sem buff' : fmtMult(t.mult)}</b></div>`).join('')}</div>
    </div>
    ${pjs.length ? `<div class="buff-grid">${cards}</div>` : '<div class="empty-card">Nenhum designer PJ cadastrado.</div>'}
  </div>`;
}

/* ============================================================
   MÉTRICAS (igual para todos; valores dos outros ficam ocultos para designers)
   ============================================================ */
function viewMetricas() {
  if (!designers().length) return welcome();
  const { from, to, label } = period();
  const admin = isAdmin(), m = me();
  const all = designers().map(p => ({ p, s: stats(p.id, from, to) }));
  const tot = all.reduce((t, { s }) => ({ pay: t.pay + (s.pay || 0), pts: t.pts + s.points, pend: t.pend + s.pending, pendPts: t.pendPts + s.pendingPts, cards: t.cards + s.cards, min: t.min + s.minutes, err: t.err + s.errors + s.refused, cmin: t.cmin + s.avgCardMins * s.cards }), { pay: 0, pts: 0, pend: 0, pendPts: 0, cards: 0, min: 0, err: 0, cmin: 0 });
  const canSee = p => admin || p.id === m.id;
  const lb = (title, sub, key, fmt, money) => {
    const list = [...all].sort((a, b) => key(b.s) - key(a.s)), max = Math.max(1e-9, ...list.map(x => key(x.s)));
    return `<div class="card lb"><div class="c-head"><h3>${title}</h3><span>${sub}</span></div><ol>${list.map(({ p, s }, i) => `<li class="${p.id === m.id ? 'me' : ''}" style="--i:${i}"><span class="lb-pos ${i === 0 && key(s) > 0 ? 'first' : ''}">${i + 1}</span>${avatar(p, 'sm')}<span class="lb-name">${esc(firstName(p.name))}</span><span class="lb-bar"><i style="--w:${key(s) / max * 100}%;background:${p.color}"></i></span><b>${money && !canSee(p) ? '•••' : fmt(s)}</b></li>`).join('')}</ol></div>`;
  };
  return `<section class="page">
    ${tot.pend ? `<button class="alert-bar" data-go-pending>${ico('alert')}<span><b>${plural(tot.pend, 'card aguardando', 'cards aguardando')} aprovação</b> · ${fmtPts(tot.pendPts)} pts que ainda não entram no valor</span><em>${admin ? 'Conferir' : 'Ver'} ${ico('right')}</em></button>` : ''}
    <div class="kpis">
      <div class="kpi dark"><span>${admin ? 'Gasto no período' : 'Você recebe'}</span><b>${num(admin ? tot.pay : (all.find(x => x.p.id === m.id)?.s.pay || 0), 'brl')}</b><small>${admin ? `${fmtBRL(tot.cards ? tot.pay / tot.cards : 0)} por card` : 'com buff, só aprovados'}</small></div>
      <div class="kpi"><span>Pontos aprovados</span><b>${num(tot.pts)}</b><small>${fmtNum(tot.cards ? tot.pts / tot.cards : 0)} pts por card</small></div>
      <div class="kpi"><span>Cards aprovados</span><b>${num(tot.cards, 'int')}</b><small>${tot.cards ? fmtDur(tot.cmin / tot.cards) : '—'} por card em média</small></div>
      <div class="kpi"><span>Horas online</span><b>${num(tot.min, 'dur')}</b><small>${fmtNum(all.length ? tot.min / 60 / all.length : 0)}h por designer</small></div>
    </div>
    <div class="lb-grid">
      ${lb('Mais tempo online', 'horas no período', s => s.minutes, s => fmtDur(s.minutes))}
      ${lb('Mais cards', 'aprovados', s => s.cards, s => `${s.cards}`)}
      ${lb('Mais cards difíceis', 'marcados como difícil', s => s.hard, s => `${s.hard}`)}
      ${lb('A receber', 'com buff', s => s.pay || 0, s => s.pay == null ? 'fixo' : fmtBRL(s.pay), true)}
    </div>
    <div class="grid-2">
      <div class="card">${chart(all, from, to)}</div>
      <div class="card">${breakdown(all)}</div>
    </div>
    <div class="card flush">
      <div class="c-head pad"><h3>Fechamento</h3><span>${esc(label)} · só cards aprovados entram no valor</span><span class="sp"></span><button class="btn line sm" data-export-csv>${ico('sheet')}Exportar planilha</button></div>
      <div class="table-wrap"><table class="grid close">
        <thead><tr><th>Designer</th><th class="num">Cards</th><th class="num">Pontos</th><th class="num">Aguardando</th><th class="num">Pts/card</th><th class="num">Tempo/card</th><th class="num">Difíceis</th><th class="num">Online</th><th class="num">Média/dia (mês)</th><th class="num">Buff</th><th class="num">A receber</th></tr></thead>
        <tbody>${[...all].sort((a, b) => b.s.points - a.s.points).map(({ p, s }, i) => `<tr class="${p.id === m.id ? 'me' : ''}" style="--i:${i}">
          <td><div class="who-cell">${avatar(p, 'sm')}<span><b>${esc(p.name)}</b><small>${p.regime}</small></span></div></td>
          <td class="num">${s.cards}</td><td class="num"><b>${fmtPts(s.points)}</b></td><td class="num ${s.pending ? 'warn-t' : ''}">${s.pending || '—'}</td>
          <td class="num">${fmtNum(s.ptsPerCard)}</td><td class="num">${s.avgCardMins ? fmtDur(s.avgCardMins) : '—'}</td><td class="num">${s.hard || '—'}</td>
          <td class="num">${fmtDur(s.minutes)}</td><td class="num">${fmtNum(s.buff.avgH)}h</td><td class="num">${s.buff.eligible ? `<span class="mult m${String(s.buff.mult).replace('.', '')}">${fmtMult(s.buff.mult)}</span>` : '<span class="muted">CLT</span>'}</td>
          <td class="num money">${canSee(p) ? (s.pay == null ? 'fixo' : fmtBRL(s.pay)) : '•••'}</td></tr>`).join('')}</tbody>
        ${admin ? `<tfoot><tr><td>Total</td><td class="num">${tot.cards}</td><td class="num">${fmtPts(tot.pts)}</td><td class="num">${tot.pend || '—'}</td><td></td><td></td><td></td><td class="num">${fmtDur(tot.min)}</td><td></td><td></td><td class="num money">${fmtBRL(tot.pay)}</td></tr></tfoot>` : ''}
      </table></div>
    </div>
  </section>`;
}
function chart(all, from, to) {
  const days = [];
  for (let d = parseKey(from); dkey(d) <= to; d = addDays(d, 1)) days.push(dkey(d));
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
  const by = {}; all.forEach(({ s }) => Object.entries(s.byKind).forEach(([k, v]) => { by[k] = (by[k] || 0) + v; }));
  const total = Object.values(by).reduce((a, b) => a + b, 0), keys = Object.keys(by).sort((a, b) => by[b] - by[a]);
  return `<div class="c-head"><h3>De onde vêm os pontos</h3><span>por tipo de atividade</span></div>
    ${total ? `<div class="stackbar">${keys.map((k, i) => `<i style="--w:${by[k] / total * 100}%;background:${kindOf(k).color};--i:${i}"></i>`).join('')}</div>
    <ul class="bd">${keys.map(k => `<li style="--tc:${kindOf(k).color}"><i></i><span>${esc(kindOf(k).label)}</span><b>${fmtPts(by[k])} pts</b><em>${Math.round(by[k] / total * 100)}%</em></li>`).join('')}</ul>` : '<p class="muted">Nenhum ponto aprovado no período.</p>'}`;
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
function cfgList(key, title, sub, fields, opts = {}) {
  const list = S.settings[key];
  return `<div class="card cfg-card"><div class="c-head"><h3>${title}</h3><span>${sub}</span></div>
    <ul class="pt-list">${list.map((t, i) => `<li class="pt-row ${fields.includes('pts') ? '' : 'nopts'}" style="--tc:${t.color || '#E4E4E7'};--i:${i}">
      ${fields.includes('color') ? `<label class="clr"><input type="color" data-cl="${key}|${i}|color" value="${t.color}"><i></i></label>` : '<span class="clr-dot"></span>'}
      <div class="pt-main"><input class="pt-label" data-cl="${key}|${i}|label" value="${esc(t.label)}">${fields.includes('hint') ? `<input class="pt-hint" data-cl="${key}|${i}|hint" value="${esc(t.hint || '')}" placeholder="descrição">` : ''}</div>
      ${fields.includes('pts') ? `<label class="pt-val">${opts.plus ? '<span>+</span>' : ''}<input type="number" min="0" step="0.25" data-cl="${key}|${i}|pts" value="${t.pts}"><span>pt</span></label>` : ''}
      ${opts.removable && !(opts.keep || []).includes(t.id) ? `<button class="ab no" data-cl-del="${key}|${i}" data-tip="Remover">${ico('trash')}</button>` : '<span></span>'}
    </li>`).join('')}</ul>
    ${opts.addable ? `<button class="btn line sm" data-cl-add="${key}">${ico('plus')}${opts.addLabel}</button>` : ''}
  </div>`;
}
function cfgPontos() {
  const st = S.settings;
  const tiers = [...st.buff].sort((a, b) => a.h - b.h).map((t, i, arr) => `<div class="tier" style="--lvl:${i}">
    <span>a partir de</span><label><input type="number" min="0" step="0.5" data-tier="${i}|h" value="${t.h}">h/dia</label>
    <label class="tm">×<input type="number" min="0" step="0.05" data-tier="${i}|mult" value="${t.mult}"></label>
    ${arr.length > 1 && i > 0 ? `<button class="tier-x" data-del-tier="${i}" aria-label="remover faixa">${ico('x')}</button>` : ''}</div>`).join('');
  return `<div class="grid-pts">
    <div class="col">
      ${cfgList('kinds', 'Tipos de atividade', 'a base de cada card', ['color', 'hint', 'pts'], { removable: true, addable: true, addLabel: 'Novo tipo', keep: ['logo'] })}
      <div class="grid-2">
        ${cfgList('logoQ', 'Logo recebida', 'soma na base', ['pts'], { plus: true, removable: true, addable: true, addLabel: 'Nova opção', keep: ['alta'] })}
        ${cfgList('adds', 'Adicionais', 'por unidade', ['pts'], { plus: true, removable: true, addable: true, addLabel: 'Novo adicional' })}
      </div>
      ${cfgList('diffs', 'Dificuldade', 'cor da linha do card · não muda pontos', ['color'], {})}
    </div>
    <div class="col">
      <div class="card dark-card"><div class="c-head"><h3>Valor do ponto</h3><span>antes do buff</span></div>
        <label class="pv"><span>R$</span><input type="number" min="0" step="0.1" data-setting="pointValue" value="${st.pointValue}"></label></div>
      <div class="card"><div class="c-head"><h3>${ico('bolt')} Buff do mês</h3><span>só PJ · média por dia do mês, com fins de semana</span></div>
        <div class="tiers">${tiers}</div><button class="btn line sm" data-add-tier>${ico('plus')}Faixa</button>
        <p class="muted small">A receber = pontos aprovados × ${fmtBRL(st.pointValue)} × buff.</p></div>
    </div>
  </div>`;
}
function cfgHoras() {
  const { days } = period(), today = dkey(new Date()), ds = designers();
  if (!ds.length) return '<div class="empty-card">Cadastre designers primeiro.</div>';
  return `<div class="card flush"><div class="c-head pad"><h3>Horas online</h3><span>digite como 8:30 ou 8,5 · salva sozinho · fins de semana contam para o buff</span></div>
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
  const admin = isAdmin(), ro = mode === 'view';
  actCtx = { mode, id: a.id };
  const titles = { edit: admin ? 'Editar card' : (a.status === 'erro' ? 'Corrigir e reenviar' : 'Editar card'), erro: 'Pedir correção', recusada: 'Recusar card', view: 'Detalhes do card' };
  const hint = mode === 'erro' ? 'Diga o que precisa corrigir. O designer vê o comentário e reenvia.' : mode === 'recusada' ? 'Diga o motivo. Card recusado não entra no valor.' : (a.note ? `Comentário da gestão: ${a.note}` : '');
  const sc = scoreOf(a), override = Math.abs(sc.total - a.pts) > 0.001 ? a.pts : null;
  $('#actForm').innerHTML = `
    <header><h2>${titles[mode]}</h2><button type="button" class="x" data-close aria-label="Fechar">×</button></header>
    ${hint ? `<p class="dlg-hint">${esc(hint)}</p>` : ''}
    <fieldset class="cp-grid dlg" ${ro ? 'disabled' : ''}><div class="cp-fields">${cardFields(a)}</div>${receipt(a, { override })}</fieldset>
    ${admin ? `<div class="adm-box"><label class="f"><span>Status</span><select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(mode === 'erro' || mode === 'recusada' ? mode : a.status) === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label><label class="f"><span>Comentário para o designer</span><input name="note" value="${esc(a.note || '')}" placeholder="ex.: a logo não era de baixa qualidade" autocomplete="off"></label></div>` : ''}
    <p class="err" id="actErr" role="alert"></p>
    <footer>${admin ? '<button type="button" class="btn line danger" id="delAct">Excluir</button>' : ''}<span class="sp"></span><button type="button" class="btn line" data-close>${ro ? 'Fechar' : 'Cancelar'}</button>${ro ? '' : '<button type="submit" class="btn dark">Salvar</button>'}</footer>`;
  $('#actDlg').showModal();
  const f = (mode === 'erro' || mode === 'recusada') ? $('#actForm').elements.note : null;
  if (f) f.focus();
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
  hoursCtx = { pid };
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

function ripple(e) {
  const b = e.target.closest('.btn, .seg button, .rail-nav button, .ab, .chip.edit, .today-btn, .icon-btn, .person.add, .alert-bar, .tile span, .pill span, .qt, .stepper-n button');
  if (!b || b.disabled) return;
  const host = b.matches('.tile span, .pill span') ? b : b;
  const r = host.getBoundingClientRect(), s = Math.max(r.width, r.height) * 1.6;
  const el = document.createElement('i');
  el.className = 'rip'; el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  host.appendChild(el); setTimeout(() => el.remove(), 600);
}

function saveCardFromForm(form, existing) {
  const admin = isAdmin(), c = readCard(form);
  const err = msg => { const el = form.querySelector('#actErr') || form.querySelector('.rc-err'); if (el) { el.textContent = msg; } toast(msg, 'warn'); };
  if (!c.client) { err('Qual o cliente?'); const f = form.elements.client; f.focus(); f.closest('.f').classList.add('shake'); setTimeout(() => f.closest('.f').classList.remove('shake'), 500); return null; }
  const sc = scoreOf(c);
  const pts = admin && c.ptsOverride != null ? c.ptsOverride : sc.total;
  const data = { designerId: c.designerId, date: c.date, time: c.time, client: c.client, name: c.name, luluId: c.luluId, kind: c.kind, logoQ: c.logoQ, adds: c.adds, diff: c.diff, mins: c.mins, details: c.details, pts };
  if (existing) {
    Object.assign(existing, data);
    if (admin) { existing.status = form.elements.status.value; existing.note = form.elements.note.value.trim(); }
    else if (existing.status === 'erro') existing.status = 'pendente';
    return existing;
  }
  const a = { id: uid(), ...data, status: admin ? 'aprovada' : 'pendente', note: '', createdAt: new Date().toISOString(), by: admin ? 'admin' : 'designer' };
  S.activities.push(a);
  return a;
}

function bind() {
  document.addEventListener('pointerdown', ripple);
  document.addEventListener('click', e => {
    const t = e.target; let el;
    if ((el = t.closest('[data-step]'))) { const [id, d] = el.dataset.step.split('|'), inp = el.closest('form').elements['add_' + id]; inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + +d); inp.classList.remove('bump'); void inp.offsetWidth; inp.classList.add('bump'); refreshReceipt(el.closest('form')); return; }
    if ((el = t.closest('[data-qt]'))) { const f = el.closest('form'); f.elements.mins.value = toHM(+el.dataset.qt); f.querySelectorAll('.qt').forEach(q => q.classList.toggle('on', q === el)); refreshReceipt(f); return; }
    if (t.closest('dialog')) return;
    if ((el = t.closest('#nav [data-view]'))) { if (el.dataset.view === 'ranking') ui.day = ui.day || new Date(); go(el.dataset.view); return; }
    if ((el = t.closest('[data-period]'))) { ui.limit = {}; ui.period = el.dataset.period; ui.enter = true; render(); return; }
    if ((el = t.closest('[data-shift]'))) { shiftPeriod(+el.dataset.shift); ui.enter = true; render(); return; }
    if ((el = t.closest('[data-rshift]'))) { const n = +el.dataset.rshift; ui.day = n ? addDays(ui.day, 7 * n) : new Date(); ui.enter = true; render(); return; }
    if ((el = t.closest('[data-status]'))) { ui.status = el.dataset.status; render(); return; }
    if ((el = t.closest('[data-cfg]'))) { ui.cfg = el.dataset.cfg; ui.enter = true; render(); return; }
    if (t.closest('[data-toggle-composer]')) { ui.composer = !ui.composer; t.closest('.composer').classList.toggle('closed'); return; }
    if ((el = t.closest('[data-more]'))) { ui.limit[el.dataset.more] = (ui.limit[el.dataset.more] || 25) + 50; render(); return; }
    if ((el = t.closest('[data-hours]'))) { e.stopPropagation(); openHours(el.dataset.hours); return; }
    if ((el = t.closest('[data-approve-all]'))) {
      const { from, to } = period();
      const list = S.activities.filter(a => a.designerId === el.dataset.approveAll && a.status === 'pendente' && inRange(a.date, from, to));
      list.forEach(a => { a.status = 'aprovada'; ui.flash[a.id] = 'ok'; });
      addLog(`aprovou ${list.length} cards de ${firstName(person(el.dataset.approveAll).name)}`);
      save(); render(); toast(plural(list.length, 'card aprovado', 'cards aprovados')); return;
    }
    if ((el = t.closest('[data-toggle]'))) { if (t.closest('button, select, input')) return; if (visiblePeople().length === 1) return; ui.closed[el.dataset.toggle] = !ui.closed[el.dataset.toggle]; el.closest('.block').classList.toggle('closed'); return; }
    if ((el = t.closest('[data-approve]'))) { const a = act(el.dataset.approve); if (a) { a.status = 'aprovada'; a.note = ''; ui.flash[a.id] = 'ok'; addLog(`aprovou: ${who(a)} · ${a.client} (${fmtPts(a.pts)} pts)`); save(); render(); toast('Card aprovado'); } return; }
    if ((el = t.closest('[data-mark]'))) { const [id, st] = el.dataset.mark.split('|'); const a = act(id); if (a) openAct(st, a); return; }
    if ((el = t.closest('[data-edit-act]'))) { const a = act(el.dataset.editAct); if (a) openAct('edit', a); return; }
    if ((el = t.closest('[data-view-act]'))) { const a = act(el.dataset.viewAct); if (a) openAct('view', a); return; }
    if ((el = t.closest('[data-del-act]'))) { const a = act(el.dataset.delAct); if (a && confirm('Excluir este card?')) { S.activities = S.activities.filter(x => x !== a); save(); render(); toast('Excluído', 'info'); } return; }
    if (t.closest('[data-go-pending]')) { ui.status = 'pendente'; ui.who = 'all'; go('atividades'); return; }
    if (t.closest('[data-export-csv]')) { exportCSV(); return; }
    if (t.closest('[data-add-person]')) { openPerson(); return; }
    if ((el = t.closest('[data-edit-person]'))) { openPerson(person(el.dataset.editPerson)); return; }
    if ((el = t.closest('[data-del-person]'))) {
      const p = person(el.dataset.delPerson); if (!p) return;
      const n = S.activities.filter(a => a.designerId === p.id).length;
      if (!confirm(`Remover ${p.name}?${n ? ` Os ${n} cards dele(a) também serão apagados.` : ''}`)) return;
      S.people = S.people.filter(x => x !== p); S.activities = S.activities.filter(a => a.designerId !== p.id);
      Object.values(S.online).forEach(d => delete d[p.id]); addLog(`removeu ${p.name}`); save(); render(); toast(`${firstName(p.name)} removido(a)`, 'info'); return;
    }
    if ((el = t.closest('[data-cl-add]'))) {
      const key = el.dataset.clAdd, list = S.settings[key];
      list.push({ id: key[0] + uid().slice(0, 5), label: key === 'kinds' ? 'Novo tipo' : key === 'logoQ' ? 'Nova opção' : 'Novo adicional', pts: key === 'kinds' ? 1 : 0.5, color: PALETTE[list.length % PALETTE.length], hint: '' });
      save(); render(); toast('Criado'); return;
    }
    if ((el = t.closest('[data-cl-del]'))) { const [key, i] = el.dataset.clDel.split('|'); if (!confirm('Remover esta opção? Cards antigos mantêm os pontos que têm.')) return; S.settings[key].splice(+i, 1); save(); render(); return; }
    if (t.closest('[data-add-tier]')) { const l = [...S.settings.buff].sort((a, b) => a.h - b.h).pop() || { h: 0, mult: 1 }; S.settings.buff.push({ h: l.h + 2, mult: Math.round((l.mult + .5) * 100) / 100 }); save(); render(); return; }
    if ((el = t.closest('[data-del-tier]'))) { const s = [...S.settings.buff].sort((a, b) => a.h - b.h); s.splice(+el.dataset.delTier, 1); S.settings.buff = s; save(); render(); return; }
    if ((el = t.closest('[data-io]'))) { io(el.dataset.io); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'meSel') { ui.meId = t.value; localStorage.setItem('dede.me', ui.meId); ui.who = 'all'; ui.draft = null; ui.enter = true; render(); toast(`Você está como ${firstName(me().name)}`, 'info'); return; }
    if (t.matches('[data-who]')) { ui.who = t.value; ui.draft = null; ui.enter = true; render(); return; }
    if (t.matches('[data-online]')) {
      const [pid, k] = t.dataset.online.split('|'), min = parseHM(t.value);
      if (min > 24 * 60) { toast('Mais de 24h num dia? Confere.', 'warn'); t.value = toHM(onlineMin(pid, k)); return; }
      setOnline(pid, k, min); addLog(`lançou ${fmtDur(min)} online para ${firstName(person(pid).name)} em ${fmtDay(k)}`); save();
      t.value = toHM(min); t.classList.toggle('has', !!min); t.classList.add('saved'); setTimeout(() => t.classList.remove('saved'), 900);
      const tot = t.closest('tr')?.querySelector('.h-tot'); if (tot) tot.textContent = fmtDur(period().days.reduce((s, d) => s + onlineMin(pid, dkey(d)), 0));
      return;
    }
    if (t.matches('[data-pts]')) {
      const a = act(t.dataset.pts), v = parseFloat(String(t.value).replace(',', '.'));
      if (a && !isNaN(v) && v >= 0) { const old = a.pts; a.pts = v; ui.flash[a.id] = 'edit'; addLog(`ajustou pontos de ${who(a)} · ${a.client}: ${fmtPts(old)} → ${fmtPts(v)}`); save(); render(); toast('Pontuação ajustada'); }
      return;
    }
    if (t.matches('[data-pay]')) { const p = person(t.dataset.pay); if (p) { p.payByPoints = t.checked; save(); toast(t.checked ? 'Recebe por pontos' : 'Valor fixo', 'info'); } return; }
    if (t.matches('[data-setting]')) { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) { S.settings[t.dataset.setting] = v; save(); toast('Valor do ponto atualizado'); } return; }
    if (t.matches('[data-cl]')) {
      const [key, i, f] = t.dataset.cl.split('|'), item = S.settings[key][+i]; if (!item) return;
      if (f === 'pts') { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) item.pts = v; } else item[f] = t.value;
      save(); if (f === 'color') render(); else toast('Atualizado'); return;
    }
    if (t.matches('[data-tier]')) { const [i, f] = t.dataset.tier.split('|'), s = [...S.settings.buff].sort((a, b) => a.h - b.h), v = parseFloat(t.value); if (isNaN(v) || v < 0) return; s[+i][f] = v; S.settings.buff = s; save(); render(); toast('Buff atualizado'); return; }
    if (t.closest('[data-cardform]')) { if (t.name === 'designerId' && t.form.id === 'quickForm') { ui.draft = { ...readCard(t.form), designerId: t.value }; render(); return; } refreshReceipt(t.closest('form')); }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-q]')) { ui.q = e.target.value; const pos = e.target.selectionStart; render(); const n = $('[data-q]'); n.focus(); n.setSelectionRange(pos, pos); return; }
    if (e.target.closest('[data-cardform]')) refreshReceipt(e.target.closest('form'));
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'quickForm') return;
    e.preventDefault();
    const a = saveCardFromForm(e.target, null); if (!a) return;
    ui.flash[a.id] = 'new';
    if (isAdmin()) addLog(`lançou para ${who(a)}: ${a.client} (${fmtPts(a.pts)} pts)`);
    save();
    // mantém dia, hora e designer; limpa o resto
    ui.draft = { ...emptyCard(a.designerId), date: a.date };
    render();
    const N = $('#quickForm').elements; N.client.focus();
    toast(`Card lançado · ${fmtPts(a.pts)} ${a.pts === 1 ? 'ponto' : 'pontos'}${isAdmin() ? '' : ' · aguardando aprovação'}`);
  });

  $$('dialog').forEach(dl => {
    dl.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === dl) closeDlg(dl); });
    dl.addEventListener('cancel', e => { e.preventDefault(); closeDlg(dl); });
  });

  $('#actForm').addEventListener('submit', e => {
    e.preventDefault();
    const a = act(actCtx.id), admin = isAdmin();
    if (admin && (e.target.elements.status.value === 'erro' || e.target.elements.status.value === 'recusada') && !e.target.elements.note.value.trim()) { $('#actErr').textContent = 'Escreva um comentário para o designer.'; return; }
    if (!saveCardFromForm(e.target, a)) return;
    if (admin) addLog(`${STATUS[a.status].label.toLowerCase()}: ${who(a)} · ${a.client} (${fmtPts(a.pts)} pts)${a.note ? ' — ' + a.note : ''}`);
    ui.flash[a.id] = a.status === 'aprovada' ? 'ok' : a.status === 'recusada' || a.status === 'erro' ? 'warn' : 'edit';
    save(); closeDlg($('#actDlg')); render();
    toast(actCtx.mode === 'erro' ? 'Correção pedida' : actCtx.mode === 'recusada' ? 'Card recusado' : (!admin ? 'Enviado para aprovação' : 'Salvo'), actCtx.mode === 'edit' ? 'ok' : 'warn');
  });
  $('#actForm').addEventListener('click', e => { if (e.target.id === 'delAct') { if (!confirm('Excluir este card?')) return; S.activities = S.activities.filter(a => a.id !== actCtx.id); addLog('excluiu um card'); save(); closeDlg($('#actDlg')); render(); toast('Excluído', 'info'); } });

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
function closeDlg(dl) { if (!dl.open) return; dl.classList.add('closing'); setTimeout(() => { dl.classList.remove('closing'); dl.close(); }, 160); }

function exportCSV() {
  const { from, to, label } = period();
  const n = v => String(v).replace('.', ','), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Designer', 'Regime', 'Dia', 'Hora', 'Cliente', 'Nome do card', 'Nº lulu', 'Tipo de atividade', 'Logo recebida', ...S.settings.adds.map(a => a.label), 'Dificuldade', 'Tempo (min)', 'Detalhes', 'Pontos', 'Status', 'Comentário da gestão', 'Valor (R$, sem buff)'].join(';')];
  for (const p of isAdmin() ? designers() : [me()]) {
    const s = stats(p.id, from, to);
    for (const a of s.acts.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) {
      const d = parseKey(a.date);
      lines.push([q(p.name), p.regime, `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, a.time, q(a.client), q(a.name), a.luluId, q(kindOf(a.kind).label), q(logoOf(a.logoQ).label), ...S.settings.adds.map(ad => (a.adds || {})[ad.id] || 0), diffOf(a.diff).label, a.mins || 0, q(a.details), n(a.pts), STATUS[a.status].label, q(a.note), p.payByPoints && a.status === 'aprovada' ? n((a.pts * S.settings.pointValue).toFixed(2)) : ''].join(';'));
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
  if (kind === 'demo') { if (designers().length && !confirm('Carregar o exemplo substitui os dados atuais. Continuar?')) return; S = demoState(); save(); ui.view = 'atividades'; ui.period = 'semana'; ui.draft = null; ui.enter = true; render(); return toast('Exemplo carregado', 'info'); }
  if (kind === 'reset') { if (!confirm('Zerar tudo? Designers, cards e horas serão apagados.')) return; S = normalize({ settings: S.settings }); ui.meId = 'adm'; localStorage.setItem('dede.me', 'adm'); save(); ui.draft = null; ui.enter = true; render(); return toast('Tudo zerado', 'info'); }
}

window.dede = { receberDoLulu: p => { const r = receiveFromLulu(p); save(); render(); return r; } };

(function init() { S = load() || normalize({}); save(); bind(); render(); })();
