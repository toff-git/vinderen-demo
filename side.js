/* Vinderen Hudpleie, demo v2: felles skript for alle sidene.
   Topp, meny og kurv settes inn her; bunnen står i hver side. Kurven huskes mellom sidene (localStorage, i try/catch).
   <body data-rot="../" data-side="produkt"> gir relative stier som virker fra undermapper, også på GitHub Pages. */
(() => {
  'use strict';
  const rot = document.body.dataset.rot || '';
  const sideNavn = document.body.dataset.side || 'forside';
  const BOOK = 'https://vinderen.onlinebooq.net/';
  const redusert = matchMedia('(prefers-reduced-motion: reduce)');
  const kr = n => Math.round(n).toLocaleString('nb-NO').replace(/\s/g, ' ') + ' kr';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const lenke = {
    forside: rot || './', hudpleie: rot + 'hudpleie/', merker: rot + 'merker/', behandlinger: rot + 'behandlinger/',
    rutine: rot + 'rutine/', produkt: id => rot + 'produkt/?p=' + encodeURIComponent(id),
    merke: m => rot + 'hudpleie/?merke=' + encodeURIComponent(m), kategori: k => rot + 'hudpleie/?kategori=' + encodeURIComponent(k)
  };

  /* ---------- Behandlinger: navn, tid, pris og behandler fra Onlinebooq (11. nov 2026).
     Hjemmeprogrammene er EKSEMPLER med ekte produkter; behandleren setter opp det enkelte programmet. ---------- */
  const BEH = [
    {id:'hudstart', navn:'Vinderen Hudstart', tid:'1 time', pris:'2 500 kr', hvem:'Klinikken', bilde:'hud',
      tekst:'Hudanalyse med Aura 3D Imaging System, en behandling og et forslag til hjemmeprogram. Stedet å begynne hvis du er ny hos oss.', hjemme:['926569','35967']},
    {id:'hudpleie', navn:'Tilpasset hudpleie', tid:'45 min', pris:'fra 1 700 kr', hvem:'Emilie', bilde:'handklaer',
      tekst:'Behandlingen settes sammen etter huden din den dagen.', hjemme:['836853','1215165']},
    {id:'peeling', navn:'Tilpasset peeling', tid:'', pris:'fra 1 550 kr', hvem:'Klinikken', bilde:'olje',
      tekst:'Peeling med ZO, NOON, Innoaesthetics, Me Line, Skinbetter, Face Formula, BioRePeel eller PRX-T33, valgt etter huden din.', hjemme:['49410','35967']},
    {id:'dermapen', navn:'DermaPen 4', tid:'', pris:'1 950 kr', hvem:'Sertifisert DermaPen-spesialist', bilde:'hud',
      tekst:'Microneedling med DermaPen 4.', hjemme:['35956','35967']},
    {id:'hydrafacial', navn:'HydraFacial', tid:'', pris:'2 450 kr', hvem:'Klinikken', bilde:'handklaer',
      tekst:'Rens, eksfoliering og fukt i én behandling.', hjemme:['1097268']},
    {id:'hudanalyse', navn:'Hudanalyse med Tomm', tid:'30 min', pris:'1 550 kr', hvem:'Tomm', bilde:'olje',
      tekst:'En grundig gjennomgang av huden din og hva den trenger.'},
    {id:'veiledning', navn:'Produktveiledning', tid:'15 min', pris:'550 kr', hvem:'Emilie',
      tekst:'Hjelp til å velge riktige produkter og bruke dem i riktig rekkefølge.'},
    {id:'skinbooster', navn:'Skinbooster', tid:'', pris:'3 950 kr', hvem:'Tomm',
      tekst:'Injeksjon. Oppfølgende behandling 2 950 kr.'},
    {id:'muskeldempende', navn:'Muskeldempende behandling', tid:'', pris:'3 250 kr', hvem:'Dr. Anne, lege',
      tekst:'Rynkebehandling utført av lege.'},
    {id:'ungdom', navn:'Hudpleie for ungdom', tid:'', pris:'750 til 950 kr', hvem:'Klinikken',
      tekst:'For 14 til 25 år.', hjemme:['35952','1215165']},
    {id:'vipper', navn:'Vipper og bryn', tid:'', pris:'500 til 850 kr', hvem:'Klinikken', tekst:'Farging og forming.'}
  ];
  /* EKSEMPEL: én kundes rutine. Solkremen er trinnet som mangler. */
  const RUTINE = {
    morgen:[{verb:'Rens', id:'926569'},{verb:'Behandle', id:'35954'},{verb:'Beskytt', id:'35967', mangler:true}],
    kveld:[{verb:'Rens', id:'926569'},{verb:'Balanser', id:'49410'},{verb:'Reparer', id:'35956'}]
  };
  const TRINN = {
    rens:'Rens. Første trinn, morgen og kveld.', balanser:'Balanser. Etter rens, før serum.', behandle:'Behandle. Serum eller pad etter rens.',
    fukt:'Fukt. Etter serum, før solkrem om morgenen.', reparer:'Reparer. Siste trinn om kvelden.', beskytt:'Beskytt. Siste trinn om morgenen.'
  };
  const KAT = [['ansikt','Ansikt'],['solkrem','Solkrem'],['kropp','Kropp'],['hår','Hår'],['duft','Duft']];

  /* ---------- Produkter fra produkter.json ---------- */
  let P = [], PI = new Map();
  const lastet = fetch(rot + 'produkter.json').then(r => r.json()).then(d => { P = d.produkter; P.forEach(p => PI.set(p.id, p)); return P; })
    .catch(() => { P = []; return P; });
  const bilde = p => rot + p.bilde;

  /* ---------- Topp, meny og kurv settes inn ---------- */
  const aktiv = s => s === sideNavn ? ' aria-current="page"' : '';
  const menyPunkter = [['behandlinger','Behandlinger'],['hudpleie','Hudpleie'],['merker','Merker'],['rutine','Din rutine']];
  const toppHTML = `
<a class="hopp" href="#innhold">Hopp til innholdet</a>
<header class="topp" id="topp">
  <div class="topp-indre">
    <div>
      <button class="menyknapp" type="button" aria-controls="meny" aria-expanded="false" id="menyknapp"><span></span><b class="skjult">Meny</b></button>
      <nav aria-label="Hovedmeny"><ul>${menyPunkter.map(([s,t]) => `<li><a href="${lenke[s]}"${aktiv(s)}>${t}</a></li>`).join('')}</ul></nav>
    </div>
    <a class="logo-lenke" href="${lenke.forside}" aria-label="Vinderen Hudpleie, til forsiden"><span class="logo" aria-hidden="true"></span></a>
    <div class="verktoy">
      <a class="kontakt" href="${lenke.forside}#besok">Besøk oss</a>
      <a class="bestill" href="${BOOK}" target="_blank" rel="noopener">Bestill time</a>
      <button type="button" class="kurvknapp" aria-controls="kurv" aria-expanded="false">Kurv (<span class="antall">0</span>)</button>
    </div>
  </div>
</header>
<div class="meny" id="meny" aria-hidden="true">
  <div class="meny-slor" data-lukk></div>
  <div class="meny-flate" role="dialog" aria-modal="true" aria-label="Meny">
    <button class="meny-lukk" type="button" data-lukk>Lukk</button>
    <ul>
      <li><a href="${lenke.forside}"${aktiv('forside')}>Forsiden</a></li>
      ${menyPunkter.map(([s,t]) => `<li><a href="${lenke[s]}"${aktiv(s)}>${t}</a></li>`).join('')}
      <li><a href="${lenke.forside}#folk" data-lukk>Om oss</a></li>
      <li><a href="${lenke.forside}#besok" data-lukk>Besøk oss</a></li>
    </ul>
    <a class="knapp knapp-kull" href="${BOOK}" target="_blank" rel="noopener">Bestill time</a>
  </div>
</div>`;
  const kurvHTML = `
<div class="bunnlinje">
  <a class="knapp knapp-gull" href="${BOOK}" target="_blank" rel="noopener">Bestill time</a>
  <button class="knapp knapp-kull kurvknapp" type="button" aria-controls="kurv" aria-expanded="false">Kurv (<span class="antall">0</span>)</button>
</div>
<div class="kurv" id="kurv" aria-hidden="true">
  <div class="meny-slor" data-lukk></div>
  <div class="kurv-flate" role="dialog" aria-modal="true" aria-labelledby="kurv-h">
    <div class="kurv-hode"><h2 id="kurv-h">Kurven</h2><button class="meny-lukk" type="button" data-lukk>Lukk</button></div>
    <ul id="kurvliste"><li class="tom">Kurven er tom.</li></ul>
    <div id="fullfor"></div>
    <div class="sum"><span>Sum</span><span id="kurvsum">0 kr</span></div>
    <p class="bonus">Kjøp i butikken og på nett teller på Vinderen™ Bonuskunde.</p>
    <button class="knapp knapp-kull" type="button" disabled title="Kassen kobles til i Shopify">Til kassen</button>
  </div>
</div>
<p class="skjult" aria-live="polite" id="melding"></p>`;
  document.body.insertAdjacentHTML('afterbegin', toppHTML);
  document.body.insertAdjacentHTML('beforeend', kurvHTML);
  if (sideNavn !== 'forside') document.body.classList.add('underside');

  /* ---------- Kurven: [{id, n}] i localStorage ---------- */
  const NOKKEL = 'vinderen-demo-kurv';
  let kurv = [];
  try { kurv = JSON.parse(localStorage.getItem(NOKKEL) || '[]'); if (!Array.isArray(kurv)) kurv = []; } catch (e) { kurv = []; }
  const lagre = () => { try { localStorage.setItem(NOKKEL, JSON.stringify(kurv)); } catch (e) { /* privat vindu: kurven gjelder bare denne siden */ } };
  const antallIKurv = () => kurv.reduce((s, x) => s + x.n, 0);
  const iKurv = id => kurv.some(x => x.id === id);
  const melding = document.getElementById('melding');

  function fullforForslag(){
    // Når to av tre trinn i en rutine ligger i kurven, foreslå det tredje (ekte produkt og pris, ingen rabatt).
    for (const [tid, trinn] of Object.entries(RUTINE)){
      const ids = [...new Set(trinn.map(t => t.id))];
      const har = ids.filter(iKurv), mangler = trinn.filter(t => !iKurv(t.id));
      if (har.length >= 2 && mangler.length === 1 && PI.get(mangler[0].id)) return {tid, t:mangler[0], nr: trinn.indexOf(mangler[0]) + 1};
    }
    return null;
  }
  function tegnKurv(){
    document.querySelectorAll('.antall').forEach(el => el.textContent = antallIKurv());
    const liste = document.getElementById('kurvliste'), ff = document.getElementById('fullfor');
    if (!P.length){ return; }
    kurv = kurv.filter(x => PI.has(x.id));
    liste.innerHTML = kurv.length ? kurv.map(x => { const p = PI.get(x.id); return `
      <li class="vare">
        <img src="${bilde(p)}" alt="" width="56" height="56" loading="lazy">
        <div class="vnavn"><small>${esc(p.merke)}</small><a href="${lenke.produkt(p.id)}">${esc(p.navn)}</a>, ${esc(p.str)}
          <div class="mengde"><button type="button" data-minus="${p.id}" aria-label="Én færre ${esc(p.navn)}">&minus;</button><span aria-label="Antall">${x.n}</span><button type="button" data-pluss="${p.id}" aria-label="Én til ${esc(p.navn)}">+</button><button type="button" class="fjern" data-fjern="${p.id}">Fjern</button></div>
        </div>
        <span>${kr(p.pris * x.n)}</span>
      </li>`; }).join('') : '<li class="tom">Kurven er tom.</li>';
    document.getElementById('kurvsum').textContent = kr(kurv.reduce((s, x) => s + PI.get(x.id).pris * x.n, 0));
    const f = fullforForslag();
    ff.innerHTML = f ? (() => { const p = PI.get(f.t.id); return `<div class="fullfor">
      <h3>Fullfør rutinen</h3>
      <p>Du har det meste av ${f.tid}rutinen i kurven. Trinn ${f.nr}, ${esc(f.t.verb.toLowerCase())}, mangler.</p>
      <div class="forslag"><img src="${bilde(p)}" alt="" width="48" height="48"><span>${esc(p.merke)} ${esc(p.navn)}, ${esc(p.str)}<br>${kr(p.pris)}</span></div>
      <button class="knapp knapp-gull" type="button" data-legg="${p.id}">Legg til ${esc(f.t.verb.toLowerCase())}</button></div>`; })() : '';
  }
  function leggTil(ids, knapp, tekst){
    ids = ids.filter(id => PI.get(id)?.lager !== false);
    if (!ids.length) return;
    ids.forEach(id => { const x = kurv.find(k => k.id === id); if (x) x.n++; else kurv.push({id, n:1}); });
    lagre(); tegnKurv();
    if (knapp){ const f = knapp.textContent; knapp.textContent = tekst || 'Lagt i kurven'; setTimeout(() => knapp.textContent = f, 1600); }
    melding.textContent = `${ids.length === 1 ? PI.get(ids[0]).navn + ' er' : ids.length + ' varer er'} lagt i kurven. ${antallIKurv()} varer i kurven.`;
  }
  document.getElementById('kurv').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.pluss || b.dataset.minus || b.dataset.fjern || b.dataset.legg; if (!id) return;
    if (b.dataset.legg){ leggTil([id], b, 'Lagt til'); return; }
    const x = kurv.find(k => k.id === id); if (!x) return;
    if (b.dataset.pluss) x.n++;
    if (b.dataset.minus) x.n--;
    if (b.dataset.fjern || x.n < 1) kurv = kurv.filter(k => k.id !== id);
    lagre(); tegnKurv();
    melding.textContent = `${antallIKurv()} varer i kurven.`;
    const fokus = document.querySelector(`#kurv [data-${b.dataset.pluss ? 'pluss' : 'minus'}="${id}"]`);
    (fokus || document.querySelector('#kurv .meny-lukk')).focus();
  });
  // Felles: alle knapper med data-kjop="id" eller data-kjop-alle="id,id"
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-kjop],[data-kjop-alle]'); if (!b || b.closest('.rad-ramme.drar')) return;
    if (b.dataset.kjop) leggTil([b.dataset.kjop], b);
    else leggTil(b.dataset.kjopAlle.split(','), b, b.dataset.tekst || 'Lagt i kurven');
  });
  addEventListener('storage', e => { if (e.key === NOKKEL){ try { kurv = JSON.parse(e.newValue || '[]'); } catch (x) {} tegnKurv(); } });
  document.querySelectorAll('.antall').forEach(el => el.textContent = antallIKurv());

  /* ---------- Paneler (meny fra venstre, kurv fra høyre; ut samme vei som inn) ---------- */
  function panel(id, knapper){
    const el = document.getElementById(id); let forrige = null;
    const sett = apen => {
      el.classList.toggle('apen', apen); el.setAttribute('aria-hidden', String(!apen));
      knapper.forEach(k => k.setAttribute('aria-expanded', String(apen)));
      document.body.style.overflow = apen ? 'hidden' : '';
      if (apen){ forrige = document.activeElement; setTimeout(() => el.querySelector('button,a').focus(), 50); }
      else if (forrige) forrige.focus();
    };
    knapper.forEach(k => k.addEventListener('click', () => sett(true)));
    el.addEventListener('click', e => { if (e.target.closest('[data-lukk]')) sett(false); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') sett(false);
      if (e.key === 'Tab'){ const f = [...el.querySelectorAll('a,button:not([disabled])')]; const a = f[0], z = f[f.length-1];
        if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } }
    });
    return sett;
  }
  panel('meny', [document.getElementById('menyknapp')]);
  const kurvPanel = panel('kurv', [...document.querySelectorAll('.kurvknapp')]);

  /* ---------- Toppen: lys når diptyken er passert (forsiden), alltid lys på undersidene ---------- */
  const topp = document.getElementById('topp');
  const forsideEl = document.querySelector('.forside');
  if (forsideEl) new IntersectionObserver(([e]) => topp.classList.toggle('fast', !e.isIntersecting), {rootMargin:'-80px 0px 0px 0px'}).observe(forsideEl);
  else topp.classList.add('fast');

  /* ---------- Inngang ved rulling ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('synlig'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px'});
  const observerInn = (r = document) => r.querySelectorAll('.inn:not(.synlig)').forEach(el => io.observe(el));

  /* ---------- Produktkort (forsiden, kolleksjonen, «mer fra merket») ---------- */
  function kortHTML(p){
    return `<li class="kort">
      <a class="kort-lenke" href="${lenke.produkt(p.id)}" draggable="false">
        <div class="kort-bilde"><img src="${bilde(p)}" alt="${esc(p.merke)} ${esc(p.navn)}" width="320" height="400" loading="lazy" draggable="false"></div>
        <p class="merke">${esc(p.merke)}</p>
        <h3>${esc(p.navn)}</h3>
      </a>
      <p class="linje">${esc(p.linje)}</p>
      <p class="pris"><span>${kr(p.pris)}</span><span>${esc(p.str)}</span></p>
      ${p.lager ? `<p class="reg">${p.reg ? 'Ny hos oss? Vi tar en kort gjennomgang før vi sender.' : ''}</p>
      <button class="knapp knapp-strek" type="button" data-kjop="${p.id}">Legg i kurv</button>`
      : `<p class="lager-ut">Ikke på lager nå. Spør oss i butikken.</p><button class="knapp knapp-strek" type="button" disabled>Utsolgt</button>`}
    </li>`;
  }
  const hjemmeListe = b => (b.hjemme || []).map(id => PI.get(id)).filter(Boolean);
  const pafyllSvar = (sel, ut) => { const u = sel.value; ut.textContent = u ? `Vi minner deg på det om ${u} uker. (Demo: ingenting lagres.)` : 'Ingen påminnelse valgt.'; };

  /* ======================================================================
     Sidene
     ====================================================================== */
  const SIDER = {};

  /* ---------- Forsiden ---------- */
  SIDER.forside = () => {
    // Din rutine (faner)
    const trinnEl = document.getElementById('trinn');
    let tid = 'morgen';
    const tegnRutine = () => {
      trinnEl.innerHTML = RUTINE[tid].map((t, i) => { const v = PI.get(t.id); return `
        <li class="${t.mangler ? 'mangler' : ''}">
          <span class="nr" aria-hidden="true">${i+1}</span>
          <p class="verb">Trinn ${i+1}: ${esc(t.verb)}</p>
          ${t.mangler ? '<p class="mangler-merke">Mangler i rutinen din</p>' : ''}
          <h3><a href="${lenke.produkt(v.id)}" style="text-decoration:none">${esc(v.navn)}</a></h3>
          <p class="info">${esc(v.merke)}, ${esc(v.str)}</p>
          <p class="pris">${kr(v.pris)}</p>
          <button class="mini" type="button" data-kjop="${v.id}">${t.mangler ? 'Fullfør rutinen' : 'Kjøp igjen'}</button>
        </li>`; }).join('');
    };
    const unike = [...new Set([...RUTINE.morgen, ...RUTINE.kveld].map(t => t.id))];
    document.getElementById('rutinesum').textContent = kr(unike.reduce((s, id) => s + PI.get(id).pris, 0));
    document.getElementById('rutineantall').textContent = `${unike.length} produkter, ordinære priser. Rensen brukes morgen og kveld og telles én gang.`;
    const kjopalle = document.getElementById('kjopalle'); kjopalle.dataset.kjopAlle = unike.join(','); kjopalle.dataset.tekst = 'Hele rutinen er i kurven';
    const faner = [...document.querySelectorAll('[role="tab"]')], strek = document.querySelector('.fane-strek');
    function velgTid(knapp, fokus){
      if (knapp.dataset.tid === tid) return;
      tid = knapp.dataset.tid;
      faner.forEach(f => { const v = f === knapp; f.setAttribute('aria-selected', String(v)); f.tabIndex = v ? 0 : -1; });
      trinnEl.setAttribute('aria-labelledby', knapp.id);
      strek.style.transform = `translateX(${knapp.offsetLeft}px)`;
      if (fokus) knapp.focus();
      if (redusert.matches){ tegnRutine(); return; }
      trinnEl.classList.add('bytter'); setTimeout(() => { tegnRutine(); trinnEl.classList.remove('bytter'); }, 200);
    }
    faner.forEach((f, i) => {
      f.addEventListener('click', () => velgTid(f));
      f.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); velgTid(faner[(i+1) % 2], true); } });
    });
    tegnRutine();
    pafyllKnapp('pafyll', 'pafyllknapp', 'pafyllsvar');

    // Produktraden: ekte varer
    const UTVALG = ['35952','1097268','1097996','1211886','1154712','1215165','720125','1097993','836853','717432','906984','1149543'];
    const rad = document.getElementById('rad');
    rad.innerHTML = UTVALG.map(id => PI.get(id)).filter(Boolean).map(kortHTML).join('');
    trekkRad();

    // Registeret over behandlinger
    const reg = document.getElementById('reg'), detalj = document.getElementById('detalj');
    reg.innerHTML = BEH.map((b, i) => `<li><button type="button" aria-pressed="${i===0}" aria-controls="detalj" data-b="${i}">${esc(b.navn)}</button></li>`).join('');
    function visBehandling(i, glid){
      const b = BEH[i], vv = hjemmeListe(b);
      const fyll = () => { detalj.innerHTML = `
        ${b.bilde ? `<div class="detalj-bilde"><img src="${rot}bilder/stock/${b.bilde}.webp" alt="" width="1800" height="1200"></div>` : ''}
        <h3>${esc(b.navn)}</h3>
        <div class="fakta"><span><b>${esc(b.pris)}</b></span>${b.tid ? `<span>${esc(b.tid)}</span>` : ''}<span>${esc(b.hvem)}</span></div>
        <p>${esc(b.tekst)}</p>
        <a class="knapp knapp-kull" href="${BOOK}" target="_blank" rel="noopener">Bestill ${b.id === 'hudstart' ? 'Hudstart' : 'time'}</a>
        <a class="lenke" href="${lenke.behandlinger}#${b.id}" style="margin-left:1.2rem">Les mer</a>
        ${vv.length ? `<div class="hjemme">
          <h4>Hjemme etter behandlingen</h4><p class="eks">Eksempel. Behandleren setter opp ditt eget program.</p>
          <ul>${vv.map(v => `<li><a href="${lenke.produkt(v.id)}">${esc(v.merke)} ${esc(v.navn)}, ${esc(v.str)}</a><span>${kr(v.pris)}</span></li>`).join('')}</ul>
          <button class="lenkeknapp" type="button" data-kjop-alle="${vv.map(v => v.id).join(',')}">Legg ${vv.length > 1 ? 'begge' : 'den'} i kurven</button></div>` : ''}`;
        detalj.classList.remove('bytter'); };
      reg.querySelectorAll('button').forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
      if (glid && !redusert.matches){ detalj.classList.add('bytter'); setTimeout(fyll, 160); } else fyll();
    }
    reg.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) visBehandling(+b.dataset.b, true); });
    if (matchMedia('(hover: hover)').matches){
      let t; reg.addEventListener('pointerover', e => { const b = e.target.closest('[data-b]'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
        clearTimeout(t); t = setTimeout(() => visBehandling(+b.dataset.b, true), 90); });
    }
    visBehandling(0, false);
  };

  function pafyllKnapp(selId, knappId, svarId){
    const sel = document.getElementById(selId), k = document.getElementById(knappId), ut = document.getElementById(svarId);
    if (sel && k && ut) k.addEventListener('click', () => pafyllSvar(sel, ut));
  }

  /* ---------- Det fysiske samspillet: produktraden man drar (fra v1, uendret) ----------
     apple-design: 1:1 sporing med grepsforskyvning, fart fra pekerhistorikken,
     momentum projisert med d = 0.998, snapp til nærmeste kort, fjær som arver farten,
     gummistrikk i kantene (c = 0.55). Fjær: demping 1.0 / respons 0.4 som standard,
     demping 0.8 / respons 0.4 bare etter et kast. Avbrytbar: nytt grep starter fra der raden er nå. */
  function trekkRad(){
    const rad = document.getElementById('rad'), ramme = document.getElementById('radramme');
    const dra = {x:0, v:0, maal:0, anim:0, aktiv:false, flyttet:false, retning:null, hist:[], startX:0, startY:0, startPos:0, id:null};
    let min = 0, punkter = [0];
    function maal(){
      const kort = [...rad.children]; const pad = parseFloat(getComputedStyle(ramme).paddingLeft);
      min = Math.min(0, ramme.clientWidth - pad*2 - rad.scrollWidth);
      punkter = [...new Set(kort.map(k => Math.max(min, -k.offsetLeft)).concat([min]))].sort((a,b) => b-a);
      oppdaterPiler();
    }
    const gummi = (over, dim, c=0.55) => (over*dim*c)/(dim + c*Math.abs(over));
    function begrens(x){ const dim = ramme.clientWidth; if (x > 0) return gummi(x, dim); if (x < min) return min - gummi(min - x, dim); return x; }
    const projiser = (v, d=0.998) => (v/1000) * d / (1-d);
    const naermest = x => punkter.reduce((a,b) => Math.abs(b-x) < Math.abs(a-x) ? b : a);
    const sett = x => { dra.x = x; rad.style.transform = `translate3d(${x}px,0,0)`; };
    function fjaer(til, v0, demping, respons){
      cancelAnimationFrame(dra.anim); dra.maal = til;
      if (redusert.matches){ sett(til); dra.v = 0; oppdaterPiler(); return; }
      const k = Math.pow(2*Math.PI/respons, 2), c = 4*Math.PI*demping/respons;
      let v = v0, sist = performance.now();
      const steg = n => {
        let dt = Math.min(0.032, (n - sist)/1000); sist = n;
        for (let i=0;i<2;i++){ const a = -k*(dra.x - til) - c*v; v += a*dt/2; sett(dra.x + v*dt/2); }
        dra.v = v;
        if (Math.abs(v) < 4 && Math.abs(dra.x - til) < 0.4){ sett(til); dra.v = 0; oppdaterPiler(); return; }
        dra.anim = requestAnimationFrame(steg);
      };
      dra.anim = requestAnimationFrame(steg);
    }
    function fart(){
      const h = dra.hist, n = h[h.length-1]; if (!n) return 0;
      let f = h[0]; for (const p of h) if (n.t - p.t <= 100){ f = p; break; }
      const dt = (n.t - f.t)/1000; return dt > 0 ? (n.x - f.x)/dt : 0;
    }
    ramme.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      cancelAnimationFrame(dra.anim);
      dra.aktiv = true; dra.flyttet = false; dra.retning = null; dra.id = e.pointerId;
      dra.startX = e.clientX; dra.startY = e.clientY; dra.startPos = dra.x;
      dra.hist = [{x:e.clientX, t:performance.now()}];
    });
    ramme.addEventListener('pointermove', e => {
      if (!dra.aktiv || e.pointerId !== dra.id) return;
      const dx = e.clientX - dra.startX, dy = e.clientY - dra.startY;
      if (!dra.retning){
        if (Math.hypot(dx,dy) < 10) return;
        dra.retning = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (dra.retning === 'y'){ dra.aktiv = false; return; }
        dra.flyttet = true; ramme.setPointerCapture(e.pointerId); ramme.classList.add('drar');
      }
      const ra = dra.startPos + dx;
      sett(ra > 0 || ra < min ? begrens(ra) : ra);
      dra.hist.push({x:e.clientX, t:performance.now()}); if (dra.hist.length > 8) dra.hist.shift();
    });
    const slipp = () => {
      if (!dra.aktiv) return; dra.aktiv = false;
      if (!dra.flyttet) return;
      const v = fart();
      const til = naermest(Math.max(min, Math.min(0, dra.x + projiser(v))));
      fjaer(til, v, Math.abs(v) > 300 ? 0.8 : 1.0, 0.4);
      setTimeout(() => { dra.flyttet = false; ramme.classList.remove('drar'); }, 0);
    };
    ramme.addEventListener('pointerup', slipp);
    ramme.addEventListener('pointercancel', slipp);
    ramme.addEventListener('click', e => { if (dra.flyttet){ e.preventDefault(); e.stopPropagation(); } }, true);
    ramme.addEventListener('dragstart', e => e.preventDefault());
    let hjulT;
    ramme.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); cancelAnimationFrame(dra.anim);
      sett(Math.max(min - 40, Math.min(40, dra.x - e.deltaX)));
      clearTimeout(hjulT); hjulT = setTimeout(() => fjaer(naermest(Math.max(min, Math.min(0, dra.x))), 0, 1.0, 0.4), 120);
    }, {passive:false});
    function gaa(retn){
      const i = punkter.indexOf(naermest(dra.maal));
      const j = Math.max(0, Math.min(punkter.length-1, i + retn));
      fjaer(punkter[j], dra.v, 1.0, 0.4);
    }
    const forrige = document.getElementById('forrige'), neste = document.getElementById('neste');
    function oppdaterPiler(){ const m = dra.maal; forrige.disabled = m >= -1; neste.disabled = m <= min + 1; }
    forrige.addEventListener('click', () => gaa(-1));
    neste.addEventListener('click', () => gaa(1));
    rad.addEventListener('focusin', e => {
      const k = e.target.closest('.kort'); if (!k) return;
      ramme.scrollLeft = 0;
      const synligV = -dra.x, synligH = synligV + ramme.clientWidth - 2*parseFloat(getComputedStyle(ramme).paddingLeft);
      if (k.offsetLeft < synligV || k.offsetLeft + k.offsetWidth > synligH) fjaer(naermest(Math.max(min, -k.offsetLeft)), 0, 1.0, 0.4);
    });
    addEventListener('resize', () => { maal(); sett(naermest(Math.max(min, Math.min(0, dra.x)))); dra.maal = dra.x; oppdaterPiler(); });
    maal();
    rad.querySelectorAll('img').forEach(i => i.addEventListener('load', maal, {once:true}));
    if (document.fonts) document.fonts.ready.then(maal);
  }

  /* ---------- Kolleksjonen: filter på merke og kategori, sortering ---------- */
  SIDER.hudpleie = () => {
    const q = new URLSearchParams(location.search);
    const tilstand = {kategori: q.get('kategori') || '', merke: q.get('merke') || '', sort: q.get('sort') || 'utvalgt'};
    const BUTIKK = {ansikt:334, solkrem:54, kropp:127, 'hår':179, duft:98};
    const chips = document.getElementById('kategorier'), merkeSel = document.getElementById('merke'), sortSel = document.getElementById('sorter');
    const merker = [...new Set(P.map(p => p.merke))].sort((a,b) => a.localeCompare(b, 'nb'));
    if (tilstand.merke && !merker.includes(tilstand.merke)) merker.push(tilstand.merke);
    merkeSel.innerHTML = '<option value="">Alle merker</option>' + merker.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    chips.innerHTML = [['','Alle'], ...KAT].map(([k,t]) => `<li><button type="button" data-kat="${k}" aria-pressed="false">${t}<sup>${k ? P.filter(p => p.kategori === k).length : P.length}</sup></button></li>`).join('');
    const rutenett = document.getElementById('rutenett'), linje = document.getElementById('antall-linje');
    function tegn(){
      merkeSel.value = tilstand.merke; sortSel.value = tilstand.sort;
      chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kat === tilstand.kategori)));
      let ut = P.filter(p => (!tilstand.kategori || p.kategori === tilstand.kategori) && (!tilstand.merke || p.merke === tilstand.merke));
      if (tilstand.sort === 'pris-opp') ut = [...ut].sort((a,b) => a.pris - b.pris);
      if (tilstand.sort === 'pris-ned') ut = [...ut].sort((a,b) => b.pris - a.pris);
      if (tilstand.sort === 'navn') ut = [...ut].sort((a,b) => a.navn.localeCompare(b.navn, 'nb'));
      const kTekst = tilstand.kategori ? KAT.find(k => k[0] === tilstand.kategori)[1].toLowerCase() : '';
      linje.textContent = `${ut.length} ${ut.length === 1 ? 'vare' : 'varer'} i demoen${tilstand.merke ? ' fra ' + tilstand.merke : ''}${kTekst ? ' i ' + kTekst : ''}.`
        + (tilstand.kategori && BUTIKK[tilstand.kategori] ? ` Butikken har ${BUTIKK[tilstand.kategori]} i dag.` : ' Butikken har 1 122 varer i dag.');
      rutenett.innerHTML = ut.length ? ut.map(kortHTML).join('')
        : `<li class="tomt-svar">${esc(tilstand.merke || 'Dette utvalget')} finnes i butikken, men er ikke med i demoen. I nettbutikken vises hele sortimentet her. <a class="lenke" href="${lenke.hudpleie}">Se alle i demoen</a></li>`;
      const u = new URLSearchParams(); if (tilstand.kategori) u.set('kategori', tilstand.kategori); if (tilstand.merke) u.set('merke', tilstand.merke); if (tilstand.sort !== 'utvalgt') u.set('sort', tilstand.sort);
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
    }
    chips.addEventListener('click', e => { const b = e.target.closest('[data-kat]'); if (b){ tilstand.kategori = b.dataset.kat; tegn(); } });
    merkeSel.addEventListener('change', () => { tilstand.merke = merkeSel.value; tegn(); });
    sortSel.addEventListener('change', () => { tilstand.sort = sortSel.value; tegn(); });
    tegn();
  };

  /* ---------- Produktsiden: én mal, ?p=id ---------- */
  SIDER.produkt = () => {
    const id = new URLSearchParams(location.search).get('p');
    const p = PI.get(id), mal = document.getElementById('produkt');
    if (!p){
      mal.innerHTML = `<div class="side-hode" style="padding-left:0"><h1>Fant ikke produktet</h1><p class="ingress">Det kan ha blitt flyttet. <a class="lenke" href="${lenke.hudpleie}">Til hudpleien</a></p></div>`;
      return;
    }
    document.title = `${p.navn}, ${p.merke} | Vinderen Hudpleie`;
    const kat = KAT.find(k => k[0] === p.kategori);
    const behandlinger = BEH.filter(b => (b.hjemme || []).includes(p.id));
    const iRutine = Object.entries(RUTINE).filter(([, t]) => t.some(x => x.id === p.id));
    const rutineBlokk = p.trinn ? `<section class="blokk" aria-labelledby="h-rutine">
        <h2 id="h-rutine">I rutinen</h2>
        <p>${esc(TRINN[p.trinn])}</p>
        ${iRutine.map(([tid, t]) => `<p class="kilde" style="margin-bottom:.4rem">Eksempel: ${tid}rutinen fra Din rutine</p>
          <ol class="trinnstripe">${t.map((x, i) => { const v = PI.get(x.id); return `<li class="${x.id === p.id ? 'her' : ''}"><b>Trinn ${i+1}: ${esc(x.verb)}</b>${x.id === p.id ? esc(v.navn) : `<a href="${lenke.produkt(v.id)}">${esc(v.navn)}</a>`}<br>${kr(v.pris)}</li>`; }).join('')}</ol>
          ${(() => { const resten = [...new Set(t.map(x => x.id))].filter(x => x !== p.id); const sum = resten.reduce((s, x) => s + PI.get(x).pris, 0);
            return `<button class="lenkeknapp" type="button" data-kjop-alle="${resten.join(',')}" data-tekst="Resten av rutinen er i kurven">Legg resten av ${tid}rutinen i kurven, ${kr(sum)}</button>`; })()}`).join('<div style="height:1.4rem"></div>')}
        <p style="margin-top:1rem"><a class="lenke" href="${lenke.rutine}">Se hele rutinen</a></p>
      </section>` : '';
    const hjemmeBlokk = behandlinger.length ? `<section class="blokk" aria-labelledby="h-hjemme">
        <h2 id="h-hjemme">Hjemme etter behandlingen</h2>
        <div class="hjemme-blokk"><img src="${rot}bilder/stock/hender-krem.webp" alt="" width="96" height="144" loading="lazy">
        <div><p>Brukes ofte hjemme etter:</p>
        <ul>${behandlinger.map(b => `<li><a href="${lenke.behandlinger}#${b.id}">${esc(b.navn)}</a>, ${esc(b.pris)}</li>`).join('')}</ul>
        <p class="kilde">Eksempel. Behandleren setter opp ditt eget program etter timen.</p></div></div>
      </section>` : '';
    mal.innerHTML = `
      <div class="produkt-bilde"><img src="${bilde(p)}" alt="${esc(p.merke)} ${esc(p.navn)}, ${esc(p.str)}" width="800" height="800"></div>
      <div class="produkt-info">
        <p class="sti"><a href="${lenke.hudpleie}">Hudpleie</a> / <a href="${lenke.kategori(p.kategori)}">${kat ? kat[1] : ''}</a> / <a href="${lenke.merke(p.merke)}">${esc(p.merke)}</a></p>
        <p class="merke"><a href="${lenke.merke(p.merke)}">${esc(p.merke)}</a></p>
        <h1>${esc(p.navn)}</h1>
        <p class="linje">${esc(p.linje)}</p>
        <div class="prisrad"><b>${kr(p.pris)}</b><span>${esc(p.str)}</span></div>
        <p class="lagerstatus${p.lager ? '' : ' ut'}">${p.lager ? 'På lager. Sendes hjem eller hentes i Vindernhuset.' : 'Ikke på lager nå. Spør oss i butikken.'}</p>
        ${p.reg ? `<p class="reg-merknad">${esc(p.merke)} selges til registrerte kunder. Er du ny hos oss, ringer vi deg for en kort gjennomgang før vi sender.</p>` : ''}
        ${p.lager ? `<button class="knapp knapp-kull kjop-knapp" type="button" data-kjop="${p.id}">Legg i kurv</button>` : `<button class="knapp knapp-kull kjop-knapp" type="button" disabled>Utsolgt</button>`}
        <div class="pafyll-lys">
          <label for="pafyll">Påminn meg om påfyll</label>
          <p class="hjelp">Vi sender en e-post når det er på tide å kjøpe ny. Ingen abonnement, du bestiller selv.</p>
          <div class="rad">
            <select id="pafyll"><option value="">Ikke nå</option><option value="6">Om 6 uker</option><option value="8">Om 8 uker</option><option value="12">Om 12 uker</option></select>
            <button class="knapp knapp-strek" type="button" id="pafyllknapp">Lagre</button>
          </div>
          <p class="svar" id="pafyllsvar" aria-live="polite"></p>
        </div>
        ${rutineBlokk}
        ${hjemmeBlokk}
        <section class="blokk" aria-labelledby="h-om">
          <h2 id="h-om">Om produktet</h2>
          ${p.tekst.map(t => `<p>${esc(t)}</p>`).join('') || '<p>Spør oss om produktet i butikken eller på telefon 91 90 90 83.</p>'}
          ${p.punkter.length ? `<ul class="punkter">${p.punkter.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          <p class="kilde">Tekst fra Vinderens nettbutikk i dag.</p>
        </section>
        ${p.bruk ? `<section class="blokk" aria-labelledby="h-bruk"><h2 id="h-bruk">Slik bruker du den</h2><p>${esc(p.bruk)}</p></section>` : ''}
      </div>`;
    pafyllKnapp('pafyll', 'pafyllknapp', 'pafyllsvar');
    const mer = P.filter(x => x.merke === p.merke && x.id !== p.id).slice(0, 4);
    const merEl = document.getElementById('mer-fra');
    if (mer.length){ merEl.querySelector('h2').innerHTML = `Mer fra <em>${esc(p.merke)}</em>`; merEl.querySelector('ul').innerHTML = mer.map(kortHTML).join(''); }
    else merEl.hidden = true;
  };

  /* ---------- Merkene ---------- */
  SIDER.merker = () => {
    const ALLE = ['ZO Skin Health','Obagi','Environ','Exuviance','Elixir Cosmeceuticals','Me Line','NOON Aesthetics','Innoaesthetics','DP Dermaceuticals',
      'Skinbetter Science','Dr Dennis Gross','NeoStrata','Genosys','Face Formula','Heliocare','Colorescience','Sisley Paris','Helena Rubinstein','By Terry',
      'Jane Iredale','Aveda','Mason Pearson','Molton Brown','Acqua di Parma','Laboratorio Olfattivo',"Eau d'Italie",'D.R. Harris','Elemis',
      'Janssen Cosmetics','Kerafactor','Miriam Quevedo','Monika Heiligmann','Micro Cell 2000','Biosil','Kolokrem','Pears','Yardley','Sprekenhus','3PL'];
    const liste = [...new Set(ALLE)].sort((a,b) => a.localeCompare(b, 'nb'));
    document.getElementById('merkeliste').innerHTML = liste.map(m => { const n = P.filter(p => p.merke === m).length; return `
      <li class="${n ? 'med' : ''}"><a href="${lenke.merke(m)}"><span class="navn">${esc(m)}</span><span class="tall">${n ? n + ' i demoen' : 'I butikken'}</span></a></li>`; }).join('');
  };

  /* ---------- Behandlingene ---------- */
  SIDER.behandlinger = () => {
    document.getElementById('behliste').innerHTML = BEH.map(b => { const vv = hjemmeListe(b); return `
      <li class="beh inn" id="${b.id}">
        <div>
          <h2>${esc(b.navn)}</h2>
          <div class="fakta"><span><b>${esc(b.pris)}</b></span>${b.tid ? `<span>${esc(b.tid)}</span>` : ''}<span>${esc(b.hvem)}</span></div>
          <p>${esc(b.tekst)}</p>
          <a class="knapp knapp-kull" href="${BOOK}" target="_blank" rel="noopener">Bestill ${b.id === 'hudstart' ? 'Hudstart' : 'time'}</a>
        </div>
        <div>
          ${vv.length ? `<div class="hjemme">
            <h4>Hjemme etter behandlingen</h4><p class="eks">Eksempel. Behandleren setter opp ditt eget program.</p>
            <ul>${vv.map(v => `<li><img src="${bilde(v)}" alt="" width="44" height="44" loading="lazy"><span><a href="${lenke.produkt(v.id)}">${esc(v.merke)} ${esc(v.navn)}</a>, ${esc(v.str)}</span><span>${kr(v.pris)}</span></li>`).join('')}</ul>
            <button class="knapp knapp-strek" type="button" data-kjop-alle="${vv.map(v => v.id).join(',')}" data-tekst="Hjemmeprogrammet er i kurven">Legg hjemmeprogrammet i kurven, ${kr(vv.reduce((s, v) => s + v.pris, 0))}</button>
          </div>` : `<p class="ingen">Spør behandleren om produkter til bruk hjemme.</p>`}
        </div>
      </li>`; }).join('');
    observerInn();
    const maal = location.hash ? location.hash.slice(1) : new URLSearchParams(location.search).get('b'); if (maal){ const el = document.getElementById(maal); if (el){ el.classList.add('synlig'); el.scrollIntoView(); } }
  };

  /* ---------- Din rutine som egen side ---------- */
  SIDER.rutine = () => {
    ['morgen','kveld'].forEach(tid => {
      document.getElementById('r-' + tid).innerHTML = RUTINE[tid].map((t, i) => { const v = PI.get(t.id); return `
        <li class="${t.mangler ? 'mangler' : ''}">
          <img src="${bilde(v)}" alt="" width="72" height="72" loading="lazy">
          <div><p class="verb">Trinn ${i+1}: ${esc(t.verb)}${t.mangler ? ', mangler i rutinen din' : ''}</p>
            <h3><a href="${lenke.produkt(v.id)}">${esc(v.navn)}</a></h3><p class="info">${esc(v.merke)}, ${esc(v.str)}</p></div>
          <div class="hoyre">${kr(v.pris)}<br><button class="mini" type="button" data-kjop="${v.id}">${t.mangler ? 'Fullfør rutinen' : 'Kjøp igjen'}</button></div>
        </li>`; }).join('');
    });
    const unike = [...new Set([...RUTINE.morgen, ...RUTINE.kveld].map(t => t.id))];
    document.getElementById('rutinesum').textContent = kr(unike.reduce((s, id) => s + PI.get(id).pris, 0));
    document.getElementById('rutineantall').textContent = `${unike.length} produkter, ordinære priser. Rensen brukes morgen og kveld og telles én gang.`;
    const k = document.getElementById('kjopalle'); k.dataset.kjopAlle = unike.join(','); k.dataset.tekst = 'Hele rutinen er i kurven';
    pafyllKnapp('pafyll', 'pafyllknapp', 'pafyllsvar');
  };

  lastet.then(() => { tegnKurv(); (SIDER[sideNavn] || (() => {}))(); observerInn(); });
  observerInn();
})();
