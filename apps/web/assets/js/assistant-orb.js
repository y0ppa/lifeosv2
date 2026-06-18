/* ==========================================================================
   Brain — AI orb renderer
   An original animated visual core for the ARIA assistant. Pure canvas,
   no 3D library. Reacts to assistant state and (optionally) live mic
   amplitude. Respects prefers-reduced-motion and pauses when hidden.
   ========================================================================== */
(function (global) {
  'use strict';

  var STATE_COLORS = {
    idle: { ring: '#22d3ee', glow: 'rgba(34,211,238,0.35)' },
    listening: { ring: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
    processing: { ring: '#38bdf8', glow: 'rgba(56,189,248,0.5)' },
    speaking: { ring: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
    action: { ring: '#f2a93b', glow: 'rgba(242,169,59,0.5)' },
    confirm: { ring: '#f2a93b', glow: 'rgba(242,169,59,0.55)' },
    error: { ring: '#fb7185', glow: 'rgba(251,113,133,0.4)' },
    offline: { ring: '#5c6b85', glow: 'rgba(92,107,133,0.2)' }
  };

  function createOrb(canvas, opts) {
    opts = opts || {};
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var state = 'idle';
    var amplitude = 0;
    var targetAmplitude = 0;
    var raf = null;
    var t = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height, 60);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawStatic() {
      var ctx = canvas.getContext('2d');
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      var cx = w / 2, cy = h / 2;
      var r = Math.min(w, h) / 2 - 6;
      var c = STATE_COLORS[state] || STATE_COLORS.idle;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = c.ring;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.fillStyle = c.ring;
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame() {
      t += 1;
      var ctx = canvas.getContext('2d');
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      var cx = w / 2, cy = h / 2;
      var rBase = Math.min(w, h) / 2 - 6;
      var c = STATE_COLORS[state] || STATE_COLORS.idle;

      amplitude += (targetAmplitude - amplitude) * 0.12;
      if (state === 'idle' || state === 'offline') targetAmplitude = 0;

      ctx.clearRect(0, 0, w, h);

      // outer glow
      var glowR = rBase * (1 + amplitude * 0.18);
      var grad = ctx.createRadialGradient(cx, cy, rBase * 0.2, cx, cy, glowR * 1.15);
      grad.addColorStop(0, c.glow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // fine radial lines
      ctx.save();
      ctx.translate(cx, cy);
      var lineCount = 48;
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = c.ring;
      ctx.lineWidth = 1;
      var spin = state === 'processing' ? t * 0.02 : state === 'action' ? t * 0.035 : t * 0.004;
      for (var i = 0; i < lineCount; i++) {
        var a = (i / lineCount) * Math.PI * 2 + spin;
        var inner = rBase * 0.78;
        var outer = rBase * 0.92;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }
      ctx.restore();

      // rotating interface layer (processing / action)
      if (state === 'processing' || state === 'action') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (state === 'action' ? 0.05 : -0.03));
        ctx.strokeStyle = c.ring;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2;
        var segs = 6;
        for (var sI = 0; sI < segs; sI++) {
          var a0 = (sI / segs) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, rBase * 0.62, a0, a0 + 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }

      // main ring
      ctx.beginPath();
      ctx.strokeStyle = c.ring;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.arc(cx, cy, rBase * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // waveform (listening / speaking)
      if (state === 'listening' || state === 'speaking') {
        ctx.save();
        ctx.translate(cx, cy);
        var bars = 28;
        ctx.strokeStyle = c.ring;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        for (var b = 0; b < bars; b++) {
          var ang = (b / bars) * Math.PI * 2;
          var noise = Math.sin(t * 0.18 + b * 0.7) * 0.5 + 0.5;
          var amp = (0.12 + amplitude * 0.5) * noise;
          var rIn = rBase * 0.42;
          var rOut = rIn + rBase * (0.18 + amp * 0.5);
          ctx.globalAlpha = 0.55 + noise * 0.4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * rIn, Math.sin(ang) * rIn);
          ctx.lineTo(Math.cos(ang) * rOut, Math.sin(ang) * rOut);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      } else {
        // idle / processing / confirm / error / offline core pulse
        var pulse = state === 'idle'
          ? 0.5 + Math.sin(t * 0.03) * 0.5
          : state === 'confirm' || state === 'error'
            ? 0.5 + Math.sin(t * 0.08) * 0.5
            : 0.7;
        var coreR = rBase * (0.34 + pulse * 0.06);
        ctx.beginPath();
        ctx.fillStyle = c.ring;
        ctx.globalAlpha = state === 'offline' ? 0.25 : 0.18 + pulse * 0.12;
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // center dot
      ctx.beginPath();
      ctx.fillStyle = c.ring;
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // particles (idle subtle motion)
      if (state !== 'offline') {
        ctx.save();
        ctx.translate(cx, cy);
        var pCount = 10;
        for (var p = 0; p < pCount; p++) {
          var pa = (p / pCount) * Math.PI * 2 + t * 0.006;
          var pr = rBase * (0.95 + Math.sin(t * 0.02 + p) * 0.04);
          ctx.globalAlpha = 0.25 + Math.sin(t * 0.04 + p) * 0.15;
          ctx.fillStyle = c.ring;
          ctx.beginPath();
          ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      if (!document.hidden) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
      }
    }

    function start() {
      stop();
      if (reduceMotion) { drawStatic(); return; }
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    function onVisibility() {
      if (document.hidden) { stop(); }
      else if (!reduceMotion) { start(); }
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', function () { resize(); if (reduceMotion) drawStatic(); });

    resize();
    if (reduceMotion) { drawStatic(); } else { start(); }

    return {
      setState: function (next) {
        state = STATE_COLORS[next] ? next : 'idle';
        if (reduceMotion) drawStatic();
      },
      setAmplitude: function (v) { targetAmplitude = Math.max(0, Math.min(1, v)); },
      getState: function () { return state; },
      destroy: function () {
        stop();
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }

  global.Brain = global.Brain || {};
  global.Brain.createOrb = createOrb;
})(window);
