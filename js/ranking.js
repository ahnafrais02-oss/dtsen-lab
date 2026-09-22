(() => {
  DTSEN.calculateWelfareScore = assignment => {
    const weights = DTSEN.SIMULATION_CONFIG.weights;
    // Indeks 1–10; bulatkan noise floating point sebelum aturan tie-break.
    return Math.round(Object.keys(weights).reduce((sum, key) => sum + assignment.attributes[key] * weights[key], 0) * 1000000) / 1000000;
  };
  DTSEN.compareAssignments = (a, b) => b.welfareScore - a.welfareScore || b.attributes.expenditure - a.attributes.expenditure || a.id.localeCompare(b.id);
  DTSEN.calculateDecile = rank => {
    const c = DTSEN.SIMULATION_CONFIG;
    if (!Number.isInteger(rank) || rank < 1 || rank > c.population) throw new Error(`Ranking harus 1–${c.population}.`);
    return c.deciles - Math.floor((rank - 1) / c.perDecile);
  };
  DTSEN.calculateRanking = assignments => {
    DTSEN.validateAssignments(assignments);
    return assignments.map(a => ({ ...a, attributes: { ...a.attributes }, welfareScore: DTSEN.calculateWelfareScore(a) }))
      .sort(DTSEN.compareAssignments).map((a, i) => ({ ...a, rank: i + 1, decile: DTSEN.calculateDecile(i + 1) }));
  };
})();
