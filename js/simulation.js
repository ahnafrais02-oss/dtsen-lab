(() => {
  DTSEN.validateSimulationResult = result => {
    for (const population of [result.before, result.after]) {
      DTSEN.validateAssignments(population);
      const counts = Array(10).fill(0);
      population.forEach((a, i) => {
        if (a.rank !== i + 1) throw new Error('Ranking harus unik dan berurutan 1–50.');
        if (!Number.isFinite(a.welfareScore) || a.welfareScore !== DTSEN.calculateWelfareScore(a)) throw new Error('Indeks tidak konsisten dengan atribut.');
        if (a.decile !== DTSEN.calculateDecile(a.rank)) throw new Error('Desil tidak konsisten dengan ranking.');
        if (i && DTSEN.compareAssignments(population[i - 1], a) > 0) throw new Error('Urutan ranking tidak konsisten.');
        counts[a.decile - 1]++;
      });
      if (counts.some(n => n !== DTSEN.SIMULATION_CONFIG.perDecile)) throw new Error('Setiap desil harus berisi tepat 5 assignment.');
    }
    if (result.before.some(a => !result.after.some(b => b.id === a.id))) throw new Error('ID populasi berubah.');
    return true;
  };
  DTSEN.simulateChanges = (baseAssignments, changes, highlightedAssignment = changes[0]?.id) => {
    const before = DTSEN.calculateRanking(baseAssignments), updated = DTSEN.clone(baseAssignments), seen = new Set();
    for (const change of changes) {
      const item = updated.find(a => a.id === change.id);
      if (!item || seen.has(change.id)) throw new Error('Perubahan memuat ID tidak dikenal atau duplikat.');
      seen.add(change.id);
      if (!change.attributes || Object.keys(change.attributes).some(k => !(k in DTSEN.attributeLabels))) throw new Error('Atribut perubahan tidak dikenal.');
      Object.assign(item.attributes, change.attributes);
    }
    const after = DTSEN.calculateRanking(updated);
    if (!after.some(a => a.id === highlightedAssignment)) throw new Error('Assignment fokus tidak ditemukan.');
    const comparisons = before.map(old => {
      const current = after.find(a => a.id === old.id);
      return { id: old.id, oldScore: old.welfareScore, newScore: current.welfareScore,
        oldRank: old.rank, newRank: current.rank, oldDecile: old.decile, newDecile: current.decile,
        rankDelta: old.rank - current.rank, decileDelta: current.decile - old.decile,
        dataChanged: Object.keys(old.attributes).some(key => old.attributes[key] !== current.attributes[key]) };
    });
    const result = { before, after, highlightedAssignment, comparisons,
      changedAssignments: comparisons.filter(a => a.dataChanged), rankingChanges: comparisons.filter(a => a.rankDelta), decileChanges: comparisons.filter(a => a.decileDelta) };
    DTSEN.validateSimulationResult(result);
    return result;
  };
  // Temukan perubahan atribut nyata yang memenuhi misi, bukan mengganti ranking/desil.
  const cache = new Map();
  const candidate = (mission, direction, ranked) => {
    const preferred = [...ranked].sort((a, b) => Math.abs(a.rank - 28) - Math.abs(b.rank - 28));
    for (const focus of preferred) {
      for (let distance = 1; distance <= 9; distance++) for (const key of Object.keys(DTSEN.attributeLabels)) {
        const value = focus.attributes[key] + direction * distance;
        if (value < 1 || value > 10) continue;
        const change = { id: focus.id, attributes: { [key]: value } };
        const result = DTSEN.simulateChanges(DTSEN.assignments, [change], focus.id);
        const f = result.comparisons.find(a => a.id === focus.id);
        const valid = mission === 1 ? f.rankDelta !== 0 && f.decileDelta === 0 : mission === 2 ? f.decileDelta !== 0 : f.rankDelta === 0;
        if (valid && direction * (f.newScore - f.oldScore) > 0) return { focus, change };
      }
    }
    throw new Error(`Tidak ditemukan perubahan yang memenuhi misi ${mission}.`);
  };
  DTSEN.createScenario = (mission, direction = 1) => {
    if (![1, 2, 3, 4].includes(mission) || ![-1, 0, 1].includes(direction)) throw new Error('Misi atau kondisi tidak dikenal.');
    // Cache is keyed by data and weights so development edits never reuse stale results.
    const cacheKey = JSON.stringify([mission, direction, DTSEN.assignments, DTSEN.SIMULATION_CONFIG]);
    if (cache.has(cacheKey)) return DTSEN.clone(cache.get(cacheKey));
    const ranked = DTSEN.calculateRanking(DTSEN.assignments);
    let focus = ranked[27], changes = [];
    if (mission <= 2 && direction !== 0) {
      const found = candidate(mission, direction, ranked);
      focus = found.focus; changes = [found.change];
    } else if (mission === 3) {
      const others = [ranked[10], ranked[17], ranked[32], ranked[37], ranked[42]];
      const move = (a, step) => ({ id: a.id, attributes: Object.fromEntries(Object.entries(a.attributes).map(([key, value]) => [key, Math.max(1, Math.min(10, value + step))])) });
      changes = others.map((a, i) => move(a, direction === 0 ? 4 : (i % 2 ? -2 : 2)));
      if (direction !== 0) changes.unshift(move(focus, direction * 2));
    } else if (mission === 4) {
      if (direction !== 0) {
        const found = candidate(4, direction, ranked);
        focus = found.focus; changes = [found.change];
      }
      // Rotate five distinct profiles strictly above the focus. They exchange ranks
      // while the count of assignments above the focus remains unchanged.
      const group = ranked.filter(a => a.rank < focus.rank).slice(0, 5);
      if (group.length !== 5) throw new Error('Misi 4 memerlukan lima assignment di atas fokus.');
      group.forEach((a, i) => changes.push({ id: a.id, attributes: { ...group[(i + 1) % group.length].attributes } }));
    }
    const result = DTSEN.simulateChanges(DTSEN.assignments, changes, focus.id);
    const f = result.comparisons.find(a => a.id === focus.id);
    const focusDirectionOK = direction === 0 ? f.newScore === f.oldScore : direction * (f.newScore - f.oldScore) > 0;
    const valid = mission <= 2 && direction === 0 ? result.changedAssignments.length === 0 && result.rankingChanges.length === 0 :
      mission === 1 ? result.changedAssignments.length === 1 && f.rankDelta !== 0 && f.decileDelta === 0 :
      mission === 2 ? result.changedAssignments.length === 1 && f.rankDelta !== 0 && f.decileDelta !== 0 :
      mission === 3 ? result.changedAssignments.length >= 5 :
      result.changedAssignments.length >= 5 && f.rankDelta === 0 && f.decileDelta === 0 && result.rankingChanges.some(a => a.id !== focus.id);
    if (!valid || !focusDirectionOK) throw new Error(`Misi ${mission} tidak memenuhi tujuan edukasi.`);
    const scenario = { mission, direction, changes, result, focus: focus.id };
    cache.set(cacheKey, DTSEN.clone(scenario));
    return scenario;
  };
})();
