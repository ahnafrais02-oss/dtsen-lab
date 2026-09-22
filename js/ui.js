(() => {
  const $ = id => document.getElementById(id);
  const number = n => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(n);
  const money = n => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
  const delta = n => n === 0 ? 'Tetap' : `${n > 0 ? 'Posisi membaik' : 'Posisi menurun'} ${Math.abs(n)} tingkat`;
  const titles = ['Ranking berubah, desil tetap', 'Ranking dan desil berubah', 'Banyak data berubah', 'Data berubah, tapi apakah desil ikut berubah?'];
  const descriptions = ['Geser sedikit. Apakah kelompoknya ikut berubah?', 'Lewati batas dan temukan efeknya pada yang lain.', 'Enam perubahan. Satu populasi yang bergerak.', 'Kondisi baru belum tentu berarti posisi baru.'];
  DTSEN.ui = {
    $, titles, number, money,
    init() {
      $('hero-ladder').innerHTML = Array.from({ length: 10 }, (_, i) => `<div class="ladder-column" style="--height:${28 + i * 8}%;--bar:hsl(${82 + i * 5} ${32 - i}% ${83 - i * 5}%)"><b>D${i + 1}</b></div>`).join('');
      $('mission-grid').innerHTML = titles.map((title, i) => `<button class="mission-card" data-mission="${i + 1}" aria-controls="playground"><span class="mission-top"><span class="mission-symbol" aria-hidden="true">${['↔', '↗', '✳', '≈'][i]}</span><span class="mission-number">MISI 0${i + 1}</span></span><h3>${title}</h3><p>${descriptions[i]}</p><span class="mission-link"><span class="mission-state">Mainkan misi</span><span aria-hidden="true">↗</span></span></button>`).join('');
    },
    prepare(scenario) {
      const { mission, focus, result } = scenario;
      $('playground').hidden = false;
      $('play-eyebrow').textContent = `MISI 0${mission} / 04 · COBA & TEMUKAN`;
      $('play-title').textContent = titles[mission - 1];
      $('focus-id').textContent = focus;
      $('change-summary').textContent = scenario.direction === 0
        ? mission <= 2 ? 'Kondisi pembanding: tidak ada data berubah. Ranking dan desil seharusnya tetap.' : `Data fokus tetap. ${result.changedAssignments.length} assignment lain berubah. Perhatikan apakah posisinya ikut bergeser.`
        : mission === 4 ? 'Enam pendapatan berubah sedikit secara bersamaan. Cukupkah untuk bertukar posisi?' : `${result.changedAssignments.length} assignment akan mengalami perubahan pendapatan. Pilihan kondisi berlaku untuk assignment fokus; data lainnya mengikuti skema misi.`;
      $('status').textContent = '';
      $('simulation-error').hidden = true;
      const before = result.before.find(a => a.id === focus), after = result.after.find(a => a.id === focus);
      $('attribute-preview').innerHTML = Object.entries(DTSEN.attributeLabels).map(([key, label]) => {
        const changed = before.attributes[key] !== after.attributes[key];
        const format = value => key === 'income' ? money(value) : key === 'householdSize' ? `${value} orang` : `Level ${value}/5`;
        return `<div class="attribute-row ${changed ? 'changed' : ''}"><span>${label}</span><span>${format(before.attributes[key])}${changed ? `<br>→ ${format(after.attributes[key])}` : ''}</span></div>`;
      }).join('');
      $('all-changes').innerHTML = scenario.changes.map(c => `<p><strong>${c.id}${c.id === focus ? ' ★' : ''}</strong><br>${money(result.before.find(a => a.id === c.id).attributes.income)} → ${money(c.attributes.income)}</p>`).join('') || '<p>Tidak ada perubahan data pada kondisi pembanding ini.</p>';
      $('results').hidden = true;
      $('board-caption').textContent = 'Posisi sebelum perubahan';
      $('assignment-detail').textContent = 'Pilih salah satu titik untuk mengenali assignment.';
      $('sequence').querySelectorAll('li').forEach(li => { li.className = ''; li.removeAttribute('aria-current'); });
      document.querySelectorAll('.mission-card').forEach(card => { card.classList.toggle('active', +card.dataset.mission === mission); card.setAttribute('aria-pressed', String(+card.dataset.mission === mission)); });
      this.board(result, false);
    },
    board(result, after) {
      const population = after ? result.after : result.before;
      const maxScore = Math.max(...result.before.map(a => a.welfareScore), ...result.after.map(a => a.welfareScore), 1);
      const savedScroll = $('population').scrollTop;
      const f = result.comparisons.find(a => a.id === result.highlightedAssignment);
      $('focus-tracker').innerHTML = `<strong>★ ${f.id} · Fokus</strong><span>Ranking <b>${f.oldRank}${after ? ` → ${f.newRank}` : ''}</b></span><span>Desil <b>${f.oldDecile}${after ? ` → ${f.newDecile}` : ''}</b></span><span>${after ? delta(f.rankDelta) : 'Sebelum simulasi'}</span>`;
      $('population').innerHTML = Array.from({ length: 10 }, (_, i) => {
        const d = i + 1;
        // Dari kesejahteraan terendah ke tertinggi, mengikuti contoh papan revisi.
        const items = population.filter(a => a.decile === d).sort((a, b) => b.rank - a.rank);
        return `<section class="decile-block" style="--decile-color:hsl(${d * 14 - 10} 65% 32%);--decile-tint:hsl(${d * 14 - 10} 72% 92%)" aria-label="Desil ${d}, 10 assignment"><div class="decile-heading"><strong>Desil ${d}</strong><span>10 assignment</span><small>Ranking ${110 - d * 10}–${101 - d * 10}</small></div><div class="dots">${items.map(a => {
          const c = result.comparisons.find(c => c.id === a.id), focus = a.id === result.highlightedAssignment;
          const changed = c.dataChanged, shifted = after && c.rankDelta !== 0;
          const label = `${a.id}, ranking ${a.rank}, desil ${a.decile}, indeks ${number(a.welfareScore)}${focus ? ', assignment fokus' : ''}${changed ? ', data diubah' : ''}${shifted ? `, ${delta(c.rankDelta)}` : ''}`;
          return `<button class="dot ${changed ? 'changed' : ''} ${shifted ? 'shifted' : ''} ${focus ? 'focus' : ''}" data-id="${a.id}" data-rank="${a.rank}" title="${label}" aria-label="${label}"><span class="row-rank"><small>Ranking</small><b>${a.rank}</b></span><span class="assignment-bar" style="--score-width:${Math.max(8, a.welfareScore / maxScore * 100)}%"><span class="row-id">${focus ? '★ ' : ''}${a.id}<small>${focus ? 'Fokus' : shifted ? '↔ Bergeser' : changed ? '+ Data diubah' : 'Assignment'}</small></span><span class="row-score"><small>Indeks</small>${number(a.welfareScore)}</span></span></button>`;
        }).join('')}</div></section>`;
      }).join('');
      $('population').scrollTop = savedScroll;
    },
    findFocus(behavior = 'smooth') {
      const board = $('population'), focus = board.querySelector('.focus');
      if (!focus) return;
      const top = focus.getBoundingClientRect().top - board.getBoundingClientRect().top + board.scrollTop - board.clientHeight / 2 + focus.offsetHeight / 2;
      board.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : behavior });
    },
    detail(result, id, after) {
      const a = (after ? result.after : result.before).find(a => a.id === id), c = result.comparisons.find(a => a.id === id);
      $('assignment-detail').textContent = `${id}${id === result.highlightedAssignment ? ' ★ Fokus' : ''} · Indeks ${number(a.welfareScore)} · Ranking ${a.rank} · Desil ${a.decile}${after ? ` · ${delta(c.rankDelta)}${c.dataChanged ? ' · Data berubah' : ' · Data tetap'}` : ''}`;
    },
    results(scenario) {
      const r = scenario.result, f = r.comparisons.find(a => a.id === scenario.focus);
      $('results').hidden = false;
      $('result-badge').textContent = `Misi ${scenario.mission} selesai ✓`;
      $('results-title').textContent = f.decileDelta ? 'Menarik! Batas desil terlewati.' : f.rankDelta ? 'Posisi baru. Desil masih sama.' : f.dataChanged ? 'Data baru. Posisi tetap.' : 'Data fokus tetap. Posisi juga tetap.';
      $('comparison').innerHTML = [
        ['Indeks simulasi kesejahteraan', number(f.oldScore), number(f.newScore), f.newScore === f.oldScore ? 'Tetap' : `${f.newScore > f.oldScore ? 'Naik' : 'Turun'} ${number(Math.abs(f.newScore - f.oldScore))} poin`],
        ['Ranking', f.oldRank, f.newRank, delta(f.rankDelta)],
        ['Desil', f.oldDecile, f.newDecile, f.decileDelta === 0 ? 'Tetap' : `${f.decileDelta > 0 ? 'Naik' : 'Turun'} ${Math.abs(f.decileDelta)} desil`]
      ].map(([label, old, current, note]) => `<article class="compare-card"><h3>${label}</h3><div class="compare-values"><div><small>SEBELUM</small>${old}</div><span class="arrow" aria-hidden="true">→</span><div><small>SESUDAH</small>${current}</div></div><p>${note}</p></article>`).join('');
      $('insight-text').textContent = [
        'Ranking berubah, tetapi posisi assignment masih berada dalam rentang desil yang sama. Perubahan data tidak otomatis berarti perubahan desil.',
        'Desil berubah ketika posisi melewati batas kelompok. Assignment lain ikut bergeser agar setiap desil kembali berisi tepat 10 assignment.',
        'Ranking bersifat relatif. Ketika beberapa data berubah bersama, posisi fokus hanya bisa diketahui setelah seluruh populasi diurutkan kembali.',
        'Data berubah belum tentu membuat ranking atau desil berubah. Dalam percobaan ini, perubahan pendapatan belum cukup untuk bertukar posisi dengan tetangga.'
      ][scenario.mission - 1];
      if (scenario.direction === 0) $('insight-text').textContent = scenario.mission <= 2 ? 'Tidak ada data yang diubah. Ini adalah kondisi pembanding: indeks, ranking, dan desil seluruh populasi tetap.' : f.rankDelta ? 'Data fokus tetap, tetapi posisinya berubah karena assignment lain berubah. Ranking dan desil ditentukan relatif terhadap seluruh populasi.' : 'Lima data lain berubah, tetapi belum cukup untuk menggeser posisi fokus. Ranking dan desil fokus tetap.';
      $('explanation').textContent = `Kesejahteraan ${f.id} ${f.newScore > f.oldScore ? 'meningkat' : f.newScore < f.oldScore ? 'menurun' : 'tetap'}. Indeks ${f.id} ${f.newScore > f.oldScore ? 'naik' : f.newScore < f.oldScore ? 'turun' : 'tetap'} dari ${number(f.oldScore)} menjadi ${number(f.newScore)}. Setelah semua 100 assignment dihitung dan diurutkan ulang, ranking ${f.oldRank} → ${f.newRank}${f.rankDelta > 0 ? ' (angka mengecil, posisi membaik)' : f.rankDelta < 0 ? ' (angka membesar, posisi menurun)' : ' (tetap)'}. ${f.decileDelta ? `Posisinya melewati batas kelompok, dari Desil ${f.oldDecile} ke Desil ${f.newDecile}.` : `Posisinya masih di rentang ranking ${101 - f.newDecile * 10}–${110 - f.newDecile * 10}, sehingga tetap di Desil ${f.newDecile}.`}`;
      const neighbors = r.rankingChanges.filter(a => a.id !== f.id);
      $('ripple').textContent = `${r.changedAssignments.length} data berubah; ${r.rankingChanges.length} ranking bergeser; ${r.decileChanges.length} assignment pindah desil. ${neighbors.length ? `Contoh efek pada yang lain: ${neighbors.slice(0, 3).map(a => `${a.id} (${a.oldRank} → ${a.newRank}${a.dataChanged ? ', data berubah' : ', data tetap'})`).join('; ')}.` : 'Tidak ada assignment yang bertukar posisi.'} Semua desil tetap berisi 10 assignment.`;
      $('next-mission').textContent = scenario.mission === 4 ? 'Kembali ke misi pertama ↻' : 'Misi berikutnya →';
    },
    table(result, after, query = '') {
      const rows = (after ? result.after : result.before).filter(a => a.id.toLowerCase().includes(query.toLowerCase().trim()));
      $('table-body').innerHTML = rows.map(a => {
        const old = result.before.find(b => b.id === a.id), c = result.comparisons.find(b => b.id === a.id);
        const pair = (x, y, format = String) => x === y ? format(y) : `${format(x)} → ${format(y)}`;
        return `<tr class="${a.id === result.highlightedAssignment ? 'is-focus' : ''}"><th scope="row">${a.id}${a.id === result.highlightedAssignment ? ' ★' : ''}${after && c.dataChanged ? ' +' : ''}${after && c.rankDelta ? ' ↔' : ''}</th><td>${pair(old.attributes.income, a.attributes.income, money)}</td><td>${a.attributes.householdSize}</td><td>${['housing','electricity','asset','education'].map(k => a.attributes[k]).join(' / ')}</td><td>${pair(old.welfareScore, a.welfareScore, number)}</td><td>${pair(old.rank, a.rank)}</td><td>${pair(old.decile, a.decile)}</td></tr>`;
      }).join('');
      $('table-count').textContent = `${rows.length} dari 100 assignment · ${after ? 'Sesudah simulasi' : 'Sebelum simulasi'}`;
    }
  };
})();
