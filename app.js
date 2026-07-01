/* Philosopher Atlas — front-end (D3 v7, self-hosted, no build step).
   Design: FRONTEND.md. Data: ./data/atlas_index.json + ./data/philosophers/{QID}.json
   Aesthetic: old-map / parchment. Clustering: deterministic screen-space greedy. */
'use strict';

// ---------- config ----------
const TRAD_COLOR = {
  european: '#33548c', greek: '#9e2a2b', chinese: '#c1440e', islamic: '#1b6b47',
  jewish: '#6d3b8e', indian: '#d98c00', african: '#0f8b8d',
  japanese: '#b5179e', korean: '#4a4e69', latin_american: '#a4531f', other: '#5c5c5c'
};
const TRAD_ZH = {
  european: '歐洲', greek: '希臘', chinese: '中國', islamic: '伊斯蘭', jewish: '猶太',
  indian: '印度', african: '非洲/離散', japanese: '日本', korean: '韓國',
  latin_american: '拉丁美洲', other: '其他'
};
const TRAD_ORDER = ['european','chinese','greek','islamic','indian','jewish','african','japanese','korean','latin_american','other'];
const TRAD_EN = {
  european: 'European', greek: 'Greek', chinese: 'Chinese', islamic: 'Islamic', jewish: 'Jewish',
  indian: 'Indian', african: 'African/Diaspora', japanese: 'Japanese', korean: 'Korean',
  latin_american: 'Latin American', other: 'Other'
};
const SRC_LABEL = { wikidata: { zh: 'Wikidata', en: 'Wikidata' }, sep: { zh: 'SEP', en: 'SEP' }, iep: { zh: 'IEP', en: 'IEP' }, feng_youlan: { zh: '馮友蘭', en: 'Feng Youlan' }, lao_siguang: { zh: '勞思光', en: 'Lao Sze-kwang' }, routledge_series: { zh: 'Routledge', en: 'Routledge' }, adamson: { zh: 'Adamson', en: 'Adamson' } };
const ANCHOR_LABEL = { birth: { zh: '生', en: 'Born' }, work: { zh: '治學', en: 'Worked' }, residence: { zh: '居', en: 'Lived' }, death: { zh: '歿', en: 'Died' } };
// ---------- i18n ----------
let lang = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'zh';
const STR = {
  search_ph:   { zh: '搜尋哲學家…', en: 'Search philosophers…' },
  all_eras:    { zh: '全部時代', en: 'All eras' },
  year_word:   { zh: (y) => `${y} 年`, en: (y) => `${y}` },
  legend_title:{ zh: '傳統（正典池）', en: 'Tradition' },
  legend_hint: { zh: '點按篩選', en: 'tap to filter' },
  focus_label: { zh: '選取時聚焦（淡化其他）', en: 'Focus on select (dim others)' },
  bias:        { zh: (n, e, p) => `共 ${n} 位 · 西方(歐洲) ${e} 佔 ${p}%（來源偏誤，誠實標示）`, en: (n, e, p) => `${n} total · Western (European) ${e} = ${p}% (source bias, shown honestly)` },
  loading:     { zh: '載入中…', en: 'Loading…' },
  empty:       { zh: '點選地圖上的哲學家', en: 'Select a philosopher on the map' },
  empty_sub:   { zh: '看收錄依據、政體、著作', en: 'see sources, polity, works' },
  sources:     { zh: '收錄依據', en: 'Why included' },
  sources_hint:{ zh: '哪些來源收了他', en: 'which sources list them' },
  bio_h:       { zh: '生平', en: 'Biography' },
  wiki_credit: { zh: '維基百科 · CC BY-SA', en: 'Wikipedia · CC BY-SA' },
  works_h:     { zh: '著作', en: 'Works' },
  places_h:    { zh: '地點', en: 'Places' },
  provisional: { zh: '暫定', en: 'provisional' },
  polity_at:   { zh: (y) => `${y} 年此地屬`, en: (y) => `In ${y}, this place was in` },
  polity_seq:  { zh: '政體序列', en: 'Polity history' },
  polity_blank:{ zh: (pl) => `${pl}：此年無資料（留白）`, en: (pl) => `${pl}: no data for this year` },
  polity_approx:{ zh: '近似(dataset)', en: 'approximate (dataset)' },
  polity_curated:{ zh: '人工核定', en: 'curated' },
  dominant:    { zh: (n, tr) => `${n} 位 · ${tr}主導`, en: (n, tr) => `${n} · mostly ${tr}` }
};
function t(k, ...a) { const v = STR[k] && STR[k][lang]; return typeof v === 'function' ? v(...a) : (v != null ? v : (STR[k] && STR[k].zh) || k); }
function tradLabel(tr) { return (lang === 'en' ? TRAD_EN : TRAD_ZH)[tr] || tr; }
function srcLabel(id) { return (SRC_LABEL[id] && SRC_LABEL[id][lang]) || id; }
function nameOf(d) { return lang === 'en' ? (d.name_en || d.name_zh) : (d.name_zh || d.name_en); }
function descOf(f) { return lang === 'en' ? (f.description_en || f.description) : (f.description || f.description_en); }
function bioOf(f) { return lang === 'en' ? (f.bio_en || f.bio) : (f.bio || f.bio_en); }
function emptyPanelHTML() { return `<div class="pempty">${t('empty')}<br><span class="dim">${t('empty_sub')}</span></div>`; }
const CLUSTER_R = 26;          // px: greedy cluster radius
const SPIDER_EPS = 4;          // px: points closer than this = same city -> spiderfy

// ---------- state ----------
let DATA = [];                 // atlas_index entries (+ derived screen coords)
let transform = d3.zoomIdentity;
let yearMode = false;          // false = show all eras
let curYear = 1800;
let activeTraditions = new Set(TRAD_ORDER);
let selected = null;           // selected datum
let selectedFull = null;       // its loaded full JSON
let spiderCluster = null;      // {cx,cy,members} currently spiderfied
let focusMode = true;          // on = dim others when one is selected (toggle in legend)

// ---------- svg scaffold ----------
const mapEl = document.getElementById('map');
let W = mapEl.clientWidth, H = mapEl.clientHeight;
const svg = d3.select('#map').append('svg').attr('width', W).attr('height', H);

const defs = svg.append('defs');
// wobbly ink coastline
const ink = defs.append('filter').attr('id', 'ink').attr('x', '-5%').attr('y', '-5%').attr('width', '110%').attr('height', '110%');
ink.append('feTurbulence').attr('type', 'fractalNoise').attr('baseFrequency', '0.012').attr('numOctaves', '2').attr('seed', '7').attr('result', 'n');
ink.append('feDisplacementMap').attr('in', 'SourceGraphic').attr('in2', 'n').attr('scale', '5').attr('xChannelSelector', 'R').attr('yChannelSelector', 'G');
// soft drop for pins
const glow = defs.append('filter').attr('id', 'pinsh').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
glow.append('feDropShadow').attr('dx', 0).attr('dy', 0.6).attr('stdDeviation', 0.6).attr('flood-color', '#3a2a12').attr('flood-opacity', 0.5);

const gBasemap = svg.append('g').attr('class', 'basemap');
const gGrat = svg.append('g').attr('class', 'graticule');
const gBorders = svg.append('g').attr('class', 'borders');   // time-synced historical polity borders
const gTrail = svg.append('g').attr('class', 'trails');
const gOverlay = svg.append('g').attr('class', 'overlay');

const projection = d3.geoEquirectangular().fitSize([W, H], { type: 'Sphere' });
const path = d3.geoPath(projection);
const graticule = d3.geoGraticule10();

const tooltip = d3.select('#tooltip');

// ---------- zoom ----------
let _rafPending = false;
const zoom = d3.zoom().scaleExtent([1, 80]).translateExtent([[0, 0], [W, H]]).on('zoom', (ev) => {
  transform = ev.transform;
  gBasemap.attr('transform', transform);   // strokes use non-scaling-stroke (stay crisp at any zoom)
  gGrat.attr('transform', transform);
  gBorders.attr('transform', transform);
  gTrail.attr('transform', transform);
  if (!_rafPending) { _rafPending = true; requestAnimationFrame(() => { _rafPending = false; redraw(); }); }  // coalesce redraws to 1/frame
});
svg.call(zoom);

// ---------- helpers ----------
function projPt(d) { const p = projection([d.coord[1], d.coord[0]]); return p; }        // [lon,lat] -> base xy
function screenXY(d) { const p = projPt(d); return [transform.applyX(p[0]), transform.applyY(p[1])]; }
function pinR(d) { return 3.4 + (d.k - 2) * 1.4; }                                        // k2..k5 -> 3.4..7.6 (base)
function pinZoom() { return Math.min(2.4, 1 + (transform.k - 1) * 0.07); }                // grow with zoom, capped
function traditionOf(d) { return d.tradition || 'other'; }
function activeYearOK(d) {
  if (!yearMode) return true;
  const b = d.birth_year, dd = d.death_year;
  if (b == null) return false;
  const end = (dd == null) ? b + 80 : dd;
  return b <= curYear && curYear <= end;
}
function visibleData() {
  return DATA.filter(d => d.coord && activeTraditions.has(traditionOf(d)) && activeYearOK(d));
}
function yr(y) { return y == null ? '?' : (y < 0 ? (-y) + ' BCE' : '' + y); }

// greedy screen-space clustering
function clusterPoints(pts) {
  const used = new Array(pts.length).fill(false), out = [];
  for (let i = 0; i < pts.length; i++) {
    if (used[i]) continue;
    const grp = [pts[i]]; used[i] = true;
    for (let j = i + 1; j < pts.length; j++) {
      if (used[j]) continue;
      if (Math.hypot(pts[i]._sx - pts[j]._sx, pts[i]._sy - pts[j]._sy) < CLUSTER_R) { grp.push(pts[j]); used[j] = true; }
    }
    let cx = 0, cy = 0; grp.forEach(g => { cx += g._sx; cy += g._sy; });
    out.push({ members: grp, cx: cx / grp.length, cy: cy / grp.length });
  }
  return out;
}
function dominantTradition(members) {
  const c = {}; members.forEach(m => { const t = traditionOf(m); c[t] = (c[t] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
}

// ---------- render ----------
function redraw() {
  const pts = visibleData();
  pts.forEach(d => { const s = screenXY(d); d._sx = s[0]; d._sy = s[1]; });

  // spider persists across zoom: re-anchor its fan from members' current screen centroid
  let spiderMembers = [];
  if (spiderCluster) {
    const mem = spiderCluster.members.filter(m => activeTraditions.has(traditionOf(m)) && activeYearOK(m));
    if (mem.length < 2) { spiderCluster = null; }
    else {
      mem.forEach(m => { const s = screenXY(m); m._sx = s[0]; m._sy = s[1]; });
      let cx = 0, cy = 0; mem.forEach(m => { cx += m._sx; cy += m._sy; }); cx /= mem.length; cy /= mem.length;
      const n = mem.length, R = 20 + n * 3.4;
      mem.forEach((m, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2; m._fx = cx + R * Math.cos(a); m._fy = cy + R * Math.sin(a); });
      spiderCluster.cx = cx; spiderCluster.cy = cy; spiderCluster.members = mem;
      spiderMembers = mem;
    }
  }
  const selId = selected ? selected.qid : null;
  const excludeIds = new Set(spiderMembers.map(m => m.qid));
  if (selId) excludeIds.add(selId);
  const clusters = clusterPoints(pts.filter(d => !excludeIds.has(d.qid)));

  // ----- clusters (count > 1) -----
  const cl = clusters.filter(c => c.members.length > 1);
  const gC = gOverlay.selectAll('g.cl').data(cl, (c) => c.members.map(m => m.qid).sort().join());
  gC.exit().remove();
  const gCe = gC.enter().append('g').attr('class', 'cl').style('cursor', 'pointer')
    .on('mouseenter', (e, c) => showClusterTip(e, c))
    .on('mousemove', moveTip)
    .on('mouseleave', hideTip)
    .on('click', (e, c) => onClusterClick(e, c));
  gCe.append('circle').attr('class', 'ch');
  gCe.append('text').attr('class', 'ct');
  const gCm = gCe.merge(gC).attr('transform', c => `translate(${c.cx},${c.cy})`).attr('opacity', (selId && focusMode) ? 0.16 : 1);
  gCm.select('circle.ch')
    .attr('r', c => 9 + Math.min(14, Math.sqrt(c.members.length) * 2.4))
    .attr('fill', c => TRAD_COLOR[dominantTradition(c.members)])
    .attr('fill-opacity', 0.82);
  gCm.select('text.ct').attr('dy', '0.35em').text(c => c.members.length);

  // ----- singletons + spiderfied members + highlighted selected -----
  let singles = [];
  clusters.forEach(c => { if (c.members.length === 1) singles.push({ d: c.members[0], x: c.cx, y: c.cy }); });
  spiderMembers.forEach(m => singles.push({ d: m, x: m._fx, y: m._fy, sp: true }));
  if (selId) { const sd = pts.find(d => d.qid === selId); if (sd) singles.push({ d: sd, x: sd._sx, y: sd._sy, selHi: true }); }
  const pin = gOverlay.selectAll('g.pin').data(singles, (s) => s.d.qid);
  pin.exit().remove();
  const pe = pin.enter().append('g').attr('class', 'pin').style('cursor', 'pointer')
    .on('mouseenter', (e, s) => showPinTip(e, s.d))
    .on('mousemove', moveTip)
    .on('mouseleave', hideTip)
    .on('click', (e, s) => { e.stopPropagation(); selectPerson(s.d); });
  pe.append('circle').attr('class', 'pc');
  const pm = pe.merge(pin).attr('transform', s => `translate(${s.x},${s.y})`);
  const pz = pinZoom();
  pm.select('circle.pc')
    .attr('r', s => pinR(s.d) * pz * (s.selHi ? 1.7 : 1))
    .attr('fill', s => TRAD_COLOR[traditionOf(s.d)])
    .attr('stroke', s => s.selHi ? '#2a1a08' : 'rgba(50,35,15,.55)')
    .attr('stroke-width', s => s.selHi ? 2.6 : 0.7)
    .attr('stroke-dasharray', s => (s.d.review && !s.selHi) ? '1.5,1.2' : null)   // k==2 provisional = dashed
    .attr('opacity', s => (selId && !s.selHi && focusMode) ? 0.13 : 1)            // focus: dim others when one is selected
    .attr('filter', 'url(#pinsh)');

  // spider legs
  const legs = gOverlay.selectAll('line.leg').data(spiderMembers, m => m.qid);
  legs.exit().remove();
  legs.enter().append('line').attr('class', 'leg').merge(legs)
    .attr('x1', spiderCluster ? spiderCluster.cx : 0).attr('y1', spiderCluster ? spiderCluster.cy : 0)
    .attr('x2', m => m._fx).attr('y2', m => m._fy);
  gOverlay.selectAll('line.leg').lower();

  drawTrail();
}

// ---------- trail (selected person's active_regions) ----------
function drawTrail() {
  gTrail.selectAll('*').remove();
  if (!selected || !selectedFull) return;
  const regs = (selectedFull.active_regions || []).filter(r => r.lat != null);
  if (regs.length < 1) return;
  const order = { birth: 0, work: 1, residence: 2, death: 3 };
  const sorted = regs.slice().sort((a, b) => (order[a.anchor] ?? 9) - (order[b.anchor] ?? 9));
  // curved journey arcs between consecutive points (reads as travel, not a straight slash)
  for (let i = 0; i + 1 < sorted.length; i++) {
    const a = projection([sorted[i].lon, sorted[i].lat]), b = projection([sorted[i + 1].lon, sorted[i + 1].lat]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const off = Math.min(70, len * 0.2), cx = mx + (-dy / len) * off, cy = my + (dx / len) * off;
    gTrail.append('path').attr('class', 'trailline')
      .attr('d', `M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`)
      .attr('stroke-width', 1.3 / transform.k).attr('stroke-dasharray', `${4 / transform.k},${3 / transform.k}`);
  }
  gTrail.selectAll('circle.reg').data(regs).enter().append('circle').attr('class', 'reg')
    .attr('cx', r => projection([r.lon, r.lat])[0]).attr('cy', r => projection([r.lon, r.lat])[1])
    .attr('r', r => (r.primary ? 4.5 : 3) / transform.k)
    .attr('fill', r => r.primary ? TRAD_COLOR[traditionOf(selected)] : '#fff')
    .attr('stroke', '#2a1a08').attr('stroke-width', 1 / transform.k);
}

// ---------- tooltips ----------
function showPinTip(e, d) {
  const other = lang === 'en' ? (d.name_zh || '') : (d.name_en || '');
  tooltip.style('display', 'block').html(`<b>${nameOf(d)}</b> <span class="tsub">${other}</span><br><span class="tsub">${yr(d.birth_year)}–${yr(d.death_year)} · ${tradLabel(traditionOf(d))} · k=${d.k}</span>`); moveTip(e);
}
function showClusterTip(e, c) {
  const sep = lang === 'en' ? ', ' : '、';
  const names = c.members.slice(0, 6).map(m => nameOf(m)).join(sep);
  const more = c.members.length > 6 ? ` …+${c.members.length - 6}` : '';
  tooltip.style('display', 'block').html(`<b>${t('dominant', c.members.length, tradLabel(dominantTradition(c.members)))}</b><br><span class="tsub">${names}${more}</span>`); moveTip(e);
}
function moveTip(e) { tooltip.style('left', (e.clientX + 14) + 'px').style('top', (e.clientY + 12) + 'px'); }
function hideTip() { tooltip.style('display', 'none'); }

// ---------- cluster click: small -> spiderfy (fan out, works at any zoom); large -> zoom to fit ----------
function spiderfy(c) {
  const n = c.members.length, R = 20 + n * 3.4;
  c.members.forEach((m, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2; m._fx = c.cx + R * Math.cos(a); m._fy = c.cy + R * Math.sin(a); });
  spiderCluster = { cx: c.cx, cy: c.cy, members: c.members, _spider: true };
  redraw();
}
function onClusterClick(e, c) {
  e.stopPropagation();
  spiderCluster = null;
  if (c.members.length <= 12) { spiderfy(c); return; }
  // large cluster: zoom to fit its geographic bbox so it breaks into smaller groups
  const xs = c.members.map(m => projPt(m)[0]), ys = c.members.map(m => projPt(m)[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cxb = (x0 + x1) / 2, cyb = (y0 + y1) / 2;
  const k = Math.max(transform.k * 1.7, Math.min(70, 0.7 * Math.min(W / Math.max(x1 - x0, 8), H / Math.max(y1 - y0, 8))));
  const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-cxb, -cyb);
  svg.transition().duration(650).call(zoom.transform, t);
}

// ---------- selection + panel ----------
async function fetchJSON(paths) {
  for (const p of (Array.isArray(paths) ? paths : [paths])) {
    try { const r = await fetch(p); if (r.ok) return await r.json(); } catch (e) { /* try next */ }
  }
  throw new Error('not found: ' + [].concat(paths).join(', '));
}
async function selectPerson(d) {
  selected = d; selectedFull = null; spiderCluster = null;   // collapse spider; highlight this one
  document.getElementById('panel').classList.add('open');    // mobile: slide up the bottom sheet
  renderPanelLoading(d);
  redraw();                                                  // immediate: pull out + highlight selected, dim rest
  try {
    selectedFull = await fetchJSON([`./data/philosophers/${d.qid}.json`, `../data/philosophers/${d.qid}.json`]);
  } catch (err) { selectedFull = null; }
  renderPanel(d, selectedFull);
  redraw();                                                  // draw the career trail
}

function membershipRow(ms) {
  return (ms || []).map(m => `<span class="vote" title="${m.entry_type} · ${m.weight}">${srcLabel(m.source_id)}</span>`).join('');
}
function polityAtYear(regs, y) {
  const prim = (regs || []).find(r => r.primary) || (regs || [])[0];
  if (!prim || !prim.polity_sequence || !prim.polity_sequence.length) return null;
  const seq = prim.polity_sequence;
  let hit = null;
  for (const s of seq) { const st = s.start ?? -99999, en = s.end ?? 99999; if (y >= st && y < en) { hit = s; break; } }
  if (!hit) { const last = seq[seq.length - 1]; if ((last.end == null) && y >= (last.start ?? -99999)) hit = last; }
  return hit ? { seg: hit, source: prim.polity_source, place: prim.place } : { seg: null, source: prim.polity_source, place: prim.place };
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function renderPanelLoading(d) { document.getElementById('panel').innerHTML = `<div class="pname">${nameOf(d)}</div><div class="ploading">${t('loading')}</div>`; }
function renderPanel(d, full) {
  const el = document.getElementById('panel');
  const trad = traditionOf(d);
  const y = yearMode ? curYear : (d.death_year ?? d.birth_year ?? 0);
  let works = '', regs = '', polity = '', bio = '', descLine = '';
  if (full) {
    const desc = descOf(full);
    if (desc) descLine = `<div class="pdesc">${esc(desc)}</div>`;
    const biotext = bioOf(full);
    if (biotext) bio = `<div class="psec bio"><div class="ph">${t('bio_h')} <span class="dim">${t('wiki_credit')}</span></div><div class="biotext">${esc(biotext)}</div></div>`;
    const ws = (full.works || []).slice(0, 12).map(w => `<li>${lang === 'en' ? (w.title || w.title_zh) : (w.title_zh || w.title)}${w.year != null ? ` <span class="dim">(${yr(w.year)})</span>` : ''}</li>`).join('');
    works = (full.works && full.works.length) ? `<div class="psec"><div class="ph">${t('works_h')} <span class="dim">P800 · ${full.works.length}</span></div><ul class="pworks">${ws}</ul></div>` : '';
    regs = `<div class="psec"><div class="ph">${t('places_h')} <span class="dim">${full.active_regions.length}</span></div><ul class="pregs">` +
      full.active_regions.map(r => `<li><span class="rk rk-${r.anchor}">${(ANCHOR_LABEL[r.anchor] && ANCHOR_LABEL[r.anchor][lang]) || r.anchor}</span> ${r.place || '—'}${r.period && r.period[0] != null ? ` <span class="dim">${yr(r.period[0])}${r.period[1] != null && r.period[1] !== r.period[0] ? '–' + yr(r.period[1]) : ''}</span>` : ''}</li>`).join('') + '</ul></div>';
    const pol = polityAtYear(full.active_regions, y);
    if (pol && pol.seg) {
      const approx = pol.source === 'historical-basemaps';
      polity = `<div class="psec polity ${approx ? 'approx' : ''}"><div class="ph">${t('polity_at', yr(y))} ${approx ? '<span class="dim" title="historical-basemaps">~</span>' : ''}</div><div class="polv">${pol.seg.polity}</div><div class="dim">${pol.place || ''} · ${approx ? t('polity_approx') : t('polity_curated')}</div></div>`;
    } else if (pol) {
      polity = `<div class="psec polity"><div class="ph">${t('polity_seq')}</div><div class="dim">${t('polity_blank', pol.place || '')}</div></div>`;
    }
  }
  const other = lang === 'en' ? (d.name_zh || '') : (d.name_en || '');
  el.innerHTML = `
    <div class="phead" style="border-color:${TRAD_COLOR[trad]}">
      <div class="pname">${nameOf(d)}</div>
      <div class="pen">${other}</div>
      ${descLine}
      <div class="pmeta">${yr(d.birth_year)} – ${yr(d.death_year)} <span class="dim">· ${d.date_certainty || ''}</span></div>
      <div class="ptags"><span class="ttag" style="background:${TRAD_COLOR[trad]}">${tradLabel(trad)}</span>
        <span class="ktag" title="k">k=${d.k}${d.review ? ` <span class="prov">${t('provisional')}</span>` : ''}</span></div>
    </div>
    ${bio}
    <div class="psec"><div class="ph">${t('sources')} <span class="dim">${t('sources_hint')}</span></div><div class="votes">${full ? membershipRow(full.membership_sources) : '…'}</div></div>
    ${polity}${regs}${works}
    <div class="pfoot"><a href="https://www.wikidata.org/wiki/${d.qid}" target="_blank" rel="noopener">${d.qid} ↗</a>${d.sitelinks != null ? ` · <span class="dim">${d.sitelinks} sitelinks</span>` : ''}</div>`;
}

// ---------- legend / filter / bias-honesty ----------
function buildLegend() {
  const counts = {}; DATA.forEach(d => { const k = traditionOf(d); counts[k] = (counts[k] || 0) + 1; });
  const used = TRAD_ORDER.filter(k => counts[k]);
  const el = document.getElementById('legend');
  const eu = counts.european || 0, pct = Math.round(eu / DATA.length * 100);
  el.innerHTML = `<div class="lh">${t('legend_title')}<span class="dim">${t('legend_hint')}</span></div>` +
    used.map(tr => `<div class="li${activeTraditions.has(tr) ? '' : ' off'}" data-t="${tr}"><span class="sw" style="background:${TRAD_COLOR[tr]}"></span><span class="ln">${tradLabel(tr)}</span><span class="lc">${counts[tr]}</span></div>`).join('') +
    `<label class="lfocus"><input type="checkbox" id="focustoggle" ${focusMode ? 'checked' : ''}> ${t('focus_label')}</label>` +
    `<div class="lbias">${t('bias', DATA.length, eu, pct)}</div>`;
  el.querySelectorAll('.li').forEach(li => li.addEventListener('click', () => {
    const tr = li.dataset.t;
    if (activeTraditions.has(tr)) { activeTraditions.delete(tr); li.classList.add('off'); }
    else { activeTraditions.add(tr); li.classList.remove('off'); }
    redraw();
  }));
  const ft = document.getElementById('focustoggle');
  if (ft) ft.addEventListener('change', () => { focusMode = ft.checked; redraw(); });
  const lh = el.querySelector('.lh');
  if (lh) lh.addEventListener('click', () => el.classList.toggle('collapsed'));
  if (window.innerWidth <= 760) el.classList.add('collapsed');   // start collapsed on phones
}

// ---------- time-synced historical borders ----------
const SNAPS = [100,200,300,400,500,600,700,800,900,1000,1100,1200,1279,1300,1400,1492,1500,1530,1600,1650,1700,1715,1783,1800,1815,1880,1900,1914,1920,1930,1938,1945,1960,1994,2000,2010];
function snapFor(y) { let s = null; for (const v of SNAPS) { if (v <= y) s = v; else break; } return s; }
let curSnap = null; const snapCache = {};
async function updateBorders() {
  if (!yearMode) { gBorders.selectAll('*').remove(); curSnap = null; return; }
  const snap = snapFor(curYear);
  if (snap === curSnap) return;
  curSnap = snap;
  if (snap == null) { gBorders.selectAll('*').remove(); return; }   // pre-100 CE: not covered (留白)
  let gj = snapCache[snap];
  if (!gj) {
    try { gj = await fetchJSON([`./basemap/history/world_${snap}.geojson`, `basemap/history/world_${snap}.geojson`]); snapCache[snap] = gj; }
    catch (e) { return; }
  }
  if (curSnap !== snap) return;   // year moved past this snapshot during fetch
  gBorders.selectAll('path').data([gj]).join('path').attr('class', 'border').attr('d', path);
}

// ---------- scrubber ----------
function buildScrubber() {
  const minY = d3.min(DATA, d => d.birth_year), maxY = d3.max(DATA, d => d.death_year ?? d.birth_year);
  const sl = document.getElementById('year'); sl.min = minY; sl.max = maxY;
  curYear = maxY; sl.value = maxY;   // default handle at far right (present); 全部時代 still on
  const lab = document.getElementById('yearlab');
  const chk = document.getElementById('allyears');
  function upd() { lab.textContent = yearMode ? t('year_word', yr(+sl.value)) : t('all_eras'); }
  sl.addEventListener('input', () => { curYear = +sl.value; if (!yearMode) { yearMode = true; chk.checked = false; } upd(); if (selected) renderPanel(selected, selectedFull); redraw(); updateBorders(); });
  chk.addEventListener('change', () => { yearMode = !chk.checked; upd(); if (selected) renderPanel(selected, selectedFull); redraw(); updateBorders(); });
  scrubUpd = upd;
  upd();
}
let scrubUpd = null;

// ---------- search ----------
function buildSearch() {
  const inp = document.getElementById('search'), box = document.getElementById('sresults');
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    if (!q) { box.style.display = 'none'; return; }
    const hits = DATA.filter(d => (d.name_zh && d.name_zh.includes(q)) || (d.name_en && d.name_en.toLowerCase().includes(q))).slice(0, 8);
    box.style.display = hits.length ? 'block' : 'none';
    box.innerHTML = hits.map(h => `<div class="sr" data-q="${h.qid}">${nameOf(h)} <span class="dim">${lang === 'en' ? (h.name_zh || '') : h.name_en}</span></div>`).join('');
    box.querySelectorAll('.sr').forEach(sr => sr.addEventListener('click', () => {
      const d = DATA.find(x => x.qid === sr.dataset.q); box.style.display = 'none'; inp.value = nameOf(d);
      flyTo(d); selectPerson(d);
    }));
  });
}
function flyTo(d) {
  const p = projPt(d), k = 4;
  const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-p[0], -p[1]);
  svg.transition().duration(700).call(zoom.transform, t);
}

// ---------- boot ----------
let landFeature = null, _rivers = null, _lakes = null;
const PARALLELS = { type: 'MultiLineString', coordinates: [0, 23.44, -23.44, 66.56, -66.56].map(lat => { const l = []; for (let lon = -180; lon <= 180; lon += 4) l.push([lon, lat]); return l; }) };
function drawBasemap(topo, rivers, lakes) {
  landFeature = topojson.feature(topo, topo.objects.land);
  _rivers = rivers; _lakes = lakes;
  const landD = path(landFeature);
  gGrat.append('path').attr('class', 'grat').attr('d', path(graticule));
  gGrat.append('path').attr('class', 'refpar').attr('d', path(PARALLELS));
  gBasemap.append('path').attr('class', 'land').attr('d', landD);
  if (lakes) gBasemap.append('path').attr('class', 'lake').attr('d', path(lakes));
  if (rivers) gBasemap.append('path').attr('class', 'river').attr('d', path(rivers));   // pre-clipped offline; no runtime clip (perf)
}
function resizeBasemap() {
  if (!landFeature) return;
  const landD = path(landFeature);
  gBasemap.select('.land').attr('d', landD);
  gGrat.select('.grat').attr('d', path(graticule));
  gGrat.select('.refpar').attr('d', path(PARALLELS));
  if (_lakes) gBasemap.select('.lake').attr('d', path(_lakes));
  if (_rivers) gBasemap.select('.river').attr('d', path(_rivers));
}
function fitToPoints() {
  if (!DATA.length) return;
  const xs = DATA.map(d => projPt(d)[0]), ys = DATA.map(d => projPt(d)[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = 44;
  const k = Math.max(1, Math.min(6, Math.min(W / ((x1 - x0) + pad * 2), H / ((y1 - y0) + pad * 2))));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  svg.call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-cx, -cy));
}
async function boot() {
  console.log('[atlas] boot start');
  const [atlas, topo, rivers, lakes] = await Promise.all([
    fetchJSON(['./data/atlas_index.json', '../data/atlas_index.json']),
    fetchJSON(['./basemap/countries-110m.json', 'basemap/countries-110m.json', './basemap/countries-50m.json']),
    fetchJSON(['./basemap/rivers-clipped.json', 'basemap/rivers-clipped.json', './basemap/rivers-110m.json']).catch(() => null),
    fetchJSON(['./basemap/lakes-110m.json', 'basemap/lakes-110m.json']).catch(() => null)
  ]);
  console.log('[atlas] data loaded:', atlas.length, 'philosophers');
  DATA = atlas.filter(d => d.coord && d.coord.length === 2);
  drawBasemap(topo, rivers, lakes);
  buildLegend(); buildScrubber(); buildSearch();
  applyLang();   // set placeholder / html lang / toggle label from persisted `lang`
  fitToPoints();   // default viewport = where the points actually are (crops empty poles)
  redraw();
  document.getElementById('loading').style.display = 'none';
  console.log('[atlas] boot done, rendered');
}

// ---------- language ----------
function applyLang() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  document.body.classList.toggle('en', lang === 'en');
  const inp = document.getElementById('search'); if (inp) inp.placeholder = t('search_ph');
  const lb = document.getElementById('langbtn'); if (lb) lb.textContent = lang === 'en' ? '中' : 'EN';
  const load = document.getElementById('loading'); if (load && load.style.display !== 'none') load.textContent = t('loading');
  const p = document.getElementById('panel'); if (p && !selected) p.innerHTML = emptyPanelHTML();
}
function switchLang() {
  lang = lang === 'en' ? 'zh' : 'en';
  try { localStorage.setItem('lang', lang); } catch (e) {}
  applyLang();
  buildLegend();
  if (scrubUpd) scrubUpd();
  const p = document.getElementById('panel');
  if (selected) renderPanel(selected, selectedFull);
  else if (p) p.innerHTML = emptyPanelHTML();
  redraw();   // tooltips/labels pick up new lang on next hover
}
(function () {
  const lb = document.getElementById('langbtn');
  if (lb) lb.addEventListener('click', switchLang);
})();
svg.on('click', () => {   // click/tap empty map = collapse spider + deselect (also dismisses mobile sheet)
  spiderCluster = null;
  if (selected) {
    selected = null; selectedFull = null;
    const p = document.getElementById('panel');
    p.classList.remove('open');
    p.innerHTML = emptyPanelHTML();
  }
  redraw();
});
window.addEventListener('resize', () => {
  W = mapEl.clientWidth; H = mapEl.clientHeight;
  svg.attr('width', W).attr('height', H);
  projection.fitSize([W, H], { type: 'Sphere' });
  zoom.translateExtent([[0, 0], [W, H]]);
  resizeBasemap();
  curSnap = null; updateBorders();   // re-project current-year borders too
  redraw();
});
boot().catch(e => { document.getElementById('loading').textContent = (lang === 'en' ? 'Load failed: ' : '載入失敗：') + e.message; });
