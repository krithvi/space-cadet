// The site's sky, in two modes:
//   flying – a warp starfield streaming toward you from the center of the screen
//   parked – a night sky: stars twinkle (mostly toward the edges), the sky drifts very slowly,
//            and now and then a shooting star crosses. Visitors whose device asks for reduced
//            motion get the twinkle only, with no drift or shooting stars.
// "Park this ship" (assets/js/park.js) switches between them.
//
// Tune the feel with these numbers:
const SPEED = 0.06;          // flying: 0.04 drifting · 0.07 cruising · 0.12 warp
const STAR_COUNT = 6000;     // flying: more stars = denser sky
const MAX_SIZE = 2.2;        // flying: px size of the closest stars
const STREAK = 0.4;          // flying: trail length on near stars, 0 = dots only
const DRIFT = 3;             // parked: px per second the sky slides sideways, 0 = still
const TWINKLE = 0.8;         // parked: share of edge stars that twinkle (center stars far fewer)
const SHOOTING_EVERY = 9;    // parked: average seconds between shooting stars, 0 = none

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const parked = () => document.documentElement.getAttribute("data-motion") === "parked";
const deviceCalm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let w, h, dpr;
const setCanvasExtents = () => {
  dpr = Math.min(window.devicePixelRatio || 1, 2);   // sharp on retina, capped for speed
  w = document.body.clientWidth;
  h = document.body.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
};
setCanvasExtents();
window.addEventListener("resize", setCanvasExtents);

/* ── Flying: warp starfield ─────────────────────────────────────────── */
const warp = [];
for (let i = 0; i < STAR_COUNT; i++) {
  warp.push({ x: Math.random() * 1600 - 800, y: Math.random() * 900 - 450, z: Math.random() * 1000 });
}
const project = (s, z) => [w / 2 + s.x / (z * 0.001), h / 2 + s.y / (z * 0.001)];

const drawWarp = (step) => {
  c.fillStyle = "black";
  c.fillRect(0, 0, w, h);
  c.lineCap = "round";
  for (let i = 0; i < warp.length; i++) {
    const s = warp[i];
    s.z -= step;
    while (s.z <= 1) s.z += 1000;
    const [x, y] = project(s, s.z);
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const near = 1 - s.z / 1000;              // 0 far away … 1 right in front of you
    const b = Math.min(1, 0.4 + near * near * 0.9);
    const size = 1 + near * near * (MAX_SIZE - 1);
    const shade = Math.round(205 + 50 * near);
    c.fillStyle = c.strokeStyle = `rgba(${shade - 20},${shade - 5},255,${b})`;
    if (STREAK > 0 && near > 0.55) {
      const [px, py] = project(s, Math.min(1000, s.z + step * 6 * STREAK));
      c.lineWidth = size * 0.8;
      c.globalAlpha = 0.6;                    // streaks stay softer than text
      c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      c.globalAlpha = 1;
    } else {
      c.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
};

/* ── Parked: twinkling night sky ────────────────────────────────────── */
const TINTS = [[230, 240, 255], [255, 250, 240], [210, 228, 255]];   // blue-white, warm white, cool blue
let sky = [];
const makeSky = () => {
  // About one star per 450 px² of screen; stored as fractions so a resize keeps the layout.
  const count = Math.min(4000, Math.round((window.innerWidth * window.innerHeight) / 450));
  sky = [];
  for (let i = 0; i < count; i++) {
    const fx = Math.random(), fy = Math.random();
    const edge = Math.min(1, Math.hypot(fx - 0.5, fy - 0.5) / 0.7071);  // 0 center … 1 corner
    const bright = Math.random() < 0.07 * edge;                          // a few big sparkly stars, near the edges
    sky.push({
      fx, fy,
      b0: 0.25 + Math.random() * 0.65,
      size: bright ? 1.8 : Math.random() < 0.15 ? 1.3 : 1,
      bright,
      tint: TINTS[Math.floor(Math.random() * 3)],
      // twinkle: fades fully in and out over 1.5–5 s; far more likely toward the edges
      tw: bright || Math.random() < 0.08 + TWINKLE * Math.pow(edge, 1.5)
        ? { phase: Math.random() * Math.PI * 2, speed: (Math.PI * 2) / (1500 + Math.random() * 3500) }
        : null,
    });
  }
};
makeSky();

let drift = 0, shooting = null, nextShot = performance.now() + 3000 + Math.random() * 3000;

const drawSky = (time, dt) => {
  c.fillStyle = "black";
  c.fillRect(0, 0, w, h);
  if (!deviceCalm && DRIFT > 0) drift = (drift + (dt / 1000) * DRIFT) % w;

  for (let i = 0; i < sky.length; i++) {
    const s = sky[i];
    let b = s.b0;
    if (s.tw) {
      const k = 0.5 + 0.5 * Math.sin(time * s.tw.speed + s.tw.phase);
      b *= 0.05 + 0.95 * k * k;               // dips almost to nothing, then shines
    }
    let x = s.fx * w + drift;
    if (x > w) x -= w;
    const y = s.fy * h;
    const [r, g, bl] = s.tint;
    if (s.bright && b > 0.35) {
      // soft glow and a small four-point sparkle that grow as the star brightens
      const glow = c.createRadialGradient(x, y, 0, x, y, 7);
      glow.addColorStop(0, `rgba(${r},${g},${bl},${b * 0.55})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = glow;
      c.fillRect(x - 7, y - 7, 14, 14);
      const arm = 3 + b * 5;
      c.strokeStyle = `rgba(${r},${g},${bl},${b * 0.7})`;
      c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(x - arm, y); c.lineTo(x + arm, y); c.moveTo(x, y - arm); c.lineTo(x, y + arm); c.stroke();
    }
    c.fillStyle = `rgba(${r},${g},${bl},${b})`;
    c.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
  }

  // an occasional shooting star, upper part of the screen, about 0.7 s long
  if (!deviceCalm && SHOOTING_EVERY > 0) {
    if (!shooting && time > nextShot) {
      shooting = { x: w * (0.15 + Math.random() * 0.6), y: h * Math.random() * 0.4, t0: time, len: 80 + Math.random() * 60 };
    }
    if (shooting) {
      const p = (time - shooting.t0) / 700;
      if (p >= 1) {
        shooting = null;
        nextShot = time + SHOOTING_EVERY * 1000 * (0.65 + Math.random() * 0.7);
      } else {
        const hx = shooting.x + p * 160, hy = shooting.y + p * 80, a = Math.sin(p * Math.PI);
        const tail = c.createLinearGradient(hx - shooting.len, hy - shooting.len / 2, hx, hy);
        tail.addColorStop(0, "rgba(255,255,255,0)");
        tail.addColorStop(1, `rgba(255,255,255,${a})`);
        c.strokeStyle = tail;
        c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(hx - shooting.len, hy - shooting.len / 2); c.lineTo(hx, hy); c.stroke();
      }
    }
  }
};

/* ── One loop for both modes ────────────────────────────────────────── */
let prev, lastSky = -1000;
const tick = (time) => {
  const elapsed = prev === undefined ? 16 : Math.min(time - prev, 50);  // no lurch after a background tab
  prev = time;
  if (parked()) {
    if (time - lastSky >= 32) { drawSky(time, time - lastSky > 200 ? 32 : time - lastSky); lastSky = time; }  // ~30 fps is plenty here
  } else {
    drawWarp(elapsed * SPEED);
  }
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
