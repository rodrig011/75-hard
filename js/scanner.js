/* Barcode scanning for the food log.
   Uses the native BarcodeDetector where the browser has one; otherwise falls back
   to a built-in EAN-13/UPC-A run-length decoder over camera frames. Manual entry
   of the printed digits always works. Product data comes from Open Food Facts. */
'use strict';

const Scanner = (() => {

  /* ── EAN-13 decoding ─────────────────────────────────────────
     Left digits use L (odd) or G (even) run patterns; right digits use R,
     whose run widths equal L. G widths are L reversed. All sum to 7 modules. */

  const L_RUNS = [
    [3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2],
    [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2],
  ];
  const G_RUNS = L_RUNS.map(r => r.slice().reverse());
  const PARITY_FIRST = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
    'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

  function matchDigit(w, tables) {
    const total = w[0] + w[1] + w[2] + w[3];
    if (!total) return null;
    let best = null, bestErr = Infinity;
    tables.forEach(([table, tag]) => {
      for (let d = 0; d < 10; d++) {
        let err = 0;
        for (let k = 0; k < 4; k++) err += Math.abs(w[k] * 7 / total - table[d][k]);
        if (err < bestErr) { bestErr = err; best = { d, tag }; }
      }
    });
    return bestErr <= 1.6 ? best : null;
  }

  function checksumOk(digits) {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0;
  }

  function runsFromRow(gray) {
    let min = 255, max = 0;
    for (const v of gray) { if (v < min) min = v; if (v > max) max = v; }
    if (max - min < 40) return null;
    const thr = (min + max) / 2;
    const runs = [];
    let dark = gray[0] < thr, len = 1;
    for (let i = 1; i < gray.length; i++) {
      const d = gray[i] < thr;
      if (d === dark) len++;
      else { runs.push({ len, dark }); dark = d; len = 1; }
    }
    runs.push({ len, dark });
    return runs;
  }

  function guardOk(runs, i, unit) {
    for (let k = 0; k < 3; k++) {
      if (Math.abs(runs[i + k].len - unit) > unit * 0.55) return false;
    }
    return true;
  }

  function decodeRuns(runs) {
    for (let s = 0; s + 58 < runs.length; s++) {
      if (!runs[s].dark) continue;
      const unit = (runs[s].len + runs[s + 1].len + runs[s + 2].len) / 3;
      if (unit < 1) continue;
      if (s > 0 && runs[s - 1].len < unit * 3) continue;           // quiet zone
      if (!guardOk(runs, s, unit)) continue;

      const centre = s + 3 + 24;
      let ok = true;
      for (let k = 0; k < 5; k++) {
        if (Math.abs(runs[centre + k].len - unit) > unit * 0.6) { ok = false; break; }
      }
      if (!ok || !guardOk(runs, centre + 5 + 24, unit)) continue;

      const digits = [];
      let parity = '';
      for (let d = 0; d < 6; d++) {
        const i = s + 3 + d * 4;
        const m = matchDigit([runs[i].len, runs[i + 1].len, runs[i + 2].len, runs[i + 3].len],
          [[L_RUNS, 'L'], [G_RUNS, 'G']]);
        if (!m) { ok = false; break; }
        digits.push(m.d); parity += m.tag;
      }
      if (!ok) continue;
      for (let d = 0; d < 6; d++) {
        const i = centre + 5 + d * 4;
        const m = matchDigit([runs[i].len, runs[i + 1].len, runs[i + 2].len, runs[i + 3].len],
          [[L_RUNS, 'R']]);
        if (!m) { ok = false; break; }
        digits.push(m.d);
      }
      if (!ok) continue;

      const first = PARITY_FIRST.indexOf(parity);
      if (first === -1) continue;
      const full = [first, ...digits];
      if (checksumOk(full)) return full.join('');
    }
    return null;
  }

  function decodeImageData(img) {
    const { data, width, height } = img;
    for (const frac of [0.5, 0.42, 0.58, 0.34, 0.66]) {
      const y = Math.floor(height * frac);
      const gray = new Uint8Array(width);
      for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        gray[x] = (data[o] * 3 + data[o + 1] * 4 + data[o + 2]) >> 3;
      }
      const runs = runsFromRow(gray);
      if (!runs) continue;
      let code = decodeRuns(runs);
      if (!code) code = decodeRuns(runs.slice().reverse());
      if (code) return code;
    }
    return null;
  }

  /* ── Open Food Facts lookup ── */

  function lookupBarcode(code) {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`
      + '?fields=product_name,brands,serving_size,nutriments';
    return fetch(url).then(r => r.json()).then(data => {
      const p = data && data.product;
      if (!p || !p.product_name) return null;
      const n = p.nutriments || {};
      const perServing = n['energy-kcal_serving'];
      const kcal = perServing != null ? perServing : n['energy-kcal_100g'];
      if (kcal == null) return null;
      const suffix = perServing != null ? '_serving' : '_100g';
      return {
        name: p.brands ? `${p.product_name} (${p.brands.split(',')[0].trim()})` : p.product_name,
        serving: perServing != null ? (p.serving_size || '1 serving') : '100 g',
        kcal: Math.round(Number(kcal)),
        p: Number(n['proteins' + suffix]) || 0,
        c: Number(n['carbohydrates' + suffix]) || 0,
        f: Number(n['fat' + suffix]) || 0,
        src: 'web',
      };
    });
  }

  /* ── Scanner overlay ── */

  function open(onFood, onToast) {
    const ov = document.createElement('div');
    ov.className = 'scan';
    ov.innerHTML = `
      <div class="scan-top">
        <span>Scan a barcode</span>
        <button class="scan-close" aria-label="Close">✕</button>
      </div>
      <div class="scan-stage">
        <video playsinline muted autoplay></video>
        <div class="scan-frame"></div>
        <div class="scan-hint">Hold the barcode inside the frame</div>
      </div>
      <div class="scan-manual">
        <input type="tel" inputmode="numeric" placeholder="…or type the numbers under it" maxlength="14">
        <button class="scan-go">Find</button>
      </div>`;
    document.body.appendChild(ov);

    const video = ov.querySelector('video');
    const hint = ov.querySelector('.scan-hint');
    const input = ov.querySelector('input');
    let stream = null, timer = null, closed = false, lastCode = null, busy = false;

    function close() {
      closed = true;
      clearInterval(timer);
      if (stream) stream.getTracks().forEach(t => t.stop());
      ov.remove();
    }

    function found(code) {
      if (busy || closed) return;
      busy = true;
      hint.textContent = `Found ${code} — looking it up…`;
      lookupBarcode(code).then(food => {
        if (closed) return;
        if (food) { close(); onFood(food); }
        else {
          hint.textContent = 'That product isn’t in the database — type it in the log instead.';
          onToast('Barcode read, but no product data found.');
          busy = false; lastCode = null;
        }
      }).catch(() => {
        if (closed) return;
        onToast('No connection — try typing the food instead.');
        busy = false; lastCode = null;
      });
    }

    ov.querySelector('.scan-close').addEventListener('click', close);
    ov.querySelector('.scan-go').addEventListener('click', () => {
      const v = input.value.trim();
      if (/^\d{8,14}$/.test(v)) found(v);
      else onToast('Barcodes are 8–14 digits.');
    });

    const canDetect = 'BarcodeDetector' in window;
    const detector = canDetect
      ? new BarcodeDetector({ formats: ['ean_13', 'upc_a', 'ean_8'] })
      : null;
    const canvas = document.createElement('canvas');

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false,
    }).then(s => {
      if (closed) { s.getTracks().forEach(t => t.stop()); return; }
      stream = s;
      video.srcObject = s;
      timer = setInterval(() => {
        if (busy || closed || video.readyState < 2) return;
        if (detector) {
          detector.detect(video).then(codes => {
            const c = codes && codes[0] && codes[0].rawValue;
            if (!c) return;
            if (c === lastCode) found(c);
            lastCode = c;
          }).catch(() => {});
        } else {
          const w = 900;
          const h = Math.max(1, Math.round(video.videoHeight * (w / video.videoWidth)));
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, w, h);
          const code = decodeImageData(ctx.getImageData(0, Math.floor(h * 0.25), w, Math.floor(h * 0.5)));
          if (!code) return;
          if (code === lastCode) found(code);
          lastCode = code;
        }
      }, 240);
    }).catch(() => {
      hint.textContent = 'Camera unavailable — type the numbers under the barcode instead.';
      video.style.display = 'none';
    });

    return { close };
  }

  return { open, lookupBarcode, _decodeImageData: decodeImageData };
})();
