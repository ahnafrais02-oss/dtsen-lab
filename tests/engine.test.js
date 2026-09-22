/* Bisa dijalankan lewat tests/index.html atau JavaScriptCore. */
(() => {
  let passed = 0;
  const log = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); passed++; };
  const throws = (fn, message) => { let caught = false; try { fn(); } catch (_) { caught = true; } assert(caught, message); };
  const base = DTSEN.assignments, snapshot = JSON.stringify(base);
  assert(base.length === 100, 'Populasi 100');
  assert(new Set(base.map(a => a.id)).size === 100, 'ID unik');
  assert(base[0].id === 'A001' && base[99].id === 'A100', 'Rentang ID');
  const ranked = DTSEN.calculateRanking(base);
  assert(ranked[0].welfareScore >= ranked[99].welfareScore, 'Arah ranking');
  for (let rank = 1; rank <= 100; rank++) assert(DTSEN.calculateDecile(rank) === Math.ceil((101 - rank) / 10), `Pemetaan rank ${rank}`);
  for (let m = 1; m <= 4; m++) for (const direction of [1, -1]) {
    const scenario = DTSEN.createScenario(m, direction), r = scenario.result, f = r.comparisons.find(a => a.id === scenario.focus);
    assert(DTSEN.validateSimulationResult(r), 'Validasi seluruh populasi');
    assert(r.after.every((a, i) => a.rank === i + 1), 'Ranking 1–100');
    for (let d = 1; d <= 10; d++) assert(r.after.filter(a => a.decile === d).length === 10, 'Sepuluh anggota tiap desil');
    assert(r.changedAssignments.every(c => c.dataChanged), 'Perubahan data nyata');
    if (m === 1) assert(r.changedAssignments.length === 1 && f.rankDelta !== 0 && f.decileDelta === 0, 'Misi 1');
    if (m === 2) {
      assert(r.changedAssignments.length === 1 && f.rankDelta !== 0 && f.decileDelta !== 0, 'Misi 2');
      assert(r.decileChanges.some(c => c.id !== f.id && !c.dataChanged), 'Efek desil pada data yang tetap');
    }
    if (m === 3) assert(r.changedAssignments.length >= 5 && f.dataChanged, 'Misi 3');
    if (m === 4) assert(r.changedAssignments.length >= 5 && f.dataChanged && Math.abs(f.rankDelta) <= 1 && f.decileDelta === 0, 'Misi 4');
    assert(Math.sign(f.newScore - f.oldScore) === direction, 'Arah kesejahteraan fokus sesuai pilihan');
    assert(direction * f.rankDelta >= 0 && direction * f.decileDelta >= 0, 'Arah ranking/desil konsisten pada preset naik/turun');
    assert(JSON.stringify(DTSEN.createScenario(m, direction)) === JSON.stringify(scenario), 'Skenario deterministik');
    log.push(`Misi ${m} (${direction > 0 ? 'naik' : 'turun'}): ${f.id}, ranking ${f.oldRank} → ${f.newRank}, desil ${f.oldDecile} → ${f.newDecile}, ${r.changedAssignments.length} data berubah.`);
  }
  for (let m = 1; m <= 4; m++) {
    const scenario = DTSEN.createScenario(m, 0), r = scenario.result, f = r.comparisons.find(a => a.id === scenario.focus);
    assert(DTSEN.validateSimulationResult(r), 'Populasi kondisi tetap valid');
    assert(f.oldScore === f.newScore && !f.dataChanged, 'Kesejahteraan tetap harus mempertahankan indeks dan data fokus');
    assert(m <= 2 ? r.changedAssignments.length === 0 && r.rankingChanges.length === 0 : r.changedAssignments.length >= 5, 'Kondisi pembanding atau lima data lain berubah');
    assert(m !== 4 || (f.rankDelta === 0 && f.decileDelta === 0), 'Skema 4 tetap tidak menggeser fokus');
    assert(m !== 3 || f.rankDelta !== 0, 'Skema 3 tetap menunjukkan pengaruh populasi');
    log.push(`Misi ${m} (tetap): ${f.id}, ranking ${f.oldRank} → ${f.newRank}, desil ${f.oldDecile} → ${f.newDecile}, ${r.changedAssignments.length} data berubah.`);
  }
  assert(JSON.stringify(base) === snapshot, 'Data awal tidak dimutasi');
  const equal = base.map(a => ({ id: a.id, attributes: { income: 3000000, householdSize: 3, housing: 1, electricity: 1, asset: 1, education: 1 } }));
  equal[99].attributes.income = 6000000; equal[99].attributes.householdSize = 6;
  const tied = DTSEN.calculateRanking(equal.reverse());
  assert(tied[0].id === 'A100', 'Tie: pendapatan tertinggi didahulukan');
  assert(tied[1].id === 'A001' && tied[99].id === 'A099', 'Tie: ID menaik');
  const none = DTSEN.simulateChanges(base, [], 'A001');
  assert(none.changedAssignments.length === 0 && none.rankingChanges.length === 0, 'Tanpa perubahan');
  const extreme = DTSEN.simulateChanges(base, [{id:'A001',attributes:{income:1000000000}}], 'A001');
  assert(extreme.after[0].id === 'A001', 'Perpindahan besar dihitung');
  throws(() => DTSEN.calculateRanking(base.slice(1)), 'Tolak populasi kurang');
  const duplicate = DTSEN.clone(base); duplicate[1].id = duplicate[0].id;
  throws(() => DTSEN.calculateRanking(duplicate), 'Tolak ID duplikat');
  throws(() => DTSEN.simulateChanges(base, [{id:'A999',attributes:{income:1}}]), 'Tolak ID asing');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{income:-1}}]), 'Tolak pendapatan negatif');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{householdSize:0}}]), 'Tolak pembagi nol');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{asset:6}}]), 'Tolak level di luar batas');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{rank:3}}]), 'Tolak mengubah rank langsung');
  throws(() => DTSEN.simulateChanges(base, [{id:'A001',attributes:{income:NaN}}]), 'Tolak NaN');
  throws(() => DTSEN.calculateDecile(0), 'Tolak rank nol');
  const broken = DTSEN.clone(none); broken.after[0].decile = 1;
  throws(() => DTSEN.validateSimulationResult(broken), 'Deteksi desil rusak');
  DTSEN.testReport = `${passed} pemeriksaan LULUS\n\n${log.join('\n')}`;
})();
