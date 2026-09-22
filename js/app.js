(() => {
  'use strict';
  try {
    DTSEN.debug = new URLSearchParams(location.search).has('debug');
    DTSEN.validateAssignments(DTSEN.assignments);
    for (let mission = 1; mission <= 4; mission++) for (const direction of [1, -1, 0]) DTSEN.createScenario(mission, direction);
    DTSEN.ui.init(); DTSEN.game.init();
    if (DTSEN.debug) console.info('DTSEN Lab: 100 data valid, dua belas variasi misi valid.', DTSEN);
  } catch (error) {
    const message = document.createElement('p'); message.className = 'notice wrap'; message.setAttribute('role', 'alert');
    message.textContent = `Simulator belum bisa dimulai: ${error.message}`;
    document.getElementById('main').prepend(message); console.error(error);
  }
})();
