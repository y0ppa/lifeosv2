/* ==========================================================================
   Brain — Voice assistant engine
   Thin wrapper around the Web Speech API (SpeechRecognition +
   SpeechSynthesis) with feature detection, graceful fallback to text
   input, mic-amplitude metering for the orb, and explicit state
   transitions: idle -> listening -> processing -> speaking / action /
   confirm / error / offline.
   ========================================================================== */
(function (global) {
  'use strict';

  var SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var synth = window.speechSynthesis || null;

  var listeners = { state: [], transcript: [], error: [] };
  var state = 'idle';
  var orb = null;
  var recognition = null;
  var micStream = null;
  var audioCtx = null;
  var analyser = null;
  var meterRaf = null;
  var muted = false;
  var voices = [];

  function emit(type, payload) {
    (listeners[type] || []).forEach(function (cb) { try { cb(payload); } catch (e) { /* listener error */ } });
  }

  function setState(next) {
    state = next;
    if (orb) orb.setState(next);
    emit('state', next);
  }

  function settingsData() {
    return (global.Brain && global.Brain.State && global.Brain.State.data && global.Brain.State.data.settings.voice) || {};
  }

  // ---- microphone amplitude metering (visual only) ----
  function startMeter(stream) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      var source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      var data = new Uint8Array(analyser.frequencyBinCount);
      (function tick() {
        analyser.getByteTimeDomainData(data);
        var sum = 0;
        for (var i = 0; i < data.length; i++) { var d = (data[i] - 128) / 128; sum += d * d; }
        var rms = Math.sqrt(sum / data.length);
        if (orb) orb.setAmplitude(Math.min(1, rms * 4));
        meterRaf = requestAnimationFrame(tick);
      })();
    } catch (e) { /* metering unavailable, non-fatal */ }
  }

  function stopMeter() {
    if (meterRaf) cancelAnimationFrame(meterRaf);
    meterRaf = null;
    if (audioCtx) { try { audioCtx.close(); } catch (e) { /* noop */ } audioCtx = null; }
    analyser = null;
  }

  function stopMic() {
    if (micStream) {
      micStream.getTracks().forEach(function (t) { t.stop(); });
      micStream = null;
    }
    stopMeter();
  }

  function requestMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('Microphone access is not supported in this browser.'));
    }
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      micStream = stream;
      startMeter(stream);
      return stream;
    });
  }

  // ---- speech recognition ----
  function buildRecognition() {
    var r = new SpeechRecognitionImpl();
    r.lang = 'en-US';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = function (event) {
      var transcript = '';
      var isFinal = false;
      for (var i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      emit('transcript', { text: transcript, isFinal: isFinal });
      if (isFinal) {
        setState('processing');
      }
    };
    r.onerror = function (event) {
      setState('error');
      emit('error', event.error || 'unknown-error');
    };
    r.onend = function () {
      stopMic();
      if (state === 'listening') setState('idle');
    };
    return r;
  }

  function start() {
    if (!SpeechRecognitionImpl) {
      emit('error', 'unsupported');
      return false;
    }
    if (!settingsData().enabled) {
      emit('error', 'disabled');
      return false;
    }
    requestMicPermission().then(function () {
      recognition = buildRecognition();
      setState('listening');
      try { recognition.start(); } catch (e) { /* already started */ }
      if (global.Brain && global.Brain.Sound) global.Brain.Sound.play('listen-start');
    }).catch(function (err) {
      setState('error');
      emit('error', err.message || 'mic-permission-denied');
    });
    return true;
  }

  function stop() {
    if (recognition) {
      try { recognition.stop(); } catch (e) { /* noop */ }
    }
    stopMic();
    if (global.Brain && global.Brain.Sound) global.Brain.Sound.play('listen-stop');
    if (state === 'listening') setState('idle');
  }

  // ---- speech synthesis ----
  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices();
  }
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  var speakingMeterInterval = null;
  function fakeSpeakingAmplitude(durationMs) {
    var startT = Date.now();
    speakingMeterInterval = setInterval(function () {
      var elapsed = Date.now() - startT;
      if (elapsed > durationMs) { clearInterval(speakingMeterInterval); if (orb) orb.setAmplitude(0); return; }
      var v = 0.35 + Math.abs(Math.sin(elapsed / 90)) * 0.55;
      if (orb) orb.setAmplitude(v);
    }, 60);
  }

  function speak(text, opts) {
    opts = opts || {};
    if (muted || !synth || !settingsData().enabled) {
      if (opts.onDone) opts.onDone();
      return;
    }
    try { synth.cancel(); } catch (e) { /* noop */ }
    var utter = new SpeechSynthesisUtterance(text);
    var cfg = settingsData();
    utter.rate = cfg.rate || 1;
    utter.volume = cfg.volume !== undefined ? cfg.volume : 0.8;
    if (cfg.voiceName) {
      var v = voices.filter(function (vv) { return vv.name === cfg.voiceName; })[0];
      if (v) utter.voice = v;
    }
    setState('speaking');
    fakeSpeakingAmplitude(Math.max(900, text.length * 55));
    utter.onend = function () {
      if (orb) orb.setAmplitude(0);
      if (state === 'speaking') setState('idle');
      if (opts.onDone) opts.onDone();
    };
    utter.onerror = function () {
      if (state === 'speaking') setState('idle');
      if (opts.onDone) opts.onDone();
    };
    synth.speak(utter);
  }

  function stopSpeaking() {
    if (synth) { try { synth.cancel(); } catch (e) { /* noop */ } }
    if (speakingMeterInterval) clearInterval(speakingMeterInterval);
    if (orb) orb.setAmplitude(0);
    if (state === 'speaking') setState('idle');
  }

  global.Brain = global.Brain || {};
  global.Brain.Voice = {
    isRecognitionSupported: !!SpeechRecognitionImpl,
    isSynthesisSupported: !!synth,
    setOrb: function (o) { orb = o; },
    getState: function () { return state; },
    setState: setState,
    start: start,
    stop: stop,
    speak: speak,
    stopSpeaking: stopSpeaking,
    setMuted: function (m) { muted = m; if (m) stopSpeaking(); },
    isMuted: function () { return muted; },
    getVoices: function () { return voices; },
    requestMicPermission: requestMicPermission,
    on: function (type, cb) { if (listeners[type]) listeners[type].push(cb); }
  };
})(window);
