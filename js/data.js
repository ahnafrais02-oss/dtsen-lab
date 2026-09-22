(() => {
  // Bobot berikut adalah bobot SIMULASI EDUKASI, bukan formula resmi DTSEN.
  DTSEN.SIMULATION_CONFIG = Object.freeze({ population: 50, deciles: 10, perDecile: 5,
    weights: Object.freeze({ basicNeeds: .4, assets: .25, expenditure: .35 }) });
  DTSEN.attributeLabels = Object.freeze({
    basicNeeds: 'Kondisi Perumahan dan Pemenuhan Kebutuhan Dasar',
    assets: 'Kepemilikan Aset',
    expenditure: 'Pengeluaran dan/atau Pendapatan'
  });
  DTSEN.clone = value => JSON.parse(JSON.stringify(value));
  DTSEN.decileRange = decile => {
    const c = DTSEN.SIMULATION_CONFIG;
    return { first: (c.deciles - decile) * c.perDecile + 1, last: (c.deciles - decile + 1) * c.perDecile };
  };
  DTSEN.validateAssignments = assignments => {
    const count = DTSEN.SIMULATION_CONFIG.population;
    if (!Array.isArray(assignments) || assignments.length !== count) throw new Error(`Populasi harus tepat ${count} assignment.`);
    const ids = new Set();
    for (const item of assignments) {
      if (!/^A\d{3}$/.test(item.id) || ids.has(item.id)) throw new Error('ID assignment tidak valid atau duplikat.');
      ids.add(item.id);
      if (!item.attributes || Object.keys(item.attributes).length !== 3) throw new Error(`Assignment ${item.id} harus memiliki tiga atribut.`);
      for (const key of Object.keys(DTSEN.attributeLabels)) {
        if (!Number.isInteger(item.attributes[key]) || item.attributes[key] < 1 || item.attributes[key] > 10) throw new Error(`${key} harus bilangan bulat 1–10: ${item.id}.`);
      }
    }
  };
})();
