/* 50 assignment sintetis deterministik. Tidak memuat data rumah tangga nyata. */
window.DTSEN = window.DTSEN || {};
(() => {
  let seed = 20260922;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const seen = new Set();
  DTSEN.assignments = Array.from({ length: 50 }, (_, i) => {
    const level = 1 + ((i * 37) % 50) / 49 * 9;
    let attributes, key;
    do {
      const score = () => Math.max(1, Math.min(10, Math.round(level + (next() - .5) * 4)));
      attributes = { basicNeeds: score(), assets: score(), expenditure: score() };
      key = JSON.stringify(attributes);
    } while (seen.has(key));
    seen.add(key);
    return { id: `A${String(i + 1).padStart(3, '0')}`, attributes };
  });
})();
