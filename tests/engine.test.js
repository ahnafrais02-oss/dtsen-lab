/* Pengujian invariant dan tujuan Revisi 2. Buka tests/index.html. */
(() => {
  let passed = 0;
  const log = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); passed++; };
  const throws = (fn, message) => { let caught = false; try { fn(); } catch (_) { caught = true; } assert(caught, message); };
  const base = DTSEN.assignments, snapshot = JSON.stringify(base);
  assert(base.length === 50, 'Populasi 50');
  assert(new Set(base.map(a => a.id)).size === 50 && base[49].id === 'A050', 'ID A001–A050 unik');
  assert(base.every(a => Object.keys(a.attributes).length === 3 && Object.values(a.attributes).every(v => Number.isInteger(v) && v >= 1 && v <= 10)), 'Tiga atribut integer 1–10');
  for (let rank = 1; rank <= 50; rank++) assert(DTSEN.calculateDecile(rank) === Math.ceil((51 - rank) / 5), `Pemetaan rank ${rank}`);
  for (let m = 1; m <= 4; m++) for (const direction of [1, -1, 0]) {
    const scenario = DTSEN.createScenario(m, direction), r = scenario.result, f = r.comparisons.find(a => a.id === scenario.focus);
    assert(DTSEN.validateSimulationResult(r), 'Validasi populasi');
    assert(r.after.every((a, i) => a.rank === i + 1), 'Ranking 1–50');
    assert(r.after.every(a => a.welfareScore >= 1 && a.welfareScore <= 10), 'Indeks dalam skala 1–10');
    for (let d = 1; d <= 10; d++) assert(r.after.filter(a => a.decile === d).length === 5, 'Tepat lima assignment per desil');
    assert(direction === 0 ? f.newScore === f.oldScore && !f.dataChanged : Math.sign(f.newScore - f.oldScore) === direction && f.dataChanged, 'Arah indeks fokus sesuai pilihan');
    if (direction !== 0 && m <= 2) {
      assert(r.changedAssignments.length === 1 && f.rankDelta !== 0, 'Skema 1–2 satu perubahan dan ranking bergerak');
      assert(direction * f.rankDelta > 0 && direction * f.decileDelta >= 0, 'Arah ranking dan desil');
      assert(m === 1 ? f.decileDelta === 0 : f.decileDelta !== 0, 'Tujuan skema 1–2');
      assert(r.rankingChanges.some(a => a.id !== f.id && !a.dataChanged), 'Assignment lain ikut bergeser');
      if (m === 2) assert(r.decileChanges.some(a => a.id !== f.id && !a.dataChanged), 'Posisi desil yang ditinggalkan terisi');
    }
    if (direction === 0 && m <= 2) assert(r.changedAssignments.length === 0 && r.rankingChanges.length === 0, 'Pembanding tanpa perubahan');
    if (m >= 3) assert(r.changedAssignments.length >= 5, 'Skema 3–4 sedikitnya lima data berubah');
    if (m === 4) {
      assert(f.rankDelta === 0 && f.decileDelta === 0, 'Misi 4: fokus tetap ranking dan desil');
      assert(r.rankingChanges.filter(a => a.id !== f.id).length >= 5, 'Misi 4: sedikitnya lima assignment lain benar-benar bergeser');
    }
    assert(JSON.stringify(DTSEN.createScenario(m, direction)) === JSON.stringify(scenario), 'Skenario deterministik');
    r.after[0].attributes.assets = 999;
    assert(DTSEN.createScenario(m, direction).result.after[0].attributes.assets !== 999, 'Cache tidak bocor lewat mutasi output');
    log.push(`Misi ${m} (${direction > 0 ? 'naik' : direction < 0 ? 'turun' : 'tetap'}): ${f.id}, ranking ${f.oldRank} → ${f.newRank}, desil ${f.oldDecile} → ${f.newDecile}, ${r.rankingChanges.length} ranking bergeser.`);
  }
  assert(JSON.stringify(base) === snapshot, 'Data awal tidak dimutasi');
  const equal = base.map(a => ({ id: a.id, attributes: { basicNeeds: 5, assets: 5, expenditure: 5 } }));
  equal[49].attributes = { basicNeeds: 2, assets: 7, expenditure: 7 };
  const tied = DTSEN.calculateRanking(equal.reverse());
  assert(tied.every(a => a.welfareScore === 5), 'Nilai sama dihitung konsisten');
  assert(tied[0].id === 'A050', 'Tie: peringkat pengeluaran tertinggi didahulukan');
  assert(tied[1].id === 'A001' && tied[49].id === 'A049', 'Tie: ID menaik');
  const none = DTSEN.simulateChanges(base, [], 'A001');
  assert(none.changedAssignments.length === 0 && none.rankingChanges.length === 0, 'Tanpa perubahan');
  throws(() => DTSEN.calculateRanking(base.slice(1)), 'Tolak populasi kurang');
  const duplicate = DTSEN.clone(base); duplicate[1].id = duplicate[0].id;
  throws(() => DTSEN.calculateRanking(duplicate), 'Tolak ID duplikat');
  throws(() => DTSEN.simulateChanges(base, [{id:'A999',attributes:{assets:1}}]), 'Tolak ID asing');
  for (const invalid of [0, 11, 1.5, NaN, Infinity]) throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{assets:invalid}}]), 'Tolak atribut invalid');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{rank:3}}]), 'Tolak mengubah ranking langsung');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{income:1000}}]), 'Atribut lama dihapus');
  throws(() => DTSEN.calculateDecile(0), 'Tolak rank nol');
  throws(() => DTSEN.calculateDecile(51), 'Tolak rank di luar 50');
  const broken = DTSEN.clone(none); broken.after[0].decile = 1;
  throws(() => DTSEN.validateSimulationResult(broken), 'Deteksi desil rusak');
  DTSEN.testReport = `${passed} pemeriksaan LULUS\n\n${log.join('\n')}`;
})();
