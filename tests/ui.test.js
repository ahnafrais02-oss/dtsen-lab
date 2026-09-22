(() => {
  const frame = document.getElementById('app'), report = document.getElementById('report'), run = document.getElementById('run');
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const preview = id => { const el = frame.contentDocument.getElementById(id); if (el && !el.hidden) el.scrollIntoView({ behavior: 'instant' }); };
  document.getElementById('viewport').onchange = event => { frame.width = event.target.value; };
  document.getElementById('home').onclick = () => frame.contentWindow.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById('lab').onclick = () => preview('population');
  document.getElementById('result').onclick = () => preview('results');
  run.onclick = async () => {
    run.disabled = true; report.textContent = 'Pengujian berjalan…\n'; report.className = '';
    let checks = 0;
    const messages = [], errors = [];
    const assert = (condition, message) => { if (!condition) throw new Error(message); checks++; };
    const log = message => { messages.push(message); report.textContent = messages.join('\n'); };
    try {
      if (location.protocol === 'file:') throw new Error('Buka melalui HTTP lokal agar frame dapat diakses dengan origin yang sama.');
      await new Promise(resolve => { frame.onload = resolve; frame.src = '../index.html?debug=1'; });
      const win = frame.contentWindow, doc = frame.contentDocument, $ = id => doc.getElementById(id);
      win.addEventListener('error', event => errors.push(event.message));
      win.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
      assert(!!win.DTSEN.game, 'Aplikasi gagal diinisialisasi');
      assert(doc.querySelectorAll('.mission-card').length === 4, 'Empat misi harus tersedia');
      const original = JSON.stringify(win.DTSEN.assignments);
      for (let mission = 1; mission <= 4; mission++) for (const direction of [1, -1, 0]) {
        doc.querySelector(`[data-mission="${mission}"]`).click();
        $('direction').value = String(direction); $('direction').dispatchEvent(new win.Event('change', { bubbles: true }));
        const scenario = win.DTSEN.game.state.scenario, focus = scenario.result.comparisons.find(a => a.id === scenario.focus);
        assert(!$('playground').hidden && $('results').hidden, 'Awal misi harus menampilkan papan sebelum dan menyembunyikan hasil');
        assert(doc.querySelectorAll('.dot').length === 100, 'Papan harus berisi 100 assignment');
        assert([...doc.querySelectorAll('.dot')].every((el, i) => +el.dataset.rank === 100 - i), 'Papan harus berurutan ranking 100 sampai 1');
        assert(doc.querySelector('.dot.focus').dataset.id === scenario.focus, 'Fokus papan harus sesuai skenario');
        $('simulate').click(); $('simulate').click();
        assert(win.DTSEN.game.state.busy && $('direction').disabled, 'Kontrol harus terkunci saat animasi');
        const deadline = Date.now() + 12000;
        while (win.DTSEN.game.state.busy && Date.now() < deadline) await delay(100);
        assert(!win.DTSEN.game.state.busy && !$('results').hidden, 'Simulasi harus menyelesaikan animasi dan menampilkan hasil');
        assert(!$('simulate').disabled && !$('reset').disabled, 'Kontrol harus aktif kembali');
        assert($('comparison').textContent.includes(String(focus.newRank)), 'Hasil harus menampilkan ranking engine');
        assert($('assignment-detail').textContent.includes(`Ranking ${focus.newRank}`), 'Detail fokus harus sesuai hasil');
        assert(doc.querySelectorAll('.decile-block').length === 10 && [...doc.querySelectorAll('.dots')].every(el => el.children.length === 10), 'Papan akhir harus 10 × 10');
        assert([...doc.querySelectorAll('.dot')].every((el, i) => +el.dataset.rank === 100 - i), 'Urutan baris akhir harus sesuai ranking baru');
        assert($('focus-tracker').textContent.includes(String(focus.newRank)), 'Pelacak fokus harus menampilkan ranking baru');
        assert(doc.activeElement === $('results-title'), 'Fokus keyboard harus berpindah ke judul hasil');
        $('table-open').focus(); $('table-open').click();
        assert($('table-dialog').open, 'Tabel harus terbuka');
        assert($('table-body').children.length === 100, 'Tabel harus berisi 100 baris');
        $('table-search').value = scenario.focus; $('table-search').dispatchEvent(new win.Event('input', { bubbles: true }));
        assert($('table-body').children.length === 1 && $('table-body').textContent.includes(scenario.focus), 'Pencarian harus menemukan fokus');
        $('table-search').value = 'tidak-ada'; $('table-search').dispatchEvent(new win.Event('input', { bubbles: true }));
        assert($('table-body').children.length === 0 && $('table-count').textContent.includes('0 dari 100'), 'Pencarian kosong harus ditangani');
        $('table-close').click(); assert(!$('table-dialog').open, 'Tabel harus bisa ditutup');
        assert(doc.activeElement === $('table-open'), 'Fokus keyboard harus kembali ke tombol tabel');
        log(`LULUS misi ${mission} ${direction > 0 ? 'naik' : direction < 0 ? 'turun' : 'tetap'}: ranking ${focus.oldRank} → ${focus.newRank}; desil ${focus.oldDecile} → ${focus.newDecile}.`);
      }
      assert(win.DTSEN.game.state.completed.size === 4 && $('progress-text').textContent.includes('4 dari 4'), 'Progress semua misi harus selesai');
      for (const width of [320, 390, 768, 1280]) {
        frame.width = String(width); await delay(150);
        assert(doc.documentElement.scrollWidth <= win.innerWidth, `Halaman overflow horizontal pada ${width}px: ${doc.documentElement.scrollWidth}`);
        assert($('population').scrollWidth <= $('population').clientWidth, `Papan overflow pada ${width}px`);
        assert([...doc.querySelectorAll('.compare-card')].every(el => el.scrollWidth <= el.clientWidth), `Kartu hasil overflow pada ${width}px`);
        assert([...doc.querySelectorAll('.hero-copy,.hero-art,.control-panel,.mission-card')].every(el => el.scrollWidth <= el.clientWidth), `Konten overflow pada ${width}px: ${[...doc.querySelectorAll('.hero-copy,.hero-art,.control-panel,.mission-card')].filter(el => el.scrollWidth > el.clientWidth).map(el => el.className).join(', ')}`);
        if (width <= 390) {
          assert(win.getComputedStyle($('mission-grid')).gridTemplateColumns.split(' ').length === 1, 'Kartu mobile harus satu kolom');
          assert([...doc.querySelectorAll('.dot')].every(el => el.getBoundingClientRect().height >= 44), 'Tinggi target sentuh mobile minimal 44px');
          assert($('direction').getBoundingClientRect().height >= 44, 'Pilihan kondisi mobile minimal 44px');
        }
        log(`LULUS layout ${width}px: tanpa overflow, konten terbaca.`);
      }
      frame.width = '390'; document.getElementById('viewport').value = '390';
      $('reset').click(); assert($('results').hidden && !win.DTSEN.game.state.after, 'Reset harus mengembalikan before');
      assert(JSON.stringify(win.DTSEN.assignments) === original, 'UI tidak boleh memutasi data awal');
      assert(errors.length === 0, `Error browser: ${errors.join('; ')}`);
      log(`${checks} pemeriksaan UI LULUS. Tidak ada error JavaScript.`); report.className = 'passed'; document.title = `${checks} pemeriksaan UI LULUS — DTSEN Lab`; report.scrollTop = report.scrollHeight;
      preview('playground');
    } catch (error) { log(`GAGAL setelah ${checks} pemeriksaan: ${error.message}`); report.className = 'failed'; document.title = 'GAGAL — Pengujian UI DTSEN Lab'; report.scrollTop = report.scrollHeight; }
    finally { run.disabled = false; }
  };
})();
