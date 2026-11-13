'use strict';
/* =========================================================
   Dedé — camada de dados (SeuBoné)
   Modo demonstração: tudo no localStorage deste navegador.
   Para usar com o time de verdade, troque load()/save() por
   um banco online (ex.: Supabase) sem mexer nas telas.
   ========================================================= */

const KEY = 'dede.v1';
const PALETTE = ['#F5A800', '#FF5A36', '#7B61FF', '#12B886', '#2F80ED', '#E64980', '#0B9E8A', '#FD7E14', '#5C7CFA', '#AE3EC9', '#495057', '#C2255C'];

const DEFAULT_SETTINGS = {
  pointValue: 3.0, // R$ por ponto
  itemTypes: [
    { id: 'logo',       label: 'Logo',                      pts: 1,   max: null, color: '#F5A800', hint: 'Logo do cliente montada no mockup do boné' },
    { id: 'var_livre',  label: 'Variação livre',            pts: 0.5, max: 4,    color: '#7B61FF', hint: 'Ideias a mais sem o cliente pedir: até 4 por cliente, só no 1º envio' },
    { id: 'var_pedida', label: 'Variação pedida',           pts: 0.5, max: null, color: '#2F80ED', hint: 'O cliente pediu outra versão' },
    { id: 'mud_logo',   label: 'Mudança na logo',           pts: 0.5, max: null, color: '#12B886', hint: 'Ajuste pedido na logo' },
    { id: 'mud_layout', label: 'Mudança no layout do boné', pts: 0.5, max: null, color: '#FF5A36', hint: 'Troca de tecido, cor, aplique, modelo…' },
  ],
  /* bônus pela média de horas online por dia trabalhado */
  tiers: [
    { h: 0, mult: 1.0 },
    { h: 6, mult: 1.1 },
    { h: 8, mult: 1.2 },
    { h: 10, mult: 1.3 },
  ],
};

/* ---------- utils ---------- */
const pad = n => String(n).padStart(2, '0');
const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const uid = () => Math.random().toString(36).slice(2, 10);
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));
const isWeekendDate = d => d.getDay() === 0 || d.getDay() === 6;
const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ---------- estado ----------
   people:     [{id, name, role:'admin'|'designer', regime:'CLT'|'PJ'|'ADM', color, email, payByPoints}]
   activities: [{id, designerId, date:'AAAA-MM-DD', time:'HH:MM', client, luluId, type, qty,
                 pts (pontuação final), status:'pendente'|'aprovada'|'recusada'|'erro',
                 note (comentário do admin), extra (atividade extra criada pelo admin), desc, createdAt, by}]
   online:     { 'AAAA-MM-DD': { designerId: minutos } }   lançado pelo admin
*/
let S = null;

function normalize(s) {
  s = s && typeof s === 'object' ? s : {};
  return {
    version: 1,
    settings: { ...structuredClone(DEFAULT_SETTINGS), ...(s.settings || {}) },
    people: Array.isArray(s.people) && s.people.length ? s.people : [{ id: 'adm', name: 'Gestão', role: 'admin', regime: 'ADM', color: '#18181B', email: '', payByPoints: false }],
    activities: Array.isArray(s.activities) ? s.activities : [],
    online: s.online && typeof s.online === 'object' ? s.online : {},
    log: Array.isArray(s.log) ? s.log : [],
  };
}
function load() { try { const r = localStorage.getItem(KEY); return r ? normalize(JSON.parse(r)) : null; } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save falhou', e); } }

/* ---------- consultas ---------- */
const person = id => S.people.find(p => p.id === id);
const designers = () => S.people.filter(p => p.role === 'designer');
const typeOf = id => S.settings.itemTypes.find(t => t.id === id) || { id, label: 'Atividade extra', pts: 0, color: '#18181B' };
const suggestedPts = (type, qty) => Math.round(typeOf(type).pts * (qty || 1) * 100) / 100;
const counts = a => a.status === 'aprovada';
function addLog(text) { S.log.unshift({ at: new Date().toISOString(), text }); S.log = S.log.slice(0, 300); }

const onlineMin = (pid, k) => (S.online[k] && S.online[k][pid]) || 0;
function setOnline(pid, k, min) {
  if (!S.online[k]) S.online[k] = {};
  if (min > 0) S.online[k][pid] = Math.round(min); else delete S.online[k][pid];
  if (!Object.keys(S.online[k]).length) delete S.online[k];
}

function multFor(avgHours) {
  let m = 1;
  for (const t of [...S.settings.tiers].sort((a, b) => a.h - b.h)) if (avgHours >= t.h) m = t.mult;
  return m;
}

const inRange = (k, from, to) => k >= from && k <= to; // chaves AAAA-MM-DD comparam como texto

/* aviso automático: variação livre acima do limite no mesmo cliente */
function ruleWarnings(a) {
  const t = typeOf(a.type);
  if (!t.max) return '';
  const same = S.activities.filter(x => x.designerId === a.designerId && x.type === a.type && x.status !== 'recusada' && norm(x.client) === norm(a.client) && x.client);
  const total = same.reduce((s, x) => s + (x.qty || 1), 0);
  return total > t.max ? `${total} ${t.label.toLowerCase()} para este cliente (limite ${t.max})` : '';
}
const norm = s => String(s || '').trim().toLowerCase();

/* números de um designer num intervalo de datas (chaves inclusive) */
function stats(pid, from, to) {
  const p = person(pid);
  const acts = S.activities.filter(a => a.designerId === pid && inRange(a.date, from, to));
  const ok = acts.filter(counts);
  const points = ok.reduce((s, a) => s + (+a.pts || 0), 0);
  const pending = acts.filter(a => a.status === 'pendente');
  const pendingPts = pending.reduce((s, a) => s + (+a.pts || 0), 0);
  const clients = new Set(ok.filter(a => a.client).map(a => norm(a.client))).size;
  let minutes = 0, days = 0;
  for (const [k, m] of Object.entries(S.online)) if (inRange(k, from, to) && m[pid]) { minutes += m[pid]; days++; }
  const workDays = new Set([...acts.map(a => a.date), ...Object.keys(S.online).filter(k => inRange(k, from, to) && S.online[k][pid])]).size;
  const avgH = days ? minutes / 60 / days : 0;
  const mult = multFor(avgH);
  const perDay = {}, byType = {};
  ok.forEach(a => { perDay[a.date] = (perDay[a.date] || 0) + (+a.pts || 0); byType[a.type] = (byType[a.type] || 0) + (+a.pts || 0); });
  return {
    acts, ok, points, pending: pending.length, pendingPts, clients, minutes, days, workDays, avgH, mult, perDay, byType,
    refused: acts.filter(a => a.status === 'recusada').length,
    errors: acts.filter(a => a.status === 'erro').length,
    ptsPerClient: clients ? points / clients : 0,
    clientsPerDay: workDays ? clients / workDays : 0,
    pay: p && p.payByPoints ? points * S.settings.pointValue * mult : null,
  };
}

/* ---------- integração futura com o lulu ----------
   payload: { lulu_id, cliente, designer (nome ou e-mail), itens:[{tipo, qtd}] }
   cria atividades "pendente" para o designer conferir */
function receiveFromLulu(payload) {
  const list = Array.isArray(payload) ? payload : [payload], out = [];
  const now = new Date();
  for (const p of list) {
    if (!p || !p.cliente) continue;
    const who = S.people.find(x => x.role === 'designer' && [norm(x.name), norm(x.email)].includes(norm(p.designer)));
    if (!who) continue;
    for (const it of (p.itens && p.itens.length ? p.itens : [{ tipo: 'logo', qtd: 1 }])) {
      const a = { id: uid(), designerId: who.id, date: dkey(now), time: hm(now), client: String(p.cliente), luluId: p.lulu_id ? String(p.lulu_id) : '', type: it.tipo, qty: it.qtd || 1, pts: suggestedPts(it.tipo, it.qtd || 1), status: 'pendente', note: '', extra: false, desc: 'veio do lulu', createdAt: now.toISOString(), by: 'lulu' };
      S.activities.push(a); out.push(a);
    }
  }
  return out;
}

/* ---------- exemplo (só quando o admin pede) ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function demoState() {
  const rnd = mulberry32(777), R = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[Math.floor(rnd() * a.length)];
  const A = ['Auto Peças', 'Clínica', 'Academia', 'Construtora', 'Agro', 'Café', 'Pizzaria', 'Escola', 'Ótica', 'Pet Shop', 'Farmácia', 'Barbearia', 'Solar', 'Hotel', 'Açaí'];
  const B = ['Nordeste', 'Potiguar', 'Boa Vista', 'Atlântico', 'Dunas', 'Ponta Negra', 'Cajueiro', 'Litoral', 'Pirangi', 'Tirol', 'Genipabu'];
  const s = normalize({});
  s.people.push(
    { id: 'd1', name: 'Ana Lima', role: 'designer', regime: 'CLT', color: PALETTE[1], email: 'ana@seubone.com', payByPoints: true },
    { id: 'd2', name: 'Bruno Alves', role: 'designer', regime: 'PJ', color: PALETTE[4], email: 'bruno@seubone.com', payByPoints: true },
    { id: 'd3', name: 'Lia Torres', role: 'designer', regime: 'PJ', color: PALETTE[0], email: 'lia@seubone.com', payByPoints: true },
  );
  const today = startOfDay(new Date()), now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i); if (isWeekendDate(d)) continue;
    const k = dkey(d);
    for (const p of s.people.filter(x => x.role === 'designer')) {
      s.online[k] = s.online[k] || {};
      s.online[k][p.id] = (p.regime === 'PJ' ? R(540, 720) : R(480, 545));
      const n = R(5, 9);
      for (let j = 0; j < n; j++) {
        const h = R(8, 17), m = R(0, 59), t = new Date(+d + (h * 60 + m) * 60000);
        if (t > now) continue;
        const client = `${pick(A)} ${pick(B)}`, lulu = String(47000 + R(0, 2000));
        const st = i === 0 ? (rnd() < 0.7 ? 'pendente' : 'aprovada') : (rnd() < 0.92 ? 'aprovada' : rnd() < 0.5 ? 'recusada' : 'erro');
        const mk = (type, qty) => ({ id: uid(), designerId: p.id, date: k, time: `${pad(h)}:${pad(m)}`, client, luluId: lulu, type, qty, pts: Math.round(DEFAULT_SETTINGS.itemTypes.find(x => x.id === type).pts * qty * 100) / 100, status: st, note: st === 'erro' ? 'Pontuação acima do combinado, confere?' : st === 'recusada' ? 'Duplicado' : '', extra: false, desc: '', createdAt: t.toISOString(), by: 'designer' });
        s.activities.push(mk('logo', 1));
        const v = pick([0, 2, 2, 3, 4]); if (v) s.activities.push(mk('var_livre', v));
        if (rnd() < 0.25) s.activities.push(mk(pick(['var_pedida', 'mud_logo', 'mud_layout']), R(1, 2)));
      }
    }
  }
  s.activities.push({ id: uid(), designerId: 'd3', date: dkey(addDays(today, -1)), time: '18:30', client: 'Mutirão de campanha', luluId: '', type: 'extra', qty: 1, pts: 5, status: 'aprovada', note: '', extra: true, desc: 'Ficou até tarde fechando a campanha de fim de ano', createdAt: new Date().toISOString(), by: 'admin' });
  return s;
}
