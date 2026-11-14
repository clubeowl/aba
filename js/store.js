'use strict';
/* =========================================================
   Dedé — camada de dados (SeuBoné)
   Modo demonstração: tudo no localStorage deste navegador.
   Para usar com o time de verdade, troque load()/save() por
   um banco online (ex.: Supabase) sem mexer nas telas.
   ========================================================= */

const KEY = 'dede.v1';
const PALETTE = ['#F5A800', '#FF5A36', '#7B61FF', '#12B886', '#2F80ED', '#E64980', '#0B9E8A', '#FD7E14', '#5C7CFA', '#AE3EC9', '#495057', '#C2255C'];

/* ---------- regras (o admin edita tudo em Configurações → Pontuação) ---------- */
const DEFAULT_SETTINGS = {
  pointValue: 3.0, // R$ por ponto
  /* tipo de atividade: a base do card */
  kinds: [
    { id: 'logo',     label: 'Logo / layout',     pts: 1,  color: '#F5A800', hint: 'Logo do cliente nos mockups do boné' },
    { id: 'catalogo', label: 'Catálogo / PDF',    pts: 4,  color: '#7B61FF', hint: 'Layouts unidos em PDF, catálogo, material mais trabalhado' },
    { id: 'pequena',  label: 'Atividade pequena', pts: 6,  color: '#12B886', hint: 'Pedido específico com poucas tarefas' },
    { id: 'media',    label: 'Atividade média',   pts: 8,  color: '#2F80ED', hint: 'Pedido específico com várias tarefas' },
    { id: 'grande',   label: 'Atividade grande',  pts: 12, color: '#E64980', hint: 'Pedido muito específico, com muitas tarefas' },
  ],
  /* como a logo chegou */
  logoQ: [
    { id: 'alta',    label: 'Alta qualidade',      pts: 0 },
    { id: 'media',   label: 'Média qualidade',     pts: 0 },
    { id: 'baixa',   label: 'Baixa qualidade',     pts: 1 },
    { id: 'recriou', label: 'Não tinha, recriou',  pts: 1 },
    { id: 'criou',   label: 'Criou logo do zero',  pts: 1 },
  ],
  /* adicionais (contam por unidade) */
  adds: [
    { id: 'variacao',   label: 'Variações da logo',   pts: 0.5 },
    { id: 'mud_logo',   label: 'Mudanças na logo',    pts: 0.5 },
    { id: 'mud_layout', label: 'Mudanças no layout',  pts: 0.5 },
  ],
  diffs: [
    { id: 'leve',     label: 'Leve',     color: '#3B82F6' },
    { id: 'moderado', label: 'Moderado', color: '#F5B700' },
    { id: 'dificil',  label: 'Difícil',  color: '#EF4444' },
  ],
  /* Buff do mês (só PJ): média de horas online por dia do mês, contando fins de semana */
  buff: [
    { h: 0,  mult: 1.0 },
    { h: 8,  mult: 1.5 },
    { h: 12, mult: 2.0 },
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
const norm = s => String(s || '').trim().toLowerCase();
const inRange = (k, from, to) => k >= from && k <= to;
const round2 = n => Math.round(n * 100) / 100;

/* ---------- estado ----------
   people: [{id, name, role:'admin'|'designer', regime:'CLT'|'PJ'|'ADM', color, email, payByPoints}]
   activities (cards): [{
     id, designerId, date, time, client, name (nome do card), luluId,
     kind, logoQ, adds:{variacao, mud_logo, mud_layout}, diff, mins, details,
     pts (pontuação final), ptsOverride (true se a gestão ajustou),
     status:'pendente'|'aprovada'|'erro'|'recusada', note (comentário da gestão), createdAt, by }]
   online: { 'AAAA-MM-DD': { designerId: minutos } }   lançado pela gestão
*/
let S = null;

function normalize(s) {
  s = s && typeof s === 'object' ? s : {};
  const base = structuredClone(DEFAULT_SETTINGS), st = s.settings || {};
  // configurações antigas (itemTypes/tiers) não servem mais: mantém só o valor do ponto
  const settings = {
    ...base,
    pointValue: typeof st.pointValue === 'number' ? st.pointValue : base.pointValue,
    ...(st.kinds ? { kinds: st.kinds } : {}), ...(st.logoQ ? { logoQ: st.logoQ } : {}), ...(st.adds ? { adds: st.adds } : {}),
    ...(st.diffs ? { diffs: st.diffs } : {}), ...(st.buff ? { buff: st.buff } : {}),
  };
  const out = {
    version: 3, settings,
    people: Array.isArray(s.people) && s.people.length ? s.people : [{ id: 'adm', name: 'Gestão', role: 'admin', regime: 'ADM', color: '#18181B', email: '', payByPoints: false }],
    activities: Array.isArray(s.activities) ? s.activities : [],
    online: s.online && typeof s.online === 'object' ? s.online : {},
    log: Array.isArray(s.log) ? s.log : [],
  };
  // migração dos lançamentos da versão anterior (um tipo por linha)
  out.activities = out.activities.map(a => {
    if (a.kind) return a;
    const map = { var_livre: 'variacao', var_pedida: 'variacao', mud_logo: 'mud_logo', mud_layout: 'mud_layout' };
    const adds = { variacao: 0, mud_logo: 0, mud_layout: 0 };
    let kind = 'logo';
    if (map[a.type]) adds[map[a.type]] = a.qty || 1;
    return { ...a, kind: a.extra ? 'pequena' : kind, name: a.extra ? (a.desc || 'Atividade extra') : '', logoQ: 'alta', adds, diff: 'moderado', mins: 0, details: a.desc || '', ptsOverride: true };
  });
  return out;
}
function load() { try { const r = localStorage.getItem(KEY); return r ? normalize(JSON.parse(r)) : null; } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save falhou', e); } }

/* ---------- consultas ---------- */
const person = id => S.people.find(p => p.id === id);
const designers = () => S.people.filter(p => p.role === 'designer');
const kindOf = id => S.settings.kinds.find(k => k.id === id) || { id, label: 'Atividade', pts: 0, color: '#71717A' };
const logoOf = id => S.settings.logoQ.find(k => k.id === id) || { id, label: '—', pts: 0 };
const addOf = id => S.settings.adds.find(k => k.id === id) || { id, label: id, pts: 0 };
const diffOf = id => S.settings.diffs.find(k => k.id === id) || S.settings.diffs[1];
function addLog(text) { S.log.unshift({ at: new Date().toISOString(), text }); S.log = S.log.slice(0, 300); }

/* pontuação calculada pelas regras + o detalhamento linha a linha */
function scoreOf(c) {
  const lines = [];
  const k = kindOf(c.kind);
  lines.push({ label: k.label, pts: k.pts });
  const lq = logoOf(c.logoQ);
  if (lq.pts) lines.push({ label: lq.label, pts: lq.pts });
  for (const ad of S.settings.adds) {
    const n = (c.adds && c.adds[ad.id]) || 0;
    if (n) lines.push({ label: `${n} ${ad.label.toLowerCase()}`, pts: round2(n * ad.pts) });
  }
  return { lines, total: round2(lines.reduce((s, l) => s + l.pts, 0)) };
}

/* ---------- horas online e Buff ---------- */
const onlineMin = (pid, k) => (S.online[k] && S.online[k][pid]) || 0;
function setOnline(pid, k, min) {
  if (!S.online[k]) S.online[k] = {};
  if (min > 0) S.online[k][pid] = Math.round(min); else delete S.online[k][pid];
  if (!Object.keys(S.online[k]).length) delete S.online[k];
}
function buffMult(avgH) {
  let m = 1;
  for (const t of [...S.settings.buff].sort((a, b) => a.h - b.h)) if (avgH >= t.h) m = t.mult;
  return m;
}
/* Buff do mês de uma data: média = horas do mês ÷ dias do mês (fins de semana contam).
   No mês atual, divide pelos dias que já passaram (até hoje). Só vale para PJ. */
function monthBuff(pid, ref) {
  const p = person(pid);
  const y = ref.getFullYear(), m = ref.getMonth();
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0), today = startOfDay(new Date());
  const end = last < today ? last : (first > today ? first : today);
  const days = Math.max(1, Math.round((end - first) / 864e5) + 1);
  let minutes = 0;
  for (let d = first; d <= last; d = addDays(d, 1)) minutes += onlineMin(pid, dkey(d));
  const avgH = minutes / 60 / days;
  const eligible = !!p && p.regime === 'PJ';
  const tiers = [...S.settings.buff].sort((a, b) => a.h - b.h);
  const next = tiers.find(t => t.h > avgH);
  const hMult = eligible ? buffMult(avgH) : 1;
  return { minutes, days, avgH, hMult, mult: hMult, eligible, next: eligible ? next : null };
}

/* números de um designer num intervalo de datas (chaves inclusive) */
function stats(pid, from, to) {
  const p = person(pid);
  const acts = S.activities.filter(a => a.designerId === pid && inRange(a.date, from, to));
  const ok = acts.filter(a => a.status === 'aprovada');
  const points = round2(ok.reduce((s, a) => s + (+a.pts || 0), 0));
  const pending = acts.filter(a => a.status === 'pendente');
  const pendingPts = round2(pending.reduce((s, a) => s + (+a.pts || 0), 0));
  const clients = new Set(ok.filter(a => a.client).map(a => norm(a.client))).size;
  let minutes = 0;
  for (const [k, m] of Object.entries(S.online)) if (inRange(k, from, to) && m[pid]) minutes += m[pid];
  const buff = monthBuff(pid, parseKey(to));
  const cardMins = ok.reduce((s, a) => s + (+a.mins || 0), 0);
  const perDay = {}, byKind = {};
  ok.forEach(a => { perDay[a.date] = (perDay[a.date] || 0) + (+a.pts || 0); byKind[a.kind] = (byKind[a.kind] || 0) + (+a.pts || 0); });
  const base = points * S.settings.pointValue;
  return {
    acts, ok, points, pending: pending.length, pendingPts, clients, minutes, buff, perDay, byKind,
    cards: ok.length, avgCardMins: ok.length ? cardMins / ok.length : 0,
    refused: acts.filter(a => a.status === 'recusada').length,
    errors: acts.filter(a => a.status === 'erro').length,
    ptsPerCard: ok.length ? points / ok.length : 0,
    hard: ok.filter(a => a.diff === 'dificil').length,
    base,
    pay: p && p.payByPoints ? base * buff.mult : null,
  };
}

/* ---------- integração futura com o lulu ----------
   payload: { lulu_id, cliente, nome, designer (nome ou e-mail), tipo }  → card "aguardando" */
function receiveFromLulu(payload) {
  const list = Array.isArray(payload) ? payload : [payload], out = [], now = new Date();
  for (const p of list) {
    if (!p || !p.cliente) continue;
    const who = S.people.find(x => x.role === 'designer' && [norm(x.name), norm(x.email)].includes(norm(p.designer)));
    if (!who) continue;
    const c = { id: uid(), designerId: who.id, date: dkey(now), time: hm(now), client: String(p.cliente), name: p.nome || '', luluId: p.lulu_id ? String(p.lulu_id) : '', kind: p.tipo || 'logo', logoQ: 'alta', adds: { variacao: 0, mud_logo: 0, mud_layout: 0 }, diff: 'moderado', mins: 0, details: 'veio do lulu', status: 'pendente', note: '', createdAt: now.toISOString(), by: 'lulu' };
    c.pts = scoreOf(c).total; S.activities.push(c); out.push(c);
  }
  return out;
}

/* ---------- exemplo (só quando o admin pede) ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function demoState() {
  const rnd = mulberry32(2026), R = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[Math.floor(rnd() * a.length)];
  const A = ['Auto Peças', 'Clínica', 'Academia', 'Construtora', 'Agro', 'Café', 'Pizzaria', 'Escola', 'Ótica', 'Pet Shop', 'Farmácia', 'Barbearia', 'Solar', 'Hotel', 'Açaí', 'Igreja', 'Rádio'];
  const B = ['Nordeste', 'Potiguar', 'Boa Vista', 'Atlântico', 'Dunas', 'Ponta Negra', 'Cajueiro', 'Litoral', 'Pirangi', 'Tirol', 'Genipabu'];
  const N = ['Trucker evento', 'Dad hat bordado', 'Americano aba curva', 'Bucket verão', 'Aba reta equipe', 'Viseira corrida', 'Boné sport'];
  const prev = S; S = normalize({});
  S.people.push(
    { id: 'd1', name: 'Bruno Alves', role: 'designer', regime: 'PJ', color: PALETTE[4], email: 'bruno@seubone.com', payByPoints: true },
    { id: 'd2', name: 'Lia Torres', role: 'designer', regime: 'PJ', color: PALETTE[0], email: 'lia@seubone.com', payByPoints: true },
    { id: 'd3', name: 'Theo Martins', role: 'designer', regime: 'PJ', color: PALETTE[5], email: 'theo@seubone.com', payByPoints: true },
    { id: 'd4', name: 'Ana Lima', role: 'designer', regime: 'CLT', color: PALETTE[1], email: 'ana@seubone.com', payByPoints: true },
  );
  const today = startOfDay(new Date()), now = new Date();
  const hoursProfile = { d1: [600, 780], d2: [480, 620], d3: [360, 520], d4: [480, 540] };
  const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  for (let d = first; d <= today; d = addDays(d, 1)) {
    const k = dkey(d), we = isWeekendDate(d);
    for (const p of S.people.filter(x => x.role === 'designer')) {
      const works = !we || (p.id === 'd1' && rnd() < .7) || (p.id === 'd2' && rnd() < .3);
      if (!works) continue;
      const [a, b] = hoursProfile[p.id];
      setOnline(p.id, k, R(a, b) * (we ? .6 : 1));
      const n = we ? R(1, 3) : R(3, 7);
      for (let j = 0; j < n; j++) {
        const h = R(8, 17), m = R(0, 59), t = new Date(+d + (h * 60 + m) * 60000);
        if (t > now) continue;
        const r = rnd();
        const kind = r < .78 ? 'logo' : r < .9 ? 'catalogo' : r < .96 ? 'pequena' : r < .99 ? 'media' : 'grande';
        const logoQ = kind === 'logo' ? pick(['alta', 'alta', 'media', 'media', 'baixa', 'baixa', 'recriou', 'criou']) : 'alta';
        const adds = { variacao: kind === 'logo' ? pick([0, 1, 2, 2, 3]) : 0, mud_logo: rnd() < .2 ? 1 : 0, mud_layout: rnd() < .25 ? R(1, 2) : 0 };
        const diff = kind === 'grande' || kind === 'media' ? 'dificil' : pick(['leve', 'leve', 'moderado', 'moderado', 'dificil']);
        const st = dkey(d) === dkey(today) ? (rnd() < .65 ? 'pendente' : 'aprovada') : (rnd() < .93 ? 'aprovada' : rnd() < .5 ? 'erro' : 'recusada');
        const c = { id: uid(), designerId: p.id, date: k, time: `${pad(h)}:${pad(m)}`, client: `${pick(A)} ${pick(B)}`, name: pick(N), luluId: String(47000 + R(0, 2000)), kind, logoQ, adds, diff, mins: kind === 'logo' ? R(15, 70) : kind === 'catalogo' ? R(60, 150) : R(120, 420), details: rnd() < .15 ? 'Não mexi na logo, mas refiz os layouts do zero.' : '', status: st, note: st === 'erro' ? 'Confere a qualidade da logo, parecia alta.' : st === 'recusada' ? 'Card duplicado' : '', createdAt: t.toISOString(), by: 'designer' };
        c.pts = scoreOf(c).total;
        S.activities.push(c);
      }
    }
  }
  const out = S; S = prev; return out;
}
