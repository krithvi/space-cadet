/* "Park this ship": a latching key that turns the site's motion off and on.
   The choice is saved on this device and announced in a short message.
   Other scripts (canvas.js, rocket.js) read <html data-motion="parked|flying">
   and listen for the "motionchange" event. */
(function () {
  'use strict';
  var root = document.documentElement;
  var key = document.getElementById('park-key');
  if (!key) return;
  var info = document.querySelector('.park-info');
  var help = document.getElementById('park-help');
  var toast = document.querySelector('.park-toast');
  var toastTimer;

  function isParked() { return root.getAttribute('data-motion') === 'parked'; }

  function show(parked) {
    key.setAttribute('aria-pressed', parked ? 'true' : 'false');
    key.title = parked ? 'Ship parked: motion is off. Press to fly again.' : 'Park this ship: turn motion off';
  }

  function announce(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 3200);
  }

  show(isParked());

  key.addEventListener('click', function () {
    var parked = !isParked();
    root.setAttribute('data-motion', parked ? 'parked' : 'flying');
    try { localStorage.setItem('motion', parked ? 'parked' : 'flying'); } catch (e) {}
    show(parked);
    announce(parked ? 'Ship parked. Motion is off.' : 'Back in flight. Motion is on.');
    document.dispatchEvent(new CustomEvent('motionchange', { detail: { parked: parked } }));
  });

  // The little "i": opens and closes the explanation; Escape or a click elsewhere closes it.
  function setHelp(open) {
    if (!info || !help) return;
    info.setAttribute('aria-expanded', open ? 'true' : 'false');
    help.classList.toggle('is-open', open);
  }
  if (info) {
    info.addEventListener('click', function (e) {
      e.stopPropagation();
      setHelp(info.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('click', function () { setHelp(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setHelp(false); });
  }
})();
