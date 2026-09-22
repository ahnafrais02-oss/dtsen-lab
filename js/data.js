(() => {
  // Bobot berikut adalah bobot SIMULASI EDUKASI, bukan formula resmi DTSEN.
  DTSEN.SIMULATION_CONFIG = Object.freeze({ population: 100, incomeReference: 3000000,
    weights: Object.freeze({ income: 40, housing: 20, electricity: 10, asset: 20, education: 10 }) });
  DTSEN.attributeLabels = { income: 'Pendapatan rumah tangga / bulan', householdSize: 'Jumlah anggota rumah tangga', housing: 'Kondisi rumah', electricity: 'Akses listrik', asset: 'Kepemilikan aset', education: 'Pendidikan' };
  DTSEN.clone = value => JSON.parse(JSON.stringify(value));
  DTSEN.validateAssignments = assignments => {
    if (!Array.isArray(assignments) || assignments.length !== 100) throw new Error('Populasi harus tepat 100 assignment.');
    const ids = new Set();
    for (const item of assignments) {
      if (!/^A\d{3}$/.test(item.id) || ids.has(item.id)) throw new Error('ID assignment tidak valid atau duplikat.');
      ids.add(item.id);
      const a = item.attributes;
      if (!a || !Number.isFinite(a.income) || a.income < 0 || !Number.isInteger(a.householdSize) || a.householdSize < 1) throw new Error(`Pendapatan atau jumlah anggota tidak valid: ${item.id}.`);
      for (const key of ['housing', 'electricity', 'asset', 'education']) {
        if (!Number.isInteger(a[key]) || a[key] < 1 || a[key] > 5) throw new Error(`${key} harus bilangan bulat 1–5: ${item.id}.`);
      }
    }
  };
})();
