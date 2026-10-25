// Rent Desk rules: Massachusetts landlord law + money math. No AI here; everything is fixed rules with sources.
// Last checked 2026-10-21. Not legal or tax advice.
(function (root) {
  'use strict';
  const CHECKED = '2026-10-21';
  const DAY = 864e5;
  const toDate = s => new Date(s + 'T12:00:00');
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const addDays = (s, n) => iso(new Date(toDate(s).getTime() + n * DAY));
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
  const leap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const anniv = (s, y) => { let md = s.slice(5, 10); if (md === '02-29' && !leap(y)) md = '02-28'; return `${y}-${md}`; };

  const SRC = {
    deposit: ['M.G.L. c.186 §15B', 'https://malegislature.gov/Laws/GeneralLaws/PartII/TitleI/Chapter186/Section15B'],
    lease: ['940 CMR 3.17', 'https://www.law.cornell.edu/regulations/massachusetts/940-CMR-3-17'],
    lead: ['MA Lead Law (c.111 §197)', 'https://www.mass.gov/the-massachusetts-lead-law'],
    leaddisc: ['Tenant Lead Law Notification', 'https://www.mass.gov/info-details/tenant-lead-law-notification'],
    voucher: ['M.G.L. c.151B §4(10)', 'https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXI/Chapter151B/Section4'],
    abate: ['M.G.L. c.59 §59', 'https://malegislature.gov/Laws/GeneralLaws/PartI/TitleIX/Chapter59/Section59'],
    exempt: ['City of Malden', 'https://cityofmalden.org/602/Residential-Tax-Exemption-Program'],
    tax: ['City of Malden', 'https://www.cityofmalden.org/236/Property-Tax'],
    heat: ['105 CMR 410.180', 'https://www.mass.gov/doc/guidance-on-housing-code-temperature-requirements/download'],
    masssave: ['Mass Save', 'https://www.masssave.com/ht/multi-family/energy-assessments/landlords-with-1-4-unit-properties'],
    notice: ['Notice to quit + required form', 'https://www.mass.gov/info-details/notice-to-quit-accompanying-form'],
    raft: ['M.G.L. c.239 §15 + RAFT', 'https://www.mass.gov/how-to/apply-for-emergency-housing-payment-assistance-with-raft'],
    irs527: ['IRS Pub 527', 'https://www.irs.gov/publications/p527'],
    mileage: ['IRS 2026 mileage rate', 'https://www.irs.gov/newsroom/irs-sets-2026-business-standard-mileage-rate-at-725-cents-per-mile-up-25-cents'],
  };

  // Malden rent ranges by bedrooms. Only the 2BR row is sourced (RentHop ZIP 02148 median $2,500; Rentometer citywide avg ~$3,063).
  // Other rows are scaled guesses and say so in the app. Voucher ceiling = 02148 Small Area FMR from a third-party site, unverified.
  const MARKET = {
    1: { low: 2100, high: 2550, sourced: false, voucher: null },
    2: { low: 2500, high: 3060, sourced: true, voucher: 3030 },
    3: { low: 2900, high: 3600, sourced: false, voucher: null },
    4: { low: 3300, high: 4100, sourced: false, voucher: null },
  };

  function rentCheck(beds, rent) {
    const m = MARKET[Math.min(4, Math.max(1, beds | 0))];
    const mid = Math.round((m.low + m.high) / 2);
    const gapLow = Math.max(0, m.low - rent), gapMid = Math.max(0, mid - rent);
    let verdict = 'fair';
    if (rent < m.low) verdict = 'under';
    else if (rent > m.high) verdict = 'over';
    return { ...m, mid, gapLow, gapMid, yearLow: gapLow * 12, yearMid: gapMid * 12, verdict };
  }

  // Schedule E lines (Form 1040 Schedule E, Part I).
  const SCHED_E = {
    5: 'Advertising', 6: 'Auto and travel', 7: 'Cleaning and maintenance', 8: 'Commissions', 9: 'Insurance',
    10: 'Legal and other professional fees', 11: 'Management fees', 12: 'Mortgage interest', 13: 'Other interest',
    14: 'Repairs', 15: 'Supplies', 16: 'Taxes', 17: 'Utilities', 19: 'Other',
  };
  const CAT_WORDS = [
    [9, /insur|policy|premium|steadily|liberty mutual|safety ins|arbella|plymouth rock/i],
    [16, /property tax|real estate tax|city of malden|tax bill|excise/i],
    [12, /mortgage|loan interest|salem five|escrow interest/i],
    [10, /lawyer|attorney|legal|cpa|accountant|tax prep|court|filing fee|housing court/i],
    [5, /zillow|apartments\.com|craigslist|facebook ad|listing|advert|\bsigns?\b/i],
    [8, /broker|commission|realtor fee/i],
    [11, /property manag|management fee/i],
    [7, /clean|landscap|snow|plow|lawn|pest|exterminat|gutter/i],
    [15, /home depot|lowe|ace hardware|supplies|bulb|filter|battery|smoke detector|paint supply/i],
    [14, /repair|roof|contractor|plumb|electrician|\bfix|leak|boiler service|furnace service|handyman|locksmith/i],
    [17, /national grid|eversource|water bill|sewer|gas bill|\belectric(ity)? bill|utility|utilities|trash|mwra/i],
    [6, /mileage|gas station|parking|toll|uber|lyft/i],
  ];
  const IMPROVE_WORDS = /new roof|replace(d|ment)? (the )?(roof|boiler|furnace|windows|kitchen|bath)|renovat|remodel|addition|install(ed|ation)? (new )?(boiler|furnace|heat pump|windows|siding|deck)|new (kitchen|bathroom|windows|siding|deck|boiler|furnace)/i;

  function categorize(text, amount) {
    let line = 19;
    for (const [l, re] of CAT_WORDS) if (re.test(text)) { line = l; break; }
    const flags = [];
    if (IMPROVE_WORDS.test(text) || (line === 14 && amount > 2500))
      flags.push('May be an improvement, not a repair. Improvements are usually depreciated over years instead of deducted at once. Ask your tax preparer. (Items $2,500 or less per invoice can often be deducted at once if your preparer makes the yearly de minimis safe-harbor election.)');
    if (line === 19) flags.push('Could not tell the category. Pick one.');
    return { line, name: SCHED_E[line], flags };
  }

  // IRS business mileage: 2026 = 72.5c Jan-Jun, 76c Jul-Dec (irs.gov/tax-professionals/standard-mileage-rates, checked 2026-10-21).
  const mileageRate = d => (d >= '2026-07-01' ? 0.76 : 0.725);
  const depreciation = (price, landPct) => Math.round(price * (1 - landPct / 100) / 27.5);

  // Fair housing: phrases that break federal or MA law in rental ads.
  const FAIR_HOUSING = [
    [/\bno (section ?8|vouchers?|rental assistance|housing programs?)\b|section ?8 not accepted|must not (be on|use) (assistance|section ?8)/i, 'Refusing Section 8 or rental assistance is illegal in Massachusetts for every landlord.', 'voucher'],
    [/\bno (kids|children|babies)\b|\badults? only|not suitable for (kids|children)|perfect for (a )?(single|couple)|couples? only|singles? only|mature (couple|person)/i, 'Turning away families with children is illegal (and lead paint is not a legal excuse).', 'lead'],
    [/english (speakers? )?only|must speak english|(christian|muslim|jewish) (only|preferred|home)|american (citizens? )?only|no immigrants/i, 'Ads cannot prefer a religion, national origin or language group.', 'voucher'],
    [/no (wheelchairs?|disabled|handicap)|able[- ]bodied|must (be able to )?climb stairs|no (service|emotional support) animals/i, 'Ads cannot exclude people with disabilities or deny assistance animals.', 'voucher'],
    [/must be employed|employment income only|no (welfare|public assistance|ssi|ssdi)/i, 'Requiring job income only can be source-of-income discrimination in MA. Ask about income in general instead.', 'voucher'],
    [/(male|female|men|women) only|gentlem[ae]n only|ladies only/i, 'Ads cannot limit by sex (except in shared living space in the owner\'s own home).', 'voucher'],
  ];
  function fairHousingCheck(text) {
    return FAIR_HOUSING.filter(([re]) => re.test(text)).map(([re, why, s]) => ({ match: (text.match(re) || [''])[0], why, src: SRC[s] }));
  }

  // Tenant message triage. Safety first: emergencies always say call a pro / 911 before anything else.
  const MSG_TYPES = [
    ['emergency', /gas smell|\bgas leak|smell(s|ing)? ((like|of) )?gas\b|carbon monoxide|\bco alarm|\bco detector (is )?(going|beeping)|\bfire\b|on fire|smoke (in|coming)|\bspark|burning smell|\bflood|water (is )?(pouring|coming through)|ceiling (is )?(leaking|falling)|sewage|no heat|heat (is )?(off|not working|out)|freezing|broke(n)? in|break[- ]in/i],
    ['repair', /broken|not working|doesn'?t work|\bleak|clog|drip|toilet|\bsink\b|faucet|outlet|\blights?\b|\bdoor|\block\b|\bwindows?\b|mold|\bmice\b|\bmouse\b|roach|\bbugs?\b|appliance|fridge|stove|\boven\b|washer|dryer|hot water/i],
    ['payment', /\brent\b|\bpay(ment|ing)?\b|\blate\b|money|rent check|pay by check|venmo|zelle|short this month|can'?t pay|extension|\braft\b|assistance/i],
    ['moveout', /move out|moving out|lease end|not renew|deposit back|security deposit/i],
  ];
  function classifyMessage(text) {
    for (const [type, re] of MSG_TYPES) if (re.test(text)) return type;
    return 'other';
  }
  const REPLIES = {
    emergency: 'Thank you for telling me right away. If you smell gas, see smoke or fire, or a CO alarm is going off, leave the unit now and call 911 first. I am calling a licensed professional now and will update you within the hour.',
    repair: 'Thank you for letting me know. I will have it looked at. Can you send a photo and tell me two times this week when someone can come in? I will give you at least a day\'s notice before anyone enters.',
    payment: 'Thank you for telling me early. Let\'s work out a plan. If you are short because of hardship, you may qualify for RAFT emergency rental assistance (mass.gov/raft). I can fill in the landlord part of the application quickly.',
    moveout: 'Thank you for the notice. Please send your move-out date in writing. I will do a walk-through with you, and your security deposit plus interest will be returned within 30 days of move-out, with a written list of any deductions.',
    other: 'Thank you for your message. I will get back to you by tomorrow.',
  };
  const TYPE_NAMES = { emergency: 'Emergency', repair: 'Repair request', payment: 'Rent / payment', moveout: 'Moving out / deposit', other: 'General' };

  // Security deposit interest: 5% a year or the bank's lower rate (deposit). Last month's rent: 5% a year.
  function depositInterest(unit) {
    const rate = Math.min(5, unit.bankRate == null ? 5 : unit.bankRate) / 100;
    return { deposit: Math.round((unit.deposit || 0) * rate * 100) / 100, lmr: Math.round((unit.lmr || 0) * 0.05 * 100) / 100, rate: rate * 100 };
  }

  // Build every dated task for the owner. today = 'YYYY-MM-DD'.
  function tasks(props, today, done) {
    done = done || {};
    const out = [];
    const add = (t) => { if (!done[t.key]) out.push(t); };
    const y = +today.slice(0, 4);
    for (const p of props) {
      for (const u of p.units) {
        if (!u.tenant) continue;
        const name = `${p.name} · ${u.label}`;
        if (u.moveIn && u.deposit) {
          if (!u.condition) add({ key: `cond-${u.id}-${u.moveIn}`, date: addDays(u.moveIn, 10), title: 'Give the statement of condition', where: name, why: 'With a security deposit, a signed statement of the unit\'s condition is due within 10 days after the tenancy starts (or when the deposit is paid, if later). The tenant then has 15 days to add to it.', src: SRC.deposit, level: 'law', unit: u.id });
          if (!u.bankReceipt) add({ key: `bank-${u.id}-${u.moveIn}`, date: addDays(u.moveIn, 30), title: 'Give the deposit bank receipt', where: name, why: 'The deposit must be in a separate interest-bearing account at a Massachusetts bank. Within 30 days give the tenant a receipt with the bank name, address and account number. Getting this wrong can cost 3× the deposit plus their lawyer fees.', src: SRC.deposit, level: 'law', unit: u.id });
        }
        if (u.moveIn && !u.leaseCopy) add({ key: `lease-${u.id}-${u.moveIn}`, date: addDays(u.moveIn, 30), title: 'Give a signed copy of the lease', where: name, why: 'The tenant must get a signed copy of the lease within 30 days of signing it. It must list the owner\'s name, address and phone and who handles repairs.', src: SRC.lease, level: 'law', unit: u.id });
        if (u.moveIn && (u.deposit || u.lmr)) {
          // next interest anniversary on or after today
          let a = anniv(u.moveIn, y);
          if (a < today && (done[`int-${u.id}-${a}`] || daysBetween(u.moveIn, a) < 365)) a = anniv(u.moveIn, y + 1);
          if (daysBetween(u.moveIn, a) >= 365) {
            const i = depositInterest(u);
            add({ key: `int-${u.id}-${a}`, date: a, title: `Pay deposit interest ($${(i.deposit + i.lmr).toFixed(2)})`, where: name, why: `Each year on the move-in anniversary, pay or credit interest: $${i.deposit.toFixed(2)} on the deposit (${i.rate}% or the bank rate) and $${i.lmr.toFixed(2)} on last month's rent (5%). Give a written statement.`, src: SRC.deposit, level: 'law', unit: u.id });
          }
        }
        if (u.moveOut) add({ key: `return-${u.id}-${u.moveOut}`, date: addDays(u.moveOut, 30), title: 'Return the security deposit', where: name, why: 'Return the deposit plus interest within 30 days of move-out. Any deduction needs an itemized list signed under the pains and penalties of perjury, with receipts or estimates. Late or sloppy = up to 3× the deposit.', src: SRC.deposit, level: 'law', unit: u.id });
        if (p.built && p.built < 1978 && u.kidsUnder6 && !u.leadCert) add({ key: `lead-${u.id}`, date: today, title: 'Lead paint: child under 6 in a pre-1978 home', where: name, why: `${p.name} was built in ${p.built}. With a child under 6 living there, the law requires deleading (or interim control) and a Letter of Compliance. You are liable even without negligence. There is a $3,000 per unit state tax credit.`, src: SRC.lead, level: 'law', unit: u.id });
        if (p.built && p.built < 1978 && !u.leadDisclosed) add({ key: `leaddisc-${u.id}-${u.moveIn}`, date: u.moveIn && u.moveIn > today ? u.moveIn : today, title: 'Lead paint notice for the tenant', where: name, why: `${p.name} was built before 1978. Every new tenant must get the state Tenant Lead Law Notification and the lead disclosure form before signing, whether or not children live there. Keep a signed copy.`, src: SRC.leaddisc, level: 'law', unit: u.id });
        if (u.leaseEnd) {
          const d = addDays(u.leaseEnd, -60);
          if (u.leaseEnd >= today) add({ key: `renew-${u.id}-${u.leaseEnd}`, date: d < today ? today : d, title: 'Decide on renewal and rent', where: name, why: 'Lease ends ' + u.leaseEnd + '. Check the rent against the market (Units tab) and tell the tenant early. A new lease or a written notice is needed to change the rent.', src: SRC.lease, level: 'money', unit: u.id });
        }
      }
      if (p.insRenew) {
        let d = anniv(p.insRenew, y); if (d < today) d = anniv(p.insRenew, y + 1);
        add({ key: `ins-${p.id}-${d}`, date: addDays(d, -30), title: 'Shop the insurance before renewal', where: p.name, why: 'Massachusetts home insurance rose about 43% recently, the fastest of any state. Get 2-3 quotes a month before renewal on ' + d + '.', src: ['Stacker / Steadily', 'https://www.steadily.com/landlord-insurance/massachusetts'], level: 'money' });
      }
      if (p.ownerOcc) add({ key: `exempt-${p.id}`, date: `${y}-03-31` < today ? `${y + 1}-03-31` : `${y}-03-31`, title: 'Residential exemption (owner-occupied)', where: p.name, why: 'If you live in this building, apply once for Malden\'s residential exemption. It can cut the bill by around $2,700 a year. The city page says March 31 (its filing guide mentions April 1 in some cases), so confirm with the assessor. No need to reapply unless ownership changes.', src: SRC.exempt, level: 'money', once: true });
      if (p.built && p.built < 2015) add({ key: `masssave-${p.id}`, date: today, title: 'Free Mass Save energy assessment', where: p.name, why: 'Landlords of 1-4 unit buildings get a no-cost assessment and up to 100% of approved insulation when all units take part. Call 1-866-527-7283.', src: SRC.masssave, level: 'money', once: true });
    }
    // City and season dates (every year).
    const yearly = [
      ['02-01', 'Property tax abatement deadline', 'If the assessed value looks too high, the abatement application is due by the date the 3rd-quarter bill is due (Feb 1). It cannot be extended.', SRC.abate],
      ['02-01', 'Property tax bill due (Q3)', 'Malden bills are due Aug 1, Nov 1, Feb 1 and May 1.', SRC.tax],
      ['05-01', 'Property tax bill due (Q4)', 'Malden bills are due Aug 1, Nov 1, Feb 1 and May 1.', SRC.tax],
      ['08-01', 'Property tax bill due (Q1)', 'Malden bills are due Aug 1, Nov 1, Feb 1 and May 1.', SRC.tax],
      ['11-01', 'Property tax bill due (Q2)', 'Malden bills are due Aug 1, Nov 1, Feb 1 and May 1.', SRC.tax],
      ['09-01', 'Get the heat ready', 'Heating season starts Sept 15: at least 68°F 7am-11pm and 64°F at night, no more than 78°F. Service the boiler/furnace and test smoke and CO alarms now.', SRC.heat],
      ['01-31', 'Send tax papers to your preparer', 'Export your Schedule E summary and mileage from the Money tab.', SRC.irs527],
    ];
    for (const [md, title, why, src] of yearly) {
      let d = `${y}-${md}`; if (d < today) d = `${y + 1}-${md}`;
      add({ key: `y-${title}-${d}`, date: d, title, where: 'All properties', why, src, level: title.includes('abatement') ? 'money' : 'date' });
    }
    out.sort((a, b) => a.date.localeCompare(b.date));
    for (const t of out) t.days = daysBetween(today, t.date);
    return out;
  }

  // Rent status for a month. MA: no late fee until rent is 30 days late.
  function rentStatus(unit, month, today) {
    if (!unit.tenant) return { state: 'vacant' };
    if (unit.payments && unit.payments[month]) return { state: 'paid', on: unit.payments[month] };
    if (unit.moveIn && unit.moveIn.slice(0, 7) > month) return { state: 'notyet' };
    const due = `${month}-01`;
    const late = daysBetween(due, today);
    if (late < 0) return { state: 'upcoming' };
    if (late <= 5) return { state: 'due', late };
    return { state: 'late', late, feeAllowed: late >= 30, feeDate: addDays(due, 30) };
  }

  const api = { CHECKED, SRC, MARKET, SCHED_E, mileageRate, rentCheck, categorize, depreciation, fairHousingCheck, classifyMessage, REPLIES, TYPE_NAMES, depositInterest, tasks, rentStatus, addDays, daysBetween, iso };
  if (typeof module !== 'undefined') module.exports = api; else root.RULES = api;
})(this);
