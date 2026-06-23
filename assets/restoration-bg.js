/*
  Restoration / fault / self-healing grid background for GitHub Pages.
  Original canvas animation: no video file, no external library, no Shutterstock asset.

  Visual sequence:
  1. blackout state
  2. fault flash
  3. node-to-node restoration wave
  4. energized grid with pulsing packets
  5. fade back for a seamless loop
*/

(function () {
  const canvas = document.getElementById("restoration-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const colors = [
    [0, 220, 255],     // cyan
    [255, 45, 210],    // magenta
    [255, 178, 52],    // amber
    [145, 80, 255]     // violet
  ];

  let dpr = 1;
  let W = 0;
  let H = 0;
  let nodes = [];
  let edges = [];
  let faultNodes = [];
  let startTime = performance.now();

  function rand(seed) {
    // deterministic pseudo-random generator
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNetwork();
  }

  function buildNetwork() {
    nodes = [];
    edges = [];
    faultNodes = [];

    const cols = Math.max(14, Math.floor(W / 90));
    const rows = Math.max(8, Math.floor(H / 90));
    const padX = W * 0.04;
    const padY = H * 0.10;
    const gridW = W - padX * 2;
    const gridH = H - padY * 2;

    let id = 0;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const s = id + 17;
        const jitterX = (rand(s * 3.1) - 0.5) * (gridW / cols) * 0.55;
        const jitterY = (rand(s * 4.7) - 0.5) * (gridH / rows) * 0.55;

        const x = padX + (i + 0.5) * gridW / cols + jitterX;
        const y = padY + (j + 0.5) * gridH / rows + jitterY;

        // Keep more nodes in the upper and lower areas so central text remains readable.
        const centerPenalty = Math.abs(y - H * 0.52) < H * 0.16 && Math.abs(x - W * 0.55) < W * 0.26;
        if (centerPenalty && rand(s * 9.4) < 0.42) continue;

        nodes.push({
          id: id++,
          x,
          y,
          r: 1.7 + rand(s * 5.3) * 2.7,
          colorIndex: Math.floor(rand(s * 8.2) * colors.length),
          delay: 0,
          pulse: rand(s * 11.1)
        });
      }
    }

    // Connect each node to close neighbors.
    for (let a = 0; a < nodes.length; a++) {
      const distances = [];
      for (let b = 0; b < nodes.length; b++) {
        if (a === b) continue;
        const dx = nodes[a].x - nodes[b].x;
        const dy = nodes[a].y - nodes[b].y;
        const dist = Math.hypot(dx, dy);
        distances.push([dist, b]);
      }
      distances.sort((p, q) => p[0] - q[0]);

      const k = 2 + Math.floor(rand(a * 13.7 + 2) * 2);
      for (let m = 0; m < Math.min(k, distances.length); m++) {
        const b = distances[m][1];
        const key = a < b ? a + "-" + b : b + "-" + a;
        if (!edges.some(e => e.key === key)) {
          const ci = Math.floor(rand((a + 1) * (b + 3)) * colors.length);
          edges.push({ key, a, b, colorIndex: ci, dist: distances[m][0] });
        }
      }
    }

    // Restoration delay is approximate distance from a source near lower-left.
    const sx = W * 0.12;
    const sy = H * 0.78;
    let maxD = 1;

    nodes.forEach(n => {
      const d = Math.hypot(n.x - sx, n.y - sy);
      n.delay = d + rand(n.id * 5.17) * W * 0.15;
      maxD = Math.max(maxD, n.delay);
    });

    nodes.forEach(n => {
      n.delay = n.delay / maxD;
    });

    // Choose several fault nodes.
    const sortedByCenter = [...nodes].sort((a, b) => {
      const da = Math.hypot(a.x - W * 0.5, a.y - H * 0.45);
      const db = Math.hypot(b.x - W * 0.5, b.y - H * 0.45);
      return da - db;
    });

    faultNodes = sortedByCenter.slice(0, Math.min(8, sortedByCenter.length)).filter((_, idx) => idx % 2 === 0);
  }

  function rgb(c, alpha) {
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }

  function cyclePhase(t) {
    // 16-second loop
    return ((t - startTime) % 16000) / 16000;
  }

  function smoothstep(edge0, edge1, x) {
    const v = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return v * v * (3 - 2 * v);
  }

  function activationForNode(n, phase) {
    if (phase < 0.16) return 0;            // blackout
    if (phase < 0.26) return 0.05;         // fault phase
    const progress = smoothstep(0.26, 0.74, phase);
    const active = smoothstep(n.delay, n.delay + 0.08, progress);
    const fadeOut = 1 - smoothstep(0.90, 1.0, phase);
    return active * fadeOut;
  }

  function drawBackground(phase) {
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createRadialGradient(W * 0.55, H * 0.45, 0, W * 0.55, H * 0.45, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(8, 20, 32, 0.92)");
    g.addColorStop(0.55, "rgba(3, 8, 16, 0.95)");
    g.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Subtle geometric grid.
    ctx.save();
    ctx.strokeStyle = "rgba(120, 190, 255, 0.045)";
    ctx.lineWidth = 1;
    const step = 56;
    for (let x = -step; x < W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + W * 0.10, H);
      ctx.stroke();
    }
    for (let y = -step; y < H + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + H * 0.06);
      ctx.stroke();
    }
    ctx.restore();

    // Edge shadow for text readability.
    const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.10, W / 2, H / 2, Math.max(W, H) * 0.70);
    vignette.addColorStop(0, "rgba(0,0,0,0.04)");
    vignette.addColorStop(0.7, "rgba(0,0,0,0.12)");
    vignette.addColorStop(1, "rgba(0,0,0,0.74)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawFaults(phase) {
    const fault = smoothstep(0.14, 0.20, phase) * (1 - smoothstep(0.25, 0.31, phase));
    if (fault <= 0) return;

    faultNodes.forEach((n, idx) => {
      const flicker = 0.55 + 0.45 * Math.sin(phase * 190 + idx * 2.9);
      const radius = 22 + 10 * Math.sin(phase * 80 + idx);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 45, 35, ${0.35 * fault * flicker})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 126, 56, ${0.85 * fault * flicker})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(n.x - 8, n.y - 8);
      ctx.lineTo(n.x + 8, n.y + 8);
      ctx.moveTo(n.x + 8, n.y - 8);
      ctx.lineTo(n.x - 8, n.y + 8);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawEdges(phase) {
    edges.forEach(e => {
      const a = nodes[e.a];
      const b = nodes[e.b];
      const aa = activationForNode(a, phase);
      const bb = activationForNode(b, phase);
      const active = Math.min(aa, bb);

      const baseAlpha = 0.07 + active * 0.78;
      const color = colors[e.colorIndex];

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Dim unpowered circuit trace.
      ctx.strokeStyle = "rgba(120, 150, 180, 0.055)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      if (active > 0.02) {
        // Glow layer.
        ctx.shadowBlur = 18 * active;
        ctx.shadowColor = rgb(color, 0.9);
        ctx.strokeStyle = rgb(color, 0.16 * active);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Sharp core line.
        ctx.shadowBlur = 10 * active;
        ctx.strokeStyle = rgb(color, baseAlpha);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Moving data packet.
        const packet = (phase * 4 + a.pulse + b.pulse) % 1;
        const px = a.x + (b.x - a.x) * packet;
        const py = a.y + (b.y - a.y) * packet;
        ctx.fillStyle = rgb(color, 0.95 * active);
        ctx.shadowBlur = 14;
        ctx.shadowColor = rgb(color, 1);
        ctx.beginPath();
        ctx.arc(px, py, 2.2 + 1.2 * active, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  function drawNodes(phase) {
    nodes.forEach(n => {
      const active = activationForNode(n, phase);
      const c = colors[n.colorIndex];

      ctx.save();

      // Dormant node.
      ctx.fillStyle = "rgba(130, 150, 175, 0.13)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      if (active > 0.02) {
        const pulse = 0.65 + 0.35 * Math.sin(phase * 40 + n.pulse * 9);
        ctx.shadowBlur = 14 + 15 * active * pulse;
        ctx.shadowColor = rgb(c, 1);
        ctx.fillStyle = rgb(c, 0.75 + 0.25 * pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + active * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = rgb(c, 0.45 * active);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 8 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  function frame(t) {
    const phase = prefersReducedMotion ? 0.72 : cyclePhase(t);

    drawBackground(phase);
    drawEdges(phase);
    drawNodes(phase);
    drawFaults(phase);

    if (!prefersReducedMotion) {
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
