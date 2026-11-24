// Homepage previews (not built, not deployed): the scripts the three preview pages share.
// The starfield and the curve-fit drawing are the production index.html scripts, unchanged in behaviour. The curve-fit numbers are
// read from index.html's own fit-data block at run time, so the previews never hold a second copy of the data.

// Starfield behind the hero (index.html, unchanged).
(() => {
  const canvas = document.getElementById("sky");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seed = 19690720;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const tints = ["#cfdcff", "#e6ecff", "#f5f5f7", "#f5f5f7", "#fff4e0", "#ffe2bd"];
  let stars = [], w = 0, h = 0;
  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 19690720;
    const count = Math.round((w * h) / 2600);
    stars = Array.from({ length: count }, () => {
      const m = Math.pow(rand(), 3.2);
      let x = rand() * w, y = rand() * h;
      if (rand() < 0.35) { const t = rand(); x = t * w; y = h * (0.05 + 0.7 * t) + (rand() - 0.5) * h * 0.18; }
      return { x, y, r: 0.35 + m * 1.5, a: 0.18 + m * 0.75, c: tints[Math.floor(rand() * tints.length)], tw: rand() < 0.08 ? 0.6 + rand() * 1.4 : 0, ph: rand() * 6.28 };
    });
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = s.tw ? s.a * (0.55 + 0.45 * Math.sin(t / 1000 * s.tw + s.ph)) : s.a;
      ctx.globalAlpha = a; ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      if (s.r > 1.4) { ctx.globalAlpha = a * 0.18; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, 6.2832); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  let raf = 0;
  function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
  function start() { build(); cancelAnimationFrame(raf); if (still) draw(0); else raf = requestAnimationFrame(loop); }
  start();
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(start, 150); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (!still) raf = requestAnimationFrame(loop); });
})();

// Io curve-fit drawing (index.html, unchanged in behaviour; data read from index.html's fit-data block).
(async () => {
  const photos = document.getElementById("fit-photos");
  const recipe = document.getElementById("fit-recipe");
  const slider = document.querySelector("[data-fit-slider]");
  const readout = document.querySelector("[data-fit-readout]");
  if (!photos || !recipe || !slider || !readout) return;
  let d;
  try {
    const html = await (await fetch("../index.html")).text();
    const block = /<script type="application\/json" id="fit-data">([\s\S]*?)<\/script>/.exec(html);
    d = block ? JSON.parse(block[1]) : undefined;
  } catch { d = undefined; }
  if (!d || !d.io) return;
  const NS = "http://www.w3.org/2000/svg";
  const n = d.coefficients;
  const windowS = d.jupiterPieceSeconds;
  const cheb = (c, o, x) => { let b1 = 0, b2 = 0; for (let k = n - 1; k >= 1; k--) { const b0 = 2 * x * b1 - b2 + c[o + k]; b2 = b1; b1 = b0; } return x * b1 - b2 + c[o]; };
  const place = (t) => {
    const piece = Math.min(1, Math.floor(t / d.pieceSeconds));
    const x = 2 * (t / d.pieceSeconds - piece) - 1;
    const xj = 2 * (t / windowS) - 1;
    const rel = [0, 1, 2].map((a) => cheb(d.io, piece * 3 * n + a * n, x) - cheb(d.jupiter, a * n, xj));
    const dot = (e) => rel[0] * e[0] + rel[1] * e[1] + rel[2] * e[2];
    return [dot(d.plane.e1), dot(d.plane.e2)];
  };
  const R = 421800 * 1.12, C = 150, S = 138 / R;
  const px = (p) => [C + p[0] * S, C - p[1] * S];
  const el = (parent, tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const stepS = d.tableStepMinutes * 60;
  const rows = Math.round(windowS / stepS);
  const dots = []; for (let i = 0; i <= rows; i++) dots.push(px(place(i * stepS)));
  const curve = []; for (let i = 0; i <= 240; i++) curve.push(px(place((windowS * i) / 240)));
  for (const svg of [photos, recipe]) {
    el(svg, "circle", { cx: C, cy: C, r: 421800 * S, class: "fit-orbit" });
    el(svg, "circle", { cx: C, cy: C, r: 71492 * S, class: "fit-planet" });
  }
  el(photos, "path", { class: "fit-dots", d: dots.map((p) => "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + "h0").join("") });
  el(recipe, "path", { class: "fit-curve", d: "M" + curve.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") });
  for (const t of [0, d.pieceSeconds, windowS]) { const p = px(place(t)); el(recipe, "circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 3.2, class: "fit-join" }); }
  const ring = el(photos, "circle", { r: 5, class: "fit-ring" });
  const mark = el(recipe, "circle", { r: 4.2, class: "fit-mark" });
  const fmt = (v) => Math.round(v).toLocaleString("en-US");
  function show() {
    const t = Number(slider.value) * 60;
    const p = place(t), q = px(p);
    mark.setAttribute("cx", q[0].toFixed(1)); mark.setAttribute("cy", q[1].toFixed(1));
    const near = dots[Math.min(rows, Math.round(t / stepS))];
    ring.setAttribute("cx", near[0].toFixed(1)); ring.setAttribute("cy", near[1].toFixed(1));
    readout.textContent = "Hour " + (t / 3600).toFixed(1) + " · Io is " + fmt(Math.hypot(p[0], p[1])) + " km from Jupiter's centre";
  }
  slider.addEventListener("input", show);
  show();
  const f = d.figures, mb = (b, k) => (b / 1e6).toFixed(k === undefined ? 1 : k) + " MB";
  const set = (key, text) => document.querySelectorAll('[data-fit="' + key + '"]').forEach((e) => { e.textContent = text; });
  set("rows", String(dots.length)); set("numbers", String(2 * 3 * n));
  set("ratio", Math.round(f.ioTableBytes / f.ioFitBytes) + "×"); set("ioFit", mb(f.ioFitBytes)); set("ioTable", mb(f.ioTableBytes));
  set("accuracy", (f.ioWorstM * 100).toFixed(0) + " cm");
})();

// A live scene that loads only when asked: a poster and a button; pressing it swaps the poster for the demo page in a frame.
// Below 760 px wide the button opens the demo full screen instead, where its own phone layout applies.
(() => {
  const stage = document.querySelector("[data-stage]");
  if (!stage) return;
  const poster = stage.querySelector("[data-stage-poster]");
  const run = stage.querySelector("[data-stage-run]");
  const open = document.querySelector("[data-stage-open]");
  const caption = document.querySelector("[data-stage-caption]");
  const picks = [...document.querySelectorAll("[data-pick]")];
  let current = picks.find((b) => b.getAttribute("aria-pressed") === "true") ?? picks[0];
  const phone = () => window.matchMedia("(max-width: 759px)").matches;
  function choose(button) {
    current = button;
    for (const b of picks) b.setAttribute("aria-pressed", String(b === button));
    const frame = stage.querySelector("iframe");
    if (frame) frame.remove();
    stage.classList.remove("live");
    poster.src = button.dataset.poster;
    poster.alt = button.dataset.alt;
    if (caption) caption.textContent = button.dataset.caption;
    if (open) open.href = button.dataset.src;
    run.textContent = phone() ? "Open " + button.dataset.name + " full screen" : "Run " + button.dataset.name + " here";
  }
  for (const b of picks) b.addEventListener("click", () => choose(b));
  run.addEventListener("click", () => {
    const src = current?.dataset.src ?? run.dataset.src;
    if (phone()) { window.location.href = src; return; }
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = (current?.dataset.name ?? "Astraeus") + ", running live";
    frame.setAttribute("allow", "fullscreen");
    stage.appendChild(frame);
    stage.classList.add("live");
    frame.focus();
  });
  if (current) choose(current);
})();
