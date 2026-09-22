/* Seluruh assignment sintetis. Generator ber-seed tetap; tanpa data pribadi. */
window.DTSEN = window.DTSEN || {};
(() => {
  let seed = 20260922;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  DTSEN.assignments = Array.from({ length: 100 }, (_, i) => {
    const level = ((i * 37) % 100) / 99;
    const householdSize = 2 + Math.floor(next() * 5);
    return { id: `A${String(i + 1).padStart(3, '0')}`, attributes: {
      income: Math.round((250000 + level * 3600000 + next() * 180000) * householdSize / 1000) * 1000,
      householdSize,
      housing: Math.min(5, 1 + Math.floor(level * 4 + next())),
      electricity: Math.min(5, 1 + Math.floor(level * 4 + next())),
      asset: Math.min(5, 1 + Math.floor(level * 4 + next())),
      education: Math.min(5, 1 + Math.floor(level * 4 + next()))
    }};
  });
})();
