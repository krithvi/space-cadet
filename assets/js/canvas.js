// Warp starfield: stars stream toward you from the center of the screen.
// "Park this ship" (or the device's reduced-motion setting) switches it to a still, twinkling sky.
//
// Tune the feel with these numbers:
const SPEED = 0.06;        // how fast you fly: 0.04 drifting · 0.07 cruising · 0.12 warp
const STAR_COUNT = 6000;   // more stars = denser sky
const MAX_SIZE = 2.2;      // px size of the closest stars (far ones stay 1px)
const STREAK = 0.4;        // trail length on near stars: 0 = dots only, 1 = long warp lines
const TWINKLE = 0.2;       // parked sky: share of stars that slowly twinkle (0 = fully still)

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const parked = () => document.documentElement.getAttribute("data-motion") === "parked";

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

const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * 1600 - 800,
    y: Math.random() * 900 - 450,
    z: Math.random() * 1000,
    // a slow 4–10 s fade between dim and bright, used only while parked
    tw: Math.random() < TWINKLE
      ? { phase: Math.random() * Math.PI * 2, speed: (Math.PI * 2) / (4000 + Math.random() * 6000) }
      : null,
  });
}

const project = (s, z) => [w / 2 + s.x / (z * 0.001), h / 2 + s.y / (z * 0.001)];

const draw = (step, time, still) => {
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
    if (still && s.tw) b *= 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * s.tw.speed + s.tw.phase));
    const size = 1 + near * near * (MAX_SIZE - 1);
    const shade = Math.round(205 + 50 * near); // far stars a cool blue-white, near ones pure white
    c.fillStyle = c.strokeStyle = `rgba(${shade - 20},${shade - 5},255,${b})`;

    if (!still && STREAK > 0 && near > 0.55) {
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

// One loop for both modes. Parked redraws ~15 times a second, plenty for a slow twinkle.
let prev, lastStill = -1000;
const tick = (time) => {
  const elapsed = prev === undefined ? 16 : Math.min(time - prev, 50);  // no lurch after a background tab
  prev = time;
  if (parked()) {
    if (time - lastStill > 66) { draw(0, time, true); lastStill = time; }
  } else {
    draw(elapsed * SPEED, time, false);
  }
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
