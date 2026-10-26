/* Touch screens have no cursor, so each tap launches a small rocket from the finger instead.
   Mouse users get the rocket cursor from CSS (_sass/cursor.scss). Skipped for reduced motion. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    var r = document.createElement('span');
    r.className = 'tap-rocket';
    r.setAttribute('aria-hidden', 'true');
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', function () { r.remove(); });
  }, { passive: true });
})();
