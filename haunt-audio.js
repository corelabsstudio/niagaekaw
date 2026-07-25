/**
 * 분위기용 저음 쿵쿵 (Web Audio — 파일 없음)
 * - 일기 진행 / stage 에 따라 볼륨·템포 상승
 * - 첫 클릭(일기 열기) 뒤 AudioContext resume
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    window.__hauntAudio = {
      unlock: function () {},
      setLevel: function () {},
      pulse: function () {},
      typeClick: function () {},
      termBeep: function () {},
      hddScratch: function () {},
      rumble: function () {},
    };
    return;
  }

  var ctx = null;
  var level = 0; // 0 off · 1 soft · 2 mid · 3 heavy
  var timer = null;
  var unlocked = false;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function unlock() {
    unlocked = true;
    var c = ensureCtx();
    if (c && c.state === "suspended") {
      c.resume().catch(function () {});
    }
  }

  /** 한 번 쿵 (lub) */
  function thump(vol, freq) {
    var c = ensureCtx();
    if (!c || !unlocked) return;
    if (c.state === "suspended") c.resume().catch(function () {});
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    var filter = c.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq || 48, t0);
    osc.frequency.exponentialRampToValueAtTime(18, t0 + 0.18);
    filter.type = "lowpass";
    filter.frequency.value = 120;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t0 + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.45);
  }

  /** lub-dub 한 세트 */
  function beat() {
    if (level <= 0) return;
    var base = level === 1 ? 0.07 : level === 2 ? 0.14 : 0.22;
    thump(base, level >= 3 ? 42 : 52);
    setTimeout(function () {
      if (level <= 0) return;
      thump(base * 0.65, level >= 3 ? 36 : 44);
    }, level >= 3 ? 160 : 200);
  }

  function schedule() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (level <= 0 || document.body.classList.contains("is-haunting") === false && level === 0) {
      /* noop */
    }
    if (level <= 0) return;

    function loop() {
      if (level <= 0) return;
      if (document.hidden) {
        timer = setTimeout(loop, 2000);
        return;
      }
      beat();
      // bpm: soft ~48, mid ~58, heavy ~72
      var gap = level === 1 ? 1250 : level === 2 ? 1050 : 820;
      gap += (Math.random() * 80) | 0;
      timer = setTimeout(loop, gap);
    }
    loop();
  }

  /**
   * @param {number} n 0 stop · 1 soft · 2 mid · 3 heavy
   * @param {{once?:boolean}} opts once=true 이면 한 세트만
   */
  function setLevel(n, opts) {
    n = Math.max(0, Math.min(3, n | 0));
    if (opts && opts.once) {
      unlock();
      var prev = level;
      level = Math.max(n, 1);
      beat();
      level = prev;
      return;
    }
    if (n === level) return;
    level = n;
    if (n > 0) unlock();
    schedule();
  }

  function pulse(strength) {
    unlock();
    var v = strength === "heavy" ? 0.2 : strength === "mid" ? 0.12 : 0.08;
    thump(v, 50);
    setTimeout(function () {
      thump(v * 0.6, 40);
    }, 180);
  }

  /**
   * CRT / DOS / 타자기 한 글자 클릭
   * @param {"soft"|"mid"|"hard"|"space"|"enter"} kind
   */
  function typeClick(kind) {
    var c = ensureCtx();
    if (!c || !unlocked) return;
    if (c.state === "suspended") c.resume().catch(function () {});
    var t0 = c.currentTime;
    kind = kind || "mid";

    // 노이즈 버스트 + 짧은 톤 = 구형 단말 키감
    var bufferSize = 256;
    var noiseBuf = c.createBuffer(1, bufferSize, c.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
    var noise = c.createBufferSource();
    noise.buffer = noiseBuf;
    var nGain = c.createGain();
    var nFilter = c.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.value = kind === "hard" ? 2200 : kind === "soft" ? 1400 : 1800;
    nFilter.Q.value = 0.8;

    var vol =
      kind === "space" ? 0.012 :
      kind === "enter" ? 0.045 :
      kind === "hard" ? 0.038 :
      kind === "soft" ? 0.018 :
      0.028;
    // 랜덤 미세 변화 (기계적 불균일)
    vol *= 0.85 + Math.random() * 0.3;

    nGain.gain.setValueAtTime(vol, t0);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (kind === "enter" ? 0.06 : 0.028));
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(c.destination);
    noise.start(t0);
    noise.stop(t0 + 0.07);

    // 얇은 고음 클릭
    var osc = c.createOscillator();
    var oGain = c.createGain();
    osc.type = "square";
    var f =
      kind === "enter" ? 180 + Math.random() * 40 :
      kind === "space" ? 90 + Math.random() * 20 :
      900 + Math.random() * 700;
    osc.frequency.setValueAtTime(f, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f * 0.3), t0 + 0.02);
    oGain.gain.setValueAtTime(vol * 0.35, t0);
    oGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.025);
    osc.connect(oGain);
    oGain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.03);
  }

  /** 단말 비프 (줄 끝 / 시스템 개입) */
  function termBeep(pitch) {
    var c = ensureCtx();
    if (!c || !unlocked) return;
    if (c.state === "suspended") c.resume().catch(function () {});
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = "square";
    osc.frequency.value = pitch || 880;
    g.gain.setValueAtTime(0.04, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.09);
  }

  /** 구형 HDD 긁히는 소리 (짧은 버스트) */
  function hddScratch() {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    if (c.state === "suspended") c.resume().catch(function () {});
    var t0 = c.currentTime;
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var start = t0 + i * 0.045;
        var bufLen = Math.floor(c.sampleRate * 0.04);
        var buf = c.createBuffer(1, bufLen, c.sampleRate);
        var data = buf.getChannelData(0);
        for (var j = 0; j < bufLen; j++) {
          data[j] = (Math.random() * 2 - 1) * (1 - j / bufLen);
        }
        var src = c.createBufferSource();
        src.buffer = buf;
        var f = c.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1800 + Math.random() * 2400;
        f.Q.value = 0.6 + Math.random();
        var g = c.createGain();
        g.gain.setValueAtTime(0.03 + Math.random() * 0.025, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
        src.connect(f);
        f.connect(g);
        g.connect(c.destination);
        src.start(start);
        src.stop(start + 0.055);
      })(i);
    }
    // 얇은 모터 톤
    var osc = c.createOscillator();
    var og = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, t0);
    osc.frequency.linearRampToValueAtTime(42, t0 + 0.28);
    og.gain.setValueAtTime(0.012, t0);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    osc.connect(og);
    og.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.32);
  }

  /** 저주파 럼블 (초) */
  function rumble(sec) {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    if (c.state === "suspended") c.resume().catch(function () {});
    sec = Math.max(0.4, Math.min(4, sec || 1.5));
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    var f = c.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = 38 + Math.random() * 12;
    f.type = "lowpass";
    f.frequency.value = 90;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sec);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + sec + 0.05);
    // 약한 하트 비트 겹침
    setTimeout(function () {
      thump(0.06, 48);
    }, 200);
    setTimeout(function () {
      thump(0.04, 40);
    }, 380);
  }

  document.addEventListener("haunt-diary", function (ev) {
    var d = (ev && ev.detail) || {};
    if (d.discovered) unlock();
  });
  document.addEventListener("haunt-stage", function (ev) {
    var s = ev && ev.detail && ev.detail.stage;
    // stage만으로 자동 켜지 않음 — mood 이벤트가 우선
  });
  document.addEventListener("haunt-mood", function (ev) {
    var m = ev && ev.detail && typeof ev.detail.mood === "number" ? ev.detail.mood : 0;
    // mood 0–1: off · 2: soft · 3: mid · 4+: heavy
    if (m <= 1) setLevel(0);
    else if (m === 2) setLevel(1);
    else if (m === 3) setLevel(2);
    else setLevel(3);
  });

  // 보스 연출: 더 크게
  var mo = new MutationObserver(function () {
    if (document.body.classList.contains("is-haunting")) {
      setLevel(3);
    }
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.__hauntAudio = {
    unlock: unlock,
    setLevel: setLevel,
    pulse: pulse,
    typeClick: typeClick,
    termBeep: termBeep,
    hddScratch: hddScratch,
    rumble: rumble,
  };
})();
