(() => {
  DTSEN.calculateWelfareScore = assignment => {
    const a = assignment.attributes, c = DTSEN.SIMULATION_CONFIG, w = c.weights;
    return a.income / a.householdSize / c.incomeReference * w.income +
      ['housing', 'electricity', 'asset', 'education'].reduce((sum, key) => sum + (a[key] - 1) / 4 * w[key], 0);
  };
  DTSEN.compareAssignments = (a, b) => b.welfareScore - a.welfareScore || b.attributes.income - a.attributes.income || a.id.localeCompare(b.id);
  DTSEN.calculateDecile = rank => {
    if (!Number.isInteger(rank) || rank < 1 || rank > 100) throw new Error('Ranking harus 1–100.');
    return 10 - Math.floor((rank - 1) / 10);
  };
  DTSEN.calculateRanking = assignments => {
    DTSEN.validateAssignments(assignments);
    return assignments.map(a => ({ ...a, attributes: { ...a.attributes }, welfareScore: DTSEN.calculateWelfareScore(a) }))
      .sort(DTSEN.compareAssignments).map((a, i) => ({ ...a, rank: i + 1, decile: DTSEN.calculateDecile(i + 1) }));
  };
})();
