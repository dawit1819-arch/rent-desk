// Rent Desk first-run questions. Fills the app with the owner's real homes and builds a summary he can send to Dawit.
(function () {
  'use strict';
  window.RentDeskSetup = function (ctx) {
    const { get, save, render, esc, am, uid, toast } = ctx;
    const $ = s => document.querySelector(s);
    const yearNow = new Date().getFullYear();

    // One question per screen. type: one | many | text | count | buildings
    const STEPS = [
      { id: 'lang', type: 'one', q: 'Which language do you want?', a: 'የትኛውን ቋንቋ ይመርጣሉ?', opts: [['en', 'English'], ['both', 'English + አማርኛ'], ['am', 'More አማርኛ help']] },
      { id: 'name', type: 'text', q: 'What should the app call you?', a: 'ስምዎ ማን ነው?', ph: 'First name' },
      { id: 'count', type: 'count', q: 'How many buildings do you rent out?', a: 'ስንት ሕንፃ ያከራያሉ?', opts: [1, 2, 3, 4, 5] },
      { id: 'buildings', type: 'buildings' },
      { id: 'deposits', type: 'one', q: 'Where do you keep tenants\' security deposits?', a: 'የተከራዮችን የዋስትና ገንዘብ የት ያስቀምጣሉ?', opts: [['separate', 'In a separate bank account in Massachusetts'], ['mixed', 'In my own account, mixed with my money'], ['none', 'I don\'t take security deposits'], ['unsure', 'Not sure']] },
      { id: 'lead', type: 'one', q: 'Do you have lead paint certificates (Letter of Compliance)?', a: 'የቀለም እርሳስ (lead) የምስክር ወረቀት አለዎት?', opts: [['all', 'Yes, for every unit'], ['some', 'For some units'], ['no', 'No'], ['unsure', 'Not sure what that is']] },
      { id: 'pay', type: 'many', q: 'How do tenants pay rent?', a: 'ተከራዮች ኪራይ እንዴት ይከፍላሉ?', opts: [['check', 'Check'], ['cash', 'Cash'], ['zelle', 'Zelle / Venmo / Cash App'], ['bank', 'Bank transfer'], ['app', 'A rent app'], ['sec8', 'Section 8 pays part']] },
      { id: 'late', type: 'one', q: 'How often is rent late?', a: 'ኪራይ ምን ያህል ጊዜ ይዘገያል?', opts: [['never', 'Almost never'], ['some', 'Sometimes'], ['often', 'Every month someone is late'], ['behind', 'A tenant is far behind right now']] },
      { id: 'raise', type: 'one', q: 'When did you last raise the rent for your longest tenant?', a: 'ለረጅም ጊዜ ተከራይዎ ኪራይ መቼ ጨመሩ?', opts: [['year', 'This year'], ['2', '1-2 years ago'], ['3', '3 or more years ago'], ['never', 'Never']] },
      { id: 'taxes', type: 'one', q: 'Who does your taxes for the rentals?', a: 'የኪራይ ግብርዎን ማን ይሠራል?', opts: [['self', 'I do them myself'], ['prep', 'A tax preparer'], ['cpa', 'A CPA / accountant'], ['soft', 'TurboTax or similar']] },
      { id: 'receipts', type: 'one', q: 'How do you keep receipts for repairs and supplies?', a: 'የወጪ ደረሰኞችን እንዴት ያስቀምጣሉ?', opts: [['box', 'Paper in a box or folder'], ['phone', 'Photos on my phone'], ['bank', 'I only have bank statements'], ['no', 'I usually don\'t keep them']] },
      { id: 'pain', type: 'many', q: 'What costs you the most time or money?', a: 'ብዙ ጊዜ ወይም ገንዘብ የሚያስወጣዎት ምንድን ነው?', opts: [['late', 'Late rent'], ['repairs', 'Repairs and calls'], ['vacancy', 'Finding new tenants'], ['laws', 'Massachusetts rules and paperwork'], ['taxes', 'Taxes and bookkeeping'], ['costs', 'Insurance and property tax going up'], ['texts', 'Tenant texts and calls']] },
      { id: 'wish', type: 'text', q: 'If this app could do one thing for you, what would it be?', a: 'ይህ መተግበሪያ አንድ ነገር ቢያደርግልዎት ምን ይሆን?', ph: 'Say it in any language', long: true },
    ];
    const TOWNS = ['Malden', 'Everett', 'Medford', 'Revere', 'Boston', 'Somerville', 'Other'];

    let i = 0, draft = null;
    const S = () => get();
    const label = (st, v) => (st.opts.find(o => o[0] === v) || [, v])[1];

    function start() {
      draft = S().profile && !S().profile.done ? S().profile : { answers: {}, buildings: [] };
      i = draft.step > 0 ? draft.step : -1;
      screen.setup = true;
      ctx.setView(screen);
      render(true);
    }

    function screen() {
      if (i === -1) return welcome();
      if (i >= STEPS.length) return finish();
      const st = STEPS[i], val = draft.answers[st.id];
      const head = `<div class="steps"><div style="width:${Math.round(i / STEPS.length * 100)}%"></div></div><p class="step-n">Question ${i + 1} of ${STEPS.length}</p>`;
      const nav = `<div class="two sticky-nav">${i > 0 ? '<button data-act="su-back">← Back</button>' : '<button data-act="su-later">Later</button>'}<button class="primary" data-act="su-next">Next →</button></div>`;
      if (st.type === 'buildings') return head + buildingsStep() + nav;
      let body = '';
      if (st.type === 'one') body = st.opts.map(([k, l]) => `<button class="choice ${val === k ? 'on' : ''}" data-act="su-pick" data-v="${k}">${esc(l)}</button>`).join('');
      if (st.type === 'many') body = st.opts.map(([k, l]) => `<button class="choice ${(val || []).includes(k) ? 'on' : ''}" data-act="su-tog" data-v="${k}">${esc(l)}</button>`).join('') + '<p class="fine">Pick all that fit.</p>';
      if (st.type === 'count') body = `<div class="count">${st.opts.map(n => `<button class="choice ${val === n ? 'on' : ''}" data-act="su-pick" data-v="${n}">${n === 5 ? '5+' : n}</button>`).join('')}</div>`;
      if (st.type === 'text') body = st.long ? `<textarea id="su-text" rows="4" placeholder="${esc(st.ph)}">${esc(val || '')}</textarea>` : `<input id="su-text" value="${esc(val || '')}" placeholder="${esc(st.ph)}" autocomplete="given-name">`;
      return `${head}<section class="ask"><h1>${esc(st.q)}</h1>${am(st.a)}<div class="choices">${body}</div></section>${nav}`;
    }

    function welcome() {
      return `<section class="welcome"><div class="welcome-icon">🏠</div><h1>Let's set up Rent Desk with your homes</h1>${am('መተግበሪያውን በእርስዎ ቤቶች እናዘጋጅ')}
<p>13 short questions, about 5 minutes. Most are one tap.</p>
<p>Then the app will show <b>your</b> rents, deadlines and money, not the sample.</p>
<p class="muted">Your answers stay on this phone. At the end you can choose to send them to Dawit so he can make the app better for you.</p>
<button class="primary" data-act="su-go">Start →</button><button class="link" data-act="su-later">Look at the sample first</button></section>`;
    }

    function buildingsStep() {
      const n = draft.answers.count || 1;
      while (draft.buildings.length < n) draft.buildings.push({ town: 'Malden', era: '', live: false, units: [{ beds: 2, rent: '', occ: true, since: '', kids: false, deposit: '' }] });
      draft.buildings.length = n;
      return `<section class="ask"><h1>Tell me about ${n > 1 ? 'each building' : 'the building'}</h1>${am('ስለ ሕንፃዎቹ ይንገሩኝ')}<p class="fine">Rough numbers are fine. You can fix them later. No tenant names needed.</p>` + draft.buildings.map((b, bi) => `
<div class="bld"><h2>Building ${bi + 1}</h2>
<label>Town<select data-su="town" data-b="${bi}">${TOWNS.map(t => `<option ${b.town === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
<p class="mini-q">When was it built?</p><div class="seg">${[['old', 'Before 1978'], ['new', '1978 or later'], ['unsure', 'Not sure']].map(([k, l]) => `<button class="${b.era === k ? 'on' : ''}" data-act="su-b" data-b="${bi}" data-f="era" data-v="${k}">${l}</button>`).join('')}</div>
<label class="check"><input type="checkbox" data-su="live" data-b="${bi}" ${b.live ? 'checked' : ''}><span>I live in this building</span></label>
<p class="mini-q">How many apartments (units)?</p><div class="seg">${[1, 2, 3, 4, 5, 6].map(k => `<button class="${b.units.length === k ? 'on' : ''}" data-act="su-units" data-b="${bi}" data-v="${k}">${k}</button>`).join('')}</div>
${b.units.map((u, ui) => `<div class="u-row"><strong>Unit ${ui + 1}</strong>
<div class="form-grid"><label>Bedrooms<select data-su="beds" data-b="${bi}" data-u="${ui}">${[1, 2, 3, 4].map(k => `<option ${+u.beds === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
<label>Rent $/month<input type="number" inputmode="numeric" data-su="rent" data-b="${bi}" data-u="${ui}" value="${esc(u.rent)}" placeholder="${b.live && ui === 0 ? 'I live here' : '2400'}"></label>
<label>Tenant moved in<input type="month" data-su="since" data-b="${bi}" data-u="${ui}" value="${esc(u.since)}" max="${yearNow}-12"></label>
<label>Deposit held $<input type="number" inputmode="numeric" data-su="deposit" data-b="${bi}" data-u="${ui}" value="${esc(u.deposit)}" placeholder="0"></label></div>
<label class="check"><input type="checkbox" data-su="occ" data-b="${bi}" data-u="${ui}" ${u.occ ? 'checked' : ''}><span>Someone rents it now</span></label>
<label class="check"><input type="checkbox" data-su="kids" data-b="${bi}" data-u="${ui}" ${u.kids ? 'checked' : ''}><span>A child under 6 lives there</span></label></div>`).join('')}
</div>`).join('') + '</section>';
    }

    function summaryText() {
      const a = draft.answers, L = id => STEPS.find(s => s.id === id);
      const many = id => (a[id] || []).map(v => label(L(id), v)).join(', ') || '-';
      const lines = [`Rent Desk answers${a.name ? ' from ' + a.name : ''} (${new Date().toLocaleDateString('en-US')})`, ''];
      draft.buildings.forEach((b, bi) => {
        lines.push(`Building ${bi + 1}: ${b.town}, built ${b.era === 'old' ? 'before 1978' : b.era === 'new' ? '1978 or later' : 'not sure'}${b.live ? ', owner lives there' : ''}`);
        b.units.forEach((u, ui) => lines.push(b.live && ui === 0 && !+u.rent ? `  Unit 1: ${u.beds} bed, owner lives here` : `  Unit ${ui + 1}: ${u.beds} bed, ${u.occ ? (u.rent ? '$' + u.rent : 'rent ?') + (u.since ? ', since ' + u.since : '') : 'empty'}${u.deposit ? ', deposit $' + u.deposit : ''}${u.kids ? ', child under 6' : ''}`));
      });
      lines.push('', `Deposits kept: ${label(L('deposits'), a.deposits || '-')}`, `Lead certificates: ${label(L('lead'), a.lead || '-')}`, `Tenants pay by: ${many('pay')}`, `Late rent: ${label(L('late'), a.late || '-')}`, `Last raise for longest tenant: ${label(L('raise'), a.raise || '-')}`, `Taxes done by: ${label(L('taxes'), a.taxes || '-')}`, `Receipts: ${label(L('receipts'), a.receipts || '-')}`, `Biggest costs: ${many('pain')}`, `Wish: ${a.wish || '-'}`);
      return lines.join('\n');
    }

    // Things the answers say he should fix first.
    function risks(profile) {
      const a = (profile && profile.answers) || {}, out = [];
      const bs = (profile && profile.buildings) || [];
      if (a.deposits === 'mixed' || a.deposits === 'unsure') out.push(['law', 'Move security deposits to a separate Massachusetts bank account', 'Keeping deposits mixed with your own money can cost 3 times the deposit plus the tenant\'s lawyer fees. Open a separate interest-bearing account, move each deposit, and give each tenant a receipt with the bank name and account number.']);
      if (bs.some(b => b.era !== 'new' && b.units.some(u => u.kids)) && a.lead !== 'all') out.push(['law', 'Lead paint: a child under 6 lives in an older home', 'Massachusetts requires deleading (or interim control) when a child under 6 lives in a home built before 1978. The owner is liable even without fault. A $3,000 per unit state tax credit helps pay for it.']);
      if (a.raise === '3' || a.raise === 'never') out.push(['money', 'Check your longest tenant\'s rent', 'Many small landlords keep long-time tenants far below market. A small raise at renewal keeps a good tenant and adds up. See the Homes tab for the market range.']);
      if (a.late === 'behind') out.push(['money', 'A tenant is far behind: try RAFT first', 'RAFT can pay up to about $7,000 of back rent for eligible tenants, and the landlord fills in part of the application. It is often faster than court.']);
      if (a.receipts === 'no' || a.receipts === 'bank') out.push(['money', 'Start saving receipts here', 'Repairs, supplies, mileage and fees are all deductions. Use Money → Add a receipt; it sorts them for your tax preparer.']);
      if (bs.some(b => b.live)) out.push(['money', 'Residential exemption if you live in your building', 'Owner-occupants in Malden can apply once for the residential exemption. It can cut the tax bill by around $2,700 a year.']);
      return out;
    }

    function applyHomes() {
      const st = S();
      st.props = draft.buildings.map((b, bi) => ({
        id: uid(), name: `${b.town} building${draft.buildings.length > 1 ? ' ' + (bi + 1) : ''}`, address: `${b.town}, MA`, built: b.era === 'old' ? 1950 : b.era === 'new' ? 1990 : 0, ownerOcc: !!b.live, price: 0, landPct: 30, insRenew: '',
        units: b.units.map((u, ui) => {
          const moveIn = u.since ? `${u.since}-01` : '';
          const old = moveIn && (Date.now() - new Date(moveIn + 'T12:00:00')) > 60 * 864e5; // past move-in paperwork assumed done
          const owner = b.live && ui === 0 && !+u.rent;
          return { id: uid(), label: `Unit ${ui + 1}`, beds: +u.beds || 2, rent: owner ? 0 : +u.rent || 0, tenant: u.occ && !owner ? `Tenant ${ui + 1}` : '', note: owner ? 'Owner lives here' : '', moveIn, leaseEnd: '', deposit: +u.deposit || 0, lmr: 0, bankRate: null, bankReceipt: !!old && draft.answers.deposits === 'separate', condition: !!old, leaseCopy: !!old, leadDisclosed: !!old, kidsUnder6: !!u.kids, leadCert: draft.answers.lead === 'all', payments: {} };
        }),
      }));
      st.expenses = []; st.trips = []; st.done = {}; st.demo = false;
    }

    function finish() {
      const text = summaryText();
      return `<section class="welcome"><div class="welcome-icon">✓</div><h1>Thank you${draft.answers.name ? ', ' + esc(draft.answers.name) : ''}!</h1>${am('እናመሰግናለን!')}
<p>Your homes are now in the app. Tap below to send your answers to Dawit so he can make it better for you.</p>
<button class="primary" data-act="su-send">📤 Send my answers to Dawit</button>
<details class="rule"><summary>See what will be sent</summary><pre class="sum">${esc(text)}</pre></details>
<button data-act="su-home" class="wide-btn">Open my Rent Desk →</button></section>`;
    }

    async function send() {
      const text = summaryText();
      if (navigator.share) { try { await navigator.share({ title: 'Rent Desk answers', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      try { await navigator.clipboard.writeText(text); toast('Copied. Paste it in a text to Dawit.'); } catch { toast('Open "See what will be sent" and copy it.'); }
    }

    function store() { draft.step = i; S().profile = draft; save(); }

    function click(a, el) {
      const st = STEPS[i];
      if (a === 'su-start') { start(); return true; }
      if (a === 'su-send') { if (!draft) draft = S().profile; if (draft) send(); return true; }
      if (!draft) return false;
      if (a === 'su-go') { i = 0; store(); render(true); return true; }
      if (a === 'su-later') { draft.step = i; S().profile = draft; S().setupLater = true; save(); ctx.setView(null); render(true); return true; }
      if (a === 'su-back') { readText(); i = Math.max(0, i - 1); store(); render(true); return true; }
      if (a === 'su-next') {
        readText();
        if (st && (st.type === 'one' || st.type === 'count') && draft.answers[st.id] == null) { toast('Tap one answer (or Back)'); return true; }
        i++;
        if (i >= STEPS.length) { applyHomes(); draft.done = true; S().profile = draft; S().showAm = draft.answers.lang !== 'en'; }
        store(); render(true); return true;
      }
      if (a === 'su-pick') { draft.answers[st.id] = st.type === 'count' ? +el.dataset.v : el.dataset.v; if (st.id === 'lang') S().showAm = el.dataset.v !== 'en'; store(); render(); return true; }
      if (a === 'su-tog') { const arr = draft.answers[st.id] = draft.answers[st.id] || []; const k = el.dataset.v; arr.includes(k) ? arr.splice(arr.indexOf(k), 1) : arr.push(k); store(); render(); return true; }
      if (a === 'su-b') { draft.buildings[+el.dataset.b][el.dataset.f] = el.dataset.v; store(); render(); return true; }
      if (a === 'su-units') { const b = draft.buildings[+el.dataset.b], n = +el.dataset.v; while (b.units.length < n) b.units.push({ beds: 2, rent: '', occ: true, since: '', kids: false, deposit: '' }); b.units.length = n; store(); render(); return true; }
      if (a === 'su-home') { ctx.setView(null); ctx.setTab('home'); render(true); return true; }
      return false;
    }
    function readText() { const t = $('#su-text'); if (t) draft.answers[STEPS[i].id] = t.value.trim(); }
    function input(el) {
      const f = el.dataset.su; if (!f) return false;
      const b = draft.buildings[+el.dataset.b];
      const target = el.dataset.u != null ? b.units[+el.dataset.u] : b;
      target[f] = el.type === 'checkbox' ? el.checked : el.value;
      store();
      if (el.type === 'checkbox' || el.tagName === 'SELECT') render();
      return true;
    }

    // Home card: invite to set up, or show what the answers say to fix.
    function homeCard() {
      const p = S().profile;
      if (!p || !p.done) return `<section class="card invite"><h2>Set up with your own homes ${am('በራስዎ ቤቶች ያዘጋጁ')}</h2><p class="muted">13 quick questions. Then everything here is about your buildings.</p><button class="primary" data-act="su-start">${p && p.step ? 'Continue the questions →' : 'Start the questions →'}</button></section>`;
      const r = risks(p);
      if (!r.length) return '';
      return `<section class="card"><h2>From your answers: fix these first ${am('መጀመሪያ ያስተካክሉ')}</h2>${r.map(([lvl, t, why]) => `<details class="task lvl-${lvl}"><summary><strong>${esc(t)}</strong></summary><p>${esc(why)}</p></details>`).join('')}<button class="link" data-act="su-send">📤 Send my answers to Dawit</button></section>`;
    }

    return { start, click, input, homeCard, firstRun: () => !S().profile && !S().setupLater };
  };
})();
