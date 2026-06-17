/* ==========================================================================
   Brain — Lightweight canvas chart helpers (no external dependencies)
   Every chart also exposes a plain-text summary for screen readers.
   ========================================================================== */
(function (global) {
  'use strict';

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v ? v.trim() : fallback;
  }

  function setupCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(rect.width, 40);
    var h = Math.max(rect.height || canvas.height, 40);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function values(series) {
    return series.map(function (p) { return typeof p === 'number' ? p : p.value; });
  }

  function summary(series, label, unit) {
    var v = values(series);
    if (!v.length) return label + ': no data available.';
    var min = Math.min.apply(null, v);
    var max = Math.max.apply(null, v);
    var avg = Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length);
    var latest = v[v.length - 1];
    return label + ' over the last ' + v.length + ' periods: latest ' + latest + unit +
      ', average ' + avg + unit + ', ranging from ' + min + unit + ' to ' + max + unit + '.';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function lineChart(canvas, series, opts) {
    opts = opts || {};
    var color = opts.color || cssVar('--accent-cyan', '#22d3ee');
    var grid = cssVar('--hairline', 'rgba(148,163,184,0.08)');
    var muted = cssVar('--text-tertiary', '#5c6b85');
    var fill = !!opts.fill;
    var goal = opts.goal;

    function draw() {
      var s = setupCanvas(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      ctx.clearRect(0, 0, w, h);
      var padL = 4, padR = 4, padT = 10, padB = 18;
      var v = values(series);
      if (!v.length) return;
      var min = opts.min !== undefined ? opts.min : Math.min.apply(null, v);
      var max = opts.max !== undefined ? opts.max : Math.max.apply(null, v);
      if (min === max) { min -= 1; max += 1; }
      var plotW = w - padL - padR;
      var plotH = h - padT - padB;

      // gridlines
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (var g = 0; g <= 3; g++) {
        var gy = padT + (plotH / 3) * g;
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(w - padR, gy);
        ctx.stroke();
      }

      function xAt(i) { return padL + (plotW * i) / Math.max(1, v.length - 1); }
      function yAt(val) { return padT + plotH - ((val - min) / (max - min)) * plotH; }

      if (goal !== undefined && goal !== null) {
        var gy2 = yAt(goal);
        ctx.strokeStyle = cssVar('--accent-amber', '#f2a93b');
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padL, gy2);
        ctx.lineTo(w - padR, gy2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (fill) {
        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(v[0]));
        for (var i = 1; i < v.length; i++) ctx.lineTo(xAt(i), yAt(v[i]));
        ctx.lineTo(xAt(v.length - 1), padT + plotH);
        ctx.lineTo(xAt(0), padT + plotH);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        grad.addColorStop(0, color + '33');
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(xAt(0), yAt(v[0]));
      for (var j = 1; j < v.length; j++) ctx.lineTo(xAt(j), yAt(v[j]));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // last point marker
      var lastX = xAt(v.length - 1), lastY = yAt(v[v.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    draw();
    if (!canvas._lifeosResizeBound) {
      canvas._lifeosResizeBound = true;
      window.addEventListener('resize', function () { draw(); });
    }
    return draw;
  }

  function barChart(canvas, series, opts) {
    opts = opts || {};
    var color = opts.color || cssVar('--accent-blue', '#38bdf8');
    var muted = cssVar('--text-tertiary', '#5c6b85');

    function draw() {
      var s = setupCanvas(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      ctx.clearRect(0, 0, w, h);
      var v = values(series);
      if (!v.length) return;
      var max = opts.max !== undefined ? opts.max : Math.max.apply(null, v) * 1.15;
      var padB = 18, padT = 8;
      var plotH = h - padT - padB;
      var gap = 6;
      var barW = (w - gap * (v.length + 1)) / v.length;

      v.forEach(function (val, i) {
        var barH = max > 0 ? (val / max) * plotH : 0;
        var x = gap + i * (barW + gap);
        var y = padT + plotH - barH;
        ctx.fillStyle = opts.colors ? opts.colors[i] || color : color;
        roundRect(ctx, x, y, barW, Math.max(barH, 2), Math.min(4, barW / 2));
        ctx.fill();
      });

      if (opts.labels) {
        ctx.fillStyle = muted;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        opts.labels.forEach(function (label, i) {
          var x = gap + i * (barW + gap) + barW / 2;
          ctx.fillText(label, x, h - 4);
        });
      }
    }

    draw();
    if (!canvas._lifeosResizeBound) {
      canvas._lifeosResizeBound = true;
      window.addEventListener('resize', function () { draw(); });
    }
    return draw;
  }

  function ring(canvas, value, max, opts) {
    opts = opts || {};
    var color = opts.color || cssVar('--accent-cyan', '#22d3ee');
    var track = cssVar('--hairline', 'rgba(148,163,184,0.12)');

    function draw() {
      var s = setupCanvas(canvas);
      var ctx = s.ctx, w = s.w, h = s.h;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2;
      var r = Math.min(w, h) / 2 - (opts.thickness || 6) / 2 - 1;
      var thickness = opts.thickness || 6;
      var pct = max > 0 ? Math.min(1, value / max) : 0;

      ctx.lineCap = 'round';
      ctx.lineWidth = thickness;
      ctx.strokeStyle = track;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.stroke();
    }

    draw();
    if (!canvas._lifeosResizeBound) {
      canvas._lifeosResizeBound = true;
      window.addEventListener('resize', function () { draw(); });
    }
    return draw;
  }

  function sparkline(canvas, series, opts) {
    return lineChart(canvas, series, Object.assign({ fill: true }, opts || {}));
  }

  global.Brain = global.Brain || {};
  global.Brain.Charts = {
    lineChart: lineChart,
    barChart: barChart,
    ring: ring,
    sparkline: sparkline,
    summary: summary,
    values: values
  };
})(window);
