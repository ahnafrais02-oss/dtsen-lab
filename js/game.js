(() => {
  const ui = DTSEN.ui, $ = ui.$;
  const state = { scenario: null, after: false, busy: false, completed: new Set() };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const busy = value => {
    state.busy = value;
    ['simulate', 'direction', 'reset', 'table-open'].forEach(id => { $(id).disabled = value; });
    document.querySelectorAll('.mission-card').forEach(b => { b.disabled = value; });
    $('population').setAttribute('aria-busy', String(value));
  };
  const select = (mission, scroll = true) => {
    if (state.busy) return;
    state.after = false;
    state.scenario = DTSEN.createScenario(mission, Number($('direction').value));
    ui.prepare(state.scenario);
    ui.findFocus('instant');
    if (scroll) { $('playground').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); $('direction').focus({ preventScroll: true }); }
  };
  const progress = () => {
    document.querySelectorAll('.mission-card').forEach(b => { b.querySelector('.mission-state').textContent = state.completed.has(+b.dataset.mission) ? 'Selesai ✓ · Main lagi' : 'Mainkan misi'; });
    $('progress-text').textContent = `${state.completed.size} dari 4 misi selesai${state.completed.size === 4 ? ' — hebat, semua misi sudah kamu jelajahi!' : ' — setiap percobaan adalah penemuan baru.'}`;
  };
  DTSEN.game = {
    state,
    init() {
      $('mission-grid').addEventListener('click', e => { const card = e.target.closest('[data-mission]'); if (card) select(+card.dataset.mission); });
      $('direction').addEventListener('change', () => select(state.scenario.mission, false));
      $('reset').addEventListener('click', () => select(state.scenario.mission, false));
      $('simulate').addEventListener('click', async () => {
        if (state.busy) return;
        busy(true); state.after = false; $('results').hidden = true;
        ui.board(state.scenario.result, false);
        const steps = [...$('sequence').children];
        steps.forEach(li => { li.className = ''; li.removeAttribute('aria-current'); });
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        try {
          ui.findFocus('instant');
          for (let i = 0; i < steps.length; i++) {
            steps.forEach((li, j) => { li.className = j <= i ? `done ${j === i ? 'current' : ''}` : ''; if (j === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
            $('status').textContent = `Langkah ${i + 1}: ${steps[i].textContent}`;
            $('board-caption').textContent = steps[i].textContent + '…';
            if (i === 4) {
              const positions = new Map([...$('population').querySelectorAll('[data-id]')].map(el => [el.dataset.id, el.getBoundingClientRect()]));
              state.after = true; ui.board(state.scenario.result, true);
              if (!reduced) $('population').querySelectorAll('[data-id]').forEach(el => {
                const previous = positions.get(el.dataset.id), current = el.getBoundingClientRect();
                if (previous && (previous.x !== current.x || previous.y !== current.y)) el.animate([{ transform: `translate(${previous.x - current.x}px,${previous.y - current.y}px)`, zIndex: 3 }, { transform: 'translate(0,0)', zIndex: 3 }], { duration: 700, easing: 'ease-in-out' });
              });
            }
            await pause(reduced ? 70 : 750);
            if (i === 4) { ui.findFocus(reduced ? 'instant' : 'smooth'); await pause(reduced ? 0 : 500); }
          }
          $('board-caption').textContent = 'Posisi sesudah perubahan · seluruh populasi dihitung ulang';
          ui.results(state.scenario); state.completed.add(state.scenario.mission); progress();
          ui.detail(state.scenario.result, state.scenario.focus, true);
          $('status').textContent = 'Simulasi selesai. Hasil perbandingan tersedia.';
          $('results-title').focus({ preventScroll: true });
          $('results').scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
        } catch (error) { $('status').textContent = `Simulasi gagal: ${error.message}`; $('simulation-error').textContent = `Simulasi gagal: ${error.message}. Silakan ulangi dari awal.`; $('simulation-error').hidden = false; console.error(error); }
        finally { busy(false); }
      });
      $('find-focus').addEventListener('click', () => ui.findFocus());
      $('population').addEventListener('click', e => { const button = e.target.closest('[data-id]'); if (button) ui.detail(state.scenario.result, button.dataset.id, state.after); });
      $('next-mission').addEventListener('click', () => select(state.scenario.mission % 4 + 1));
      $('table-open').addEventListener('click', () => { $('table-search').value = ''; ui.table(state.scenario.result, state.after); $('table-dialog').showModal(); });
      $('table-close').addEventListener('click', () => $('table-dialog').close());
      $('table-search').addEventListener('input', e => ui.table(state.scenario.result, state.after, e.target.value));
    }
  };
})();
