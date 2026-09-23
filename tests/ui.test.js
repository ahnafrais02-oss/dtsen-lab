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
    const log = message => { messages.push(message); report.textContent = messages.join('\n'); document.getElementById('summary').textContent = message; };
    try {
      if (location.protocol === 'file:') throw new Error('Buka melalui HTTP lokal agar frame dapat diakses dengan origin yang sama.');
      await new Promise(resolve => { frame.onload = resolve; frame.src = '../index.html?debug=1'; });
      const win = frame.contentWindow, doc = frame.contentDocument, $ = id => doc.getElementById(id);
      win.addEventListener('error', event => errors.push(event.message));
      win.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
      assert(!!win.DTSEN.game, 'Aplikasi gagal diinisialisasi');
      assert(doc.querySelectorAll('.mission-card').length === 4, 'Empat misi harus tersedia');
      assert(!doc.querySelector('.formula') && !$('attribute-preview'), 'Bagian yang diminta dihapus tidak ada');
      assert($('table-dialog').textContent.includes('Pemenuhan Kebutuhan Dasar') && !$('table-dialog').textContent.includes('Anggota'), 'Kolom baru menggantikan atribut lama');
      const original = JSON.stringify(win.DTSEN.assignments);
      for (let mission = 1; mission <= 4; mission++) for (const direction of [1, -1, 0]) {
        doc.querySelector(`[data-mission="${mission}"]`).click();
        $('direction').value = String(direction); $('direction').dispatchEvent(new win.Event('change', { bubbles: true }));
        const scenario = win.DTSEN.game.state.scenario, focus = scenario.result.comparisons.find(a => a.id === scenario.focus);
        assert(!$('playground').hidden && $('results').hidden, 'Awal misi harus menampilkan papan sebelum dan menyembunyikan hasil');
        assert(doc.querySelectorAll('.dot').length === 50, 'Papan harus berisi 50 assignment');
        assert([...doc.querySelectorAll('.dot')].every((el, i) => +el.dataset.rank === 50 - i), 'Papan harus berurutan ranking 50 sampai 1');
        assert(doc.querySelector('.dot.focus').dataset.id === scenario.focus, 'Fokus papan harus sesuai skenario');
        if (mission === 1 && direction === 1) {
          $('playground').requestFullscreen = () => Promise.reject(new Error('Test fallback'));
          $('expand-board').click(); await delay(50);
          assert($('playground').classList.contains('board-expanded'), 'Fallback layar penuh mencakup seluruh simulasi');
          assert($('playground').contains($('simulate')) && $('playground').contains($('access-dialog')), 'Kontrol dan dialog berada di area yang diperbesar');
        }
        $('simulate').click(); $('simulate').click();
        assert(win.DTSEN.game.state.busy && $('direction').disabled, 'Kontrol harus terkunci saat animasi');
        const deadline = Date.now() + 12000;
        while (win.DTSEN.game.state.busy && Date.now() < deadline) await delay(100);
        assert(!win.DTSEN.game.state.busy && !$('results').hidden, 'Simulasi harus menyelesaikan animasi dan menampilkan hasil');
        assert(!$('simulate').disabled && !$('reset').disabled, 'Kontrol harus aktif kembali');
        assert($('comparison').textContent.includes(String(focus.newRank)), 'Hasil harus menampilkan ranking engine');
        assert($('assignment-detail').textContent.includes(`Ranking ${focus.newRank}`), 'Detail fokus harus sesuai hasil');
        assert(doc.querySelectorAll('.decile-block').length === 10 && [...doc.querySelectorAll('.dots')].every(el => el.children.length === 5), 'Papan akhir harus 10 × 5');
        assert([...doc.querySelectorAll('.dot')].every((el, i) => +el.dataset.rank === 50 - i), 'Urutan baris akhir harus sesuai ranking baru');
        assert($('focus-tracker').textContent.includes(String(focus.newRank)), 'Pelacak fokus harus menampilkan ranking baru');
        assert(doc.activeElement === $('see-results'), 'Fokus keyboard harus berpindah ke tautan hasil tanpa meninggalkan papan');
        $('table-open').focus(); $('table-open').click();
        assert($('access-dialog').open && !$('table-dialog').open && $('table-body').children.length === 0, 'Detail harus terkunci sebelum password');
        $('table-password').value = 'salah'; $('access-form').requestSubmit();
        while ($('access-submit').disabled) await delay(20);
        assert(!$('table-dialog').open && $('access-error').textContent.includes('belum tepat'), 'Password salah harus ditolak');
        $('table-password').value = 'demiBUSEL7415'; $('access-form').requestSubmit();
        while ($('access-submit').disabled) await delay(20);
        assert($('table-dialog').open && !$('access-dialog').open, 'Password benar membuka tabel');
        assert($('table-body').children.length === 50, 'Tabel harus berisi 50 baris');
        $('table-search').value = scenario.focus; $('table-search').dispatchEvent(new win.Event('input', { bubbles: true }));
        assert($('table-body').children.length === 1 && $('table-body').textContent.includes(scenario.focus), 'Pencarian harus menemukan fokus');
        $('table-search').value = 'tidak-ada'; $('table-search').dispatchEvent(new win.Event('input', { bubbles: true }));
        assert($('table-body').children.length === 0 && $('table-count').textContent.includes('0 dari 50'), 'Pencarian kosong harus ditangani');
        $('table-close').click(); await delay(30); assert(!$('table-dialog').open && $('table-body').children.length === 0 && !win.DTSEN.game.state.tableUnlocked, 'Tabel harus terkunci dan dibersihkan setelah ditutup');
        assert(doc.activeElement === $('table-open'), 'Fokus keyboard harus kembali ke tombol tabel');
        if (mission === 1 && direction === 1) {
          assert($('playground').classList.contains('board-expanded') && !$('results').hidden, 'Simulasi selesai di tampilan diperbesar');
          $('expand-board').click(); await delay(50);
          assert(!$('playground').classList.contains('board-expanded') && !doc.body.classList.contains('simulation-expanded'), 'Tombol kembali memulihkan tampilan');
        }
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
          assert([...doc.querySelectorAll('.dot')].every(el => el.getBoundingClientRect().height >= 32), 'Target baris mobile minimal 32px');
          assert($('direction').getBoundingClientRect().height >= 44, 'Pilihan kondisi mobile minimal 44px');
        }
        if (width >= 768) {
          assert($('population').scrollHeight <= $('population').clientHeight, 'Papan desktop tidak boleh memerlukan gulir internal');
          assert($('population').getBoundingClientRect().height < 480, `Papan ${width}px terlalu tinggi: ${$('population').getBoundingClientRect().height}px`);
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
