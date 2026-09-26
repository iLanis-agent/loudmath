/* LoudMath engine - daily noise dose truth-teller (NIOSH 3 dB exchange). Pure logic, no DOM. */
(function (root) {
  'use strict';

  var CRITERION_DB = 85;      /* NIOSH recommended exposure limit for 8 h */
  var EXCHANGE_DB = 3;        /* allowable time halves per +3 dB */
  var BASE_HOURS = 8;

  /* Max permissible hours at level L: 8 / 2^((L-85)/3). Below 80 dB we treat as free. */
  var FLOOR_DB = 80;

  function maxHours(db) {
    if (db <= FLOOR_DB) return Infinity;
    return BASE_HOURS / Math.pow(2, (db - CRITERION_DB) / EXCHANGE_DB);
  }

  var PRESETS = [
    { name: 'Quiet home', db: 50 },
    { name: 'Office chatter', db: 65 },
    { name: 'City traffic', db: 80 },
    { name: 'Subway platform', db: 90 },
    { name: 'Lawn mower', db: 95 },
    { name: 'Headphones, loud', db: 95 },
    { name: 'Motorcycle', db: 100 },
    { name: 'Ambulance siren', db: 110 },
    { name: 'Rock concert', db: 110 },
    { name: 'Club night', db: 105 },
    { name: 'Power tools', db: 100 },
    { name: 'Movie action scene', db: 90 }
  ];

  function normEntry(raw, idx) {
    if (!raw || typeof raw !== 'object') throw new Error('Entry ' + (idx + 1) + ' is not an object');
    var name = String(raw.name == null ? '' : raw.name).trim();
    if (!name) throw new Error('Entry ' + (idx + 1) + ' needs a name');
    var db = Number(raw.db);
    if (!isFinite(db) || db < 30 || db > 140) throw new Error('"' + name + '" needs a level between 30 and 140 dB');
    var minutes = Number(raw.minutes);
    if (!isFinite(minutes) || minutes <= 0 || minutes > 1440) throw new Error('"' + name + '" needs minutes between 0 and 1440');
    return { name: name, db: db, minutes: minutes };
  }

  function analyze(input) {
    if (!input || typeof input !== 'object') throw new Error('No input');
    var raw = input.entries;
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('Add at least one sound');
    var daysPerWeek = input.daysPerWeek == null || input.daysPerWeek === '' ? 1 : Number(input.daysPerWeek);
    if (!isFinite(daysPerWeek) || daysPerWeek < 0.5 || daysPerWeek > 7) throw new Error('Days per week must be 0.5-7');

    var entries = raw.map(normEntry);
    var dose = 0;
    var loudest = null;
    var biggestDose = null;
    var rows = entries.map(function (e) {
      var maxH = maxHours(e.db);
      var share = maxH === Infinity ? 0 : (e.minutes / 60) / maxH;
      dose += share;
      var row = {
        name: e.name, db: e.db, minutes: e.minutes,
        maxMinutes: maxH === Infinity ? null : Math.round(maxH * 60),
        doseShare: Math.round(share * 1000) / 10
      };
      if (!loudest || e.db > loudest.db) loudest = row;
      if (!biggestDose || row.doseShare > biggestDose.doseShare) biggestDose = row;
      return row;
    });
    rows.sort(function (a, b) { return b.doseShare - a.doseShare; });

    var dosePct = Math.round(dose * 1000) / 10;
    var band;
    if (dosePct < 25) band = 'easy on the ears';
    else if (dosePct < 75) band = 'within budget';
    else if (dosePct <= 100) band = 'at the limit';
    else band = 'over the limit';

    /* How long until the loudest source alone burns the whole day. */
    var loudestAlone = loudest.maxMinutes == null ? null : loudest.maxMinutes;

    /* Weekly dose if this pattern repeats. */
    var weeklyPct = Math.round(dosePct * daysPerWeek);

    var verdict = 'Today adds up to ' + dosePct + '% of a safe daily noise dose - "' + band + '".';
    if (biggestDose && biggestDose.doseShare > 0) {
      verdict += ' Biggest bite: ' + biggestDose.name + ' at ' + biggestDose.db + ' dB ate ' +
        biggestDose.doseShare + '% of the budget in ' + biggestDose.minutes + ' min' +
        (biggestDose.maxMinutes != null ? ' (alone, it would be over in ' + biggestDose.maxMinutes + ' min)' : '') + '.';
    }
    if (loudestAlone != null && loudest.db > FLOOR_DB) {
      verdict += ' Loudest sound: ' + loudest.name + ' (' + loudest.db + ' dB) - the safe allowance there is only ' + loudestAlone + ' min a day.';
    }
    if (daysPerWeek > 1) {
      verdict += ' At ' + daysPerWeek + ' days a week this pattern is a ' + weeklyPct + '% weekly dose.';
    }

    return {
      rows: rows,
      dosePct: dosePct,
      band: band,
      loudest: loudest,
      biggestDose: biggestDose,
      weeklyPct: weeklyPct,
      daysPerWeek: daysPerWeek,
      verdict: verdict
    };
  }

  var api = { analyze: analyze, maxHours: maxHours, PRESETS: PRESETS, CRITERION_DB: CRITERION_DB, EXCHANGE_DB: EXCHANGE_DB };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LoudMathEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
