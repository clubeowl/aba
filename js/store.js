'use strict';
/* =========================================================
   aba. — camada de dados
   Hoje: tudo no localStorage (modo demonstração).
   Depois: trocar load()/save() por um banco (ex.: Supabase)
   sem mexer nas telas.
   ========================================================= */

const KEY = 'aba.v1';

const PALETTE = ['#FF5A36', '#7B61FF', '#12B886', '#2F80ED', '#E8A400', '#E64980', '#0B9E8A', '#FD7E14', '#5C7CFA', '#AE3EC9', '#495057', '#C2255C'];

/* Regras padrão — o admin edita tudo isso na tela "Pontuação" */
const DEFAULT_SETTINGS = {
  pointValue: 3.0, // R$ por ponto
  itemTypes: [
    { id: 'logo',       label: 'Logo', short: 'logo',                      pts: 1,   max: null, firstOnly: false, color: '#FF5A36', hint: 'Logo do cliente montada no mockup do boné' },
    { id: 'var_livre',  label: 'Variação livre', short: 'var. livre',            pts: 0.5, max: 4,    firstOnly: true,  color: '#7B61FF', hint: 'Ideias a mais, sem o cliente pedir. Só na 1ª entrega' },
    { id: 'var_pedida', label: 'Variação pedida', short: 'var. pedida',           pts: 0.5, max: null, firstOnly: false, color: '#2F80ED', hint: 'O cliente pediu outra versão' },
    { id: 'mud_logo',   label: 'Mudança na logo', short: 'mud. logo',           pts: 0.5, max: null, firstOnly: false, color: '#12B886', hint: 'Ajuste pedido na logo' },
    { id: 'mud_layout', label: 'Mudança no layout do boné', short: 'mud. layout', pts: 0.5, max: null, firstOnly: false, color: '#E8A400', hint: 'Troca de tecido, cor, aplique, modelo…' },
  ],
  /* multiplicador pela média de horas online por dia trabalhado */
  tiers: [
    { h: 0, mult: 1.0 },
    { h: 6, mult: 1.1 },
    { h: 8, mult: 1.2 },
    { h: 10, mult: 1.3 },
  ],
  hours: { start: 8, lunch: 12, end: 18, nightEnd: 23 },
  weekendNight: false,
};

/* ---------- utils de data ---------- */
const pad = n => String(n).padStart(2, '0');
const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const uid = () => Math.random().toString(36).slice(2, 10);
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));
const isWeekendDate = d => d.getDay() === 0 || d.getDay() === 6;
const sameDay = (a, b) => dkey(a) === dkey(b);
const at = (day, h, m = 0) => { const d = startOfDay(day); d.setHours(h, 0, 0, 0); d.setMinutes(m); return d; };
const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ---------- estado ---------- */
let S = null;

function normalize(s) {
  s = s && typeof s === 'object' ? s : {};
  const settings = { ...structuredClone(DEFAULT_SETTINGS), ...(s.settings || {}) };
  settings.hours = { ...DEFAULT_SETTINGS.hours, ...(settings.hours || {}) };
  return {
    version: 1,
    settings,
    people: Array.isArray(s.people) ? s.people : [],
    cards: Array.isArray(s.cards) ? s.cards : [],
    sessions: Array.isArray(s.sessions) ? s.sessions : [],
    shifts: s.shifts && typeof s.shifts === 'object' ? s.shifts : {},
    log: Array.isArray(s.log) ? s.log : [],
  };
}
function load() { try { const r = localStorage.getItem(KEY); return r ? normalize(JSON.parse(r)) : null; } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save falhou', e); } }

/* ---------- consultas ---------- */
const H = () => S.settings.hours;
const NIGHT = () => range(H().end, H().nightEnd);
const person = id => S.people.find(p => p.id === id);
const designers = () => S.people.filter(p => p.role === 'designer');
const typeOf = id => S.settings.itemTypes.find(t => t.id === id) || { id, label: id, pts: 0, color: '#999' };
const entryPts = e => (e.status === 'feito' ? typeOf(e.type).pts : 0);
const cardPts = c => c.entries.reduce((s, e) => s + entryPts(e), 0);

/* ---------- online / offline ---------- */
const openSession = pid => S.sessions.find(s => s.personId === pid && !s.end);
const isOnlineNow = pid => !!openSession(pid);
function goOnline(pid, by) {
  if (openSession(pid)) return;
  S.sessions.push({ id: uid(), personId: pid, start: new Date().toISOString(), end: null, startedBy: by || 'self', endedBy: null });
  if (by === 'admin') addLog(`ligou ${person(pid)?.name}`);
}
function goOffline(pid, by) {
  const s = openSession(pid); if (!s) return;
  s.end = new Date().toISOString(); s.endedBy = by || 'self';
  if (by === 'admin') addLog(`desligou ${person(pid)?.name} (sem resposta)`);
}
function addLog(text) { S.log.unshift({ at: new Date().toISOString(), text }); S.log = S.log.slice(0, 200); }

/* minutos online de uma pessoa dentro de [from, to) */
function minutesOnline(pid, from, to) {
  const now = new Date();
  let ms = 0;
  for (const s of S.sessions) {
    if (s.personId !== pid) continue;
    const a = new Date(s.start), b = s.end ? new Date(s.end) : now;
    const x = Math.max(a, from), y = Math.min(b, to);
    if (y > x) ms += y - x;
  }
  return ms / 60000;
}
/* dias (chaves) em que a pessoa teve alguma sessão dentro do intervalo */
function activeDays(pid, from, to) {
  const set = new Set(), now = new Date();
  for (const s of S.sessions) {
    if (s.personId !== pid) continue;
    const a = new Date(s.start), b = s.end ? new Date(s.end) : now;
    if (b <= from || a >= to) continue;
    set.add(dkey(new Date(Math.max(a, from))));
  }
  return set;
}
function sessionsOn(pid, day) {
  const from = startOfDay(day), to = addDays(day, 1), now = new Date();
  return S.sessions.filter(s => s.personId === pid && new Date(s.start) < to && (s.end ? new Date(s.end) : now) > from);
}

/* ---------- multiplicador ---------- */
function multFor(avgHours) {
  const tiers = [...S.settings.tiers].sort((a, b) => a.h - b.h);
  let m = 1;
  for (const t of tiers) if (avgHours >= t.h) m = t.mult;
  return m;
}

/* ---------- estatísticas ---------- */
function stats(pid, from, to) {
  const p = person(pid);
  let points = 0, doneItems = 0, notDone = 0;
  const cardSet = new Set(), perDay = {}, byType = {};
  for (const c of S.cards) {
    if (c.designerId !== pid) continue;
    for (const e of c.entries) {
      if (!e.at) continue;
      const t = new Date(e.at);
      if (t < from || t >= to) continue;
      if (e.status === 'nao') { notDone++; continue; }
      if (e.status !== 'feito') continue;
      const v = typeOf(e.type).pts;
      points += v; doneItems++;
      cardSet.add(c.id);
      const k = dkey(t);
      perDay[k] = (perDay[k] || 0) + v;
      byType[e.type] = (byType[e.type] || 0) + v;
    }
  }
  const minutes = minutesOnline(pid, from, to);
  const days = activeDays(pid, from, to).size;
  const avgH = days ? minutes / 60 / days : 0;
  const mult = multFor(avgH);
  const cards = cardSet.size;
  return {
    points, cards, doneItems, notDone, minutes, days, avgH, mult, perDay, byType,
    cardsPerDay: days ? cards / days : 0,
    ptsPerCard: cards ? points / cards : 0,
    pay: p && p.payByPoints ? points * S.settings.pointValue * mult : null,
  };
}

/* ---------- escala (quem disse que fica à noite) ---------- */
const shiftIds = (k, h) => ((S.shifts[k] && S.shifts[k][h]) || []).filter(id => person(id));
function setShiftIds(k, h, ids) {
  ids = [...new Set(ids)].filter(Boolean);
  if (!S.shifts[k]) S.shifts[k] = {};
  if (ids.length) S.shifts[k][h] = ids; else delete S.shifts[k][h];
  if (!Object.keys(S.shifts[k]).length) delete S.shifts[k];
}
function toggleShift(k, h, id, on) {
  const cur = shiftIds(k, h).filter(x => x !== id);
  setShiftIds(k, h, on ? [...cur, id] : cur);
}
const committedHours = (pid, k) => NIGHT().filter(h => shiftIds(k, h).includes(pid));

/* Combinado × cumprido numa noite.
   status: futuro | ficou | parcial | faltou */
function nightResult(pid, k) {
  const hrs = committedHours(pid, k);
  if (!hrs.length) return null;
  const day = parseKey(k), now = new Date();
  let promised = 0, kept = 0;
  for (const h of hrs) {
    const a = at(day, h), b = at(day, h + 1);
    if (a >= now) continue;
    const end = b < now ? b : now;
    promised += (end - a) / 60000;
    kept += minutesOnline(pid, a, end);
  }
  const first = at(day, hrs[0]);
  if (first >= now) return { status: 'futuro', hrs, ratio: 0 };
  const ratio = promised ? kept / promised : 0;
  const cut = sessionsOn(pid, day).some(s => s.endedBy === 'admin' && new Date(s.end).getHours() >= H().end);
  let status = ratio >= 0.9 ? 'ficou' : ratio > 0.05 ? 'parcial' : 'faltou';
  // última saída da noite
  const ns = sessionsOn(pid, day).filter(s => (s.end ? new Date(s.end) : now) > at(day, H().end));
  const live = ns.some(s => !s.end);
  const lastEnd = ns.filter(s => s.end).map(s => new Date(s.end)).sort((a, b) => b - a)[0] || null;
  return { status, hrs, ratio, cut, lastEnd, live };
}

/* ---------- cards ---------- */
function canAdd(card, typeId) {
  const t = typeOf(typeId);
  if (t.firstOnly && card.round > 1) return `“${t.label}” só vale na 1ª entrega.`;
  if (t.max) {
    const n = card.entries.filter(e => e.type === typeId && e.status !== 'nao').length;
    if (n >= t.max) return `Limite de ${t.max} “${t.label.toLowerCase()}” por cliente.`;
  }
  return '';
}
function addEntry(card, typeId, status = 'feito') {
  const err = canAdd(card, typeId); if (err) return err;
  card.entries.push({ id: uid(), type: typeId, status, at: status === 'pendente' ? null : new Date().toISOString(), round: card.round });
  return '';
}

/* Ponto de entrada da integração com o lulu.
   payload: { lulu_id, cliente, vendedor, modelo, designer (nome ou e-mail), itens:[{tipo:'logo', qtd:1}] } */
function receiveFromLulu(payload) {
  const list = Array.isArray(payload) ? payload : [payload];
  const out = [];
  for (const p of list) {
    if (!p || !p.cliente) continue;
    if (p.lulu_id && S.cards.some(c => c.luluId === String(p.lulu_id))) continue; // já existe
    const who = p.designer ? S.people.find(x => x.role === 'designer' && (x.name.toLowerCase() === String(p.designer).toLowerCase() || (x.email || '').toLowerCase() === String(p.designer).toLowerCase())) : null;
    const card = {
      id: uid(), luluId: p.lulu_id ? String(p.lulu_id) : null, source: 'lulu',
      client: String(p.cliente), seller: p.vendedor || '', model: p.modelo || '',
      designerId: who ? who.id : null, createdAt: new Date().toISOString(),
      status: who ? 'fazendo' : 'fila', round: 1, entries: [],
    };
    const itens = Array.isArray(p.itens) && p.itens.length ? p.itens : [{ tipo: 'logo', qtd: 1 }];
    for (const it of itens) for (let i = 0; i < (it.qtd || 1); i++) {
      card.entries.push({ id: uid(), type: it.tipo, status: 'pendente', at: null, round: 1 });
    }
    S.cards.unshift(card);
    out.push(card);
  }
  return out;
}

/* ---------- dados de exemplo ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const CLIENT_A = ['Auto Peças', 'Clínica', 'Academia', 'Construtora', 'Agro', 'Café', 'Pizzaria', 'Escola', 'Transportadora', 'Imobiliária', 'Ótica', 'Pet Shop', 'Mercadinho', 'Farmácia', 'Studio', 'Barbearia', 'Solar', 'Cervejaria', 'Rádio', 'Surf Club', 'Hotel', 'Posto', 'Laboratório', 'Açaí'];
const CLIENT_B = ['Nordeste', 'Potiguar', 'Boa Vista', 'São José', 'Atlântico', 'Serra Azul', 'Dunas', 'Ponta Negra', 'Cajueiro', 'Sol Nascente', 'Mangue', 'Litoral', 'Vale Verde', 'Pirangi', 'Jacumã', 'Tirol', 'Petrópolis', 'Lagoa Nova', 'Areia Preta', 'Genipabu', 'Maracajaú', 'Cotovelo'];
const SELLERS = ['Rafa', 'Juliana', 'Marcos', 'Bia', 'Diego', 'Carol'];
const MODELS = ['Trucker', 'Americano', 'Dad hat', 'Bucket', 'Aba reta', 'Boné Sport', 'Viseira Sport', 'New York'];

function seedState() {
  const rnd = mulberry32(20261113);
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  S = normalize({});
  S.people = [
    { id: 'adm', name: 'Gestão', role: 'admin', regime: 'ADM', color: '#17140F', payByPoints: false, email: '' },
    { id: 'ana', name: 'Ana Lima', role: 'designer', regime: 'CLT', color: PALETTE[0], payByPoints: true, email: 'ana@seubone.com' },
    { id: 'caio', name: 'Caio Rocha', role: 'designer', regime: 'CLT', color: PALETTE[1], payByPoints: true, email: 'caio@seubone.com' },
    { id: 'duda', name: 'Duda Mendes', role: 'designer', regime: 'CLT', color: PALETTE[2], payByPoints: true, email: 'duda@seubone.com' },
    { id: 'bruno', name: 'Bruno Alves', role: 'designer', regime: 'PJ', color: PALETTE[3], payByPoints: true, email: 'bruno@seubone.com' },
    { id: 'lia', name: 'Lia Torres', role: 'designer', regime: 'PJ', color: PALETTE[4], payByPoints: true, email: 'lia@seubone.com' },
    { id: 'theo', name: 'Theo Martins', role: 'designer', regime: 'PJ', color: PALETTE[5], payByPoints: true, email: 'theo@seubone.com' },
  ];
  const ds = designers(), pjs = ds.filter(p => p.regime === 'PJ');
  const now = new Date(), today = startOfDay(now), hrs = H();
  let lulu = 47200, night = 0;
  const clientName = () => `${pick(CLIENT_A)} ${pick(CLIENT_B)}`;

  const makeCard = (p, t, limit, open) => {
    const card = {
      id: uid(), luluId: rnd() < 0.88 ? String(++lulu) : null, source: 'lulu',
      client: clientName(), seller: pick(SELLERS), model: pick(MODELS),
      designerId: p.id, createdAt: t.toISOString(), status: 'entregue', round: 1, entries: [],
    };
    if (!card.luluId) card.source = 'manual';
    let done = new Date(+t + R(12, 30) * 60000);
    if (done > limit && !open) done = new Date(+limit - 60000);
    if (done > limit) {
      card.status = 'fazendo';
      card.entries.push({ id: uid(), type: 'logo', status: 'pendente', at: null, round: 1 });
      return card;
    }
    const iso = done.toISOString();
    card.entries.push({ id: uid(), type: 'logo', status: rnd() < 0.95 ? 'feito' : 'nao', at: iso, round: 1 });
    const nv = pick([0, 1, 2, 2, 2, 3, 4, 4]);
    for (let i = 0; i < nv; i++) card.entries.push({ id: uid(), type: 'var_livre', status: 'feito', at: iso, round: 1 });
    if (rnd() < 0.3) {
      const t2 = new Date(+done + R(40, 200) * 60000);
      if (t2 < limit) {
        card.round = 2;
        const n2 = R(1, 3);
        for (let i = 0; i < n2; i++) card.entries.push({ id: uid(), type: pick(['var_pedida', 'mud_logo', 'mud_layout', 'mud_layout']), status: 'feito', at: t2.toISOString(), round: 2 });
      }
    }
    return card;
  };

  for (let i = 27; i >= 0; i--) {
    const day = addDays(today, -i);
    if (isWeekendDate(day)) continue;
    const k = dkey(day);
    // escala: um PJ por noite, às vezes outro reforça 18–20
    const main = pjs[night++ % pjs.length];
    NIGHT().forEach(h => setShiftIds(k, h, [main.id]));
    if (rnd() < 0.3) { const extra = pick(pjs.filter(x => x !== main)); [18, 19].forEach(h => toggleShift(k, h, extra.id, true)); }

    for (const p of ds) {
      if (i > 0 && rnd() < 0.04) continue; // faltou no dia
      const blocks = p.regime === 'CLT'
        ? [[at(day, hrs.start, R(0, 12)), at(day, hrs.lunch, R(-4, 2))], [at(day, hrs.lunch + 1, R(0, 10)), at(day, hrs.end, R(-12, 15))]]
        : [[at(day, hrs.start, R(0, 18)), at(day, hrs.end, R(-14, 6))]];
      const nh = committedHours(p.id, k);
      if (nh.length) {
        const r = rnd();
        const st = at(day, nh[0], R(0, 9));
        let en = at(day, nh[nh.length - 1] + 1, R(-4, 3)), by = 'self';
        if (r < 0.06) { /* não apareceu */ }
        else {
          if (r < 0.17) en = at(day, R(19, 21), R(0, 59));
          else if (r < 0.23) { en = at(day, R(20, 21), R(0, 59)); by = 'admin'; }
          blocks.push([st, en, by]);
        }
      }
      for (const [s, e, by] of blocks) {
        if (s > now) continue;
        const open = e > now;
        S.sessions.push({ id: uid(), personId: p.id, start: s.toISOString(), end: open ? null : e.toISOString(), startedBy: 'self', endedBy: open ? null : (by || 'self') });
        if (by === 'admin' && !open) S.log.push({ at: e.toISOString(), text: `desligou ${p.name} (sem resposta)` });
        // cards trabalhados nessa sessão
        const limit = open ? now : e;
        const hours = (limit - s) / 3600000;
        const n = Math.max(0, Math.round(hours * (p.regime === 'PJ' ? 0.78 : 0.7) + R(-1, 1)));
        for (let j = 0; j < n; j++) {
          const t = new Date(+s + rnd() * Math.max(1, (limit - s) - 15 * 60000));
          S.cards.push(makeCard(p, t, limit, open));
        }
      }
    }
  }
  // clientes que chegaram do lulu e ainda não têm designer
  for (let j = 0; j < 3; j++) {
    S.cards.push({ id: uid(), luluId: String(++lulu), source: 'lulu', client: clientName(), seller: pick(SELLERS), model: pick(MODELS), designerId: null, createdAt: new Date(+now - R(2, 25) * 60000).toISOString(), status: 'fila', round: 1, entries: [{ id: uid(), type: 'logo', status: 'pendente', at: null, round: 1 }] });
  }
  S.cards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  S.log.sort((a, b) => new Date(b.at) - new Date(a.at));
  return S;
}
