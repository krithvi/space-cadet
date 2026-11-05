/* A 👾 dances wherever you click or tap something clickable, like it's infecting what you pressed.
   Works for mouse and touch. At most one every 350 ms, so mashing a button can't flood the screen.
   Nothing appears while the ship is parked. The 🛸/👾 cursors themselves are CSS (_sass/cursor.scss). */
(function () {
  'use strict';
  var CLICKABLE = 'a, button, summary, label, select, [role="button"], input[type="submit"], input[type="button"]';
  var last = 0;
  document.addEventListener('pointerdown', function (e) {
    if (document.documentElement.getAttribute('data-motion') === 'parked') return;
    if (!e.target.closest || !e.target.closest(CLICKABLE)) return;
    var now = Date.now();
    if (now - last < 350) return;
    last = now;
    var bug = document.createElement('span');
    bug.className = 'invader';
    bug.setAttribute('aria-hidden', 'true');
    bug.textContent = '👾';   // 👾
    bug.style.left = e.clientX + 'px';
    bug.style.top = e.clientY + 'px';
    document.body.appendChild(bug);
    bug.addEventListener('animationend', function () { bug.remove(); });
    setTimeout(function () { bug.remove(); }, 1500);   // backup: parking mid-dance hides it before the animation ends
  }, { passive: true });
})();
