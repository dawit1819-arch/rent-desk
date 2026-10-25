(function () {
  'use strict';
  const R = window.RULES;
  const KEY = 'rent-desk-v1';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const money2 = n => '$' + (+n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = () => R.iso(new Date());
  const month = () => today().slice(0, 7);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const am = t => `<span class="am" lang="am">${t}</span>`;
  const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const src = s => s ? `<a class="src" href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a>` : '';

  // ---------- sample data (clearly marked) ----------
  function sample() {
    const t = today(), m = month();
    const back = n => R.addDays(t, -n);
    return {
      demo: true, showAm: true, done: { [`int-u2-${t.slice(0, 4)}-09-01`]: t, [`int-u4-${t.slice(0, 4)}-06-01`]: t, [`int-u5-${t.slice(0, 4)}-03-01`]: t },
      props: [
        { id: 'p1', name: 'Sample 3-family', address: 'Malden, MA (sample)', built: 1925, ownerOcc: true, price: 900000, landPct: 30, insRenew: R.addDays(t, 45),
          units: [
            { id: 'u1', label: 'Unit 1', beds: 3, rent: 0, tenant: '', note: 'Owner lives here' },
            { id: 'u2', label: 'Unit 2', beds: 2, rent: 2150, tenant: 'Sample tenant A', lang: 'English', moveIn: '2019-09-01', leaseEnd: R.addDays(t, 70), deposit: 1800, lmr: 1800, bankRate: 0.5, bankReceipt: true, condition: true, leaseCopy: true, leadDisclosed: true, kidsUnder6: false, payments: { [m]: back(19) } },
            { id: 'u3', label: 'Unit 3', beds: 2, rent: 2750, tenant: 'Sample tenant B', lang: 'Spanish', moveIn: back(9), leaseEnd: R.addDays(back(9), 364), deposit: 2750, lmr: 2750, bankRate: 0.5, bankReceipt: false, condition: false, leaseCopy: false, kidsUnder6: true, leadCert: false, payments: {} },
          ] },
        { id: 'p2', name: 'Sample 2-family', address: 'Everett, MA (sample)', built: 1910, ownerOcc: false, price: 720000, landPct: 30, insRenew: R.addDays(t, 200),
          units: [
            { id: 'u4', label: 'First floor', beds: 3, rent: 2600, tenant: 'Sample tenant C', lang: 'Haitian Creole', moveIn: '2022-06-01', leaseEnd: '', deposit: 0, lmr: 2600, bankRate: 5, bankReceipt: true, condition: true, leaseCopy: true, leadDisclosed: true, kidsUnder6: false, payments: { [m]: back(18) } },
            { id: 'u5', label: 'Second floor', beds: 2, rent: 2400, tenant: 'Sample tenant D', lang: 'Amharic', moveIn: '2024-03-01', leaseEnd: '2027-02-28', deposit: 2400, lmr: 0, bankRate: 0.5, bankReceipt: true, condition: true, leaseCopy: true, leadDisclosed: true, kidsUnder6: false, payments: {} },
          ] },
      ],
      expenses: [
        { id: 'e1', d: back(40), amt: 385, vendor: 'Joe\'s Plumbing', note: 'Fix leak under kitchen sink, unit 2', line: 14, prop: 'p1' },
        { id: 'e2', d: back(25), amt: 2124, vendor: 'Arbella', note: 'Landlord insurance premium', line: 9, prop: 'p1' },
        { id: 'e3', d: back(12), amt: 64.18, vendor: 'Home Depot', note: 'Smoke detector batteries and furnace filters', line: 15, prop: 'p2' },
        { id: 'e4', d: back(5), amt: 2840, vendor: 'City of Malden', note: 'Property tax Q2', line: 16, prop: 'p1' },
      ],
      trips: [
        { id: 't1', d: back(40), miles: 14, purpose: 'Meet plumber at Unit 2', prop: 'p1' },
        { id: 't2', d: back(12), miles: 9, purpose: 'Home Depot + filter change', prop: 'p2' },
      ],
    };
  }

  // Make sure stored or restored data has the right shape before using it.
  function clean(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.props)) return null;
    const arr = x => Array.isArray(x) ? x : [];
    const str = x => typeof x === 'string' ? x : '';
    const n = x => Number.isFinite(+x) ? +x : 0;
    const date = x => /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : '';
    const out = { demo: !!d.demo, setupLater: !!d.setupLater, profile: d.profile && typeof d.profile === 'object' && Array.isArray(d.profile.buildings) ? d.profile : null, showAm: d.showAm !== false, done: d.done && typeof d.done === 'object' ? d.done : {}, lastBackup: date(d.lastBackup) };
    out.props = d.props.filter(p => p && typeof p === 'object').map(p => ({ id: str(p.id) || uid(), name: str(p.name), address: str(p.address), built: n(p.built), ownerOcc: !!p.ownerOcc, price: n(p.price), landPct: p.landPct == null ? 30 : n(p.landPct), insRenew: date(p.insRenew),
      units: arr(p.units).filter(u => u && typeof u === 'object').map(u => ({ ...u, id: str(u.id) || uid(), label: str(u.label), tenant: str(u.tenant), lang: str(u.lang), note: str(u.note), beds: n(u.beds) || 1, rent: n(u.rent), deposit: n(u.deposit), lmr: n(u.lmr), bankRate: u.bankRate == null ? null : n(u.bankRate), moveIn: date(u.moveIn), leaseEnd: date(u.leaseEnd), moveOut: date(u.moveOut), payments: u.payments && typeof u.payments === 'object' ? u.payments : {} })) }));
    out.expenses = arr(d.expenses).filter(e => e && n(e.amt)).map(e => ({ id: str(e.id) || uid(), d: date(e.d) || today(), amt: n(e.amt), vendor: str(e.vendor), note: str(e.note), line: R.SCHED_E[e.line] ? +e.line : 19, prop: str(e.prop), flag: str(e.flag), photo: /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(e.photo || '') ? e.photo : null }));
    out.trips = arr(d.trips).filter(t => t && n(t.miles)).map(t => ({ id: str(t.id) || uid(), d: date(t.d) || today(), miles: n(t.miles), purpose: str(t.purpose), prop: str(t.prop) }));
    return out;
  }
  let S;
  try { S = clean(JSON.parse(localStorage.getItem(KEY))) || sample(); } catch { S = sample(); }
  const savedTag = ok => { const el = document.getElementById('saved'); if (el) { el.textContent = ok ? '✓ Saved on this phone' : '⚠ Not saved: phone storage full'; el.classList.toggle('bad', !ok); } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); savedTag(true); return true; } catch { savedTag(false); toast('Phone storage is full. Save a backup, then delete old receipt photos.'); return false; } };
  let tab = 'home', view = null, photoBusy = false;
  const SU = window.RentDeskSetup({ get: () => S, save, render: top => render(!top), esc, am, uid, toast: m => toast(m), setView: f => { view = f; }, setTab: t => { tab = t; } });

  const tripValue = ts => ts.reduce((a, t) => a + t.miles * R.mileageRate(t.d), 0);
  const allUnits = () => S.props.flatMap(p => p.units.map(u => ({ p, u })));
  const findUnit = id => allUnits().find(x => x.u.id === id);
  const findProp = id => S.props.find(p => p.id === id);

  function undoToast(msg, undo) { const t = $('#toast'); t.innerHTML = `${esc(msg)} <button class="undo">Undo</button>`; t.hidden = false; t.querySelector('.undo').onclick = () => { undo(); t.hidden = true; }; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 6000); }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2200); }

  // ---------- money found ----------
  function moneyFound() {
    const items = [];
    for (const { p, u } of allUnits()) {
      if (!u.tenant || !u.rent) continue;
      const rc = R.rentCheck(u.beds, u.rent);
      if (rc.verdict === 'under') items.push({ amt: rc.yearLow, text: `${p.name} · ${u.label} rent is ${money(rc.gapLow)}+/mo under the low end of the market`, go: `unit:${u.id}` });
    }
    const y = today().slice(0, 4);
    const trips = S.trips.filter(t => t.d.startsWith(y));
    const miles = trips.reduce((a, t) => a + +t.miles, 0);
    const exp = S.expenses.filter(e => e.d.startsWith(y)).reduce((a, e) => a + +e.amt, 0);
    if (exp || miles) items.push({ amt: exp + tripValue(trips), text: `Receipts and ${miles} business miles saved this year (deductions)`, go: 'tab:money', deduction: true });
    for (const p of S.props) if (p.price) items.push({ amt: R.depreciation(p.price, p.landPct || 30), text: `Depreciation on ${p.name}: ask your preparer if it is claimed every year`, go: 'tab:money', check: true });
    for (const p of S.props) if (p.ownerOcc) items.push({ amt: 2700, text: `Residential exemption on ${p.name} if not filed yet (about)`, go: 'tab:rules' });
    return items;
  }

  // ---------- screens ----------
  function render(keep) {
    document.body.classList.toggle('hide-am', !S.showAm);
    $('#tabs').innerHTML = [['home', 'Home', 'መነሻ', '⌂'], ['units', 'Homes', 'ቤቶች', '▦'], ['money', 'Money', 'ገንዘብ', '$'], ['rules', 'Deadlines', 'ቀኖች', '!'], ['tools', 'Tools', 'መሣሪያ', '✎']]
      .map(([k, l, a, i]) => `<button data-act="tab" data-v="${k}" class="${tab === k ? 'on' : ''}"><b>${i}</b>${l}${am(a)}</button>`).join('');
    const screen = view ? view() : ({ home: renderHome, units: renderUnits, money: renderMoney, rules: renderRules, tools: renderTools })[tab]();
    $('#app').innerHTML = (S.demo && !(view && view.setup) ? `<div class="demo">Sample homes for the demo. <button data-act="clear-demo">Start with my own homes</button></div>` : '') + screen;
    if (!keep) window.scrollTo(0, 0);
  }

  function taskCard(t) {
    const cls = t.days < 0 ? 'over' : t.days <= 14 ? 'soon' : '';
    const when = t.days < 0 ? `${-t.days} days overdue` : t.days === 0 ? 'Today' : t.days === 1 ? 'Tomorrow' : `in ${t.days} days · ${fmtDate(t.date)}`;
    return `<details class="task ${cls} lvl-${t.level}"><summary><span class="when">${when}</span><strong>${esc(t.title)}</strong><small>${esc(t.where)}</small></summary><p>${esc(t.why)}</p><div class="row">${src(t.src)}<button class="small" data-act="done" data-v="${esc(t.key)}">Done ✓</button></div></details>`;
  }

  function renderHome() {
    const found = moneyFound();
    const extra = found.filter(f => !f.deduction && !f.check).reduce((a, f) => a + f.amt, 0);
    const ded = found.filter(f => f.deduction).reduce((a, f) => a + f.amt, 0);
    const ts = R.tasks(S.props, today(), S.done);
    const urgent = ts.filter(t => t.days <= 14);
    const m = month();
    const rows = allUnits().filter(x => x.u.tenant);
    const st = rows.map(x => ({ ...x, s: R.rentStatus(x.u, m, today()) })).filter(x => x.s.state !== 'notyet');
    const paid = st.filter(x => x.s.state === 'paid');
    const expected = st.reduce((a, x) => a + (+x.u.rent || 0), 0);
    const got = paid.reduce((a, x) => a + (+x.u.rent || 0), 0);
    const first = urgent[0];
    const late = st.filter(x => x.s.state === 'late');
    const hi = S.profile && S.profile.answers && S.profile.answers.name ? `Hello, ${esc(S.profile.answers.name)}` : 'Hello';
    return `<p class="hello">${hi} ${am('ሰላም')}</p>
<section class="attention"><small>Needs your attention ${am('ትኩረት የሚፈልግ')}</small>
${first ? `<strong>${esc(first.title)}</strong><span>${esc(first.where)} · ${first.days < 0 ? `${-first.days} days overdue` : first.days === 0 ? 'today' : first.days === 1 ? 'tomorrow' : 'by ' + fmtDate(first.date)}</span>` : '<strong>Nothing urgent</strong><span>You are up to date.</span>'}
${late.length ? `<span class="att-late">${late.length} rent payment${late.length > 1 ? 's' : ''} late this month</span>` : ''}
<button class="primary" data-act="tab" data-v="rules">See what to do →</button></section>
${SU.homeCard()}
<section class="card"><h2>Rent for ${new Date(m + '-15').toLocaleDateString('en-US', { month: 'long' })} ${am('የወሩ ኪራይ')}</h2>
<div class="stat"><b>${money(got)}</b><span>received of ${money(expected)}</span></div>
<div class="meter"><div style="width:${expected ? Math.round(got / expected * 100) : 0}%"></div></div>
${st.map(x => rentRow(x)).join('') || '<p class="muted">No rented units yet.</p>'}</section>

<section class="card"><h2>Next 2 weeks ${am('የሚቀጥሉት ቀኖች')}</h2>
${urgent.length ? urgent.map(taskCard).join('') : '<p class="muted">Nothing due. Nice.</p>'}
<button class="link" data-act="tab" data-v="rules">See all deadlines →</button></section>

<section class="card"><h2>Money you could gain ${am('ሊያገኙት የሚችሉት ገንዘብ')}</h2>
<div class="two-stats"><div class="stat"><b>${money(extra)}</b><span>a year, if rents match the market <em>estimate</em></span></div>
<div class="stat"><b>${money(ded)}</b><span>tax deductions recorded this year</span></div></div>
${found.map(f => `<button class="found-row" data-act="go" data-v="${esc(f.go)}"><b>${money(f.amt)}</b><span>${esc(f.text)}</span><i>›</i></button>`).join('')}
<p class="fine">Rent figures are estimates from Malden market data. Deductions lower your taxable income; your tax preparer decides the final numbers.</p></section>`;
  }

  function rentRow({ p, u, s }) {
    let badge = '', note = '';
    if (s.state === 'paid') badge = `<span class="pill ok">Paid ${fmtDate(s.on).replace(/, \d{4}/, '')}</span>`;
    else if (s.state === 'due' || s.state === 'upcoming') badge = '<span class="pill">Due</span>';
    else if (s.state === 'late') {
      badge = `<span class="pill bad">${s.late} days late</span>`;
      note = s.feeAllowed ? '<small class="warn">Over 30 days late: a late fee is now allowed if your lease says so. Consider RAFT before a notice to quit.</small>'
        : `<small class="warn">No late fee allowed in MA until rent is 30 days late (${fmtDate(s.feeDate)}). <a href="${R.SRC.deposit[1]}" target="_blank" rel="noopener">c.186 §15B</a></small>`;
    }
    return `<div class="rent-row"><div><strong>${esc(u.label)}</strong><small>${esc(p.name)} · ${money(u.rent)}</small>${note}</div>${badge}${s.state !== 'paid' ? `<button class="small" data-act="paid" data-v="${u.id}">Record rent</button>` : ''}</div>`;
  }

  function renderUnits() {
    return `<h1>Your homes ${am('ቤቶችዎ')}</h1>` + S.props.map(p => `
<section class="card"><div class="row"><div><h2>${esc(p.name)}</h2><small class="muted">${esc(p.address)} · built ${esc(p.built || '?')}${p.ownerOcc ? ' · you live here' : ''}</small></div><button class="small" data-act="edit-prop" data-v="${p.id}">Edit</button></div>
${p.units.map(u => {
      const rc = u.tenant && u.rent ? R.rentCheck(u.beds, u.rent) : null;
      return `<button class="unit" data-act="unit" data-v="${u.id}"><div><strong>${esc(u.label)}</strong><small>${u.tenant ? esc(u.tenant) + ' · ' + money(u.rent) + '/mo' : esc(u.note || 'Vacant')}</small></div>${rc ? `<span class="pill ${rc.verdict === 'under' ? 'bad' : 'ok'}">${rc.verdict === 'under' ? 'Under market' : rc.verdict === 'over' ? 'Above range' : 'Market rent'}</span>` : ''}</button>`;
    }).join('')}
<button class="link" data-act="add-unit" data-v="${p.id}">+ Add a unit</button></section>`).join('') + `<button class="primary" data-act="add-prop">+ Add a property</button>`;
  }

  function renderUnit(id) {
    const { p, u } = findUnit(id);
    const rc = u.rent ? R.rentCheck(u.beds, u.rent) : null;
    const i = R.depositInterest(u);
    const ts = R.tasks([{ ...p, units: [u] }], today(), S.done).filter(t => t.unit === u.id);
    return `<button class="back" data-act="back">← Back</button><h1>${esc(u.label)} <small>${esc(p.name)}</small></h1>
${rc ? `<section class="card"><h2>Rent check ${am('የኪራይ ዋጋ')}</h2>
<div class="range"><div class="bar"><span class="you" style="left:${Math.max(0, Math.min(100, (u.rent - rc.low + 400) / (rc.high - rc.low + 800) * 100))}%"></span><span class="mk" style="left:${400 / (rc.high - rc.low + 800) * 100}%;right:${400 / (rc.high - rc.low + 800) * 100}%"></span></div>
<div class="row muted"><small>Market ${money(rc.low)} – ${money(rc.high)}</small><small>You: ${money(u.rent)}</small></div></div>
${rc.verdict === 'under' ? `<p><strong>About ${money(rc.gapLow)} to ${money(rc.gapMid)} a month under market</strong> = ${money(rc.yearLow)} to ${money(rc.yearMid)} a year.</p><p class="muted">A long-time tenant who pays on time is worth something: one empty month costs about ${money(u.rent)} plus turnover costs. A step-up at renewal (for example ${money(Math.min(rc.gapLow, Math.round(u.rent * 0.05 / 25) * 25) || 100)}/mo) keeps a good tenant and closes the gap over time.</p>` : rc.verdict === 'over' ? '<p>Above the usual range. Fine if the unit is updated. Watch for long vacancy.</p>' : '<p>Your rent is inside the market range.</p>'}
${rc.voucher ? `<p class="muted">Section 8 rent limit for this ZIP (2BR): about ${money(rc.voucher)}/mo (unverified, confirm with the housing authority). Voucher rent is paid by the housing authority every month.</p>` : ''}
<p class="fine">${rc.sourced ? 'Malden 2-bedroom range from RentHop (ZIP 02148 median $2,500) and Rentometer (about $3,060).' : 'Rough estimate scaled from Malden 2-bedroom data. A live rent-comps feature comes next.'}</p></section>` : ''}

${u.tenant ? `<section class="card"><h2>Security deposit ${am('የዋስትና ገንዘብ')}</h2>
<div class="facts"><div><small>Deposit</small><b>${money(u.deposit || 0)}</b></div><div><small>Last month's rent</small><b>${money(u.lmr || 0)}</b></div><div><small>Interest due each year</small><b>${money2(i.deposit + i.lmr)}</b></div></div>
${check(u, 'condition', 'Statement of condition given (10 days)')}
${check(u, 'bankReceipt', 'Bank receipt given: MA bank + account number (30 days)')}
${check(u, 'leaseCopy', 'Signed lease copy given (30 days)')}
${p.built < 1978 ? check(u, 'leadDisclosed', 'Lead notice + disclosure form signed') + check(u, 'kidsUnder6', 'A child under 6 lives here') + (u.kidsUnder6 ? check(u, 'leadCert', 'Lead Letter of Compliance on file') : '') : ''}
${src(R.SRC.deposit)}</section>` : ''}

${ts.length ? `<section class="card"><h2>Deadlines for this unit</h2>${ts.map(taskCard).join('')}</section>` : ''}
<div class="two"><button data-act="edit-unit" data-v="${u.id}">Edit unit</button>${u.tenant ? `<button data-act="moveout" data-v="${u.id}">Tenant moving out</button>` : ''}</div>`;
  }
  const check = (u, f, label) => `<label class="check"><input type="checkbox" data-act="flag" data-v="${u.id}" data-f="${f}" ${u[f] ? 'checked' : ''}><span>${label}</span></label>`;

  function renderMoney() {
    const y = today().slice(0, 4);
    const ex = S.expenses.filter(e => e.d.startsWith(y));
    const tr = S.trips.filter(t => t.d.startsWith(y));
    const byLine = {};
    for (const e of ex) byLine[e.line] = (byLine[e.line] || 0) + +e.amt;
    const miles = tr.reduce((a, t) => a + +t.miles, 0);
    if (miles) byLine[6] = (byLine[6] || 0) + tripValue(tr);
    const dep = S.props.reduce((a, p) => a + (p.price ? R.depreciation(p.price, p.landPct || 30) : 0), 0);
    const total = Object.values(byLine).reduce((a, b) => a + b, 0) + dep;
    return `<h1>Money ${y} ${am('ገንዘብ')}</h1>
<div class="two"><button class="primary" data-act="add-exp">📷 Add a receipt</button><button class="secondary" data-act="add-trip">🚗 Log a trip</button></div>
<section class="card"><h2>Tax summary ${am('የግብር ማጠቃለያ')}</h2><p class="fine">Lines match IRS Schedule E, the rental page of your tax return.</p>
${Object.keys(R.SCHED_E).filter(l => byLine[l]).map(l => `<div class="line"><span>Line ${l} · ${R.SCHED_E[l]}</span><b>${money2(byLine[l])}</b></div>`).join('')}
<div class="line"><span>Line 18 · Depreciation (estimate)</span><b>${money2(dep)}</b></div>
<div class="line total"><span>Total deductions</span><b>${money2(total)}</b></div>
<p class="fine">Depreciation estimate = building value (price minus land) ÷ 27.5 years; the first year is smaller and improvements add to it. Mileage uses the IRS rate for each trip's date (2026: 72.5¢ Jan-Jun, 76¢ Jul-Dec). Your preparer decides the final numbers. ${src(R.SRC.irs527)}</p>
<button data-act="export">⬇ Download for my tax preparer (CSV)</button></section>
<section class="card"><h2>Keep your records safe ${am('መዝገብዎን ያስቀምጡ')}</h2><p class="muted">Everything lives only on this phone. Save a backup file once a month (email it to yourself or keep it in iCloud).</p>${S.lastBackup ? `<p class="fine">Last backup: ${fmtDate(S.lastBackup)}</p>` : '<p class="warn">No backup yet.</p>'}<div class="two"><button data-act="backup">Save backup</button><label class="filebtn">Restore backup<input id="restore" type="file" accept="application/json,.json"></label></div></section>
<section class="card"><h2>Receipts</h2><p class="fine">Tap a receipt to fix or delete it.</p>${ex.slice().sort((a, b) => b.d.localeCompare(a.d)).map(e => `<div class="exp" role="button" tabindex="0" data-act="edit-exp" data-v="${esc(e.id)}">${e.photo ? `<img src="${esc(e.photo)}" alt="">` : '<i>🧾</i>'}<div><strong>${esc(e.vendor)}</strong><small>${fmtDate(e.d)} · ${esc(R.SCHED_E[e.line])}</small><small class="muted">${esc(e.note)}</small>${e.flag ? `<small class="warn">${esc(e.flag)}</small>` : ''}</div><b>${money2(e.amt)}</b></div>`).join('') || '<p class="muted">No receipts yet.</p>'}</section>
<section class="card"><h2>Trips</h2>${tr.map(t => `<div class="line"><span>${fmtDate(t.d)} · ${esc(t.purpose)}</span><b>${esc(t.miles)} mi</b></div>`).join('') || '<p class="muted">No trips yet.</p>'}
<p class="fine">Every drive to a property, the hardware store or the bank for the rentals counts.</p></section>`;
  }

  function renderRules() {
    const ts = R.tasks(S.props, today(), S.done);
    return `<h1>Deadlines ${am('የጊዜ ገደቦች')}</h1>
<p class="muted">Built from Massachusetts law and your homes. Tap one to see why it matters.</p>
<div class="legend"><span class="lvl-law">Law</span><span class="lvl-money">Money</span><span class="lvl-date">Date</span></div>
${ts.map(taskCard).join('')}
<section class="card"><h2>Rules to know ${am('ማወቅ ያለብዎት ሕጎች')}</h2>
${[
        ['Late fees', 'No late fee or interest until rent is 30 days late.', R.SRC.deposit],
        ['What you can collect at move-in', 'Only first month, last month, a security deposit up to one month\'s rent, and the cost of a new lock and key.', R.SRC.deposit],
        ['Section 8 / vouchers', 'Every landlord must accept rental assistance. Saying "no Section 8" in an ad is itself illegal.', R.SRC.voucher],
        ['Families and lead paint', 'You cannot refuse families with children because of lead paint. Delead instead ($3,000/unit tax credit).', R.SRC.lead],
        ['Unpaid rent', 'Usually a 14-day notice to quit that tells the tenant they can still pay, sent with the required state form. A notice is not an eviction; only the court can order one. If the tenant applies for RAFT (up to about $7,000, if eligible), the court pauses the case, so helping them apply is often the fastest way to get paid. Talk to a lawyer before sending one.', R.SRC.notice],
        ['Heat', 'Sept 15 to May 31: at least 68°F from 7am to 11pm, 64°F at night.', R.SRC.heat],
      ].map(([h, t, s]) => `<details class="rule"><summary>${h}</summary><p>${t}</p>${src(s)}</details>`).join('')}
<p class="fine">Rules last checked ${R.CHECKED}. This is not legal advice; ask a Massachusetts landlord lawyer before you act on a dispute.</p></section>`;
  }

  function renderTools() {
    return `<h1>Tools ${am('መሣሪያዎች')}</h1>
<section class="card"><h2>Answer a tenant message ${am('ለተከራይ መልስ')}</h2>
<textarea id="msg" rows="4" placeholder="Paste the tenant's text message here"></textarea>
<button class="primary" data-act="triage">Help me answer</button><div id="msg-out"></div></section>
<section class="card"><h2>Write a rental listing ${am('የኪራይ ማስታወቂያ')}</h2>
<div class="form-grid">
<label>Unit<select id="l-unit">${allUnits().map(({ p, u }) => `<option value="${u.id}">${esc(p.name)} · ${esc(u.label)}</option>`).join('')}</select></label>
<label>Rent<input id="l-rent" type="number" inputmode="numeric" placeholder="2600"></label>
<label class="wide">Good things about it<input id="l-good" placeholder="near Oak Grove T, new kitchen, parking, laundry"></label>
<label class="wide">Your own words (optional)<textarea id="l-extra" rows="2" placeholder="Anything else you want to say"></textarea></label></div>
<button class="primary" data-act="listing">Write it + check it</button><div id="listing-out"></div></section>
<section class="card"><h2>Ask AI ${am('AI ይጠይቁ')}</h2><p class="muted">Copies a question with your Massachusetts context, then opens Claude. Paste it there. Never paste tenant Social Security or bank numbers.</p>
<textarea id="ask" rows="3" placeholder="Example: My tenant wants to paint the bedroom. What should I say?"></textarea>
<button data-act="ask">Copy and open Claude</button></section>`;
  }

  // ---------- forms (bottom sheet) ----------
  function sheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="sheet-body">${html}</div>`; s.hidden = false; }
  const closeSheet = () => { $('#sheet').hidden = true; };
  const field = (id, label, value, type = 'text', extra = '') => `<label>${label}<input id="${id}" type="${type}" value="${esc(value ?? '')}" ${extra}></label>`;
  const box = (id, label, on) => `<label class="check"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;

  function unitForm(pid, uid_) {
    const u = uid_ ? findUnit(uid_).u : { beds: 2 };
    sheet(`<h2>${uid_ ? 'Edit unit' : 'Add a unit'}</h2><div class="form-grid">
${field('f-label', 'Name', u.label, 'text', 'placeholder="Unit 2 / First floor"')}${field('f-beds', 'Bedrooms', u.beds, 'number')}
${field('f-tenant', 'Tenant name (leave empty if vacant)', u.tenant)}${field('f-lang', 'Tenant language', u.lang)}
${field('f-rent', 'Rent / month', u.rent, 'number')}${field('f-movein', 'Move-in date', u.moveIn, 'date')}
${field('f-leaseend', 'Lease ends (empty = month-to-month)', u.leaseEnd, 'date')}${field('f-deposit', 'Security deposit held', u.deposit, 'number')}
${field('f-lmr', 'Last month\'s rent held', u.lmr, 'number')}${field('f-bank', 'Deposit bank interest rate %', u.bankRate, 'number', 'step="0.01"')}</div>
<div class="two"><button data-act="close">Cancel</button><button class="primary" data-act="save-unit" data-v="${pid}" data-u="${uid_ || ''}">Save</button></div>${uid_ ? `<button class="link danger" data-act="del-unit" data-v="${uid_}">Delete this unit</button>` : ''}`);
  }
  function propForm(pid) {
    const p = pid ? findProp(pid) : { landPct: 30 };
    sheet(`<h2>${pid ? 'Edit property' : 'Add a property'}</h2><div class="form-grid">
${field('f-name', 'Name', p.name, 'text', 'placeholder="Main St 3-family"')}${field('f-addr', 'Address', p.address)}
${field('f-built', 'Year built', p.built, 'number')}${field('f-price', 'Price you paid', p.price, 'number')}
${field('f-land', 'Land share of price %', p.landPct, 'number')}${field('f-ins', 'Insurance renews on', p.insRenew, 'date')}</div>
${box('f-own', 'I live in this building', p.ownerOcc)}
<div class="two"><button data-act="close">Cancel</button><button class="primary" data-act="save-prop" data-v="${pid || ''}">Save</button></div>`);
  }
  function expForm(id) {
    const e = id ? S.expenses.find(x => x.id === id) : null;
    const line = String(e ? e.line : 19);
    sheet(`<h2>${e ? 'Fix this receipt' : 'Add a receipt'}</h2>
<label class="photo">📷 ${e && e.photo ? 'Change the photo' : 'Take or pick a photo'}<input id="f-photo" type="file" accept="image/*" capture="environment"></label><img id="f-prev" ${e && e.photo ? `src="${esc(e.photo)}"` : 'hidden'} alt="Receipt photo">
<div class="form-grid">${field('f-amt', 'Amount $', e ? e.amt : '', 'number', 'step="0.01" inputmode="decimal"')}${field('f-date', 'Date', e ? e.d : today(), 'date')}
${field('f-vendor', 'Paid to', e ? e.vendor : '', 'text', 'placeholder="Home Depot, plumber, National Grid…"')}
<label>Property<select id="f-prop">${S.props.map(p => `<option value="${p.id}" ${e && e.prop === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
<label class="wide">What was it for?<input id="f-note" value="${esc(e ? e.note : '')}" placeholder="Fixed leak in unit 2 bathroom"></label>
<label class="wide">Tax category<select id="f-line" ${e ? 'data-touched="1"' : ''}>${Object.entries(R.SCHED_E).map(([l, n]) => `<option value="${l}" ${l === line ? 'selected' : ''}>Line ${l} · ${n}</option>`).join('')}</select></label></div>
<div id="f-hint" class="hint"></div>
<div class="two"><button data-act="close">Cancel</button><button class="primary" data-act="save-exp" data-v="${e ? esc(e.id) : ''}">Save</button></div>${e ? `<button class="link danger" data-act="del-exp" data-v="${esc(e.id)}">Delete this receipt</button>` : ''}`);
  }
  function tripForm() {
    sheet(`<h2>Log a trip</h2><div class="form-grid">${field('f-miles', 'Miles (round trip)', '', 'number', 'inputmode="decimal"')}${field('f-date', 'Date', today(), 'date')}
<label class="wide">Why<input id="f-why" placeholder="Showed unit 3, picked up supplies"></label>
<label>Property<select id="f-prop">${S.props.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label></div>
<div class="two"><button data-act="close">Cancel</button><button class="primary" data-act="save-trip">Save</button></div>`);
  }
  const val = id => ($('#' + id)?.value ?? '').trim();
  const num = id => { const v = val(id); return v === '' ? 0 : +v; };

  function shrink(file) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => { const s = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7)); URL.revokeObjectURL(img.src); };
      img.onerror = () => res(null);
      img.src = URL.createObjectURL(file);
    });
  }

  // ---------- tools ----------
  function triage() {
    const text = val('msg'); if (!text) return toast('Paste a message first');
    const type = R.classifyMessage(text);
    $('#msg-out').innerHTML = `<div class="triage t-${type}"><span class="pill ${type === 'emergency' ? 'bad' : ''}">${R.TYPE_NAMES[type]}</span>
${type === 'emergency' ? '<p class="warn"><strong>Act now.</strong> Gas smell, smoke, fire, CO alarm, flooding or no heat in winter: tell the tenant to get out and call 911 if there is danger, then call a licensed pro. Do not wait to text back.</p>' : ''}
${type === 'payment' ? '<p class="muted">Remember: no late fee until 30 days late. RAFT can pay up to about $7,000 of back rent.</p>' : ''}
<label>Reply draft (edit before sending)<textarea id="reply" rows="5">${esc(R.REPLIES[type])}</textarea></label>
<div class="two"><button data-act="copy-reply">Copy reply</button><button data-act="ai-reply">Translate / improve with AI</button></div></div>`;
  }
  function listing() {
    const hit = findUnit(val('l-unit')); if (!hit) return toast('Add a unit first');
    const { p, u } = hit;
    const rent = num('l-rent') || u.rent || R.rentCheck(u.beds, 0).mid;
    const good = val('l-good'), extra = val('l-extra');
    const text = `${u.beds}-bedroom apartment for rent in ${p.address.replace(/\s*\(sample\)/, '')} – $${rent.toLocaleString('en-US')}/month\n\n${u.label} of a ${p.units.length}-family home${good ? '. Highlights: ' + good : ''}.${extra ? '\n\n' + extra : ''}\n\nAll applicants welcome. Section 8 and rental assistance accepted. Equal housing opportunity.\nTo see it, message me with a good time to visit.`;
    const issues = R.fairHousingCheck(text);
    const tips = ['Take photos in daylight with all lights on, phone held at chest height, horizontal.', 'First photo: the best room, not the outside.', 'Post on Zillow Rental Manager, Facebook Marketplace and Craigslist (all free).', 'Since Aug 2025 you pay a broker only if you hire one, so listing it yourself saves the fee.'];
    $('#listing-out').innerHTML = `${issues.length ? `<div class="warn box"><strong>Fix before posting:</strong>${issues.map(i => `<p>"${esc(i.match)}": ${esc(i.why)} ${src(i.src)}</p>`).join('')}</div>` : '<p class="ok-text">✓ Passed the fair-housing check.</p>'}
<label>Your listing<textarea id="listing-text" rows="8">${esc(text)}</textarea></label><div class="two"><button data-act="copy-listing">Copy listing</button><button data-act="ai-listing">Make it better with AI</button></div>
<ul class="tips">${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  }
  async function copyOpen(prompt) {
    const copying = navigator.clipboard ? navigator.clipboard.writeText(prompt) : Promise.reject();
    window.open('https://claude.ai/new', '_blank', 'noopener');
    try { await copying; toast('Copied. Paste it in Claude.'); } catch { toast('Could not copy. Select and copy the text.'); }
  }
  const CONTEXT = 'I am a small landlord in Malden, Massachusetts. Follow Massachusetts law (security deposit c.186 §15B, no late fee before 30 days, Section 8 must be accepted, lead law). Answer in plain simple English, short, and tell me when I should ask a lawyer or a licensed pro.';

  function exportCsv() {
    const rows = [['Date', 'Property', 'Paid to', 'What for', 'Schedule E line', 'Category', 'Amount']];
    const y = today().slice(0, 4);
    for (const e of S.expenses.filter(e => e.d.startsWith(y))) rows.push([e.d, findProp(e.prop)?.name || '', e.vendor, e.note, e.line, R.SCHED_E[e.line], (+e.amt).toFixed(2)]);
    for (const t of S.trips.filter(t => t.d.startsWith(y))) rows.push([t.d, findProp(t.prop)?.name || '', 'Mileage', `${t.purpose} (${t.miles} mi × $${R.mileageRate(t.d)})`, 6, 'Auto and travel', (t.miles * R.mileageRate(t.d)).toFixed(2)]);
    for (const p of S.props) if (p.price) rows.push([today().slice(0, 4), p.name, '', `Depreciation estimate: $${p.price} × ${100 - (p.landPct || 30)}% ÷ 27.5`, 18, 'Depreciation', R.depreciation(p.price, p.landPct || 30).toFixed(2)]);
    const cell = c => { let s = String(c); if (/^\s*[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const csv = rows.map(r => r.map(cell).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `rent-desk-schedule-e-${today().slice(0, 4)}.csv`; a.click();
  }

  // ---------- events ----------
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, v = b.dataset.v;
    if (a.startsWith('su-') && SU.click(a, b)) return;
    if (b.type === 'checkbox' && a !== 'flag') return;
    if (a === 'tab') { tab = v; view = null; return render(); }
    if (a === 'go') { const [k, x] = v.split(':'); if (k === 'tab') { tab = x; view = null; } else { tab = 'units'; view = () => renderUnit(x); } return render(); }
    if (a === 'unit') { view = () => renderUnit(v); return render(); }
    if (a === 'back') { view = null; return render(); }
    if (a === 'lang') { S.showAm = !S.showAm; save(); return render(); }
    if (a === 'done') { S.done[v] = today(); save(); toast('Marked done'); return render(); }
    if (a === 'paid') { const { u } = findUnit(v); u.payments = u.payments || {}; u.payments[month()] = today(); save(); toast('Rent marked paid'); return render(); }
    if (a === 'flag') { const { u } = findUnit(v); u[b.dataset.f] = b.checked; save(); return render(); }
    if (a === 'clear-demo') return SU.start();
    if (a === 'add-prop') return propForm();
    if (a === 'edit-prop') return propForm(v);
    if (a === 'add-unit') return unitForm(v);
    if (a === 'edit-unit') return unitForm(S.props.find(p => p.units.some(u => u.id === v)).id, v);
    if (a === 'close') return closeSheet();
    if (a === 'save-prop') {
      const d = { name: val('f-name') || 'My property', address: val('f-addr'), built: num('f-built'), price: num('f-price'), landPct: val('f-land') === '' ? 30 : num('f-land'), insRenew: val('f-ins'), ownerOcc: $('#f-own').checked };
      if (v) Object.assign(findProp(v), d); else S.props.push({ id: uid(), units: [], ...d });
      save(); closeSheet(); return render();
    }
    if (a === 'save-unit') {
      const d = { label: val('f-label') || 'Unit', beds: num('f-beds') || 1, tenant: val('f-tenant'), lang: val('f-lang'), rent: num('f-rent'), moveIn: val('f-movein'), leaseEnd: val('f-leaseend'), deposit: num('f-deposit'), lmr: num('f-lmr'), bankRate: val('f-bank') === '' ? null : num('f-bank') };
      const uidv = b.dataset.u;
      if (uidv) {
        const u = findUnit(uidv).u;
        if (d.tenant !== u.tenant) Object.assign(u, { payments: {}, condition: false, bankReceipt: false, leaseCopy: false, leadDisclosed: false, kidsUnder6: false, leadCert: false, moveOut: '' });
        Object.assign(u, d);
      } else findProp(v).units.push({ id: uid(), payments: {}, ...d });
      save(); closeSheet(); return render();
    }
    if (a === 'del-unit') { if (!confirm('Delete this unit?')) return; for (const p of S.props) p.units = p.units.filter(u => u.id !== v); save(); closeSheet(); view = null; return render(); }
    if (a === 'moveout') { const { u } = findUnit(v); u.moveOut = today(); save(); toast('Deposit return deadline added'); return render(); }
    if (a === 'add-exp') return expForm();
    if (a === 'edit-exp') return expForm(v);
    if (a === 'del-exp') { const gone = S.expenses.find(x => x.id === v); S.expenses = S.expenses.filter(x => x.id !== v); save(); closeSheet(); render(true); undoToast('Receipt deleted', () => { S.expenses.push(gone); save(); render(true); }); return; }
    if (a === 'add-trip') return tripForm();
    if (a === 'save-exp') {
      if (photoBusy) return toast('Photo still loading, one second');
      const amt = num('f-amt'); if (!amt) return toast('Enter the amount');
      const note = val('f-note'), vendor = val('f-vendor');
      const cat = R.categorize(`${vendor} ${note}`, amt);
      const prev = $('#f-prev');
      const rec = { d: val('f-date') || today(), amt, vendor: vendor || 'Receipt', note, line: +val('f-line'), prop: val('f-prop'), photo: prev.hidden ? null : prev.src, flag: cat.flags.find(f => f.startsWith('May')) || '' };
      const old = v && S.expenses.find(x => x.id === v);
      if (old) Object.assign(old, rec); else S.expenses.push({ id: uid(), ...rec });
      if (save()) { closeSheet(); toast(old ? 'Receipt updated' : 'Receipt saved'); } return render(true);
    }
    if (a === 'save-trip') { const miles = num('f-miles'); if (!miles) return toast('Enter the miles'); S.trips.push({ id: uid(), d: val('f-date') || today(), miles, purpose: val('f-why') || 'Rental business', prop: val('f-prop') }); save(); closeSheet(); toast(`Saved: ${money2(miles * R.mileageRate(val('f-date') || today()))} deduction`); return render(); }
    if (a === 'export') return exportCsv();
    if (a === 'backup') { S.lastBackup = today(); save(); const blob = new Blob([JSON.stringify(S)], { type: 'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = `rent-desk-backup-${today()}.json`; l.click(); return render(); }
    if (a === 'triage') return triage();
    if (a === 'listing') return listing();
    if (a === 'copy-reply' || a === 'copy-listing') { try { await navigator.clipboard.writeText(val(a === 'copy-reply' ? 'reply' : 'listing-text')); toast('Copied'); } catch { toast('Select the text and copy it'); } return; }
    if (a === 'ai-reply') return copyOpen(`${CONTEXT}\n\nMy tenant sent me this message:\n"""${val('msg')}"""\n\nHere is my draft reply:\n"""${val('reply')}"""\n\nImprove my reply so it is kind, clear and legally safe. Then give me the same reply translated into the language the tenant wrote in. Also explain the reply to me in Amharic.`);
    if (a === 'ai-listing') return copyOpen(`${CONTEXT}\n\nImprove this rental listing so it gets more good applicants. Keep it honest and fair-housing compliant (no preferences about children, disability, religion, national origin, or source of income; Section 8 welcome).\n\n"""${val('listing-text')}"""`);
    if (a === 'ask') { const q = val('ask'); if (!q) return toast('Type your question'); return copyOpen(`${CONTEXT}\n\nMy question: ${q}`); }
  });

  document.addEventListener('change', async e => {
    if (e.target.dataset.su && (e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) return SU.input(e.target);
    if (e.target.id === 'restore' && e.target.files[0]) { try { const d = clean(JSON.parse(await e.target.files[0].text())); if (!d) throw 0; if (!confirm('Replace everything on this phone with this backup?')) return; S = d; save(); tab = 'home'; view = null; closeSheet(); toast('Backup restored'); render(); } catch { toast('That file is not a Rent Desk backup'); } return; }
    if (e.target.id === 'f-line') e.target.dataset.touched = '1';
    if (e.target.id === 'f-photo' && e.target.files[0]) { const p = $('#f-prev'); photoBusy = true; const d = await shrink(e.target.files[0]); photoBusy = false; if (d && p.isConnected) { p.src = d; p.hidden = false; } }
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.su && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') return SU.input(e.target);
    if (['f-vendor', 'f-note', 'f-amt'].includes(e.target.id)) {
      const c = R.categorize(`${val('f-vendor')} ${val('f-note')}`, num('f-amt'));
      const sel = $('#f-line'); if (!sel.dataset.touched) sel.value = c.line;
      $('#f-hint').innerHTML = (c.line !== 19 ? `<p>Sorted as <b>Line ${c.line} · ${c.name}</b></p>` : '') + c.flags.filter(f => f.startsWith('May')).map(f => `<p class="warn">${esc(f)}</p>`).join('');
    }
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); } });
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

  if (SU.firstRun()) SU.start(); else render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
