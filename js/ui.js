(() => {
  const $ = id => document.getElementById(id);
  const number = n => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
  const delta = n => n === 0 ? 'Ranking tetap' : `${n > 0 ? 'Membaik' : 'Menurun'} ${Math.abs(n)} posisi`;
  const titles = ['Ranking berubah, desil tetap', 'Ranking dan desil berubah', 'Banyak data berubah', 'Yang lain bergeser, fokus tetap'];
  const descriptions = ['Geser sedikit. Apakah kelompoknya ikut berubah?', 'Lewati batas dan temukan efeknya pada yang lain.', 'Lihat posisi fokus di tengah perubahan bersama.', 'Amati yang lain bertukar posisi, sementara fokus bertahan.'];
  DTSEN.ui = {
    $, titles, number,
    init() {
      $('hero-ladder').innerHTML = Array.from({ length: 10 }, (_, i) => `<div class="ladder-column" style="--height:${28 + i * 8}%;--bar:hsl(${82 + i * 5} ${32 - i}% ${83 - i * 5}%)"><b>D${i + 1}</b></div>`).join('');
      $('mission-grid').innerHTML = titles.map((title, i) => `<button class="mission-card" data-mission="${i + 1}" aria-controls="playground"><span class="mission-top"><span class="mission-symbol" aria-hidden="true">${['↔', '↗', '✳', '≈'][i]}</span><span class="mission-number">MISI 0${i + 1}</span></span><h3>${title}</h3><p>${descriptions[i]}</p><span class="mission-link"><span class="mission-state">Mainkan misi</span><span aria-hidden="true">↗</span></span></button>`).join('');
    },
    prepare(scenario) {
      const { mission, focus, result, direction } = scenario;
      const old = result.before.find(a => a.id === focus);
      $('playground').hidden = false;
      $('play-eyebrow').textContent = `MISI 0${mission} / 04 · COBA & TEMUKAN`;
      $('play-title').textContent = titles[mission - 1];
      $('focus-id').textContent = focus;
      $('change-summary').textContent = direction === 0
        ? mission <= 2 ? 'Kondisi pembanding: semua data tetap.' : `${result.changedAssignments.length} data lain berubah. Data fokus tetap.`
        : mission === 4 ? 'Kondisi fokus berubah. Lima assignment lain bertukar posisi. Apakah fokus ikut bergeser?' : `${result.changedAssignments.length} data berubah. Pilihan kondisi berlaku untuk fokus amatan.`;
      $('focus-snapshot').innerHTML = `<span><small>Indeks awal</small><b>${number(old.welfareScore)}</b></span><span><small>Ranking</small><b>${old.rank}</b></span><span><small>Desil</small><b>${old.decile}</b></span>`;
      $('status').textContent = '';
      $('simulation-error').hidden = true;
      $('results').hidden = true;
      $('see-results').hidden = true;
      $('board-caption').textContent = 'Posisi sebelum perubahan';
      $('assignment-detail').textContent = 'Pilih satu baris untuk melihat posisi assignment.';
      const labels = ['Kondisi diperiksa', 'Indeks dihitung', 'Ranking diurutkan', 'Posisi bergerak', 'Desil diperbarui', 'Hasil siap'];
      $('sequence').querySelectorAll('li').forEach((li, i) => { li.className = ''; li.textContent = labels[i]; li.removeAttribute('aria-current'); });
      document.querySelectorAll('.mission-card').forEach(card => { card.classList.toggle('active', +card.dataset.mission === mission); card.setAttribute('aria-pressed', String(+card.dataset.mission === mission)); });
      this.board(result, false);
    },
    board(result, after) {
      const population = after ? result.after : result.before;
      const f = result.comparisons.find(a => a.id === result.highlightedAssignment);
      $('focus-tracker').innerHTML = `<strong>★ ${f.id} · Fokus</strong><span>Ranking <b>${f.oldRank}${after ? ` → ${f.newRank}` : ''}</b></span><span>Desil <b>${f.oldDecile}${after ? ` → ${f.newDecile}` : ''}</b></span><span>${after ? delta(f.rankDelta) : 'Sebelum simulasi'}</span>`;
      $('population').innerHTML = Array.from({ length: 10 }, (_, i) => {
        const d = i + 1, range = DTSEN.decileRange(d);
        const items = population.filter(a => a.decile === d).sort((a, b) => b.rank - a.rank);
        return `<section class="decile-block" style="--decile-color:hsl(${d * 14 - 10} 65% 32%);--decile-tint:hsl(${d * 14 - 10} 72% 92%)" aria-label="Desil ${d}, 5 assignment"><div class="decile-heading"><strong>Desil ${d}</strong><small>${range.last}–${range.first}</small></div><div class="dots">${items.map(a => {
          const c = result.comparisons.find(c => c.id === a.id), focus = a.id === result.highlightedAssignment;
          const shifted = after && c.rankDelta !== 0;
          const label = `${a.id}, ranking ${a.rank}, desil ${a.decile}, indeks ${number(a.welfareScore)}${focus ? ', fokus' : ''}${c.dataChanged ? ', data diubah' : ''}${shifted ? `, ${delta(c.rankDelta)}` : ''}`;
          return `<button class="dot ${c.dataChanged ? 'changed' : ''} ${shifted ? 'shifted' : ''} ${focus ? 'focus' : ''}" data-id="${a.id}" data-rank="${a.rank}" title="${label}" aria-label="${label}"><span class="row-rank">${a.rank}</span><span class="assignment-bar" style="--score-width:${a.welfareScore * 10}%"><span class="row-id">${focus ? '★' : shifted ? '↔' : c.dataChanged ? '+' : ''}${a.id}</span><span class="row-score">${number(a.welfareScore)}</span></span></button>`;
        }).join('')}</div></section>`;
      }).join('');
    },
    findFocus(behavior = 'smooth') {
      const focus = $('population').querySelector('.focus');
      if (focus) focus.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : behavior });
    },
    detail(result, id, after) {
      const a = (after ? result.after : result.before).find(a => a.id === id), c = result.comparisons.find(a => a.id === id);
      $('assignment-detail').textContent = `${id}${id === result.highlightedAssignment ? ' ★ Fokus' : ''} · Indeks ${number(a.welfareScore)} · Ranking ${a.rank} · Desil ${a.decile}${after ? ` · ${delta(c.rankDelta)}${c.dataChanged ? ' · Data berubah' : ' · Data tetap'}` : ''}`;
    },
    results(scenario) {
      const r = scenario.result, f = r.comparisons.find(a => a.id === scenario.focus), range = DTSEN.decileRange(f.newDecile);
      $('results').hidden = false;
      $('see-results').hidden = false;
      $('result-badge').textContent = `Misi ${scenario.mission} selesai ✓`;
      $('results-title').textContent = f.decileDelta ? 'Batas desil terlewati.' : f.rankDelta ? 'Posisi baru. Desil masih sama.' : scenario.mission === 4 ? 'Yang lain bergerak. Fokus tetap.' : 'Posisi tetap.';
      $('comparison').innerHTML = [
        ['Indeks simulasi kesejahteraan', number(f.oldScore), number(f.newScore), f.newScore === f.oldScore ? 'Tetap' : `${f.newScore > f.oldScore ? 'Naik' : 'Turun'} ${number(Math.abs(f.newScore - f.oldScore))} poin`],
        ['Ranking', f.oldRank, f.newRank, delta(f.rankDelta)],
        ['Desil', f.oldDecile, f.newDecile, f.decileDelta === 0 ? 'Tetap' : `${f.decileDelta > 0 ? 'Naik' : 'Turun'} ${Math.abs(f.decileDelta)} desil`]
      ].map(([label, old, current, note]) => `<article class="compare-card"><h3>${label}</h3><div class="compare-values"><div><small>SEBELUM</small>${old}</div><span class="arrow" aria-hidden="true">→</span><div><small>SESUDAH</small>${current}</div></div><p>${note}</p></article>`).join('');
      $('insight-text').textContent = [
        'Ranking berubah, tetapi posisi assignment masih berada dalam rentang desil yang sama.',
        'Posisi melewati batas desil. Assignment lain mengisi posisi yang ditinggalkan agar setiap desil tetap berisi lima anggota.',
        'Posisi fokus ditentukan setelah seluruh populasi diurutkan kembali, termasuk data assignment lain yang berubah.',
        'Lima assignment lain bertukar posisi. Fokus tetap berada pada ranking yang sama karena jumlah assignment di atas dan di bawahnya tidak berubah.'
      ][scenario.mission - 1];
      if (scenario.direction === 0 && scenario.mission <= 2) $('insight-text').textContent = 'Tidak ada data yang diubah. Indeks, ranking, dan desil seluruh populasi tetap.';
      if (scenario.direction === 0 && scenario.mission === 3) $('insight-text').textContent = 'Data fokus tetap, tetapi posisinya dapat berubah karena assignment lain berubah. Ranking dan desil bersifat relatif.';
      $('explanation').textContent = `Indeks ${f.id} ${number(f.oldScore)} → ${number(f.newScore)}. Setelah semua 50 assignment diurutkan ulang, ranking ${f.oldRank} → ${f.newRank}${f.rankDelta > 0 ? ' (angka mengecil, posisi membaik)' : f.rankDelta < 0 ? ' (angka membesar, posisi menurun)' : ' (tetap)'}. ${f.decileDelta ? `Desil berubah dari ${f.oldDecile} ke ${f.newDecile}.` : `Fokus tetap berada di ranking ${range.first}–${range.last}, rentang Desil ${f.newDecile}.`}`;
      const neighbors = r.rankingChanges.filter(a => a.id !== f.id);
      $('ripple').textContent = `${r.changedAssignments.length} data berubah; ${r.rankingChanges.length} ranking bergeser; ${r.decileChanges.length} assignment pindah desil. ${neighbors.length ? `Contoh: ${neighbors.slice(0, 5).map(a => `${a.id} (${a.oldRank} → ${a.newRank})`).join('; ')}.` : ''} Semua desil tetap berisi 5 assignment.`;
      $('next-mission').textContent = scenario.mission === 4 ? 'Kembali ke misi pertama ↻' : 'Misi berikutnya →';
    },
    table(result, after, query = '') {
      const rows = (after ? result.after : result.before).filter(a => a.id.toLowerCase().includes(query.toLowerCase().trim()));
      $('table-body').innerHTML = rows.map(a => {
        const old = result.before.find(b => b.id === a.id), c = result.comparisons.find(b => b.id === a.id);
        const pair = (x, y, format = String) => x === y ? format(y) : `${format(x)} → ${format(y)}`;
        return `<tr class="${a.id === result.highlightedAssignment ? 'is-focus' : ''}"><th scope="row">${a.id}${a.id === result.highlightedAssignment ? ' ★' : ''}${after && c.dataChanged ? ' +' : ''}${after && c.rankDelta ? ' ↔' : ''}</th>${Object.keys(DTSEN.attributeLabels).map(k => `<td>${pair(old.attributes[k], a.attributes[k])}</td>`).join('')}<td>${pair(old.welfareScore, a.welfareScore, number)}</td><td>${pair(old.rank, a.rank)}</td><td>${pair(old.decile, a.decile)}</td></tr>`;
      }).join('');
      $('table-count').textContent = `${rows.length} dari 50 assignment · ${after ? 'Sesudah simulasi' : 'Sebelum simulasi'}`;
    }
  };
})();
