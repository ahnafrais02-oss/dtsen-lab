(() => {
  DTSEN.validateSimulationResult = result => {
    for (const population of [result.before, result.after]) {
      DTSEN.validateAssignments(population);
      const counts = Array(10).fill(0);
      population.forEach((a, i) => {
        if (a.rank !== i + 1) throw new Error('Ranking harus unik dan berurutan 1–100.');
        if (!Number.isFinite(a.welfareScore) || a.welfareScore !== DTSEN.calculateWelfareScore(a)) throw new Error('Indeks tidak konsisten dengan atribut.');
        if (a.decile !== DTSEN.calculateDecile(a.rank)) throw new Error('Desil tidak konsisten dengan ranking.');
        if (i && DTSEN.compareAssignments(population[i - 1], a) > 0) throw new Error('Urutan ranking tidak konsisten.');
        counts[a.decile - 1]++;
      });
      if (counts.some(n => n !== 10)) throw new Error('Setiap desil harus berisi tepat 10 assignment.');
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
  // Cari perubahan pendapatan dari target indeks; ranking/desil selalu dihitung engine.
  const incomeAtScore = (item, score) => Math.max(0, Math.round(item.attributes.income +
    (score - item.welfareScore) * item.attributes.householdSize * DTSEN.SIMULATION_CONFIG.incomeReference / DTSEN.SIMULATION_CONFIG.weights.income));
  DTSEN.createScenario = (mission, direction = 1) => {
    if (![1, 2, 3, 4].includes(mission) || ![-1, 0, 1].includes(direction)) throw new Error('Misi atau kondisi tidak dikenal.');
    const ranked = DTSEN.calculateRanking(DTSEN.assignments);
    const focus = ranked[mission === 2 ? (direction > 0 ? 50 : 49) : 54];
    let changes;
    if (direction === 0 && mission <= 2) {
      changes = [];
    } else if (mission <= 2) {
      const targetRank = focus.rank - direction * 2;
      const others = ranked.filter(a => a.id !== focus.id);
      const targetScore = (others[targetRank - 2].welfareScore + others[targetRank - 1].welfareScore) / 2;
      changes = [{ id: focus.id, attributes: { income: incomeAtScore(focus, targetScore) } }];
    } else if (mission === 3) {
      changes = [focus, ranked[20], ranked[35], ranked[65], ranked[78], ranked[88]].map((a, i) => ({ id: a.id,
        attributes: { income: Math.round(a.attributes.income * (i % 2 ? 0.35 : 2.3)) } }));
      if (direction === 0) changes = [ranked[20], ranked[35], ranked[65], ranked[78], ranked[88]].map(a => ({ id: a.id, attributes: { income: Math.round(a.attributes.income * 2.2) } }));
      if (direction < 0) changes = changes.map(c => ({ id: c.id, attributes: { income: Math.round(ranked.find(a => a.id === c.id).attributes.income * (c.id === focus.id ? 0.7 : 1.8)) } }));
    } else {
      const minGap = Math.min(...ranked.slice(1).map((a, i) => ranked[i].welfareScore - a.welfareScore));
      changes = ranked.slice(52, 58).filter(a => direction !== 0 || a.id !== focus.id).map(a => ({ id: a.id, attributes: { income: incomeAtScore(a, a.welfareScore + (direction || 1) * minGap / 4) } }));
    }
    const result = DTSEN.simulateChanges(DTSEN.assignments, changes, focus.id);
    const f = result.comparisons.find(a => a.id === focus.id);
    const valid = direction === 0 ? !f.dataChanged && f.oldScore === f.newScore && (mission <= 2 ? result.changedAssignments.length === 0 && result.rankingChanges.length === 0 : result.changedAssignments.length >= 5 && (mission === 3 || (f.rankDelta === 0 && f.decileDelta === 0))) : mission === 1 ? result.changedAssignments.length === 1 && f.rankDelta !== 0 && f.decileDelta === 0 :
      mission === 2 ? result.changedAssignments.length === 1 && f.rankDelta !== 0 && f.decileDelta !== 0 :
      mission === 3 ? result.changedAssignments.length >= 5 : result.changedAssignments.length >= 5 && f.dataChanged && Math.abs(f.rankDelta) <= 1 && f.decileDelta === 0;
    if (!valid) throw new Error(`Misi ${mission} tidak memenuhi tujuan edukasi.`);
    return { mission, direction, changes, result, focus: focus.id };
  };
})();
