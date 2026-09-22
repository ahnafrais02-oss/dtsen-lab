(() => {
  const ui = DTSEN.ui, $ = ui.$;
  const state = { scenario: null, after: false, busy: false, completed: new Set(), tableUnlocked: false };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Local presentation gate only. Synthetic data and client code are not secret.
  const tablePasswordDigest = 'ba7f2b2d36e45cfe4c7ccdaab93cf83b66c101cd1c14f574a964127f9b274492';
  DTSEN.checkTablePassword = async password => {
    if (!globalThis.crypto?.subtle) throw new Error('Buka melalui HTTPS, localhost, atau file lokal di browser modern.');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('') === tablePasswordDigest;
  };
  const busy = value => {
    state.busy = value;
    ['simulate', 'direction', 'reset', 'table-open', 'expand-board'].forEach(id => { $(id).disabled = value; });
    document.querySelectorAll('.mission-card').forEach(b => { b.disabled = value; });
    $('population').setAttribute('aria-busy', String(value));
  };
  const lockTable = () => {
    state.tableUnlocked = false;
    $('table-body').replaceChildren();
    $('table-count').textContent = '';
    $('table-password').value = '';
  };
  const select = (mission, scroll = true) => {
    if (state.busy) return;
    lockTable();
    state.after = false;
    state.scenario = DTSEN.createScenario(mission, Number($('direction').value));
    ui.prepare(state.scenario);
    if (scroll) {
      $('playground').scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
      $('direction').focus({ preventScroll: true });
    }
  };
  const progress = () => {
    document.querySelectorAll('.mission-card').forEach(b => { b.querySelector('.mission-state').textContent = state.completed.has(+b.dataset.mission) ? 'Selesai ✓ · Main lagi' : 'Mainkan misi'; });
    $('progress-text').textContent = `${state.completed.size} dari 4 misi selesai${state.completed.size === 4 ? ' — semua misi sudah dijelajahi!' : ' — coba dan temukan hal baru.'}`;
  };
  const animatePositions = async result => {
    const positions = new Map([...$('population').querySelectorAll('[data-id]')].map(el => [el.dataset.id, el.getBoundingClientRect()]));
    state.after = true;
    ui.board(result, true);
    if (reducedMotion()) return;
    $('population').classList.add('is-animating');
    const animations = [];
    $('population').querySelectorAll('[data-id]').forEach(el => {
      const old = positions.get(el.dataset.id), current = el.getBoundingClientRect();
      const dx = old.x - current.x, dy = old.y - current.y;
      const focused = el.classList.contains('focus');
      if (dx || dy) {
        const duration = focused ? 1700 : 1200;
        const motion = el.animate([
          { transform: `translate(${dx}px,${dy}px)`, zIndex: focused ? 30 : 20, opacity: .8 },
          { transform: `translate(${dx * .5}px,${dy * .5}px) scale(${focused ? 1.1 : 1.03})`, zIndex: focused ? 30 : 20, opacity: 1, offset: .5 },
          { transform: 'translate(0,0) scale(1)', zIndex: focused ? 30 : 20, opacity: 1 }
        ], { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
        animations.push(motion.finished.catch(() => {}).then(() => motion.cancel()));
      } else if (focused) {
        const pulse = el.animate([{ boxShadow: '0 0 0 0 #2d6a4600' }, { boxShadow: '0 0 0 6px #83b45588' }, { boxShadow: '0 0 0 0 #2d6a4600' }], { duration: 1400 });
        animations.push(pulse.finished.catch(() => {}));
      }
    });
    await Promise.all(animations);
    $('population').classList.remove('is-animating');
  };
  DTSEN.game = {
    state,
    init() {
      $('mission-grid').addEventListener('click', e => { const card = e.target.closest('[data-mission]'); if (card) select(+card.dataset.mission); });
      $('direction').addEventListener('change', () => select(state.scenario.mission, false));
      $('reset').addEventListener('click', () => select(state.scenario.mission, false));
      $('simulate').addEventListener('click', async () => {
        if (state.busy) return;
        busy(true); lockTable(); state.after = false;
        $('results').hidden = true; $('see-results').hidden = true;
        $('simulation-error').hidden = true;
        const steps = [...$('sequence').children];
        try {
          ui.board(state.scenario.result, false);
          $('population-panel').scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'instant' : 'smooth' });
          for (let i = 0; i < steps.length; i++) {
            steps.forEach((li, j) => { li.className = j <= i ? `done ${j === i ? 'current' : ''}` : ''; if (j === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
            $('status').textContent = `Langkah ${i + 1}: ${steps[i].textContent}`;
            $('board-caption').textContent = steps[i].textContent + '…';
            if (i === 3) await animatePositions(state.scenario.result);
            await pause(reducedMotion() ? 50 : 350);
          }
          $('board-caption').textContent = 'Sesudah simulasi · 50 posisi dihitung ulang';
          ui.results(state.scenario); state.completed.add(state.scenario.mission); progress();
          ui.detail(state.scenario.result, state.scenario.focus, true);
          $('status').textContent = 'Simulasi selesai. Fokus tetap ditandai bintang. Penjelasan hasil tersedia di bawah papan.';
          $('see-results').focus({ preventScroll: true });
        } catch (error) {
          $('status').textContent = `Simulasi gagal: ${error.message}`;
          $('simulation-error').textContent = `Simulasi gagal: ${error.message}. Silakan ulangi dari awal.`;
          $('simulation-error').hidden = false;
          console.error(error);
        } finally { $('population').classList.remove('is-animating'); busy(false); }
      });
      $('find-focus').addEventListener('click', () => { ui.findFocus(); const f = $('population').querySelector('.focus'); f?.focus({ preventScroll: true }); });
      $('expand-board').addEventListener('click', async () => {
        const panel = $('population-panel');
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (panel.requestFullscreen) await panel.requestFullscreen().catch(() => panel.classList.toggle('board-expanded'));
        else panel.classList.toggle('board-expanded');
        $('expand-board').textContent = document.fullscreenElement || panel.classList.contains('board-expanded') ? 'Kembali ⛶' : 'Perbesar papan ⛶';
      });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('population-panel').classList.remove('board-expanded'); if (!document.fullscreenElement) $('expand-board').textContent = 'Perbesar papan ⛶'; } });
      document.addEventListener('fullscreenchange', () => { $('expand-board').textContent = document.fullscreenElement ? 'Kembali ⛶' : 'Perbesar papan ⛶'; });
      $('population').addEventListener('click', e => { const button = e.target.closest('[data-id]'); if (button) ui.detail(state.scenario.result, button.dataset.id, state.after); });
      $('next-mission').addEventListener('click', () => select(state.scenario.mission % 4 + 1));
      $('table-open').addEventListener('click', () => {
        lockTable(); $('access-error').textContent = ''; $('access-dialog').showModal(); $('table-password').focus();
      });
      $('access-close').addEventListener('click', () => $('access-dialog').close());
      $('access-dialog').addEventListener('close', () => { $('table-password').value = ''; });
      $('access-form').addEventListener('submit', async event => {
        event.preventDefault(); $('access-submit').disabled = true;
        try {
          const valid = await DTSEN.checkTablePassword($('table-password').value);
          if (!$('access-dialog').open) return;
          if (!valid) { $('access-error').textContent = 'Password belum tepat. Silakan coba lagi.'; $('table-password').select(); return; }
          state.tableUnlocked = true;
          $('access-dialog').close(); $('table-search').value = '';
          ui.table(state.scenario.result, state.after); $('table-dialog').showModal();
        } catch (error) { $('access-error').textContent = error.message; }
        finally { $('access-submit').disabled = false; }
      });
      $('table-close').addEventListener('click', () => $('table-dialog').close());
      $('table-dialog').addEventListener('close', () => { lockTable(); $('table-open').focus({ preventScroll: true }); });
      $('table-search').addEventListener('input', e => { if (state.tableUnlocked) ui.table(state.scenario.result, state.after, e.target.value); });
    }
  };
})();
