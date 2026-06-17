/* ==========================================================================
   LifeOS — Sound controller
   All interface tones are synthesized locally with the Web Audio API
   (oscillators + envelopes). No audio files are bundled, so there is
   nothing copyrighted or third-party involved. Sounds are off by default,
   never autoplay, and only fire from a direct user interaction so browser
   autoplay restrictions are respected.
   ========================================================================== */
(function (global) {
  'use strict';

  var ctx = null;

  function getCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function settings() {
    var s = global.LifeOS && global.LifeOS.State && global.LifeOS.State.data && global.LifeOS.State.data.settings;
    return (s && s.voice) || { soundEnabled: false, soundVolume: 0.4 };
  }

  function tone(freq, duration, opts) {
    opts = opts || {};
    var ac = getCtx();
    if (!ac) return;
    var vol = settings().soundVolume;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (opts.glideTo) {
      osc.frequency.linearRampToValueAtTime(opts.glideTo, ac.currentTime + duration);
    }
    var peak = Math.max(0.0001, vol * (opts.gain !== undefined ? opts.gain : 0.18));
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ac.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.02);
  }

  var PRESETS = {
    activate: function () { tone(420, 0.16, { glideTo: 640, gain: 0.16 }); },
    'listen-start': function () { tone(560, 0.12, { glideTo: 760, gain: 0.14 }); },
    'listen-stop': function () { tone(520, 0.12, { glideTo: 320, gain: 0.12 }); },
    confirm: function () { tone(480, 0.1, { gain: 0.14 }); setTimeout(function () { tone(680, 0.12, { gain: 0.14 }); }, 90); },
    success: function () { tone(520, 0.1, { gain: 0.15 }); setTimeout(function () { tone(780, 0.16, { gain: 0.15 }); }, 100); },
    warning: function () { tone(300, 0.22, { type: 'triangle', gain: 0.16 }); },
    notification: function () { tone(640, 0.09, { gain: 0.12 }); }
  };

  function play(name) {
    if (!settings().soundEnabled) return;
    var fn = PRESETS[name];
    if (fn) {
      try { fn(); } catch (e) { /* audio unavailable */ }
    }
  }

  global.LifeOS = global.LifeOS || {};
  global.LifeOS.Sound = { play: play };
})(window);
