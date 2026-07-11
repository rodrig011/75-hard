/* FX engine — sound (synthesized, no assets), haptics, particles,
   the seal coin, share-card renderer, and the transformation film exporter. */
'use strict';

const FX = (() => {
  let enabled = true;
  let actx = null;

  function audio() {
    if (!enabled) return null;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch { return null; }
  }

  function tone(freq, at, dur, type = 'sine', gain = 0.1) {
    const ctx = audio();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t0 = ctx.currentTime + at;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function vibrate(pattern) {
    if (!enabled) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
  }

  /* ── Micro-interactions ── */

  function tick() {
    tone(880, 0, 0.07, 'triangle', 0.05);
    vibrate(10);
  }

  function burst(el, color) {
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    spawn(cx, cy, color || '#d7f958', 14, 90);
  }

  function spawn(cx, cy, color, n, dist) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'fx-p';
      const size = 4 + Math.random() * 5;
      p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color}`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2;
      const d = dist * (0.4 + Math.random() * 0.8);
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d - dist * 0.35;
      p.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + dist * 0.6}px)) scale(0.2)`, opacity: 0 },
      ], { duration: 650 + Math.random() * 450, easing: 'cubic-bezier(.16,.84,.44,1)' })
        .onfinish = () => p.remove();
    }
  }

  function confetti(colors) {
    const w = window.innerWidth;
    for (let i = 0; i < 56; i++) {
      const p = document.createElement('i');
      p.className = 'fx-p';
      const size = 5 + Math.random() * 7;
      p.style.cssText = `left:${Math.random() * w}px;top:-14px;width:${size}px;height:${size * (0.5 + Math.random())}px;`
        + `background:${colors[i % colors.length]};border-radius:2px`;
      document.body.appendChild(p);
      p.animate([
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(${window.innerHeight * (0.6 + Math.random() * 0.5)}px) rotate(${(Math.random() - 0.5) * 720}deg)`, opacity: 0.9, offset: 0.85 },
        { transform: `translateY(${window.innerHeight * 1.1}px) rotate(${(Math.random() - 0.5) * 900}deg)`, opacity: 0 },
      ], { duration: 1800 + Math.random() * 1400, easing: 'cubic-bezier(.2,.6,.4,1)', delay: Math.random() * 500 })
        .onfinish = () => p.remove();
    }
  }

  /* ── Seal the Day ── */

  function sealDay(dayN, opts = {}, onClose) {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#d7f958';
    const big = !!opts.milestone;

    const ov = document.createElement('div');
    ov.className = 'seal-ov';
    ov.innerHTML = `
      <div class="coin-scene">
        <div class="coin">
          <div class="coin-face coin-front"><span class="coin-num">${dayN}</span><span class="coin-cap">DAY</span></div>
          <div class="coin-face coin-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.3 4.3L19 7.5"/></svg></div>
        </div>
      </div>
      <div class="seal-txt">
        <div class="seal-title">${big ? opts.milestone : `Day ${dayN} sealed.`}</div>
        <div class="seal-sub">${opts.sub || (75 - dayN > 0 ? `${75 - dayN} days remain. See you tomorrow.` : 'That was the last one.')}</div>
      </div>
      <div class="seal-hint">Tap to continue</div>`;
    document.body.appendChild(ov);

    // Each tier has its own ceremony. Ordinary days stay quiet — a coin, two notes,
    // a ring of light. Confetti is reserved for the milestones.
    const tier = opts.tier || 0;
    const SEQS = [
      [523, 784],
      [523, 659, 784],
      [440, 554, 659, 880],
      [392, 523, 659, 784, 1046],
    ];
    const seq = SEQS[Math.min(tier, 3)];
    seq.forEach((f, i) => tone(f, i * 0.12, 0.55, 'triangle', tier ? 0.09 : 0.06));
    tone(seq[seq.length - 1] * 2, seq.length * 0.12, 0.9, 'sine', tier ? 0.045 : 0.025);
    vibrate(tier ? [40, 60, 40, 60, 120] : [25, 40, 60]);

    setTimeout(() => {
      if (tier === 0) {
        spawn(window.innerWidth / 2, window.innerHeight / 2 - 60, accent, 22, 150);
      } else if (tier === 1) {
        confetti([accent, '#ffffff']);
      } else if (tier === 2) {
        confetti([accent, '#e9d5a6']);
        setTimeout(() => confetti([accent, '#e9d5a6']), 500);
      } else {
        confetti(['#e9d5a6', '#d5b87f', accent]);
        setTimeout(() => confetti(['#e9d5a6', '#d5b87f']), 450);
        setTimeout(() => confetti(['#e9d5a6', accent]), 900);
      }
    }, 550);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      ov.style.opacity = '0';
      setTimeout(() => { ov.remove(); if (onClose) onClose(); }, 320);
    };
    ov.addEventListener('click', close);
    setTimeout(close, big ? 4200 : 2800);
  }

  /* ── Share card (Wrapped-style) ── */

  function shareCard(s) {
    const W = 1080, H = 1920;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const accent = s.accent || '#d7f958';

    x.fillStyle = '#000';
    x.fillRect(0, 0, W, H);
    // ambient glow
    const g = x.createRadialGradient(W / 2, 340, 60, W / 2, 340, 900);
    g.addColorStop(0, accent + '2e');
    g.addColorStop(1, 'transparent');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    // noise
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      x.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
    }
    // ring
    const cx = W / 2, cy = 480, R = 260;
    x.lineCap = 'round';
    x.strokeStyle = 'rgba(255,255,255,.1)';
    x.lineWidth = 34;
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = accent;
    x.shadowColor = accent; x.shadowBlur = 40;
    x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (Math.min(s.dayN, 75) / 75) * Math.PI * 2); x.stroke();
    x.shadowBlur = 0;

    const F = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    x.textAlign = 'center';
    x.fillStyle = '#fff';
    x.font = `800 200px ${F}`;
    x.fillText(String(s.dayN), cx, cy + 62);
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.font = `700 44px ${F}`;
    x.fillText('OF 75', cx, cy + 130);

    x.fillStyle = accent;
    x.font = `700 40px ${F}`;
    x.fillText((s.kicker || 'SEVENTY-FIVE · 75 HARD').toUpperCase(), cx, 200);

    x.fillStyle = '#fff';
    x.font = `800 92px ${F}`;
    x.fillText(s.title || 'Still standing.', cx, 920);
    if (s.name) {
      x.fillStyle = 'rgba(255,255,255,.55)';
      x.font = `600 44px ${F}`;
      x.fillText(s.name, cx, 990);
    }

    // last-seven-days seal row
    if (s.week && s.week.length === 7) {
      const r = 34, gap2 = 92, x0 = cx - gap2 * 3;
      s.week.forEach((sealed, i) => {
        const px = x0 + i * gap2;
        const py = 810;
        if (sealed) {
          const cg = x.createLinearGradient(px - r, py - r, px + r, py + r);
          cg.addColorStop(0, '#ffffff');
          cg.addColorStop(0.25, accent);
          cg.addColorStop(1, accent);
          x.fillStyle = cg;
          x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
        } else {
          x.strokeStyle = 'rgba(255,255,255,.18)';
          x.lineWidth = 3;
          x.beginPath(); x.arc(px, py, r - 2, 0, Math.PI * 2); x.stroke();
        }
      });
    }

    const stats = s.stats || [];
    const bw = 440, bh = 220, gap = 40;
    stats.slice(0, 4).forEach((st, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = cx - bw - gap / 2 + col * (bw + gap);
      const by = 1080 + row * (bh + gap);
      x.fillStyle = '#161618';
      roundRect(x, bx, by, bw, bh, 36);
      x.fill();
      x.fillStyle = st.color || accent;
      x.font = `800 84px ${F}`;
      x.fillText(st.v, bx + bw / 2, by + 118);
      x.fillStyle = 'rgba(255,255,255,.45)';
      x.font = `700 30px ${F}`;
      x.fillText(st.l.toUpperCase(), bx + bw / 2, by + 172);
    });

    if (s.quote) {
      x.fillStyle = 'rgba(255,255,255,.6)';
      x.font = `italic 500 40px ${F}`;
      wrapText(x, `“${s.quote}”`, cx, 1650, 860, 54);
    }
    x.fillStyle = 'rgba(255,255,255,.35)';
    x.font = `700 32px ${F}`;
    x.fillText('SEVENTY-FIVE — NO MERCY', cx, 1830);

    return new Promise(res => c.toBlob(b => res(b), 'image/png'));
  }

  function roundRect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }

  function wrapText(x, text, cx, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      if (x.measureText(line + w).width > maxW && line) {
        x.fillText(line.trim(), cx, y);
        line = w + ' ';
        y += lh;
      } else line += w + ' ';
    }
    x.fillText(line.trim(), cx, y);
  }

  /* ── Transformation film ── */

  const filmSupported = () =>
    'MediaRecorder' in window && !!HTMLCanvasElement.prototype.captureStream;

  async function exportFilm(frames, onProgress) {
    // frames: [{url, label}]
    const W = 720, H = 960;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const stream = c.captureStream(30);
    const mime = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']
      .find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error('unsupported');
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise(res => { rec.onstop = res; });
    rec.start(200);

    const F = '-apple-system, BlinkMacSystemFont, sans-serif';
    for (let i = 0; i < frames.length; i++) {
      const img = await loadImg(frames[i].url);
      x.fillStyle = '#000';
      x.fillRect(0, 0, W, H);
      const s = Math.max(W / img.width, (H - 90) / img.height);
      const iw = img.width * s, ih = img.height * s;
      x.drawImage(img, (W - iw) / 2, (H - 90 - ih) / 2, iw, ih);
      x.fillStyle = '#000';
      x.fillRect(0, H - 90, W, 90);
      x.fillStyle = '#d7f958';
      x.font = `800 40px ${F}`;
      x.textAlign = 'left';
      x.fillText(frames[i].label, 28, H - 33);
      x.fillStyle = 'rgba(255,255,255,.4)';
      x.font = `700 24px ${F}`;
      x.textAlign = 'right';
      x.fillText('SEVENTY-FIVE', W - 28, H - 36);
      if (onProgress) onProgress(i + 1, frames.length);
      await wait(i === 0 || i === frames.length - 1 ? 1300 : 620);
    }
    await wait(500);
    rec.stop();
    await done;
    return new Blob(chunks, { type: mime.split(';')[0] });
  }

  const loadImg = url => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const wait = ms => new Promise(r => setTimeout(r, ms));

  return {
    setEnabled(v) { enabled = v; },
    tick, burst, confetti, sealDay, shareCard, exportFilm, filmSupported,
  };
})();
