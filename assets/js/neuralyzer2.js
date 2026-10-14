/* Neuralyzer case study — prototype flow + scroll rail.
   Vanilla, no dependencies. The starfield is the site's own assets/js/canvas.js,
   loaded separately and untouched. */
(function () {
  'use strict';

  var SEQ = [
    { step: 1, ms: 2000 },
    { step: 2, ms: 2000 },
    { step: 3, ms: 2600 },
    { step: 4, ms: 1600 },
    { step: 5, ms: 3600 },
    { step: 6, ms: 2600 }
  ];

  var scroller = document.getElementById('n-scroll');
  var stage = document.getElementById('n-stage');
  if (!scroller || !stage) return;

  /* ---------------------------------------------------------------- rail */
  var bar = document.querySelector('.n-progress-bar');
  var railLinks = [].slice.call(document.querySelectorAll('.n-rail a'));
  var targets = railLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });

  var railRaf = null;
  function onScroll() {
    if (railRaf) return;
    railRaf = requestAnimationFrame(function () {
      railRaf = null;
      var max = scroller.scrollHeight - scroller.clientHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';

      var top = scroller.getBoundingClientRect().top;
      var cut = scroller.clientHeight * 0.4;
      var active = -1;
      targets.forEach(function (el, i) {
        if (el && el.getBoundingClientRect().top - top <= cut) active = i;
      });
      railLinks.forEach(function (a, i) {
        a.classList.toggle('is-on', i === active);
        a.classList.toggle('is-past', i < active);
      });
    });
  }
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* smooth in-page jumps inside the scroll container */
  railLinks.concat([].slice.call(document.querySelectorAll('a[href^="#"]:not(.n-rail a)')))
    .forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        if (!el) return;
        e.preventDefault();
        scroller.scrollTo({
          top: scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 40,
          behavior: 'smooth'
        });
      });
    });

  /* ----------------------------------------------------------- prototype */
  var screens = {};
  [].slice.call(stage.querySelectorAll('[data-screen]')).forEach(function (el) {
    screens[el.getAttribute('data-screen')] = el;
  });
  var steps = [].slice.call(document.querySelectorAll('.n-step'));
  var flash = stage.querySelector('.n-flash');
  var badge = document.querySelector('.n-badge');
  var badgeText = document.querySelector('.n-badge-text');
  var countEl = document.querySelector('.n-count');
  var digits = [].slice.call(document.querySelectorAll('.n-digit'));

  var step = 1, live = false, count = 3, demoIndex = 0;
  var dur = [0, 0, 0, 5];
  var maxima = [30, 11, 30, 23];
  var t1, t2, iv;

  function pad(n) { return String(n).length < 2 ? '0' + n : String(n); }

  function clear() { clearTimeout(t1); clearTimeout(t2); clearInterval(iv); }

  function paint() {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('is-on', Number(k) === step);
    });
    steps.forEach(function (el, i) { el.classList.toggle('is-on', i + 1 === step); });
    if (badge) {
      badge.classList.toggle('is-live', live);
      if (badgeText) {
        badgeText.textContent = live ? "You're in control" : 'Demo running — click to take control';
      }
    }
    digits.forEach(function (btn, i) {
      var n = btn.querySelector('.n-digit-n');
      if (n) n.textContent = pad(dur[i]);
    });
    if (countEl) countEl.textContent = String(count > 0 ? count : 1);
  }

  function doFlash() {
    if (!flash) return;
    flash.classList.add('is-on');
    t2 = setTimeout(function () { flash.classList.remove('is-on'); }, 200);
  }

  function runCount() {
    clearInterval(iv);
    count = 3;
    paint();
    iv = setInterval(function () {
      count -= 1;
      if (count <= 0) { count = 0; clearInterval(iv); }
      paint();
    }, 1000);
  }

  /* the screens re-trigger their one-shot animations on each entry */
  function restart(el) {
    if (!el) return;
    el.querySelectorAll('.n-authorized, .n-confirm, .n-tick').forEach(function (n) {
      n.style.animation = 'none';
      void n.offsetWidth;
      n.style.animation = '';
    });
  }

  function show(n) {
    step = n;
    if (flash && n !== 4) flash.classList.remove('is-on');
    paint();
    restart(screens[n]);
  }

  function tickDemo() {
    var cur = SEQ[demoIndex % SEQ.length];
    count = 3;
    show(cur.step);
    if (cur.step === 5) runCount();
    if (cur.step === 4) doFlash();
    t1 = setTimeout(function () { demoIndex += 1; tickDemo(); }, cur.ms);
  }

  function go(n) {
    clear();
    live = true;
    show(n);
    if (n === 5) runCount();
    if (n === 1) t1 = setTimeout(function () { go(2); }, 1800);
    if (n === 2) t1 = setTimeout(function () { go(3); }, 1500);
  }

  stage.addEventListener('click', function () { if (!live) go(1); });

  digits.forEach(function (btn, i) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dur[i] = (dur[i] + 1) % (maxima[i] + 1);
      paint();
    });
  });

  function bind(sel, fn) {
    var el = document.querySelector(sel);
    if (el) el.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
  }

  bind('[data-act="neuralyze"]', function () {
    clear();
    live = true;
    show(4);
    doFlash();
    t1 = setTimeout(function () { go(5); }, 1700);
  });
  bind('[data-act="cancel"]', function () { go(1); });
  bind('[data-act="team"]', function () { go(6); });
  bind('[data-act="restart"]', function () { go(1); });

  paint();
  if (document.body.hasAttribute('data-no-autoplay')) { live = true; paint(); }
  else tickDemo();
})();
