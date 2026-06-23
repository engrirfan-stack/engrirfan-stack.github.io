/*
  Fault-and-restoration animated background for GitHub Pages.
  Original canvas animation: no stock video and no external libraries.

  Sequence:
  1. Dark outage state
  2. Lightning strike and fault flash
  3. Damaged lines burn red/orange and go dark
  4. Restoration wave reconnects the network node-to-node
  5. Energized network with moving packets
  6. Soft fade to loop
*/

(function () {
  const canvas = document.getElementById("restoration-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const colors = [
    [0, 220, 255],
    [255, 45, 210],
    [255, 178, 52],
    [145, 80, 255]
  ];

  let dpr = 1;
  let W = 0;
  let H = 0;
  let nodes = [];
  let edges = [];
  let faultNodes = [];
  let damagedEdges = [];
  let lightning = [];
  let startTime = performance.now();

  function prand(seed) {
    const x = Math.sin(seed * 999.123) * 10000;
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
    damagedEdges = [];
    lightning = [];
    faultNodes = [];

    const cols = Math.max(16, Math.floor(W / 82));
    const rows = Math.max(9, Math.floor(H / 82));
    const padX = W * 0.035;
    const padY = H * 0.09;
    const gridW = W - padX * 2;
    const gridH = H - padY * 2;

    let id = 0;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const s = (j + 1) * 131 + (i + 3) * 17;
        const x = padX + (i + 0.5) * gridW / cols + (prand(s + 2) - 0.5) * (gridW / cols) * 0.54;
        const y = padY + (j + 0.5) * gridH / rows + (prand(s + 7) - 0.5) * (gridH / rows) * 0.54;

        const centralTextZone = x > W * 0.30 && x < W * 0.72 && y > H * 0.18 && y < H * 0.74;
        if (centralTextZone && prand(s + 19) < 0.38) continue;

        nodes.push({
          id: id++,
          x,
          y,
          r: 1.6 + prand(s + 11) * 2.5,
          colorIndex: Math.floor(prand(s + 29) * colors.length),
          delay: 0,
          pulse: prand(s + 41)
        });
      }
    }

    for (let a = 0; a < nodes.length; a++) {
      const distances = [];
      for (let b = 0; b < nodes.length; b++) {
        if (a === b) continue;
        const dist = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
        distances.push([dist, b]);
      }
      distances.sort((p, q) => p[0] - q[0]);

      const count = 2 + Math.floor(prand(a + 8) * 2);
      for (let k = 0; k < Math.min(count, distances.length); k++) {
        const b = distances[k][1];
        const key = a < b ? a + "-" + b : b + "-" + a;
        if (!edges.some(e => e.key === key)) {
          edges.push({
            key,
            a,
            b,
            colorIndex: Math.floor(prand((a + 5) * (b + 9)) * colors.length),
            damage: 0,
            repairBoost: prand((a + 1) * (b + 2))
          });
        }
      }
    }

    const sx = W * 0.10;
    const sy = H * 0.76;
    let maxD = 1;
    nodes.forEach(n => {
      n.delay = Math.hypot(n.x - sx, n.y - sy) + prand(n.id + 77) * W * 0.16;
      maxD = Math.max(maxD, n.delay);
    });
    nodes.forEach(n => n.delay /= maxD);

    const fx = W * 0.58;
    const fy = H * 0.24;

    const sortedNodes = [...nodes].sort((a, b) =>
      Math.hypot(a.x - fx, a.y - fy) - Math.hypot(b.x - fx, b.y - fy)
    );
    faultNodes = sortedNodes.slice(0, Math.min(7, sortedNodes.length));

    damagedEdges = edges
      .map(e => {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return [Math.hypot(mx - fx, my - fy), e];
      })
      .sort((a, b) => a[0] - b[0])
      .slice(0, Math.min(18, edges.length))
      .map(x => x[1]);

    damagedEdges.forEach(e => e.damage = 1);

    faultNodes.slice(0, 3).forEach((n, idx) => {
      const startX = n.x + (prand(idx + 9) - 0.5) * W * 0.25;
      const startY = -H * 0.08;
      const points = [];
      const steps = 7;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        points.push({
          x: startX + (n.x - startX) * t + (prand(idx * 31 + k) - 0.5) * 42,
          y: startY + (n.y - startY) * t + (prand(idx * 43 + k) - 0.5) * 26
        });
      }
      lightning.push({ points, node: n, seed: idx + 1 });
    });
  }

  function rgba(c, a) {
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
  }

  function phase(t) {
    return ((t - startTime) % 18000) / 18000;
  }

  function smoothstep(a, b, x) {
    const v = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return v * v * (3 - 2 * v);
  }

  function activation(n, ph) {
    if (ph < 0.12) return 0;
    if (ph < 0.28) return 0.04;
    const progress = smoothstep(0.30, 0.78, ph);
    const active = smoothstep(n.delay, n.delay + 0.09, progress);
    const fade = 1 - smoothstep(0.92, 1.0, ph);
    return active * fade;
  }

  function edgeDamageAmount(e, ph) {
    if (!e.damage) return 0;
    const breakIn = smoothstep(0.16, 0.24, ph);
    const repair = smoothstep(0.52 + e.repairBoost * 0.10, 0.74 + e.repairBoost * 0.08, ph);
    return breakIn * (1 - repair);
  }

  function drawBackground(ph) {
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * 0.55, H * 0.45, 0, W * 0.55, H * 0.45, Math.max(W, H) * 0.78);
    bg.addColorStop(0, "rgba(6, 19, 33, 0.96)");
    bg.addColorStop(0.55, "rgba(3, 8, 16, 0.98)");
    bg.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(125, 190, 255, 0.045)";
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

    const flash = smoothstep(0.145, 0.165, ph) * (1 - smoothstep(0.20, 0.24, ph));
    if (flash > 0) {
      ctx.fillStyle = `rgba(180, 220, 255, ${0.16 * flash})`;
      ctx.fillRect(0, 0, W, H);
    }

    const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.10, W / 2, H / 2, Math.max(W, H) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0.03)");
    vignette.addColorStop(0.68, "rgba(0,0,0,0.12)");
    vignette.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawLightning(ph) {
    const strike = smoothstep(0.135, 0.155, ph) * (1 - smoothstep(0.21, 0.25, ph));
    if (strike <= 0) return;

    lightning.forEach((bolt, idx) => {
      const flicker = 0.35 + 0.65 * Math.abs(Math.sin(ph * 520 + idx * 1.7));
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 28;
      ctx.shadowColor = `rgba(120, 220, 255, ${strike})`;
      ctx.strokeStyle = `rgba(210, 245, 255, ${0.95 * strike * flicker})`;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      bolt.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 220, 90, ${0.62 * strike * flicker})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      bolt.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x + 4, p.y);
        else ctx.lineTo(p.x + (prand(idx * 11 + i) - 0.5) * 18, p.y);
      });
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawEdges(ph) {
    edges.forEach(e => {
      const a = nodes[e.a];
      const b = nodes[e.b];
      const active = Math.min(activation(a, ph), activation(b, ph));
      const damage = edgeDamageAmount(e, ph);
      const color = colors[e.colorIndex];

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.strokeStyle = "rgba(130, 160, 190, 0.055)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      if (damage > 0.02) {
        const flicker = 0.50 + 0.50 * Math.sin(ph * 220 + e.repairBoost * 9);
        ctx.shadowBlur = 20 * damage;
        ctx.shadowColor = `rgba(255, 74, 35, ${damage})`;
        ctx.strokeStyle = `rgba(255, 74, 35, ${0.45 * damage * flicker})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 185, 50, ${0.65 * damage * flicker})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillStyle = `rgba(255, 225, 140, ${0.85 * damage * flicker})`;
        ctx.beginPath();
        ctx.arc(mx, my, 2.4 + 2.0 * flicker, 0, Math.PI * 2);
        ctx.fill();
      } else if (active > 0.025) {
        ctx.shadowBlur = 18 * active;
        ctx.shadowColor = rgba(color, 0.95);
        ctx.strokeStyle = rgba(color, 0.16 * active);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.shadowBlur = 10 * active;
        ctx.strokeStyle = rgba(color, 0.72 * active);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        const packet = (ph * 4.5 + a.pulse + b.pulse) % 1;
        const px = a.x + (b.x - a.x) * packet;
        const py = a.y + (b.y - a.y) * packet;
        ctx.fillStyle = rgba(color, 0.95 * active);
        ctx.shadowBlur = 15;
        ctx.shadowColor = rgba(color, 1);
        ctx.beginPath();
        ctx.arc(px, py, 2.0 + 1.1 * active, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  function drawNodes(ph) {
    nodes.forEach(n => {
      const active = activation(n, ph);
      const c = colors[n.colorIndex];
      const faulted = faultNodes.includes(n);
      const fault = faulted ? smoothstep(0.15, 0.23, ph) * (1 - smoothstep(0.42, 0.62, ph)) : 0;

      ctx.save();

      ctx.fillStyle = "rgba(135, 155, 180, 0.13)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      if (fault > 0.02) {
        const flicker = 0.45 + 0.55 * Math.sin(ph * 240 + n.id);
        ctx.shadowBlur = 22;
        ctx.shadowColor = `rgba(255, 76, 35, ${fault})`;
        ctx.fillStyle = `rgba(255, 76, 35, ${0.75 * fault * flicker})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 190, 70, ${0.70 * fault})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16 + 8 * flicker, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (active > 0.02 && fault < 0.65) {
        const pulse = 0.65 + 0.35 * Math.sin(ph * 42 + n.pulse * 9);
        ctx.shadowBlur = 14 + 15 * active * pulse;
        ctx.shadowColor = rgba(c, 1);
        ctx.fillStyle = rgba(c, 0.70 + 0.30 * pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + active * 2.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = rgba(c, 0.40 * active);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 8 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  function frame(now) {
    const ph = reduced ? 0.72 : phase(now);
    drawBackground(ph);
    drawEdges(ph);
    drawNodes(ph);
    drawLightning(ph);
    if (!reduced) requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
