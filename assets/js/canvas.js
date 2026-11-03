// Warp starfield: stars stream toward you from the center of the screen.
// Tune the feel with the four numbers below.
const SPEED = 0.12;        // how fast you fly (0.1 = the original cruise)
const STAR_COUNT = 6000;   // more stars = denser sky
const MAX_SIZE = 2.2;      // px size of the closest stars (far ones stay 1px)
const STREAK = 0.6;        // 0 = dots only, 1 = long warp streaks on near stars
const TWINKLE = 0.2;       // reduced-motion sky: share of stars that slowly twinkle (0 = fully still)

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

const makeStars = (count) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ x: Math.random() * 1600 - 800, y: Math.random() * 900 - 450, z: Math.random() * 1000 });
  }
  return out;
};
const stars = makeStars(STAR_COUNT);

// Twinkle only in the reduced-motion sky: each chosen star fades between dim and bright
// over 4–10 seconds. Nothing moves, and nothing flashes.
const twinkles = stars.map(() =>
  still && Math.random() < TWINKLE
    ? { phase: Math.random() * Math.PI * 2, speed: (Math.PI * 2) / (4000 + Math.random() * 6000) }
    : null
);

const project = (s, z) => [w / 2 + s.x / (z * 0.001), h / 2 + s.y / (z * 0.001)];

const draw = (step, time = 0) => {
  c.fillStyle = "black";
  c.fillRect(0, 0, w, h);
  c.lineCap = "round";

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.z -= step;
    while (s.z <= 1) s.z += 1000;

    const [x, y] = project(s, s.z);
    if (x < 0 || x >= w || y < 0 || y >= h) continue;

    const near = 1 - s.z / 1000;              // 0 far away … 1 right in front of you
    let b = Math.min(1, 0.4 + near * near * 0.9);
    const tw = twinkles[i];
    if (tw) b *= 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * tw.speed + tw.phase));
    const size = 1 + near * near * (MAX_SIZE - 1);
    const shade = Math.round(205 + 50 * near); // far stars a cool blue-white, near ones pure white
    c.fillStyle = c.strokeStyle = `rgba(${shade - 20},${shade - 5},255,${b})`;

    if (STREAK > 0 && step > 0 && near > 0.55) {
      // a short trail back toward where the star was a moment ago
      const [px, py] = project(s, Math.min(1000, s.z + step * 6 * STREAK));
      c.lineWidth = size * 0.8;
      c.globalAlpha = 0.6;                    // streaks stay softer than text, so they never read as underlines
      c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      c.globalAlpha = 1;
    } else {
      c.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
};

if (still) {
  // Reduced motion: the stars hold their places and some twinkle. ~15 frames a second is plenty for a slow fade.
  let last = -1000;
  const twinkle = (time) => {
    if (time - last > 66) { draw(0, time); last = time; }
    if (TWINKLE > 0) requestAnimationFrame(twinkle);
  };
  requestAnimationFrame(twinkle);
} else {
  let prev;
  const tick = (time) => {
    const elapsed = prev === undefined ? 16 : Math.min(time - prev, 50);  // no lurch after a background tab
    prev = time;
    draw(elapsed * SPEED);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
