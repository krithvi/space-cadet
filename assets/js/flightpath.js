/* Flight path: the scroller on the right of every page that has sections (a sideways track on phones).
   - One planet per section heading; hover or focus a planet to see its name, click to jump there.
   - The green marker sits on the section you're reading; its ring fills as you get through that section.
   - Section headings it looks for: .sec-head (section-head.html), ## headings in entries (.prose h2),
     and the case study's chapter heads (.n-sechead). Pages with fewer than two get no scroller.
   - Also nudges each asteroid heading as it comes into view, and wraps entry headings in their plate.
   Styles: _sass/flightpath.scss. Colours: _sass/palette.scss. */
(function () {
  'use strict';
  var scroller = document.querySelector('.n-scroll') || document.querySelector('.container-sm');
  if (!scroller) return;

  // Entry pages: put each ## heading's text on a plate, like the include does
  [].forEach.call(document.querySelectorAll('.prose h2'), function (h) {
    if (!h.querySelector('.plate')) h.innerHTML = '<span class="plate">' + h.innerHTML + '</span>';
  });

  var heads = [].slice.call(document.querySelectorAll('.sec-head, .prose h2, .n-sechead'));
  var parked = function () { return document.documentElement.getAttribute('data-motion') === 'parked'; };

  // Nudge each rock as it arrives
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || parked()) return;
        e.target.classList.remove('is-arriving'); void e.target.offsetWidth; e.target.classList.add('is-arriving');
      });
    }, { threshold: 0.6 });
    heads.forEach(function (h) { if (!h.classList.contains('n-sechead')) io.observe(h); });
  }

  if (heads.length < 2) return;

  // Build the scroller: a list of links (what keyboards and screen readers use) on a dashed line
  var sections = heads.map(function (h, k) {
    var target = h.id ? h : (h.closest('[id]') || h);
    if (!target.id) target.id = 'section-' + (k + 1);
    var label = (h.querySelector('.n-seclabel') || h).textContent.trim();
    return { el: h, id: target.id, label: label };
  });
  var nav = document.createElement('nav');
  nav.className = 'flight';
  nav.setAttribute('aria-label', 'Sections on this page');
  nav.innerHTML = '<span class="flight-track" aria-hidden="true"></span><span class="flight-done" aria-hidden="true"></span>' +
    '<ol>' + sections.map(function (s) {
      return '<li><a class="flight-planet" href="#' + s.id + '"><span class="flight-label">' + s.label + '</span></a></li>';
    }).join('') + '</ol>' +
    '<span class="flight-marker" aria-hidden="true"></span>';
  document.body.appendChild(nav);
  var planets = [].slice.call(nav.querySelectorAll('.flight-planet'));
  var marker = nav.querySelector('.flight-marker'), done = nav.querySelector('.flight-done');

  function navH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80; }
  function topOf(el) { return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop; }
  var tops = [];

  // Place each planet at its section's position down the page (as a fraction of the whole page)
  function layout() {
    var total = scroller.scrollHeight;
    tops = sections.map(function (s) { return topOf(s.el); });
    planets.forEach(function (p, k) { p.parentNode.style.setProperty('--at', (tops[k] / total * 100) + '%'); });
    update();
  }

  // Which section is being read, and how far through it
  var raf = null;
  function update() {
    raf = null;
    var line = scroller.scrollTop + navH() + 60;          // the reading line, a little below the nav
    var max = scroller.scrollHeight - scroller.clientHeight;
    var cur = 0;
    tops.forEach(function (t, k) { if (line >= t) cur = k; });
    if (scroller.scrollTop >= max - 2) cur = tops.length - 1;
    var start = tops[cur], end = cur + 1 < tops.length ? tops[cur + 1] : max + navH() + 60;
    var through = Math.max(0, Math.min(1, (line - start) / Math.max(1, end - start)));
    if (scroller.scrollTop >= max - 2) through = 1;
    planets.forEach(function (p, k) {
      p.classList.toggle('is-past', k < cur);
      p.classList.toggle('is-on', k === cur);
      if (k === cur) p.setAttribute('aria-current', 'location'); else p.removeAttribute('aria-current');
    });
    var at = planets[cur].parentNode.style.getPropertyValue('--at');
    nav.style.setProperty('--now', at);
    nav.style.setProperty('--f', parseFloat(at) / 100);   // same position as a plain number, for the phone track
    nav.style.setProperty('--through', (through * 100) + '%');
  }
  scroller.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(scroller.firstElementChild || scroller);

  // Jump to a section inside the scroll container, landing just below the nav
  planets.forEach(function (p, k) {
    p.addEventListener('click', function (e) {
      e.preventDefault();
      scroller.scrollTo({ top: Math.max(0, topOf(sections[k].el) - navH() - 24), behavior: parked() ? 'auto' : 'smooth' });
      history.replaceState(null, '', '#' + sections[k].id);
    });
  });

  layout();
})();
