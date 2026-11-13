'use strict';
/* =========================================================
   aba. — telas
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

const fmtPts = n => (Math.round(n * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const fmtNum = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtBRL = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDur = min => { min = Math.max(0, Math.round(min)); const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h${pad(m)}` : `${m}min`; };
const fmtMult = m => `×${fmtNum(m, m % 1 ? (Math.round(m * 100) % 10 ? 2 : 1) : 1)}`;

const ui = {
  view: 'painel',
  period: 'semana',
  meId: localStorage.getItem('aba.me') || 'adm',
  day: new Date(),
  cardTab: 'fazendo',
  cardWho: 'me',
  q: '',
  shownDone: 40,
  rotation: 'noite',
  sim: null,
};
const I = {
  painel: '<path d="M3 13h8V3H3z"/><path d="M13 21h8V11h-8z"/><path d="M13 3v6h8V3z"/><path d="M3 21h8v-6H3z"/>',
  cards: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  turno: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pontos: '<path d="M12 2l2.9 6.26 6.6.74-4.9 4.6 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9l6.6-.74z"/>',
  equipe: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 21h16"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
};
const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;
/* medidor de barrinhas (estilo "uso") */
const ticks = (frac, n = 28) => { const on = Math.round(Math.max(0, Math.min(1, frac)) * n); return `<div class="ticks" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div>`; };
const me = () => person(ui.meId) || S.people.find(p => p.role === 'admin') || S.people[0];
const isAdmin = () => me() && me().role === 'admin';
const avatar = (p, size = '') => p ? `<span class="av ${size}" style="--pc:${p.color}" title="${esc(p.name)}">${esc(initials(p.name))}</span>` : `<span class="av ${size} ghost-av">?</span>`;

/* ---------- período ---------- */
function periodRange() {
  const now = new Date(), t = startOfDay(now);
  switch (ui.period) {
    case 'hoje': return { from: t, to: now, label: `hoje, ${t.getDate()} de ${MESL[t.getMonth()]}` };
    case 'mes': return { from: new Date(t.getFullYear(), t.getMonth(), 1), to: now, label: MESL[t.getMonth()] };
    case 'mes_ant': { const a = new Date(t.getFullYear(), t.getMonth() - 1, 1); return { from: a, to: new Date(t.getFullYear(), t.getMonth(), 1), label: `${MESL[a.getMonth()]} (fechado)` }; }
    default: { const w = startOfWeek(t); return { from: w, to: now, label: `semana de ${w.getDate()} ${MES[w.getMonth()]}` }; }
  }
}
function periodTabs() {
  const keep = ui.period, out = [];
  for (const [v, l] of [['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês'], ['mes_ant', 'Mês passado']]) {
    ui.period = v; const { from, to } = periodRange();
    const pts = designers().filter(p => isAdmin() || p.id === me().id).reduce((t, p) => t + stats(p.id, from, to).points, 0);
    out.push(`<button class="tab-pill ${keep === v ? 'on' : ''}" data-period="${v}">${ico('cal')}<span>${l}</span><b>${fmtPts(pts)}</b></button>`);
  }
  ui.period = keep;
  return `<div class="tab-row">${out.join('')}</div>`;
}
function meterCard() {
  const m = me(), ds = designers();
  if (isAdmin()) {
    const on = ds.filter(p => isOnlineNow(p.id)).length;
    return `<div class="meter-card"><span class="mc-ico">${ico('bolt')}</span><div class="mc-t"><b>Time online agora</b><span>${on} de ${ds.length} designers</span></div>${ticks(ds.length ? on / ds.length : 0, 30)}</div>`;
  }
  const today = startOfDay(new Date());
  const min = minutesOnline(m.id, today, new Date());
  const top = [...S.settings.tiers].sort((a, b) => b.h - a.h)[0] || { h: 10, mult: 1 };
  const left = top.h * 60 - min;
  return `<div class="meter-card"><span class="mc-ico">${ico('bolt')}</span><div class="mc-t"><b>Hoje · ${fmtDur(min)} online</b><span>${left > 0 ? `faltam ${fmtDur(left)} para ${fmtMult(top.mult)}` : `bônus máximo ${fmtMult(top.mult)}`}</span></div>${ticks(min / (top.h * 60), 30)}</div>`;
}
function nightBanner() {
  const now = new Date(), k = dkey(now);
  const ppl = [...new Set(NIGHT().flatMap(h => shiftIds(k, h)))].map(person).filter(Boolean);
  const txt = ppl.length ? `${ppl.map(p => firstName(p.name)).join(' e ')} ${ppl.length > 1 ? 'ficam' : 'fica'} até as ${H().nightEnd}h` : 'Ninguém escalado ainda';
  return `<button class="banner" data-go="turno"><span class="b-sky"></span><span class="b-txt"><b>Escala de hoje à noite</b><span>${esc(txt)}</span></span><span class="b-av">${ppl.map(p => avatar(p, 'sm')).join('')}</span></button>`;
}
const periodSeg = () => `<div class="seg period">${[['hoje', 'hoje'], ['semana', 'semana'], ['mes', 'mês'], ['mes_ant', 'mês passado']].map(([v, l]) => `<button data-period="${v}" class="${ui.period === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;

/* ---------- shell ---------- */
function render() {
  if (!person(ui.meId)) ui.meId = me().id;
  const items = [['painel', 'Painel'], ['cards', 'Cards'], ['turno', 'Turno'], ['pontos', 'Pontuação']];
  if (isAdmin()) items.push(['equipe', 'Equipe']);
  if (!items.some(i => i[0] === ui.view)) ui.view = 'painel';
  $('#nav').innerHTML = items.map(([v, l]) => `<button data-view="${v}" class="${ui.view === v ? 'on' : ''}" title="${l}" aria-label="${l}">${ico(v)}${v === 'cards' ? badgeQueue() : ''}<span class="tip">${l}</span></button>`).join('');
  $('#title').innerHTML = titleFor(Object.fromEntries(items)[ui.view] || '');
  renderMe();
  document.body.dataset.view = ui.view;
  document.body.classList.toggle('is-admin', isAdmin());
  const v = { painel: viewPainel, cards: viewCards, turno: viewTurno, pontos: viewPontos, equipe: viewEquipe }[ui.view];
  $('#main').innerHTML = v();
  tick();
}
function titleFor(label) {
  let sub = '';
  if (ui.view === 'painel') sub = periodRange().label;
  else if (ui.view === 'cards') sub = `${S.cards.filter(c => c.status === 'fazendo').length} em andamento`;
  else if (ui.view === 'turno') sub = `${WDL[ui.day.getDay()]}, ${ui.day.getDate()} de ${MESL[ui.day.getMonth()]}`;
  else if (ui.view === 'pontos') sub = `${S.settings.itemTypes.length} tipos de tarefa`;
  else if (ui.view === 'equipe') sub = `${S.people.length} pessoas`;
  return `<span>${label}</span><i class="sep"></i><span class="sub">${esc(sub)}</span>`;
}
function badgeQueue() {
  const n = S.cards.filter(c => c.status === 'fila').length;
  return n ? `<i class="nav-badge">${n}</i>` : '';
}
function renderMe() {
  const m = me();
  const opts = `<optgroup label="Admin">${S.people.filter(p => p.role === 'admin').map(p => `<option value="${p.id}" ${p.id === m.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>
    <optgroup label="Designers">${designers().map(p => `<option value="${p.id}" ${p.id === m.id ? 'selected' : ''}>${esc(p.name)} · ${p.regime}</option>`).join('')}</optgroup>`;
  let status = '';
  if (m.role === 'designer') {
    const s = openSession(m.id);
    status = s
      ? `<button class="online-btn on" data-online-self="off" title="Clique para ficar offline"><i class="dot"></i>online <span class="mono" data-since="${s.start}"></span><em>sair</em></button>`
      : `<button class="online-btn" data-online-self="on"><i class="dot"></i>ficar online</button>`;
  } else {
    const n = designers().filter(p => isOnlineNow(p.id)).length;
    status = `<span class="online-count"><i class="dot"></i>${n} de ${designers().length} online</span>`;
  }
  $('#me').innerHTML = `${status}<label class="whoami" title="Modo demonstração: troque de usuário para ver como cada um enxerga">${avatar(m, 'sm')}<select id="meSel" aria-label="Entrar como">${opts}</select></label>`;
}

/* ============================================================
   PAINEL
   ============================================================ */
function viewPainel() {
  const { from, to, label } = periodRange();
  const ds = designers();
  const rows = ds.map(p => ({ p, s: stats(p.id, from, to) })).sort((a, b) => b.s.points - a.s.points);
  const tot = rows.reduce((t, { s }) => ({ points: t.points + s.points, cards: t.cards + s.cards, minutes: t.minutes + s.minutes, pay: t.pay + (s.pay || 0) }), { points: 0, cards: 0, minutes: 0, pay: 0 });
  const m = me(), admin = isAdmin();

  let hero;
  if (admin) {
    hero = `<div class="kpis">
      ${kpi('pontos', fmtPts(tot.points), `${rows.length} designers`, 'lime')}
      ${kpi('clientes atendidos', tot.cards, tot.cards ? `${fmtNum(tot.points / tot.cards)} pts por cliente` : '—')}
      ${kpi('tempo online', fmtDur(tot.minutes), 'soma do time')}
      ${kpi('a pagar', fmtBRL(tot.pay), `${fmtBRL(S.settings.pointValue)} por ponto × bônus`, 'ink')}
    </div>`;
  } else {
    const mine = rows.find(r => r.p.id === m.id) || { s: stats(m.id, from, to) };
    const pos = rows.findIndex(r => r.p.id === m.id) + 1;
    const s = mine.s;
    hero = `<div class="hero" style="--pc:${m.color}">
      <div class="hero-main">
        <span class="eyebrow mono">${pos ? `${pos}º no time` : ''}</span>
        <div class="hero-pts"><b>${fmtPts(s.points)}</b><span>pontos</span></div>
        <p class="mono">${s.cards} clientes · ${fmtNum(s.ptsPerCard)} pts por cliente · ${fmtNum(s.cardsPerDay)} clientes/dia</p>
      </div>
      <div class="hero-side">
        <div><span class="mono">tempo online</span><b>${fmtDur(s.minutes)}</b><small class="mono">${fmtNum(s.avgH)}h por dia</small></div>
        <div><span class="mono">bônus de horas</span><b>${fmtMult(s.mult)}</b><small class="mono">${nextTierHint(s.avgH)}</small></div>
        <div class="pay"><span class="mono">a receber</span><b>${s.pay == null ? '—' : fmtBRL(s.pay)}</b><small class="mono">${fmtPts(s.points)} × ${fmtBRL(S.settings.pointValue)} × ${fmtNum(s.mult, 2)}</small></div>
      </div>
    </div>`;
  }

  return `<section class="page">
    <div class="page-head">
      <button class="solid big" data-go="cards">${ico('cards')}Continuar nos cards</button><span class="vsep"></span>
      ${periodTabs()}
    </div>
    ${meterCard()}
    ${hero}
    <div class="grid-2">
      <div class="card list-card">${cardHead('Agora', admin ? 'desligue quem parou de responder' : 'quem está online neste momento')}${nightBanner()}${nowList()}</div>
      <div class="card">${cardHead('Pontos ao longo do tempo', ui.period === 'hoje' ? 'por hora' : 'por dia')}${pointsChart(rows, from, to)}</div>
    </div>
    <div class="card">${cardHead('Fechamento', `${esc(label)} · bônus pela média de horas online por dia trabalhado`)}${rankTable(rows, from, to)}</div>
    <div class="grid-2">
      <div class="card">${cardHead('De onde vêm os pontos', 'por tipo de tarefa')}${breakdown(rows)}</div>
      <div class="card">${cardHead('Escala noturna', 'combinado × cumprido no período')}${turnoSummary(from, to)}</div>
    </div>
  </section>`;
}
const kpi = (label, value, sub, tone = '') => `<div class="kpi ${tone}"><span class="mono">${label}</span><b>${value}</b><small class="mono">${sub}</small></div>`;
const cardHead = (t, sub) => `<div class="card-head"><h3>${t}</h3>${sub ? `<span class="mono">${sub}</span>` : ''}</div>`;
function nextTierHint(avgH) {
  const t = [...S.settings.tiers].sort((a, b) => a.h - b.h).find(x => x.h > avgH);
  return t ? `${fmtNum(t.h - avgH)}h/dia para ${fmtMult(t.mult)}` : 'bônus máximo';
}

function nowList() {
  const admin = isAdmin(), now = new Date(), k = dkey(now);
  const ds = designers().map(p => ({ p, s: openSession(p.id) })).sort((a, b) => (!!b.s - !!a.s));
  return `<ul class="now-list">${ds.map(({ p, s }) => {
    const last = S.sessions.filter(x => x.personId === p.id && x.end).sort((a, b) => new Date(b.end) - new Date(a.end))[0];
    const night = committedHours(p.id, k);
    const lastTxt = last ? `saiu ${sameDay(new Date(last.end), now) ? 'às ' + hm(new Date(last.end)) : 'em ' + WD[new Date(last.end).getDay()]}${last.endedBy === 'admin' ? ' · desligado pela gestão' : ''}` : 'sem registro';
    return `<li class="${s ? 'on' : ''}">
      ${avatar(p)}
      <div class="nl-t"><b>${esc(p.name)}${p.regime === 'PJ' ? '<i class="badge-pj">PJ</i>' : ''}</b><small class="mono">${s ? `online há <span data-since="${s.start}"></span>` : lastTxt}${night.length ? ` · <span class="moon-t">☾ ${pad(night[0])}–${pad(night[night.length - 1] + 1)}h hoje</span>` : ''}</small></div>
      <span class="nl-meter">${ticks(minutesOnline(p.id, startOfDay(now), now) / 600, 12)}</span>
      ${admin ? `<label class="switch big" title="${s ? 'Desligar' : 'Ligar'}"><input type="checkbox" data-admin-online="${p.id}" ${s ? 'checked' : ''}><i></i></label>` : `<span class="pill-status mono">${s ? 'online' : 'offline'}</span>`}
    </li>`;
  }).join('')}</ul>`;
}

/* gráfico de barras empilhadas, feito à mão em SVG */
function pointsChart(rows, from, to) {
  const hourly = ui.period === 'hoje';
  const buckets = [];
  if (hourly) {
    for (const h of range(H().start, H().nightEnd)) buckets.push({ key: h, label: pad(h) });
  } else {
    for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
      if (isWeekendDate(d)) continue;
      buckets.push({ key: dkey(d), label: ui.period === 'semana' ? WD[d.getDay()] : String(d.getDate()) });
    }
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  const data = rows.map(({ p }) => ({ p, v: buckets.map(() => 0) }));
  const pIdx = new Map(data.map((d, i) => [d.p.id, i]));
  for (const c of S.cards) {
    const di = pIdx.get(c.designerId); if (di == null) continue;
    for (const e of c.entries) {
      if (e.status !== 'feito' || !e.at) continue;
      const t = new Date(e.at); if (t < from || t >= to) continue;
      const bi = idx.get(hourly ? t.getHours() : dkey(t)); if (bi == null) continue;
      data[di].v[bi] += typeOf(e.type).pts;
    }
  }
  const sums = buckets.map((_, i) => data.reduce((s, d) => s + d.v[i], 0));
  const max = Math.max(1, ...sums);
  const mag = Math.pow(10, Math.floor(Math.log10(max / 4)));
  const stepV = [1, 2, 2.5, 5, 10, 20].map(x => x * mag).find(x => Math.ceil(max / x) <= 5);
  const lines = Math.max(1, Math.ceil(max / stepV)), nice = stepV * lines;
  const W = 720, Hh = 230, pl = 34, pb = 26, pt = 10, pr = 6;
  const iw = W - pl - pr, ih = Hh - pb - pt;
  const bw = iw / Math.max(1, buckets.length);
  const gap = Math.min(10, bw * 0.28);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="Pontos por ${hourly ? 'hora' : 'dia'}">`;
  for (let g = 0; g <= lines; g++) {
    const y = pt + ih - ih * g / lines;
    svg += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" class="grid-l"/><text x="${pl - 6}" y="${y + 3}" class="ax" text-anchor="end">${fmtPts(stepV * g)}</text>`;
  }
  buckets.forEach((b, i) => {
    let y = pt + ih;
    const x = pl + i * bw + gap / 2, w = Math.max(2, bw - gap);
    data.forEach(d => {
      const v = d.v[i]; if (!v) return;
      const h = ih * v / nice;
      y -= h;
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, h - 1.5).toFixed(1)}" rx="3" fill="${d.p.color}"><title>${esc(d.p.name)} · ${b.label}: ${fmtPts(v)} pts</title></rect>`;
    });
    const showLbl = buckets.length <= 16 || i % Math.ceil(buckets.length / 16) === 0;
    if (showLbl) svg += `<text x="${(x + w / 2).toFixed(1)}" y="${Hh - 8}" class="ax" text-anchor="middle">${b.label}</text>`;
  });
  svg += '</svg>';
  const leg = `<div class="chart-leg">${rows.map(({ p }) => `<span><i style="background:${p.color}"></i>${esc(firstName(p.name))}</span>`).join('')}</div>`;
  return buckets.length ? svg + leg : '<p class="muted">Sem dias úteis no período.</p>';
}

function spark(perDay, from, to, color) {
  const days = [];
  for (let d = startOfDay(from); d < to; d = addDays(d, 1)) if (!isWeekendDate(d)) days.push(perDay[dkey(d)] || 0);
  if (days.length < 2) return '';
  const max = Math.max(1, ...days), W = 90, Hh = 26;
  const pts = days.map((v, i) => `${(i / (days.length - 1) * W).toFixed(1)},${(Hh - 2 - v / max * (Hh - 4)).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${Hh}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function rankTable(rows, from, to) {
  const admin = isAdmin(), m = me();
  const max = Math.max(1, ...rows.map(r => r.s.points));
  const body = rows.map(({ p, s }, i) => {
    const showPay = admin || p.id === m.id;
    return `<tr class="${p.id === m.id ? 'mine' : ''}">
      <td class="pos mono">${i + 1}</td>
      <td><div class="who-cell">${avatar(p, 'sm')}<span><b>${esc(p.name)}</b><small class="mono">${p.regime}</small></span></div></td>
      <td><div class="bar-cell"><div class="pbar"><i style="width:${s.points / max * 100}%;background:${p.color}"></i></div><b class="mono">${fmtPts(s.points)}</b></div></td>
      <td class="mono">${s.cards}</td>
      <td class="mono">${fmtNum(s.cardsPerDay)}</td>
      <td class="mono">${fmtNum(s.ptsPerCard)}</td>
      <td class="mono">${fmtDur(s.minutes)}<small>${fmtNum(s.avgH)}h/dia</small></td>
      <td class="mono"><span class="mult m${Math.round((s.mult - 1) * 10)}">${fmtMult(s.mult)}</span></td>
      <td class="mono pay-cell">${showPay ? (s.pay == null ? '<span class="muted">fixo</span>' : fmtBRL(s.pay)) : '<span class="muted">·····</span>'}</td>
      <td>${spark(s.perDay, from, to, p.color)}</td>
    </tr>`;
  }).join('');
  const totPay = rows.reduce((t, r) => t + (r.s.pay || 0), 0);
  return `<div class="table-wrap"><table class="rank">
    <thead><tr><th></th><th>designer</th><th>pontos</th><th>clientes</th><th>por dia</th><th>pts/cliente</th><th>online</th><th>bônus</th><th>a receber</th><th>ritmo</th></tr></thead>
    <tbody>${body}</tbody>
    ${admin ? `<tfoot><tr><td></td><td>total</td><td class="mono">${fmtPts(rows.reduce((t, r) => t + r.s.points, 0))}</td><td class="mono">${rows.reduce((t, r) => t + r.s.cards, 0)}</td><td></td><td></td><td class="mono">${fmtDur(rows.reduce((t, r) => t + r.s.minutes, 0))}</td><td></td><td class="mono pay-cell">${fmtBRL(totPay)}</td><td></td></tr></tfoot>` : ''}
  </table></div>`;
}

function breakdown(rows) {
  const isMine = !isAdmin();
  const src = isMine ? rows.filter(r => r.p.id === me().id) : rows;
  const by = {};
  src.forEach(({ s }) => Object.entries(s.byType).forEach(([k, v]) => { by[k] = (by[k] || 0) + v; }));
  const total = Object.values(by).reduce((a, b) => a + b, 0);
  if (!total) return '<p class="muted">Nenhum ponto no período.</p>';
  const types = S.settings.itemTypes.filter(t => by[t.id]);
  return `<div class="stackbar">${types.map(t => `<i style="width:${by[t.id] / total * 100}%;background:${t.color}" title="${esc(t.label)}"></i>`).join('')}</div>
    <ul class="bd-list">${types.map(t => `<li style="--tc:${t.color}"><i></i><span>${esc(t.label)}</span><small class="mono">${Math.round(by[t.id] / typeOf(t.id).pts || 0)} itens</small><b class="mono">${fmtPts(by[t.id])} pts</b><em class="mono">${Math.round(by[t.id] / total * 100)}%</em></li>`).join('')}</ul>
    ${isMine ? '<p class="muted mono small">mostrando só os seus pontos</p>' : ''}`;
}

function turnoSummary(from, to) {
  const res = {};
  for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
    const k = dkey(d);
    for (const p of designers()) {
      const r = nightResult(p.id, k); if (!r) continue;
      (res[p.id] = res[p.id] || []).push({ k, r });
    }
  }
  const ids = Object.keys(res);
  if (!ids.length) return '<p class="muted">Ninguém escalado no período.</p>';
  return `<ul class="ts-list">${ids.map(id => {
    const p = person(id), list = res[id];
    const c = st => list.filter(x => x.r.status === st).length;
    const cut = list.filter(x => x.r.cut).length;
    return `<li>${avatar(p, 'sm')}<span class="ts-name"><b>${esc(firstName(p.name))}</b><small class="mono">${list.length} noites · ${c('ficou')} cumpridas${c('parcial') ? ` · ${c('parcial')} saiu antes` : ''}${c('faltou') ? ` · ${c('faltou')} faltou` : ''}${cut ? ` · ${cut} desligado` : ''}</small></span>
      <span class="ts-dots">${list.map(x => `<i class="tsd ${x.r.status}" title="${x.k}: ${statusTxt(x.r)}"></i>`).join('')}</span></li>`;
  }).join('')}</ul>
  <div class="ts-leg mono"><span><i class="tsd ficou"></i>ficou</span><span><i class="tsd parcial"></i>saiu antes</span><span><i class="tsd faltou"></i>não ficou</span><span><i class="tsd futuro"></i>ainda vai</span></div>`;
}
function statusTxt(r) {
  if (!r) return '';
  if (r.status === 'futuro') return `combinou ${pad(r.hrs[0])}–${pad(r.hrs[r.hrs.length - 1] + 1)}h`;
  if (r.live) return 'está na escala agora';
  if (r.status === 'ficou') return 'ficou até o fim';
  if (r.status === 'faltou') return 'não ficou';
  return `saiu ${r.lastEnd ? 'às ' + hm(r.lastEnd) : 'antes'}${r.cut ? ' (desligado pela gestão)' : ''}`;
}

/* ============================================================
   CARDS
   ============================================================ */
function viewCards() {
  const m = me(), admin = isAdmin();
  let pool = S.cards;
  const who = admin ? ui.cardWho : (ui.cardWho === 'all' ? 'all' : 'me');
  if (who === 'me' && !admin) pool = pool.filter(c => c.designerId === m.id || c.status === 'fila');
  else if (who !== 'all' && who !== 'me') pool = pool.filter(c => c.designerId === who || c.status === 'fila');
  if (ui.q) { const q = ui.q.toLowerCase(); pool = pool.filter(c => (c.client + ' ' + (c.luluId || '') + ' ' + c.seller + ' ' + c.model).toLowerCase().includes(q)); }
  const by = st => pool.filter(c => c.status === st);
  const tabs = [['fila', 'Sem designer'], ['fazendo', 'Em andamento'], ['entregue', 'Entregues']];
  let list = by(ui.cardTab);
  const total = list.length;
  if (ui.cardTab === 'entregue') list = list.slice(0, ui.shownDone);

  const whoCtl = admin
    ? `<select class="pill-select" data-cardwho>${[['all', 'Todo o time'], ...designers().map(p => [p.id, p.name])].map(([v, l]) => `<option value="${v}" ${ui.cardWho === v || (v === 'all' && ui.cardWho === 'me') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
    : `<div class="seg small"><button data-cardwho-btn="me" class="${who === 'me' ? 'on' : ''}">meus</button><button data-cardwho-btn="all" class="${who === 'all' ? 'on' : ''}">time todo</button></div>`;

  return `<section class="page">
    <div class="page-head">
      <button class="solid big" data-new-card>${ico('plus')}Novo card</button><span class="vsep"></span>
      <div class="tab-row">${tabs.map(([v, l]) => `<button data-cardtab="${v}" class="tab-pill ${ui.cardTab === v ? 'on' : ''}">${ico(v === 'fila' ? 'down' : v === 'fazendo' ? 'cards' : 'arrow')}<span>${l}</span><b>${by(v).length}</b></button>`).join('')}</div>
      <span class="sp"></span><button class="ghost" data-sim-lulu>${ico('down')}Simular cliente do lulu</button>
    </div>
    <div class="toolbar">
      <span class="sp"></span>
      ${whoCtl}
      <input class="search" type="search" placeholder="buscar cliente, nº lulu, vendedor…" value="${esc(ui.q)}" data-search>
    </div>
    ${ui.cardTab === 'fila' ? `<p class="hint mono">Clientes que chegaram do lulu sem designer. ${admin ? 'Escolha quem vai fazer.' : 'Pegue um para você.'}</p>` : ''}
    ${ui.cardTab === 'fazendo' ? `<p class="hint mono">Marque ✓ no que fez e ✕ no que não fez. Use + para variações e mudanças. As variações livres só contam na 1ª entrega (até ${typeOf('var_livre').max || '∞'}).</p>` : ''}
    <div class="tags">${list.map(tagCard).join('') || `<div class="empty-state small"><p>${ui.cardTab === 'fila' ? 'Nenhum cliente esperando.' : 'Nada por aqui.'}</p></div>`}</div>
    ${total > list.length ? `<div class="more"><button class="ghost" data-more>ver mais ${Math.min(40, total - list.length)} de ${total - list.length}</button></div>` : ''}
  </section>`;
}

function tagCard(c) {
  const d = person(c.designerId), admin = isAdmin(), m = me();
  const mine = c.designerId === m.id;
  const editable = c.status === 'fazendo' && (admin || mine);
  const pts = cardPts(c);
  const created = new Date(c.createdAt);
  const when = sameDay(created, new Date()) ? `hoje ${hm(created)}` : `${created.getDate()} ${MES[created.getMonth()]} ${hm(created)}`;
  const rows = S.settings.itemTypes.map(t => {
    const ents = c.entries.filter(e => e.type === t.id);
    const done = ents.filter(e => e.status === 'feito').length;
    const pend = ents.filter(e => e.status === 'pendente');
    const no = ents.filter(e => e.status === 'nao').length;
    if (!ents.length) return '';
    const block = editable ? canAdd(c, t.id) : 'x';
    const locked = editable && t.firstOnly && c.round > 1;
    return `<li class="it ${!done && !pend.length ? 'zero' : ''} ${locked ? 'locked' : ''}" style="--tc:${t.color}">
      <span class="it-dot"></span>
      <span class="it-l">${esc(t.label)}<small class="mono">${fmtPts(t.pts)} pt${t.max ? ` · até ${t.max}` : ''}${t.firstOnly ? ' · 1ª entrega' : ''}</small></span>
      <span class="it-ctrl">
        ${pend.map(e => (admin || mine) && c.status !== 'fila' ? `<span class="pend"><button type="button" data-ent="${e.id}" data-to="feito">✓ fiz</button><button type="button" data-ent="${e.id}" data-to="nao" title="não fiz">✕</button></span>` : `<span class="pend-ro mono">aguardando</span>`).join('')}
        ${no ? `<span class="no mono">${no} não fiz</span>` : ''}
        ${editable ? `<button type="button" class="ct" data-dec="${t.id}" ${!done ? 'disabled' : ''} aria-label="menos">−</button><b class="mono n">${done}</b><button type="button" class="ct" data-inc="${t.id}" ${block ? `disabled title="${esc(block)}"` : ''} aria-label="mais">+</button>` : (done ? `<b class="mono n">${done}</b>` : '')}
      </span></li>`;
  }).join('');

  const adders = editable ? `<div class="adders"><span class="mono">adicionar</span>${S.settings.itemTypes.map(t => { const b = canAdd(c, t.id); return `<button type="button" class="add-chip" style="--tc:${t.color}" data-inc="${t.id}" ${b ? `disabled title="${esc(b)}"` : ''}>+ ${esc(t.short || t.label)}</button>`; }).join('')}</div>` : '';
  let actions = '';
  if (c.status === 'fila') {
    actions = admin
      ? `<select class="pill-select" data-assign><option value="">entregar para…</option>${designers().map(p => `<option value="${p.id}">${esc(p.name)}${isOnlineNow(p.id) ? ' · online' : ''}</option>`).join('')}</select>`
      : `<button class="solid sm" data-take>pegar este cliente</button>`;
  } else if (c.status === 'fazendo') {
    actions = (admin || mine)
      ? `<button class="ghost sm" data-round title="O cliente pediu ajustes: abre a ${c.round + 1}ª entrega">cliente pediu ajuste</button><button class="solid sm" data-deliver>entregue ✓</button>`
      : '';
  } else if (admin || mine) {
    actions = `<button class="ghost sm" data-reopen>reabrir</button>`;
  }

  return `<article class="tag st-${c.status}" data-card="${c.id}" style="--pc:${d ? d.color : '#B9B0A0'}">
    <span class="tag-hole" aria-hidden="true"></span>
    <header class="tag-head">
      <div class="tag-id mono">${c.luluId ? `lulu #${esc(c.luluId)}` : 'manual'} · ${when}</div>
      <h3>${esc(c.client)}</h3>
      <p class="mono">${esc(c.model || 'modelo —')}${c.seller ? ` · vend. ${esc(c.seller)}` : ''}</p>
    </header>
    <div class="tag-pts"><b>${fmtPts(pts)}</b><span class="mono">pts</span></div>
    <ul class="items">${rows || '<li class="it-empty mono">nada lançado ainda</li>'}</ul>${adders}
    <footer class="tag-foot">
      <span class="tag-who">${d ? avatar(d, 'sm') + `<span>${esc(firstName(d.name))}</span>` : '<span class="mono muted">sem designer</span>'}</span>
      <span class="round mono">${c.round}ª entrega</span>
      <span class="sp"></span>${actions}
    </footer>
  </article>`;
}

/* ============================================================
   TURNO
   ============================================================ */
function viewTurno() {
  const day = ui.day, k = dkey(day), now = new Date(), isToday = sameDay(day, now);
  const hrs = H(), span = hrs.nightEnd - hrs.start;
  const X = t => Math.min(100, Math.max(0, ((t.getHours() + t.getMinutes() / 60) - hrs.start) / span * 100));
  const Xh = h => (h - hrs.start) / span * 100;
  const weekend = isWeekendDate(day);

  const rows = designers().map(p => {
    const planned = [];
    if (!weekend) {
      if (p.regime === 'CLT') planned.push([hrs.start, hrs.lunch, 'day'], [hrs.lunch + 1, hrs.end, 'day']);
      else planned.push([hrs.start, hrs.end, 'day']);
    }
    const nh = committedHours(p.id, k);
    // agrupa horas seguidas da escala
    nh.forEach(h => { const last = planned[planned.length - 1]; if (last && last[2] === 'night' && last[1] === h) last[1] = h + 1; else planned.push([h, h + 1, 'night']); });
    const sess = sessionsOn(p.id, day);
    const dayFrom = startOfDay(day), dayTo = addDays(day, 1);
    const onMin = minutesOnline(p.id, dayFrom, dayTo);
    const nr = nightResult(p.id, k);
    const bars = sess.map(s => {
      const a = new Date(Math.max(new Date(s.start), at(day, hrs.start)));
      const b = s.end ? new Date(s.end) : now;
      const l = X(a), r = X(b > at(day, hrs.nightEnd) ? at(day, hrs.nightEnd) : b);
      if (r <= l) return '';
      return `<div class="sess ${s.end ? '' : 'live'} ${s.endedBy === 'admin' ? 'cut' : ''}" style="left:${l}%;width:${r - l}%" title="${hm(new Date(s.start))}–${s.end ? hm(b) : 'agora'}${s.endedBy === 'admin' ? ' · desligado pela gestão' : ''}">${r - l > 7 ? `<span class="mono">${hm(new Date(s.start))}–${s.end ? hm(b) : 'agora'}</span>` : ''}</div>`;
    }).join('');
    const plan = planned.map(([a, b, kind]) => `<div class="plan ${kind}" style="left:${Xh(a)}%;width:${Xh(b) - Xh(a)}%"></div>`).join('');
    const nightTxt = nr ? `<span class="nt ${nr.live ? 'live' : nr.status}">☾ ${esc(statusTxt(nr))}</span>` : '';
    return `<div class="t-row" style="--pc:${p.color}">
      <div class="t-who">${avatar(p)}<div><b>${esc(p.name)}</b><small class="mono">${onMin ? `online ${fmtDur(onMin)}` : (day > now ? '—' : 'não entrou')}</small>${nightTxt}</div></div>
      <div class="t-track">${plan}${bars}</div>
    </div>`;
  }).join('');

  const hoursHead = range(hrs.start, hrs.nightEnd).map(h => `<span class="${h >= hrs.end ? 'n' : ''}" style="left:${Xh(h)}%">${pad(h)}</span>`).join('');
  const nowLine = isToday && now.getHours() >= hrs.start && now.getHours() < hrs.nightEnd ? `<div class="t-now" style="left:calc(var(--who) + (100% - var(--who) - 22px) * ${(X(now) / 100).toFixed(4)})" data-t="${hm(now)}"></div>` : '';

  return `<section class="page">
    <div class="page-head">
      <button class="solid big" data-dayshift="0">${ico('cal')}Hoje</button><span class="vsep"></span>
      <div class="date-btns"><button class="icon" data-dayshift="-1" aria-label="dia anterior">←</button><button class="icon" data-dayshift="1" aria-label="próximo dia">→</button></div></div>
    ${weekStrip()}
    <div class="card flush">
      ${cardHead('Combinado × real', 'contorno = o que a pessoa combinou · barra = quanto ficou online de verdade')}
      <div class="t-scroll"><div class="t-board">
        <div class="t-head"><div></div><div class="t-hours">${hoursHead}<i class="t-nightbg" style="left:${Xh(hrs.end)}%"></i></div></div>
        ${rows}
        ${nowLine}
      </div></div>
      <div class="legend mono"><span><i class="lg plan-day"></i>expediente combinado</span><span><i class="lg plan-night"></i>disse que fica à noite</span><span><i class="lg lg-sess"></i>online de verdade</span><span><i class="lg lg-cut"></i>desligado pela gestão</span></div>
    </div>
    ${escalaWeek()}
  </section>`;
}

function weekStrip() {
  const ws = startOfWeek(ui.day), today = dkey(new Date()), sel = dkey(ui.day);
  return `<div class="week">${range(0, 7).map(i => {
    const d = addDays(ws, i), k = dkey(d);
    const ppl = [...new Set(NIGHT().flatMap(h => shiftIds(k, h)))].map(person).filter(Boolean);
    const res = ppl.map(p => nightResult(p.id, k));
    const on = designers().filter(p => sessionsOn(p.id, d).length).length;
    return `<button class="day ${k === sel ? 'on' : ''} ${k === today ? 'is-today' : ''} ${isWeekendDate(d) ? 'we' : ''}" data-day="${k}">
      <span class="d-wd">${WD[d.getDay()]}</span><span class="d-n">${d.getDate()}</span>
      <span class="d-meta mono">${on ? `${on} on` : ''}</span>
      <span class="d-night">${ppl.length ? '☾&nbsp;' + ppl.map((p, j) => `<i style="--pc:${p.color}" class="r-${res[j] ? (res[j].live ? 'live' : res[j].status) : ''}" title="${esc(p.name)}: ${esc(statusTxt(res[j]))}">${esc(initials(p.name))}</i>`).join('') : '<s>☾ —</s>'}</span>
    </button>`;
  }).join('')}</div>`;
}

function escalaWeek() {
  const ws = startOfWeek(ui.day), days = range(0, 7).map(i => addDays(ws, i));
  const today = dkey(new Date()), admin = isAdmin(), m = me();
  let g = `<div class="esc-grid"><div class="eg-corner">☾</div>`;
  g += days.map(d => `<div class="eg-day ${dkey(d) === today ? 'is-today' : ''}"><span class="mono">${WD[d.getDay()]}</span><b>${d.getDate()}</b></div>`).join('');
  for (const h of NIGHT()) {
    g += `<div class="eg-h mono">${pad(h)}–${pad(h + 1)}h</div>`;
    for (const d of days) {
      const k = dkey(d), ids = shiftIds(k, h), ps = ids.map(person);
      const past = at(d, h + 1) <= new Date();
      const we = isWeekendDate(d) && !S.settings.weekendNight;
      const iAm = ids.includes(m.id);
      const cells = ps.map(p => {
        let st = '';
        if (past) { const on = minutesOnline(p.id, at(d, h), at(d, h + 1)); st = on >= 50 ? 'ok' : on > 3 ? 'meio' : 'nao'; }
        return `<span class="eg-p ${st}" style="--pc:${p.color}" title="${esc(p.name)}${st === 'ok' ? ' · ficou' : st === 'meio' ? ' · ficou parte' : st === 'nao' ? ' · não ficou' : ''}">${avatar(p, 'sm')}${ps.length === 1 ? `<span>${esc(firstName(p.name))}</span>` : ''}</span>`;
      }).join('');
      const can = admin || (!past && m.role === 'designer');
      const label = !ps.length ? (can ? (admin ? '+ escalar' : '+ eu fico') : '—') : '';
      g += `<button class="eg-cell ${ps.length ? 'filled' : 'vazio'} ${iAm ? 'me' : ''} ${we ? 'we' : ''} ${past ? 'past' : ''}" ${can ? `data-shift-open="${k}" data-h="${h}"` : 'disabled'} title="${admin ? 'clique para escolher quem fica' : iAm ? 'clique para sair desse horário' : 'clique para dizer que fica'}">${cells}<span class="mono lbl">${label}</span></button>`;
    }
  }
  g += '</div>';
  const side = admin ? `<div class="esc-tools">
      <div class="seg small"><button data-rot="noite" class="${ui.rotation === 'noite' ? 'on' : ''}">noite inteira</button><button data-rot="hora" class="${ui.rotation === 'hora' ? 'on' : ''}">revezar por hora</button></div>
      <button class="ghost light sm" data-gen="week">preencher semana</button><button class="ghost light sm" data-gen="clear">limpar</button>
    </div>` : `<span class="mono esc-tip">clique num horário para dizer que você fica (ou para sair)</span>`;
  return `<div class="esc-main"><div class="stars"></div>
    <div class="esc-head"><h2>quem disse que fica até as ${H().nightEnd}h</h2>${side}</div>
    <div class="esc-scroll">${g}</div>
    <div class="esc-leg mono"><span><i class="eg-dot ok"></i>ficou</span><span><i class="eg-dot meio"></i>ficou parte</span><span><i class="eg-dot nao"></i>não ficou</span></div>
  </div>`;
}

/* preenche horários vazios da escala com quem é PJ (ou recebe por pontos e já fez noite) */
function fillShifts(days, mode) {
  const elig = designers().filter(p => p.regime === 'PJ');
  if (!elig.length) return -1;
  const counts = {};
  Object.entries(S.shifts).forEach(([, hrs]) => Object.values(hrs).forEach(ids => ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; })));
  const n = elig.length; let filled = 0;
  const pick = (salt, avoid) => elig.map((e, i) => ({ e, c: counts[e.id] || 0, x: e.id === avoid ? 1 : 0, o: ((i - salt) % n + n) % n })).sort((a, b) => a.c - b.c || a.x - b.x || a.o - b.o)[0].e;
  for (const d of days) {
    if (isWeekendDate(d) && !S.settings.weekendNight) continue;
    const k = dkey(d), salt = Math.floor(d.getTime() / 864e5);
    if (mode === 'noite') {
      const empty = NIGHT().filter(h => !shiftIds(k, h).length); if (!empty.length) continue;
      const p = pick(salt, shiftIds(dkey(addDays(d, -1)), H().end)[0]);
      empty.forEach(h => { setShiftIds(k, h, [p.id]); counts[p.id] = (counts[p.id] || 0) + 1; filled++; });
    } else {
      let prev = null;
      for (const h of NIGHT()) { const cur = shiftIds(k, h); if (cur.length) { prev = cur[0]; continue; } const p = pick(salt + h, prev); setShiftIds(k, h, [p.id]); counts[p.id] = (counts[p.id] || 0) + 1; prev = p.id; filled++; }
    }
  }
  return filled;
}

/* ============================================================
   PONTUAÇÃO
   ============================================================ */
function viewPontos() {
  const admin = isAdmin(), st = S.settings;
  if (!ui.sim) { ui.sim = { h: 9 }; st.itemTypes.forEach(t => { ui.sim[t.id] = t.id === 'logo' ? 1 : t.id === 'var_livre' ? (t.max || 2) : 0; }); }
  const ex = st.itemTypes.find(t => t.id === 'var_livre');
  const exPts = typeOf('logo').pts + (ex ? ex.pts * (ex.max || 0) : 0);

  const rows = st.itemTypes.map((t, i) => `<li class="menu-row" style="--tc:${t.color}">
    <span class="mr-dot"></span>
    <div class="mr-main">
      ${admin ? `<input class="mr-label" data-tf="${t.id}|label" value="${esc(t.label)}">` : `<b>${esc(t.label)}</b>`}
      ${admin ? `<input class="mr-hint mono" data-tf="${t.id}|hint" value="${esc(t.hint || '')}" placeholder="descrição">` : `<small>${esc(t.hint || '')}</small>`}
      <div class="mr-rules mono">
        ${admin ? `<label>limite por cliente <input type="number" min="0" step="1" data-tf="${t.id}|max" value="${t.max || ''}" placeholder="∞"></label>
                   <label class="switch sm"><input type="checkbox" data-tf="${t.id}|firstOnly" ${t.firstOnly ? 'checked' : ''}><i></i>só na 1ª entrega</label>
                   <label class="clr"><input type="color" data-tf="${t.id}|color" value="${t.color}"></label>
                   ${['logo', 'var_livre'].includes(t.id) ? '' : `<button class="ghost sm danger" data-del-type="${t.id}">remover</button>`}`
                : `${t.max ? `<span>até ${t.max} por cliente</span>` : '<span>sem limite</span>'}${t.firstOnly ? '<span>só na 1ª entrega</span>' : ''}`}
      </div>
    </div>
    <div class="mr-pts">${admin ? `<input type="number" min="0" step="0.25" data-tf="${t.id}|pts" value="${t.pts}">` : `<b>${fmtPts(t.pts)}</b>`}<span class="mono">pt</span></div>
  </li>`).join('');

  const tiers = [...st.tiers].sort((a, b) => a.h - b.h);
  const tierHtml = tiers.map((t, i) => `<div class="tier" style="--lvl:${i}">
    ${admin ? `<label class="mono">a partir de<input type="number" min="0" step="0.5" data-tier="${i}|h" value="${t.h}">h/dia</label><label class="tm">×<input type="number" min="0" step="0.05" data-tier="${i}|mult" value="${t.mult}"></label>${tiers.length > 1 ? `<button class="x sm" data-del-tier="${i}" aria-label="remover faixa">×</button>` : ''}`
            : `<span class="mono">${t.h ? `${fmtNum(t.h)}h+ por dia` : 'base'}</span><b>${fmtMult(t.mult)}</b>`}
  </div>`).join('');

  // simulador
  const simPts = st.itemTypes.reduce((s, t) => s + (ui.sim[t.id] || 0) * t.pts, 0);
  const simMult = multFor(ui.sim.h || 0);
  const simRows = st.itemTypes.map(t => `<div class="sim-row" style="--tc:${t.color}"><i></i><span>${esc(t.label)}</span><button class="ct" data-sim="${t.id}|-1">−</button><b class="mono">${ui.sim[t.id] || 0}</b><button class="ct" data-sim="${t.id}|1">+</button></div>`).join('');

  return `<section class="page">
    <div class="page-head"><span class="solid big as-label">${ico('pontos')}Quanto vale cada coisa</span><span class="vsep"></span><span class="pill-note">${admin ? 'Você pode editar tudo nesta tela' : 'Só a gestão edita'}</span></div>
    <div class="grid-pts">
      <div class="card menu">
        ${cardHead('Tabela de pontos', `ex.: logo + ${ex?.max || 0} variações livres = ${fmtPts(exPts)} pts no 1º envio`)}
        <ul class="menu-list">${rows}</ul>
        ${admin ? '<button class="ghost sm add-type" data-add-type>+ novo tipo de tarefa</button>' : ''}
      </div>
      <div class="col">
        <div class="card ink-card">
          ${cardHead('Valor do ponto', 'quanto cada ponto paga, antes do bônus')}
          <div class="pv">${admin ? `<span>R$</span><input type="number" min="0" step="0.1" data-setting="pointValue" value="${st.pointValue}">` : `<b>${fmtBRL(st.pointValue)}</b>`}<small class="mono">por ponto</small></div>
        </div>
        <div class="card">
          ${cardHead('Bônus por tempo online', 'quem fica mais tempo online ganha mais por ponto')}
          <div class="tiers">${tierHtml}</div>
          ${admin ? '<button class="ghost sm" data-add-tier>+ faixa</button>' : ''}
          <p class="muted small">Conta a média de horas online por dia trabalhado no período. Ex.: média de ${fmtNum(tiers[tiers.length - 1]?.h || 0)}h por dia → cada ponto vale ${fmtBRL(st.pointValue * (tiers[tiers.length - 1]?.mult || 1))}.</p>
        </div>
      </div>
    </div>
    <div class="card sim">
      ${cardHead('Simulador', 'monte um cliente e veja quanto rende')}
      <div class="sim-grid">
        <div class="sim-rows">${simRows}
          <div class="sim-row h"><i></i><span>média online por dia</span><button class="ct" data-sim="h|-1">−</button><b class="mono">${ui.sim.h}h</b><button class="ct" data-sim="h|1">+</button></div>
        </div>
        <div class="sim-out">
          <div><span class="mono">pontos</span><b>${fmtPts(simPts)}</b></div>
          <div><span class="mono">bônus</span><b>${fmtMult(simMult)}</b></div>
          <div class="big"><span class="mono">rende</span><b>${fmtBRL(simPts * st.pointValue * simMult)}</b></div>
          ${ex && ex.max && (ui.sim.var_livre || 0) > ex.max ? `<p class="warn mono">no sistema, só ${ex.max} variações livres contam por cliente</p>` : ''}
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   EQUIPE (admin)
   ============================================================ */
function viewEquipe() {
  const ppl = S.people.map(p => {
    const on = isOnlineNow(p.id);
    return `<article class="person" style="--pc:${p.color}">
      ${avatar(p, 'xl')}
      <div class="p-info">
        <span class="reg ${p.regime}">${p.role === 'admin' ? 'ADMIN' : p.regime}</span>
        <h3>${esc(p.name)}</h3>
        <p class="mono">${p.email ? esc(p.email) : 'sem e-mail'}</p>
        ${p.role === 'designer' ? `<div class="p-tg">
          <label class="switch sm"><input type="checkbox" data-pay="${p.id}" ${p.payByPoints ? 'checked' : ''}><i></i>recebe por pontos</label>
          <label class="switch sm"><input type="checkbox" data-admin-online="${p.id}" ${on ? 'checked' : ''}><i></i>${on ? 'online' : 'offline'}</label>
        </div>` : ''}
        <div class="p-act"><button class="ghost sm" data-edit="${p.id}">editar</button>${p.id !== me().id ? `<button class="ghost sm danger" data-del="${p.id}">remover</button>` : ''}</div>
      </div>
    </article>`;
  }).join('');

  const example = JSON.stringify({ lulu_id: 48311, cliente: 'Academia Ponta Negra', vendedor: 'Rafa', modelo: 'Trucker', designer: 'lia@seubone.com', itens: [{ tipo: 'logo', qtd: 1 }] }, null, 2);
  return `<section class="page">
    <div class="page-head"><button class="solid big" data-add-person>${ico('plus')}Nova pessoa</button><span class="vsep"></span><span class="pill-note">${designers().length} designers · ${S.people.length - designers().length} admin</span></div>
    <div class="team">${ppl}</div>
    <div class="grid-2">
      <div class="card">
        ${cardHead('Integração com o lulu', 'como os clientes entram sozinhos')}
        <p class="small">Quando um designer pega um cliente no lulu, o lulu manda os dados para cá e o card aparece pronto. O designer só marca o que fez. O designer é reconhecido pelo <b>nome</b> ou <b>e-mail</b> cadastrado aqui.</p>
        <p class="small muted">Enquanto o lulu não estiver ligado, cole aqui o JSON (um cliente ou uma lista) para testar:</p>
        <textarea class="code" id="luluJson" rows="9" spellcheck="false">${esc(example)}</textarea>
        <div class="btns"><button class="solid sm" data-lulu-import>receber</button><button class="ghost sm" data-sim-lulu>simular cliente aleatório</button></div>
      </div>
      <div class="col">
        <div class="card">
          ${cardHead('Regras do turno', '')}
          <label class="switch"><input type="checkbox" data-setting-bool="weekendNight" ${S.settings.weekendNight ? 'checked' : ''}><i></i>escala noturna também no fim de semana</label>
          <p class="muted small mono">CLT ${H().start}h–${H().end}h com almoço ${H().lunch}h–${H().lunch + 1}h · PJ ${H().start}h–${H().end}h direto · noite ${H().end}h–${H().nightEnd}h</p>
        </div>
        <div class="card">
          ${cardHead('Dados', 'modo demonstração')}
          <div class="btns"><button class="ghost sm" data-io="export">exportar .json</button><button class="ghost sm" data-io="import">importar</button><button class="ghost sm" data-io="demo">recarregar exemplo</button><button class="ghost sm danger" data-io="reset">zerar tudo</button></div>
        </div>
        <div class="card">
          ${cardHead('Registro da gestão', 'últimas ações')}
          <ul class="log">${S.log.slice(0, 8).map(l => { const d = new Date(l.at); return `<li><span class="mono">${d.getDate()} ${MES[d.getMonth()]} ${hm(d)}</span>${esc(l.text)}</li>`; }).join('') || '<li class="muted">nada ainda</li>'}</ul>
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   dialogs
   ============================================================ */
let editingPerson = null, shiftCtx = null;
function openCardDlg() {
  const F = $('#cardForm').elements, m = me();
  F.designerId.innerHTML = (isAdmin() ? '<option value="">— sem designer (fila) —</option>' : '') + designers().filter(p => isAdmin() || p.id === m.id).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  F.client.value = ''; F.model.value = ''; F.seller.value = ''; F.luluId.value = '';
  if (!isAdmin()) F.designerId.value = m.id;
  $('#cardErr').textContent = '';
  $('#cardDlg').showModal(); setTimeout(() => F.client.focus(), 40);
}
function openPerson(p) {
  editingPerson = p || null;
  const F = $('#personForm').elements;
  const used = new Set(S.people.map(x => x.color));
  const color = p ? p.color : (PALETTE.find(c => !used.has(c)) || PALETTE[0]);
  $('#swatches').innerHTML = [...PALETTE, '#17140F'].map(c => `<label><input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''}><i style="--c:${c}"></i></label>`).join('');
  F.name.value = p ? p.name : '';
  F.regime.value = p ? (p.role === 'admin' ? 'ADM' : p.regime) : 'PJ';
  F.email.value = p ? (p.email || '') : '';
  F.payByPoints.checked = p ? !!p.payByPoints : true;
  $('#pEyebrow').textContent = p ? 'editar pessoa' : 'nova pessoa';
  $('#personErr').textContent = '';
  $('#personDlg').showModal(); setTimeout(() => F.name.focus(), 40);
}
function openShift(k, h) {
  const m = me();
  if (!isAdmin()) { // designer: alterna a si mesmo
    const on = !shiftIds(k, h).includes(m.id);
    toggleShift(k, h, m.id, on); save(); render();
    toast(on ? `Você disse que fica ${pad(h)}h–${pad(h + 1)}h` : `Você saiu da escala ${pad(h)}h–${pad(h + 1)}h`);
    return;
  }
  shiftCtx = { k, h };
  const d = parseKey(k), ids = shiftIds(k, h);
  $('#shiftTitle').innerHTML = `<em>${WDL[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]}</em> · ${pad(h)}h–${pad(h + 1)}h`;
  $('#shiftPeople').innerHTML = designers().map(p => `<label style="--pc:${p.color}"><input type="checkbox" name="who" value="${p.id}" ${ids.includes(p.id) ? 'checked' : ''}>${avatar(p, 'sm')}<span>${esc(p.name)}</span><small class="mono">${p.regime}</small></label>`).join('');
  $('#shiftForm').elements.allNight.checked = false;
  $('#shiftDlg').showModal();
}

/* ============================================================
   eventos
   ============================================================ */
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2800); }
const findCard = el => { const a = el.closest('[data-card]'); return a ? S.cards.find(c => c.id === a.dataset.card) : null; };

function simulateLulu() {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const online = designers().filter(p => isOnlineNow(p.id));
  const who = Math.random() < 0.75 && online.length ? pick(online) : null;
  const n = Math.max(48300, ...S.cards.map(c => +c.luluId || 0)) + 1;
  const [c] = receiveFromLulu({ lulu_id: n, cliente: `${pick(CLIENT_A)} ${pick(CLIENT_B)}`, vendedor: pick(SELLERS), modelo: pick(MODELS), designer: who ? who.name : null, itens: [{ tipo: 'logo', qtd: 1 }] });
  save();
  if (c) {
    ui.view = 'cards'; ui.cardTab = c.status; ui.q = '';
    render();
    toast(`lulu #${c.luluId}: ${c.client} → ${who ? firstName(who.name) : 'sem designer'}`);
  }
}

function bind() {
  document.addEventListener('click', e => {
    const t = e.target; let el;
    if (t.closest('dialog')) return;
    if ((el = t.closest('#nav [data-view]'))) { ui.view = el.dataset.view; render(); scrollTo(0, 0); return; }
    if ((el = t.closest('[data-go]'))) { ui.view = el.dataset.go; render(); scrollTo(0, 0); return; }
    if ((el = t.closest('[data-period]'))) { ui.period = el.dataset.period; render(); return; }
    if ((el = t.closest('[data-online-self]'))) {
      const m = me();
      if (el.dataset.onlineSelf === 'on') { goOnline(m.id, 'self'); toast('Você está online'); } else { goOffline(m.id, 'self'); toast('Você ficou offline'); }
      save(); render(); return;
    }
    // cards
    if ((el = t.closest('[data-cardtab]'))) { ui.cardTab = el.dataset.cardtab; ui.shownDone = 40; render(); return; }
    if ((el = t.closest('[data-cardwho-btn]'))) { ui.cardWho = el.dataset.cardwhoBtn; render(); return; }
    if (t.closest('[data-more]')) { ui.shownDone += 40; render(); return; }
    if (t.closest('[data-new-card]')) { openCardDlg(); return; }
    if (t.closest('[data-sim-lulu]')) { simulateLulu(); return; }
    if ((el = t.closest('[data-ent]'))) {
      const c = findCard(el); if (!c) return;
      const en = c.entries.find(x => x.id === el.dataset.ent); if (!en) return;
      en.status = el.dataset.to; en.at = new Date().toISOString();
      save(); render(); return;
    }
    if ((el = t.closest('[data-inc]'))) {
      const c = findCard(el); if (!c) return;
      const err = addEntry(c, el.dataset.inc, 'feito');
      if (err) toast(err); else { save(); render(); }
      return;
    }
    if ((el = t.closest('[data-dec]'))) {
      const c = findCard(el); if (!c) return;
      const list = c.entries.filter(x => x.type === el.dataset.dec && x.status === 'feito');
      const last = list.filter(x => x.round === c.round).pop() || list.pop();
      if (last) { c.entries = c.entries.filter(x => x !== last); save(); render(); }
      return;
    }
    if ((el = t.closest('[data-round]'))) {
      const c = findCard(el); if (!c) return;
      c.round++; save(); render(); toast(`${c.client}: ${c.round}ª entrega aberta`); return;
    }
    if ((el = t.closest('[data-deliver]'))) {
      const c = findCard(el); if (!c) return;
      if (c.entries.some(x => x.status === 'pendente')) { toast('Marque ✓ ou ✕ nos itens que estão aguardando.'); return; }
      c.status = 'entregue'; save(); render(); toast(`${c.client} entregue · ${fmtPts(cardPts(c))} pts`); return;
    }
    if ((el = t.closest('[data-reopen]'))) { const c = findCard(el); if (c) { c.status = 'fazendo'; save(); render(); } return; }
    if ((el = t.closest('[data-take]'))) {
      const c = findCard(el); if (!c) return;
      c.designerId = me().id; c.status = 'fazendo'; save(); ui.cardTab = 'fazendo'; render(); toast(`${c.client} é seu`); return;
    }
    // turno
    if ((el = t.closest('[data-dayshift]'))) { const n = +el.dataset.dayshift; ui.day = n ? addDays(ui.day, n) : new Date(); render(); return; }
    if ((el = t.closest('[data-day]'))) { ui.day = parseKey(el.dataset.day); render(); return; }
    if ((el = t.closest('[data-shift-open]'))) { openShift(el.dataset.shiftOpen, +el.dataset.h); return; }
    if ((el = t.closest('[data-rot]'))) { ui.rotation = el.dataset.rot; render(); return; }
    if ((el = t.closest('[data-gen]'))) {
      const ws = startOfWeek(ui.day), days = range(0, 7).map(i => addDays(ws, i));
      if (el.dataset.gen === 'clear') { if (!confirm('Limpar a escala noturna desta semana?')) return; days.forEach(d => delete S.shifts[dkey(d)]); save(); render(); return; }
      const n = fillShifts(days, ui.rotation); save(); render(); toast(n < 0 ? 'Nenhum PJ cadastrado.' : n ? `${n} horas escaladas` : 'Já está tudo escalado.'); return;
    }
    // pontuação
    if ((el = t.closest('[data-sim]'))) {
      const [id, d] = el.dataset.sim.split('|'); ui.sim[id] = Math.max(0, (ui.sim[id] || 0) + +d); render(); return;
    }
    if (t.closest('[data-add-type]')) {
      S.settings.itemTypes.push({ id: 't' + uid().slice(0, 5), label: 'Nova tarefa', pts: 0.5, max: null, firstOnly: false, color: PALETTE[S.settings.itemTypes.length % PALETTE.length], hint: '' });
      save(); render(); return;
    }
    if ((el = t.closest('[data-del-type]'))) {
      const id = el.dataset.delType;
      const used = S.cards.some(c => c.entries.some(x => x.type === id));
      if (used && !confirm('Esse tipo já tem pontos lançados. Remover mesmo assim? (os pontos lançados param de contar)')) return;
      S.settings.itemTypes = S.settings.itemTypes.filter(x => x.id !== id); save(); render(); return;
    }
    if (t.closest('[data-add-tier]')) { const last = [...S.settings.tiers].sort((a, b) => a.h - b.h).pop() || { h: 0, mult: 1 }; S.settings.tiers.push({ h: last.h + 2, mult: Math.round((last.mult + 0.1) * 100) / 100 }); save(); render(); return; }
    if ((el = t.closest('[data-del-tier]'))) { const sorted = [...S.settings.tiers].sort((a, b) => a.h - b.h); sorted.splice(+el.dataset.delTier, 1); S.settings.tiers = sorted; save(); render(); return; }
    // equipe
    if (t.closest('[data-add-person]')) { openPerson(); return; }
    if ((el = t.closest('[data-edit]'))) { openPerson(person(el.dataset.edit)); return; }
    if ((el = t.closest('[data-del]'))) {
      const p = person(el.dataset.del); if (!p) return;
      if (!confirm(`Remover ${p.name}? Os cards dele(a) ficam sem designer e o histórico online é apagado.`)) return;
      S.people = S.people.filter(x => x.id !== p.id);
      S.cards.forEach(c => { if (c.designerId === p.id) c.designerId = null; });
      S.sessions = S.sessions.filter(s => s.personId !== p.id);
      Object.keys(S.shifts).forEach(k => Object.keys(S.shifts[k]).forEach(h => toggleShift(k, h, p.id, false)));
      save(); render(); return;
    }
    if (t.closest('[data-lulu-import]')) {
      try {
        const got = receiveFromLulu(JSON.parse($('#luluJson').value));
        save(); render();
        toast(got.length ? `${got.length} cliente(s) recebido(s) do lulu` : 'Nada novo (nº do lulu já existe?)');
      } catch (err) { toast('JSON inválido'); }
      return;
    }
    if ((el = t.closest('[data-io]'))) { io(el.dataset.io); return; }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'meSel') { ui.meId = t.value; localStorage.setItem('aba.me', ui.meId); ui.cardWho = 'me'; render(); toast(`Agora você está como ${me().name}`); return; }
    if (t.matches('[data-admin-online]')) {
      const id = t.dataset.adminOnline;
      if (t.checked) goOnline(id, 'admin'); else goOffline(id, 'admin');
      save(); render(); toast(`${firstName(person(id).name)} ${t.checked ? 'ligado(a)' : 'desligado(a)'} pela gestão`); return;
    }
    if (t.matches('[data-cardwho]')) { ui.cardWho = t.value; render(); return; }
    if (t.matches('[data-assign]')) {
      const c = findCard(t); if (!c || !t.value) return;
      c.designerId = t.value; c.status = 'fazendo'; save(); render(); toast(`${c.client} → ${firstName(person(t.value).name)}`); return;
    }
    if (t.matches('[data-pay]')) { const p = person(t.dataset.pay); if (p) { p.payByPoints = t.checked; save(); render(); } return; }
    if (t.matches('[data-setting]')) { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) { S.settings[t.dataset.setting] = v; save(); render(); } return; }
    if (t.matches('[data-setting-bool]')) { S.settings[t.dataset.settingBool] = t.checked; save(); render(); return; }
    if (t.matches('[data-tf]')) {
      const [id, f] = t.dataset.tf.split('|'), ty = S.settings.itemTypes.find(x => x.id === id); if (!ty) return;
      if (f === 'pts') { const v = parseFloat(t.value); if (!isNaN(v) && v >= 0) ty.pts = v; }
      else if (f === 'max') { const v = parseInt(t.value, 10); ty.max = v > 0 ? v : null; }
      else if (f === 'firstOnly') ty.firstOnly = t.checked;
      else ty[f] = t.value;
      save(); render(); return;
    }
    if (t.matches('[data-tier]')) {
      const [i, f] = t.dataset.tier.split('|'), sorted = [...S.settings.tiers].sort((a, b) => a.h - b.h);
      const v = parseFloat(t.value); if (isNaN(v) || v < 0) return;
      sorted[+i][f] = v; S.settings.tiers = sorted; save(); render(); return;
    }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-search]')) {
      ui.q = e.target.value; const pos = e.target.selectionStart;
      render(); const s = $('[data-search]'); if (s) { s.focus(); s.setSelectionRange(pos, pos); }
    }
  });

  // dialogs
  $$('dialog').forEach(dl => dl.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === dl) dl.close(); }));

  $('#cardForm').addEventListener('submit', e => {
    e.preventDefault();
    const F = e.target.elements, client = F.client.value.trim();
    if (!client) { $('#cardErr').textContent = 'Qual o cliente?'; return; }
    const luluId = F.luluId.value.trim();
    if (luluId && S.cards.some(c => c.luluId === luluId)) { $('#cardErr').textContent = `Já existe um card com o lulu #${luluId}.`; return; }
    const did = F.designerId.value || null;
    S.cards.unshift({ id: uid(), luluId: luluId || null, source: luluId ? 'lulu' : 'manual', client, seller: F.seller.value.trim(), model: F.model.value.trim(), designerId: did, createdAt: new Date().toISOString(), status: did ? 'fazendo' : 'fila', round: 1, entries: [{ id: uid(), type: 'logo', status: 'pendente', at: null, round: 1 }] });
    save(); $('#cardDlg').close(); ui.view = 'cards'; ui.cardTab = did ? 'fazendo' : 'fila'; render(); toast('Card criado');
  });

  $('#personForm').addEventListener('submit', e => {
    e.preventDefault();
    const F = e.target.elements, name = F.name.value.trim();
    if (!name) { $('#personErr').textContent = 'Qual o nome?'; return; }
    const reg = F.regime.value;
    const data = { name, regime: reg, role: reg === 'ADM' ? 'admin' : 'designer', email: F.email.value.trim(), color: F.color.value || PALETTE[0], payByPoints: reg !== 'ADM' && F.payByPoints.checked };
    if (editingPerson) {
      if (editingPerson.id === me().id && data.role !== 'admin' && !S.people.some(p => p.role === 'admin' && p.id !== me().id)) { $('#personErr').textContent = 'Precisa ter pelo menos um admin.'; return; }
      Object.assign(editingPerson, data);
    } else S.people.push({ id: uid(), ...data });
    save(); $('#personDlg').close(); render(); toast(editingPerson ? 'Atualizado' : `${firstName(name)} entrou na equipe`);
  });

  $('#shiftForm').addEventListener('submit', e => {
    e.preventDefault(); if (!shiftCtx) return;
    const ids = $$('#shiftPeople input[name=who]:checked').map(i => i.value);
    const hours = e.target.elements.allNight.checked ? NIGHT() : [shiftCtx.h];
    hours.forEach(h => setShiftIds(shiftCtx.k, h, ids));
    save(); $('#shiftDlg').close(); render(); toast('Escala salva');
  });
  $('#shiftClear').onclick = () => $$('#shiftPeople input[name=who]').forEach(i => { i.checked = false; });

  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const s = normalize(JSON.parse(await f.text())); if (!confirm('Substituir todos os dados por este arquivo?')) return; S = s; save(); render(); toast('Importado'); }
    catch (err) { toast('Arquivo inválido'); }
  });

  setInterval(() => {
    tick();
    // atualiza as barras do turno/painel a cada minuto se ninguém estiver digitando
    if (!$('dialog[open]') && !document.activeElement.matches('input,select,textarea') && (ui.view === 'turno' || ui.view === 'painel')) render();
  }, 60000);
  setInterval(tick, 15000);
}

function tick() {
  const now = Date.now();
  $$('[data-since]').forEach(el => { el.textContent = fmtDur((now - new Date(el.dataset.since)) / 60000); });
}

function io(kind) {
  if (kind === 'export') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = `aba-${dkey(new Date())}.json`; document.body.appendChild(a); a.click(); a.remove();
    return toast('Exportado');
  }
  if (kind === 'import') return $('#importFile').click();
  if (kind === 'demo') { if (!confirm('Recarregar os dados de exemplo? O que está aqui será substituído.')) return; seedState(); save(); render(); return toast('Exemplo recarregado'); }
  if (kind === 'reset') {
    if (!confirm('Zerar tudo? Fica só a conta da gestão.')) return;
    const adm = S.people.filter(p => p.role === 'admin');
    S = normalize({}); S.people = adm.length ? adm : [{ id: 'adm', name: 'Gestão', role: 'admin', regime: 'ADM', color: '#17140F', payByPoints: false }];
    ui.meId = S.people[0].id; save(); render(); return toast('Tudo zerado');
  }
}

/* para a integração futura: window.aba.receberDoLulu({...}) */
window.aba = { receberDoLulu: p => { const r = receiveFromLulu(p); save(); render(); return r; } };

(function init() {
  S = load() || seedState();
  save();
  bind();
  render();
})();
