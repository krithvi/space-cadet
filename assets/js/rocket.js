/* Touch screens have no cursor, so each tap launches a small rocket from the finger instead.
   Mouse users get the rocket cursor from CSS (_sass/cursor.scss). Skipped while the ship is parked. */
(function () {
  'use strict';
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    if (document.documentElement.getAttribute('data-motion') === 'parked') return;  // ship parked: no launches
    var r = document.createElement('span');
    r.className = 'tap-rocket';
    r.setAttribute('aria-hidden', 'true');
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', function () { r.remove(); });
  }, { passive: true });
})();
