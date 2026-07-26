/**
 * 공포 오디오 엔진 (Web Audio — 외부 파일 없음)
 * - 저음 심박 + 앰비언트 드론 + 스팅/정전기/속삭임/HDD
 * - stage/mood/이상현상/클라이맥스/엔딩에 훅
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ensureCtx 보다 앞에 선언 (BGM 경로에서 참조)
  var ctx = null;
  var master = null;
  var comp = null;
  // 2페이즈 BGM — Stalled_Rotor 루프 (HTMLAudio + WebAudio 이중)
  var P2_BGM_REL = "assets/audio/Stalled_Rotor.mp3";
  var P2_BGM_VOL = 0.26; // 작게 깔되 들릴 정도
  var p2BgmEl = null;
  var p2BgmWanted = false;
  var p2BgmFadeTimer = null;
  var p2BgmPlaying = false;
  var p2BgmLoadPromise = null;
  var p2BgmBuffer = null;
  var p2BgmSource = null;
  var p2BgmGainNode = null;
  var p2BgmUseWA = false; // Web Audio 경로 성공 시 true
  var p2BgmLastErr = "";

  // 3페이즈 BGM — Iron_Chest_Cavity (DOM #p3BgmTrack 우선, 단순·확실)
  var P3_BGM_REL = "assets/audio/Iron_Chest_Cavity.mp3";
  var P3_BGM_VOL = 0.42;
  var p3BgmEl = null;
  var p3BgmWanted = false;
  var p3BgmPlaying = false;
  var p3BgmLastErr = "";
  var p3BgmUseWA = false;
  var p3BgmSource = null; // status 호환용 (DOM 전용)

  function resolveAudioUrl(rel) {
    try {
      return new URL(rel, location.href).href;
    } catch (e) {
      return rel;
    }
  }

  function p2BgmSrc() {
    return resolveAudioUrl(P2_BGM_REL);
  }

  function p3BgmSrc() {
    return resolveAudioUrl(P3_BGM_REL);
  }

  function p3BgmReady() {
    try {
      if (!document.body) return false;
      if (document.body.classList.contains("is-haunting")) return false;
      if (document.body.classList.contains("is-ending")) return false;
      if (window.__hauntPhase3Active === true) return true;
      if (document.body.classList.contains("phase-3-active")) return true;
      try {
        if (
          sessionStorage.getItem("haunt_phase3") === "1" &&
          window.__hauntDiaryDiscovered
        ) {
          return true;
        }
      } catch (e0) {}
      return false;
    } catch (e) {
      return false;
    }
  }

  function ensureP3BgmEl() {
    if (p3BgmEl) return p3BgmEl;
    // 1) HTML 에 박아 둔 태그 우선
    p3BgmEl = document.getElementById("p3BgmTrack");
    if (!p3BgmEl) {
      try {
        p3BgmEl = new Audio();
        p3BgmEl.id = "p3BgmTrack";
        p3BgmEl.src = p3BgmSrc();
        p3BgmEl.loop = true;
        p3BgmEl.preload = "auto";
        p3BgmEl.setAttribute("playsinline", "");
        if (document.body) document.body.appendChild(p3BgmEl);
      } catch (e) {
        p3BgmEl = null;
        p3BgmLastErr = String(e && e.message ? e.message : e);
        return null;
      }
    }
    try {
      if (!p3BgmEl.getAttribute("src") && !p3BgmEl.src) {
        p3BgmEl.src = p3BgmSrc();
      }
      p3BgmEl.loop = true;
      p3BgmEl.preload = "auto";
      // crossOrigin 이 로컬/동일 출처에서 문제 되면 제거
      try {
        p3BgmEl.removeAttribute("crossorigin");
      } catch (eC) {}
    } catch (e2) {}
    p3BgmEl.addEventListener(
      "error",
      function () {
        p3BgmLastErr =
          "audio-error " +
          (p3BgmEl.error ? p3BgmEl.error.code : "?") +
          " " +
          p3BgmSrc();
        console.warn("[p3-bgm]", p3BgmLastErr);
      },
      { once: false }
    );
    return p3BgmEl;
  }

  function killP2BgmHard() {
    p2BgmWanted = false;
    if (p2BgmFadeTimer) {
      clearInterval(p2BgmFadeTimer);
      p2BgmFadeTimer = null;
    }
    if (p2BgmSource) {
      try {
        p2BgmSource.stop();
      } catch (e1) {}
      try {
        p2BgmSource.disconnect();
      } catch (e2) {}
      p2BgmSource = null;
    }
    p2BgmUseWA = false;
    p2BgmPlaying = false;
    if (p2BgmGainNode) {
      try {
        p2BgmGainNode.gain.value = 0.0001;
      } catch (e3) {}
    }
    if (p2BgmEl) {
      try {
        p2BgmEl.pause();
        p2BgmEl.volume = 0;
      } catch (e4) {}
    }
    // DOM p2 트랙
    var p2dom = document.getElementById("p2BgmTrack");
    if (p2dom) {
      try {
        p2dom.pause();
        p2dom.volume = 0;
      } catch (e5) {}
    }
  }

  function startPhase3Bgm() {
    p3BgmWanted = true;
    if (!p3BgmReady()) {
      console.log("[p3-bgm] skip — not in phase3", {
        flag: window.__hauntPhase3Active,
        cls: document.body && document.body.className,
      });
      return false;
    }

    try {
      killP2BgmHard();
    } catch (eK) {
      try {
        if (typeof stopPhase2Bgm === "function") stopPhase2Bgm(true);
      } catch (eS) {}
    }

    // AudioContext 깨우기 (다른 SFX 와 같이)
    try {
      if (typeof ensureCtx === "function") {
        var c = ensureCtx();
        if (c && c.state === "suspended") c.resume();
      }
    } catch (eCtx) {}

    var el = ensureP3BgmEl();
    if (!el) {
      console.warn("[p3-bgm] no audio element");
      return false;
    }

    // 이미 재생 중이면 볼륨만 보정
    if (!el.paused && !el.ended && el.currentTime > 0) {
      try {
        el.volume = P3_BGM_VOL;
        el.muted = false;
      } catch (eV) {}
      p3BgmPlaying = true;
      return true;
    }

    try {
      el.muted = false;
      el.loop = true;
      el.volume = P3_BGM_VOL;
      // 처음부터
      try {
        if (el.currentTime > 0.5) el.currentTime = 0;
      } catch (eT) {}
    } catch (eSet) {}

    var attempt = function (n) {
      n = n || 0;
      var p = el.play();
      if (p && typeof p.then === "function") {
        p.then(function () {
          p3BgmPlaying = true;
          try {
            el.volume = P3_BGM_VOL;
            el.muted = false;
          } catch (e2) {}
          console.log("[p3-bgm] PLAYING", p3BgmSrc(), "vol", el.volume);
        }).catch(function (err) {
          p3BgmLastErr = String(err && err.message ? err.message : err);
          p3BgmPlaying = false;
          console.warn("[p3-bgm] play() failed", p3BgmLastErr, "try", n);
          if (n < 5) {
            setTimeout(function () {
              if (p3BgmWanted && p3BgmReady()) attempt(n + 1);
            }, 400 + n * 300);
          }
        });
      } else {
        p3BgmPlaying = !el.paused;
      }
    };
    attempt(0);
    return true;
  }

  function stopPhase3Bgm(fast) {
    p3BgmWanted = false;
    var el = p3BgmEl || document.getElementById("p3BgmTrack");
    if (!el) return;
    if (fast) {
      try {
        el.pause();
        el.volume = 0;
      } catch (e) {}
      p3BgmPlaying = false;
      return;
    }
    // 짧은 페이드
    var from = el.volume || P3_BGM_VOL;
    var steps = 8;
    var i = 0;
    var iv = setInterval(function () {
      i++;
      try {
        el.volume = Math.max(0, from * (1 - i / steps));
      } catch (e2) {}
      if (i >= steps) {
        clearInterval(iv);
        try {
          el.pause();
          el.volume = 0;
        } catch (e3) {}
        p3BgmPlaying = false;
      }
    }, 40);
  }

  function syncPhase3Bgm() {
    if (p3BgmReady()) {
      var el = ensureP3BgmEl();
      var ok = el && !el.paused && el.volume > 0.05;
      if (!ok) startPhase3Bgm();
    } else {
      var el2 = p3BgmEl || document.getElementById("p3BgmTrack");
      if (el2 && !el2.paused) stopPhase3Bgm(true);
    }
  }

  function preloadP3Bgm() {
    try {
      var el = ensureP3BgmEl();
      if (el && el.load) el.load();
    } catch (e) {}
  }

  function p2BgmReady() {
    try {
      if (!document.body) return false;
      if (document.body.classList.contains("is-haunting")) return false;
      if (document.body.classList.contains("is-ending")) return false;
      if (
        window.__hauntPhase3Active ||
        document.body.classList.contains("phase-3-active")
      ) {
        return false;
      }
      // 2페이즈 UI 플래그
      if (document.body.classList.contains("phase-2-active")) return true;
      if (
        document.body.classList.contains("stage-corrupt") ||
        document.body.classList.contains("stage-dread")
      ) {
        return true;
      }
      if (!window.__hauntDiaryDiscovered) return false;
      var st = 0;
      if (typeof window.__hauntStage === "function") st = window.__hauntStage();
      else st = parseInt(document.body.getAttribute("data-stage") || "0", 10) || 0;
      return st >= 2;
    } catch (e) {
      return false;
    }
  }

  function ensureP2BgmEl() {
    if (p2BgmEl) return p2BgmEl;
    try {
      p2BgmEl = document.getElementById("p2BgmTrack");
      if (!p2BgmEl) {
        p2BgmEl = new Audio();
        p2BgmEl.src = p2BgmSrc();
        p2BgmEl.loop = true;
        p2BgmEl.preload = "auto";
        p2BgmEl.setAttribute("playsinline", "");
      }
      p2BgmEl.loop = true;
      p2BgmEl.preload = "auto";
      try {
        p2BgmEl.removeAttribute("crossorigin");
      } catch (eC) {}
      p2BgmEl.addEventListener("error", function () {
        p2BgmLastErr = "html-audio-error";
        if (window.console && /[?&]debug=1/.test(location.search || "")) {
          console.warn("[p2-bgm] HTMLAudio load error", p2BgmSrc(), p2BgmEl.error);
        }
      });
    } catch (e) {
      p2BgmEl = null;
      p2BgmLastErr = String(e && e.message ? e.message : e);
    }
    return p2BgmEl;
  }

  function fadeHtmlBgmTo(target, ms) {
    var el = ensureP2BgmEl();
    if (!el) return;
    if (p2BgmFadeTimer) {
      clearInterval(p2BgmFadeTimer);
      p2BgmFadeTimer = null;
    }
    var from = typeof el.volume === "number" ? el.volume : 0;
    var steps = Math.max(6, Math.floor((ms || 1000) / 50));
    var i = 0;
    p2BgmFadeTimer = setInterval(function () {
      i++;
      var t = Math.min(1, i / steps);
      el.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (i >= steps) {
        clearInterval(p2BgmFadeTimer);
        p2BgmFadeTimer = null;
        el.volume = Math.max(0, Math.min(1, target));
        if (target <= 0.001) {
          try {
            el.pause();
          } catch (e0) {}
          p2BgmPlaying = false;
        }
      }
    }, 50);
  }

  function stopWebBgm(fast) {
    if (p2BgmGainNode && ctx) {
      try {
        var t0 = ctx.currentTime;
        p2BgmGainNode.gain.cancelScheduledValues(t0);
        p2BgmGainNode.gain.setValueAtTime(p2BgmGainNode.gain.value, t0);
        p2BgmGainNode.gain.linearRampToValueAtTime(0.0001, t0 + (fast ? 0.25 : 1.0));
      } catch (e) {}
    }
    setTimeout(
      function () {
        if (p2BgmSource) {
          try {
            p2BgmSource.stop();
          } catch (e2) {}
          try {
            p2BgmSource.disconnect();
          } catch (e3) {}
          p2BgmSource = null;
        }
        p2BgmUseWA = false;
        p2BgmPlaying = false;
      },
      fast ? 280 : 1100
    );
  }

  function loadP2BgmBuffer() {
    if (p2BgmBuffer) return Promise.resolve(p2BgmBuffer);
    if (p2BgmLoadPromise) return p2BgmLoadPromise;
    p2BgmLoadPromise = fetch(p2BgmSrc())
      .then(function (r) {
        if (!r.ok) throw new Error("bgm-http-" + r.status);
        return r.arrayBuffer();
      })
      .then(function (ab) {
        var c = ensureCtx();
        if (!c) throw new Error("no-audio-ctx");
        return new Promise(function (resolve, reject) {
          var p = c.decodeAudioData(ab.slice(0), resolve, reject);
          if (p && typeof p.then === "function") p.then(resolve, reject);
        });
      })
      .then(function (buf) {
        p2BgmBuffer = buf;
        return buf;
      })
      .catch(function (err) {
        p2BgmLastErr = String(err && err.message ? err.message : err);
        p2BgmLoadPromise = null;
        if (window.console && /[?&]debug=1/.test(location.search || "")) {
          console.warn("[p2-bgm] decode fail", p2BgmLastErr, p2BgmSrc());
        }
        throw err;
      });
    return p2BgmLoadPromise;
  }

  function startWebBgm() {
    var c = ensureCtx();
    if (!c) return Promise.reject(new Error("no-ctx"));
    if (c.state === "suspended") {
      try {
        c.resume();
      } catch (e) {}
    }
    return loadP2BgmBuffer().then(function (buf) {
      if (!p2BgmReady()) return false;
      // 이미 재생 중이면 게인만 맞춤
      if (p2BgmSource && p2BgmUseWA) {
        if (p2BgmGainNode) {
          var t = c.currentTime;
          p2BgmGainNode.gain.cancelScheduledValues(t);
          p2BgmGainNode.gain.setValueAtTime(
            Math.max(0.0001, p2BgmGainNode.gain.value),
            t
          );
          p2BgmGainNode.gain.linearRampToValueAtTime(P2_BGM_VOL, t + 1.2);
        }
        p2BgmPlaying = true;
        return true;
      }
      if (p2BgmSource) {
        try {
          p2BgmSource.stop();
        } catch (e0) {}
        p2BgmSource = null;
      }
      p2BgmGainNode = c.createGain();
      p2BgmGainNode.gain.value = 0.0001;
      // 마스터 컴프 거치지 않고 destination 직결 → SFX에 파묻히지 않음
      p2BgmGainNode.connect(c.destination);
      p2BgmSource = c.createBufferSource();
      p2BgmSource.buffer = buf;
      p2BgmSource.loop = true;
      p2BgmSource.connect(p2BgmGainNode);
      p2BgmSource.start(0);
      var t0 = c.currentTime;
      p2BgmGainNode.gain.linearRampToValueAtTime(P2_BGM_VOL, t0 + 1.4);
      p2BgmUseWA = true;
      p2BgmPlaying = true;
      // HTML 쪽은 중지
      if (p2BgmEl) {
        try {
          p2BgmEl.pause();
        } catch (e1) {}
      }
      if (window.console && /[?&]debug=1/.test(location.search || "")) {
        console.log("[p2-bgm] WebAudio playing", p2BgmSrc(), "vol", P2_BGM_VOL);
      }
      return true;
    });
  }

  function startHtmlBgm() {
    var el = ensureP2BgmEl();
    if (!el) return Promise.reject(new Error("no-el"));
    // 들릴 정도로 바로 살짝 올린 뒤 목표 볼륨으로
    try {
      el.volume = Math.max(el.volume, 0.08);
    } catch (e) {}
    var p = el.play();
    if (p && typeof p.then === "function") {
      return p.then(function () {
        p2BgmPlaying = true;
        fadeHtmlBgmTo(P2_BGM_VOL, 1200);
        if (window.console && /[?&]debug=1/.test(location.search || "")) {
          console.log("[p2-bgm] HTMLAudio playing", p2BgmSrc(), "vol", P2_BGM_VOL);
        }
        return true;
      });
    }
    p2BgmPlaying = true;
    fadeHtmlBgmTo(P2_BGM_VOL, 1200);
    return Promise.resolve(true);
  }

  function startPhase2Bgm() {
    p2BgmWanted = true;
    if (!p2BgmReady()) {
      if (window.console && /[?&]debug=1/.test(location.search || "")) {
        console.log("[p2-bgm] not ready (need phase2)");
      }
      return false;
    }
    // 이미 잘 재생 중
    if (p2BgmPlaying && p2BgmUseWA && p2BgmSource) return true;
    if (p2BgmPlaying && p2BgmEl && !p2BgmEl.paused && p2BgmEl.volume >= P2_BGM_VOL * 0.4) {
      return true;
    }

    // 1) Web Audio 우선 (reduced 모션은 HTML 만)
    if (!reduced && typeof ensureCtx === "function") {
      try {
        ensureCtx();
      } catch (eC) {}
      if (ctx) {
        startWebBgm().catch(function () {
          return startHtmlBgm().catch(function (err) {
            p2BgmLastErr = String(err && err.message ? err.message : err);
            p2BgmPlaying = false;
            if (window.console && /[?&]debug=1/.test(location.search || "")) {
              console.warn("[p2-bgm] all play paths failed", p2BgmLastErr);
            }
          });
        });
        return true;
      }
    }

    // 2) HTMLAudio 폴백 (reduced / ctx 실패)
    startHtmlBgm().catch(function (err) {
      p2BgmLastErr = String(err && err.message ? err.message : err);
      p2BgmPlaying = false;
    });
    return true;
  }

  function stopPhase2Bgm(fast) {
    p2BgmWanted = false;
    if (p2BgmUseWA || p2BgmSource) {
      stopWebBgm(!!fast);
    }
    if (p2BgmEl) {
      fadeHtmlBgmTo(0, fast ? 350 : 1000);
    }
  }

  function syncPhase2Bgm() {
    if (p2BgmReady()) {
      var ok = p2BgmPlaying;
      if (p2BgmUseWA && p2BgmSource) ok = true;
      if (p2BgmEl && !p2BgmEl.paused && p2BgmEl.volume > 0.02) ok = true;
      if (!ok) startPhase2Bgm();
    } else if (p2BgmPlaying || (p2BgmEl && !p2BgmEl.paused) || p2BgmSource) {
      stopPhase2Bgm(false);
    }
  }

  if (reduced) {
    var noop = function () {};
    // reduced: HTMLAudio만 (ensureCtx 없음)
    window.__hauntAudio = {
      unlock: function () {
        if (p3BgmReady()) startPhase3Bgm();
        else if (p2BgmReady()) startPhase2Bgm();
      },
      setLevel: noop,
      pulse: noop,
      typeClick: noop,
      termBeep: noop,
      hddScratch: noop,
      rumble: noop,
      sting: noop,
      whisper: noop,
      staticBurst: noop,
      breath: noop,
      signalDrop: noop,
      dreadHit: noop,
      metal: noop,
      codeLaugh: noop,
      approachLaugh: noop,
      binauralWhisper: noop,
      muffledHeartbeat: noop,
      stopAll: function () {
        stopPhase2Bgm(true);
        stopPhase3Bgm(true);
      },
      setMaster: noop,
      startPhase2Bgm: startPhase2Bgm,
      stopPhase2Bgm: stopPhase2Bgm,
      startPhase3Bgm: startPhase3Bgm,
      stopPhase3Bgm: stopPhase3Bgm,
      p2BgmStatus: function () {
        return {
          ready: p2BgmReady(),
          playing: p2BgmPlaying,
          src: p2BgmSrc(),
          err: p2BgmLastErr,
          vol: P2_BGM_VOL,
        };
      },
      p3BgmStatus: function () {
        var el = p3BgmEl || document.getElementById("p3BgmTrack");
        return {
          ready: p3BgmReady(),
          playing: p3BgmPlaying,
          paused: el ? el.paused : null,
          vol: el ? el.volume : P3_BGM_VOL,
          src: p3BgmSrc(),
          err: p3BgmLastErr,
        };
      },
    };
    document.addEventListener("haunt-stage", function (ev) {
      var s = ev && ev.detail && ev.detail.stage;
      if (s >= 2 && !p3BgmReady()) startPhase2Bgm();
    });
    document.addEventListener("haunt-diary", function () {
      setTimeout(function () {
        if (p2BgmReady() && !p3BgmReady()) startPhase2Bgm();
      }, 500);
    });
    document.addEventListener("haunt-phase3", function () {
      try {
        killP2BgmHard();
      } catch (e) {
        stopPhase2Bgm(true);
      }
      startPhase3Bgm();
      setTimeout(startPhase3Bgm, 300);
      setTimeout(startPhase3Bgm, 900);
    });
    document.addEventListener(
      "pointerdown",
      function () {
        if (p3BgmReady()) startPhase3Bgm();
        else if (p2BgmReady()) startPhase2Bgm();
      },
      true
    );
    document.addEventListener(
      "keydown",
      function () {
        if (p3BgmReady()) startPhase3Bgm();
        else if (p2BgmReady()) startPhase2Bgm();
      },
      true
    );
    setInterval(function () {
      syncPhase2Bgm();
      syncPhase3Bgm();
    }, 1200);
    return;
  }

  var unlocked = false;
  var level = 0; // 0 off · 1 soft · 2 mid · 3 heavy
  var beatTimer = null;
  var droneNodes = [];
  // 마스터 + 개별 게인 (기존 너무 작았음 → 크게)
  var masterVol = 1.45;
  var SFX = 2.35; // 개별 효과음 배수

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = masterVol;
    // 컴프레서를 덜 세게 — 작은 소리만 올리고 큰 타격은 덜 죽임
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.knee.value = 18;
    comp.ratio.value = 2.2;
    comp.attack.value = 0.005;
    comp.release.value = 0.28;
    master.connect(comp);
    comp.connect(ctx.destination);
    return ctx;
  }

  function v(x) {
    return Math.max(0.0001, (x || 0) * SFX);
  }

  function out() {
    ensureCtx();
    return master;
  }

  function unlock() {
    unlocked = true;
    var c = ensureCtx();
    if (c && c.state === "suspended") {
      c.resume().catch(function () {});
    }
    // 제스처 직후 해당 페이즈 BGM 시작 (브라우저 자동재생 정책)
    if (p3BgmReady()) startPhase3Bgm();
    else if (p2BgmReady()) startPhase2Bgm();
  }

  function now() {
    var c = ensureCtx();
    return c ? c.currentTime : 0;
  }

  function noiseBuffer(sec) {
    var c = ensureCtx();
    if (!c) return null;
    var len = Math.max(1, Math.floor(c.sampleRate * sec));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function playNoise(opts) {
    opts = opts || {};
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now() + (opts.delay || 0);
    var src = c.createBufferSource();
    src.buffer = noiseBuffer(opts.dur || 0.12);
    var f = c.createBiquadFilter();
    f.type = opts.filter || "bandpass";
    f.frequency.value = opts.freq || 1200;
    f.Q.value = opts.q != null ? opts.q : 0.7;
    var g = c.createGain();
    var vv = v(opts.vol != null ? opts.vol : 0.05);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vv, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (opts.dur || 0.12));
    src.connect(f);
    f.connect(g);
    g.connect(out());
    src.start(t0);
    src.stop(t0 + (opts.dur || 0.12) + 0.02);
  }

  /** 두꺼운 심박 (바디 + 노이즈 클릭) */
  function thump(vol, freq) {
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    vol = v(vol || 0.14);
    freq = freq || 48;

    // 바디 사인
    var osc = c.createOscillator();
    var og = c.createGain();
    var lf = c.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(16, t0 + 0.22);
    lf.type = "lowpass";
    lf.frequency.value = 160;
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    osc.connect(lf);
    lf.connect(og);
    og.connect(out());
    osc.start(t0);
    osc.stop(t0 + 0.52);

    // 서브 한 겹
    var sub = c.createOscillator();
    var sg = c.createGain();
    sub.type = "sine";
    sub.frequency.value = Math.max(22, freq * 0.5);
    sg.gain.setValueAtTime(0.0001, t0);
    sg.gain.exponentialRampToValueAtTime(vol * 0.7, t0 + 0.018);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.58);
    sub.connect(sg);
    sg.connect(out());
    sub.start(t0);
    sub.stop(t0 + 0.6);

    // 어택 노이즈
    playNoise({
      dur: 0.05,
      freq: 200,
      filter: "lowpass",
      vol: (vol / SFX) * 0.45,
      q: 0.5,
    });
  }

  function beat() {
    if (level <= 0) return;
    var base = level === 1 ? 0.12 : level === 2 ? 0.2 : 0.32;
    thump(base, level >= 3 ? 40 : 50);
    setTimeout(function () {
      if (level <= 0) return;
      thump(base * 0.62, level >= 3 ? 34 : 42);
    }, level >= 3 ? 150 : 190);
  }

  function stopDrone() {
    droneNodes.forEach(function (n) {
      try {
        if (n.g) n.g.gain.exponentialRampToValueAtTime(0.0001, now() + 0.4);
        if (n.osc) n.osc.stop(now() + 0.5);
      } catch (e) {}
    });
    droneNodes = [];
  }

  /** 깔리는 공포 드론 (level에 따라 층 추가) */
  function startDrone() {
    stopDrone();
    var c = ensureCtx();
    if (!c || !unlocked || level <= 0) return;
    var t0 = now();
    var layers =
      level === 1
        ? [{ f: 42, v: v(0.028), type: "sine" }]
        : level === 2
          ? [
              { f: 38, v: v(0.04), type: "sine" },
              { f: 55, v: v(0.02), type: "triangle" },
              { f: 110, v: v(0.012), type: "sine" },
            ]
          : [
              { f: 32, v: v(0.055), type: "sine" },
              { f: 48, v: v(0.035), type: "triangle" },
              { f: 72, v: v(0.018), type: "sine" },
              { f: 180, v: v(0.01), type: "sawtooth" },
            ];

    layers.forEach(function (L, i) {
      var osc = c.createOscillator();
      var g = c.createGain();
      var f = c.createBiquadFilter();
      osc.type = L.type;
      osc.frequency.value = L.f;
      // 아주 느린 LFO 느낌
      try {
        var lfo = c.createOscillator();
        var lg = c.createGain();
        lfo.frequency.value = 0.07 + i * 0.03;
        lg.gain.value = L.f * 0.015;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start(t0);
        droneNodes.push({ osc: lfo, g: lg });
      } catch (e) {}
      f.type = "lowpass";
      f.frequency.value = 220 + i * 40;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(L.v, t0 + 1.2 + i * 0.3);
      osc.connect(f);
      f.connect(g);
      g.connect(out());
      osc.start(t0);
      droneNodes.push({ osc: osc, g: g });
    });

    // heavy: 아주 약한 핑크 노이즈 깔개
    if (level >= 3) {
      var src = c.createBufferSource();
      src.buffer = noiseBuffer(2);
      src.loop = true;
      var nf = c.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 400;
      var ng = c.createGain();
      ng.gain.value = v(0.02);
      src.connect(nf);
      nf.connect(ng);
      ng.connect(out());
      src.start(t0);
      droneNodes.push({ osc: src, g: ng });
    }
  }

  function scheduleBeat() {
    if (beatTimer) {
      clearTimeout(beatTimer);
      beatTimer = null;
    }
    if (level <= 0) return;

    function loop() {
      if (level <= 0) return;
      if (document.hidden) {
        beatTimer = setTimeout(loop, 2000);
        return;
      }
      // 가끔 불규칙 (공포감)
      if (level >= 2 && Math.random() > 0.88) {
        thump(0.09, 60);
        beatTimer = setTimeout(loop, 400 + Math.random() * 300);
        return;
      }
      beat();
      var gap = level === 1 ? 1280 : level === 2 ? 1020 : 780;
      gap += (Math.random() * 100) | 0;
      if (level >= 3 && Math.random() > 0.92) gap *= 0.55; // 급박
      beatTimer = setTimeout(loop, gap);
    }
    loop();
  }

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
    if (n === level && !(opts && opts.force)) return;
    level = n;
    if (n > 0) unlock();
    if (n <= 0) {
      stopDrone();
      if (beatTimer) clearTimeout(beatTimer);
      beatTimer = null;
      return;
    }
    startDrone();
    scheduleBeat();
  }

  function pulse(strength) {
    unlock();
    var pv = strength === "heavy" ? 0.34 : strength === "mid" ? 0.22 : 0.14;
    thump(pv, strength === "heavy" ? 38 : 48);
    setTimeout(function () {
      thump(pv * 0.6, 36);
    }, 160);
    if (strength === "heavy") {
      playNoise({ dur: 0.1, freq: 90, filter: "lowpass", vol: 0.08 });
    }
  }

  function typeClick(kind) {
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    kind = kind || "mid";
    var bufferSize = 320;
    var noiseBuf = c.createBuffer(1, bufferSize, c.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.85;
    var noise = c.createBufferSource();
    noise.buffer = noiseBuf;
    var nGain = c.createGain();
    var nFilter = c.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.value = kind === "hard" ? 2400 : kind === "soft" ? 1300 : 1900;
    nFilter.Q.value = 0.85;
    var vol =
      kind === "space"
        ? 0.028
        : kind === "enter"
          ? 0.09
          : kind === "hard"
            ? 0.075
            : kind === "soft"
              ? 0.04
              : 0.055;
    vol = v(vol * (0.85 + Math.random() * 0.3));
    nGain.gain.setValueAtTime(vol, t0);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (kind === "enter" ? 0.07 : 0.03));
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(out());
    noise.start(t0);
    noise.stop(t0 + 0.08);

    var osc = c.createOscillator();
    var oGain = c.createGain();
    osc.type = "square";
    var f =
      kind === "enter"
        ? 170 + Math.random() * 40
        : kind === "space"
          ? 85 + Math.random() * 20
          : 850 + Math.random() * 750;
    osc.frequency.setValueAtTime(f, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f * 0.28), t0 + 0.022);
    oGain.gain.setValueAtTime(vol * 0.45, t0);
    oGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.028);
    osc.connect(oGain);
    oGain.connect(out());
    osc.start(t0);
    osc.stop(t0 + 0.035);
  }

  function termBeep(pitch) {
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = "square";
    osc.frequency.value = pitch || 880;
    g.gain.setValueAtTime(v(0.1), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.connect(g);
    g.connect(out());
    osc.start(t0);
    osc.stop(t0 + 0.11);
  }

  function hddScratch() {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    for (var i = 0; i < 6; i++) {
      (function (i) {
        var start = t0 + i * 0.04;
        var bufLen = Math.floor(c.sampleRate * 0.045);
        var buf = c.createBuffer(1, bufLen, c.sampleRate);
        var data = buf.getChannelData(0);
        for (var j = 0; j < bufLen; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / bufLen);
        var src = c.createBufferSource();
        src.buffer = buf;
        var f = c.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1600 + Math.random() * 2800;
        f.Q.value = 0.5 + Math.random();
        var g = c.createGain();
        g.gain.setValueAtTime(v(0.06 + Math.random() * 0.04), start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.055);
        src.connect(f);
        f.connect(g);
        g.connect(out());
        src.start(start);
        src.stop(start + 0.06);
      })(i);
    }
    var osc = c.createOscillator();
    var og = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(58, t0);
    osc.frequency.linearRampToValueAtTime(40, t0 + 0.32);
    og.gain.setValueAtTime(v(0.035), t0);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
    osc.connect(og);
    og.connect(out());
    osc.start(t0);
    osc.stop(t0 + 0.36);
  }

  function rumble(sec) {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    sec = Math.max(0.5, Math.min(5, sec || 1.6));
    var t0 = now();
    var osc = c.createOscillator();
    var g = c.createGain();
    var f = c.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = 32 + Math.random() * 14;
    f.type = "lowpass";
    f.frequency.value = 100;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v(0.14), t0 + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sec);
    osc.connect(f);
    f.connect(g);
    g.connect(out());
    osc.start(t0);
    osc.stop(t0 + sec + 0.05);
    setTimeout(function () {
      thump(0.14, 44);
    }, 180);
    setTimeout(function () {
      thump(0.1, 38);
    }, 360);
  }

  /** 점프스케어/섬광 스팅 */
  function sting(kind) {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    kind = kind || "blood";

    // 급격한 디스코드 톤
    var freqs =
      kind === "neon"
        ? [880, 1320, 1760]
        : kind === "soft"
          ? [120, 180]
          : [55, 110, 220, 440];
    freqs.forEach(function (fq, i) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = i % 2 ? "sawtooth" : "square";
      o.frequency.setValueAtTime(fq, t0);
      o.frequency.exponentialRampToValueAtTime(fq * 0.4, t0 + 0.12);
      var sv = v((kind === "soft" ? 0.055 : 0.1) * (1 - i * 0.12));
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, sv), t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(g);
      g.connect(out());
      o.start(t0);
      o.stop(t0 + 0.22);
    });
    playNoise({
      dur: 0.18,
      freq: kind === "neon" ? 3000 : 400,
      filter: kind === "neon" ? "highpass" : "bandpass",
      vol: kind === "soft" ? 0.07 : 0.12,
      q: 0.4,
    });
    thump(kind === "soft" ? 0.12 : 0.26, 36);
  }

  /** 속삭임 같은 필터 노이즈 */
  function whisper() {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    var src = c.createBufferSource();
    src.buffer = noiseBuffer(0.9);
    var bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(900, t0);
    bp.frequency.linearRampToValueAtTime(1600, t0 + 0.5);
    bp.frequency.linearRampToValueAtTime(600, t0 + 0.9);
    bp.Q.value = 4;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v(0.055), t0 + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.95);
    src.connect(bp);
    bp.connect(g);
    g.connect(out());
    src.start(t0);
    src.stop(t0 + 1);
  }

  function staticBurst(ms) {
    unlock();
    playNoise({
      dur: (ms || 180) / 1000,
      freq: 2200,
      filter: "highpass",
      vol: 0.1,
      q: 0.3,
    });
    playNoise({
      dur: (ms || 180) / 1000,
      freq: 300,
      filter: "lowpass",
      vol: 0.08,
      q: 0.5,
    });
  }

  function breath() {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    var src = c.createBufferSource();
    src.buffer = noiseBuffer(1.4);
    var f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(500, t0);
    f.frequency.linearRampToValueAtTime(1200, t0 + 0.5);
    f.frequency.linearRampToValueAtTime(350, t0 + 1.3);
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(v(0.07), t0 + 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t0 + 1.35);
    src.connect(f);
    f.connect(g);
    g.connect(out());
    src.start(t0);
    src.stop(t0 + 1.4);
  }

  /** 엔딩/신호 끊김 */
  function signalDrop() {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    // 하강 톤
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(420, t0);
    o.frequency.exponentialRampToValueAtTime(40, t0 + 1.6);
    g.gain.setValueAtTime(v(0.1), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
    o.connect(g);
    g.connect(out());
    o.start(t0);
    o.stop(t0 + 1.85);
    staticBurst(400);
    setTimeout(function () {
      staticBurst(200);
    }, 500);
    setTimeout(function () {
      thump(0.18, 30);
    }, 900);
  }

  function dreadHit() {
    unlock();
    sting("blood");
    setTimeout(function () {
      rumble(1.2);
    }, 80);
  }

  function metal() {
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    [880, 1320, 1760, 2200].forEach(function (fq, i) {
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = "square";
      o.frequency.value = fq * (0.98 + Math.random() * 0.04);
      g.gain.setValueAtTime(0.0001, t0 + i * 0.01);
      g.gain.exponentialRampToValueAtTime(v(0.055 / (i + 1)), t0 + 0.02 + i * 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.connect(g);
      g.connect(out());
      o.start(t0);
      o.stop(t0 + 0.42);
    });
    playNoise({ dur: 0.22, freq: 4500, filter: "highpass", vol: 0.06, q: 1.2 });
  }

  /**
   * 링식 얼굴 접근 전용: 기계·기괴 웃음
   * - 멀리서 아주 작게 → 접근 중 점점 커짐 → 화면 덮을 때 피크
   * opts.ms: 접근 구간(ms), opts.scareMs: 점프 유지(ms)
   */
  function approachLaugh(opts) {
    opts = opts || {};
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var approachSec = Math.max(1.2, (opts.ms != null ? opts.ms : 4000) / 1000);
    var scareSec = Math.max(0.4, (opts.scareMs != null ? opts.scareMs : 900) / 1000);
    var t0 = now();
    var total = approachSec + scareSec;
    try {
      // 전체 엔벨로프: 작게 → 점점 → 덮을 때 크게
      var env = c.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(v(0.012), t0 + 0.2);
      env.gain.exponentialRampToValueAtTime(v(0.028), t0 + approachSec * 0.35);
      env.gain.exponentialRampToValueAtTime(v(0.055), t0 + approachSec * 0.65);
      env.gain.exponentialRampToValueAtTime(v(0.095), t0 + approachSec * 0.92);
      // 화면 덮는 순간 피크
      env.gain.linearRampToValueAtTime(v(0.2), t0 + approachSec + 0.04);
      env.gain.setValueAtTime(v(0.16), t0 + approachSec + 0.22);
      env.gain.exponentialRampToValueAtTime(v(0.05), t0 + approachSec + scareSec * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + total + 0.15);
      env.connect(out());

      // 기괴한 기계 드론 베드 (멀리 있음)
      var drone = c.createOscillator();
      var drone2 = c.createOscillator();
      var dG = c.createGain();
      var dF = c.createBiquadFilter();
      drone.type = "sawtooth";
      drone2.type = "square";
      drone.frequency.setValueAtTime(48, t0);
      drone.frequency.linearRampToValueAtTime(72, t0 + approachSec);
      drone2.frequency.setValueAtTime(96.5, t0);
      drone2.frequency.linearRampToValueAtTime(145, t0 + approachSec);
      dF.type = "lowpass";
      dF.frequency.setValueAtTime(180, t0);
      dF.frequency.linearRampToValueAtTime(900, t0 + approachSec);
      dG.gain.value = 0.35;
      drone.connect(dF);
      drone2.connect(dF);
      dF.connect(dG);
      dG.connect(env);
      drone.start(t0);
      drone2.start(t0);
      drone.stop(t0 + total + 0.2);
      drone2.stop(t0 + total + 0.2);

      // 디지털 정적 레이어 (점점 또렷)
      var nSrc = c.createBufferSource();
      nSrc.buffer = noiseBuffer(Math.min(8, total + 0.5));
      nSrc.loop = true;
      var nF = c.createBiquadFilter();
      nF.type = "bandpass";
      nF.frequency.setValueAtTime(600, t0);
      nF.frequency.linearRampToValueAtTime(2200, t0 + approachSec);
      nF.Q.value = 0.7;
      var nG = c.createGain();
      nG.gain.value = 0.45;
      nSrc.connect(nF);
      nF.connect(nG);
      nG.connect(env);
      nSrc.start(t0);
      nSrc.stop(t0 + total + 0.15);

      // ha-ha-ha 기계 웃음 버스트 — 처음엔 드물고 작게, 끝으로 갈수록 잦고 굵게
      var t = 0.18;
      var i = 0;
      while (t < approachSec + scareSec * 0.55) {
        (function (tBurst, idx) {
          var progress = Math.min(1, tBurst / approachSec);
          // 초반 느리게, 후반 빠르게
          var o = c.createOscillator();
          var o2 = c.createOscillator();
          var g = c.createGain();
          var f = c.createBiquadFilter();
          o.type = "square";
          o2.type = "sawtooth";
          var base = 220 + progress * 160 + (idx % 3) * 18;
          o.frequency.setValueAtTime(base, t0 + tBurst);
          o.frequency.exponentialRampToValueAtTime(base * 1.4, t0 + tBurst + 0.045);
          o.frequency.exponentialRampToValueAtTime(base * 0.78, t0 + tBurst + 0.11);
          o2.frequency.setValueAtTime(base * 1.02, t0 + tBurst);
          f.type = "bandpass";
          f.frequency.value = 700 + progress * 900;
          f.Q.value = 2.2 + progress;
          // 개별 버스트 상대 세기 (env가 전체 크레센도)
          var peak = 0.35 + progress * 0.85;
          g.gain.setValueAtTime(0.0001, t0 + tBurst);
          g.gain.exponentialRampToValueAtTime(peak, t0 + tBurst + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + tBurst + 0.12 + (progress > 0.85 ? 0.08 : 0));
          o.connect(f);
          o2.connect(f);
          f.connect(g);
          g.connect(env);
          o.start(t0 + tBurst);
          o2.start(t0 + tBurst);
          o.stop(t0 + tBurst + 0.16);
          o2.stop(t0 + tBurst + 0.16);
        })(t, i);
        // 간격: 초반 ~0.55s → 후반 ~0.14s
        var gap = 0.55 - Math.min(0.42, (t / approachSec) * 0.42);
        if (t >= approachSec) gap = 0.1;
        t += gap + Math.random() * 0.04;
        i++;
      }

      // 화면 덮는 순간: 거친 웃음 다발 + 고음 글리치
      var peakT = t0 + approachSec;
      for (var k = 0; k < 6; k++) {
        (function (k) {
          var tk = peakT + k * 0.07;
          var o = c.createOscillator();
          var g = c.createGain();
          var f = c.createBiquadFilter();
          o.type = k % 2 ? "square" : "sawtooth";
          var p0 = 180 + k * 35 + Math.random() * 40;
          o.frequency.setValueAtTime(p0, tk);
          o.frequency.exponentialRampToValueAtTime(p0 * 1.55, tk + 0.05);
          o.frequency.exponentialRampToValueAtTime(p0 * 0.7, tk + 0.14);
          f.type = "bandpass";
          f.frequency.value = 500 + k * 180;
          f.Q.value = 1.8;
          g.gain.setValueAtTime(0.0001, tk);
          g.gain.exponentialRampToValueAtTime(0.9, tk + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, tk + 0.16);
          o.connect(f);
          f.connect(g);
          g.connect(env);
          o.start(tk);
          o.stop(tk + 0.18);
        })(k);
      }
      // 피크 노이즈 버스트
      playNoise({
        delay: approachSec,
        dur: 0.28,
        freq: 1600,
        filter: "highpass",
        vol: 0.1,
        q: 0.9,
      });
      playNoise({
        delay: approachSec + 0.05,
        dur: 0.18,
        freq: 3200,
        filter: "bandpass",
        vol: 0.08,
        q: 1.2,
      });
    } catch (e) {
      // 폴백: 짧게 커지는 codeLaugh 연쇄
      try {
        codeLaugh({ vol: 0.02 });
        setTimeout(function () {
          codeLaugh({ vol: 0.045 });
        }, approachSec * 400);
        setTimeout(function () {
          codeLaugh({ vol: 0.1 });
        }, approachSec * 900);
      } catch (e2) {}
    }
  }

  /**
   * 2페이즈: 프로그램/기계가 작게 웃는 소리
   * - 비트 깨진 디지털 ha-ha-ha (사각파 + 노이즈)
   * - 작게, 멀리서, 코드 실행되는 느낌
   */
  function codeLaugh(opts) {
    opts = opts || {};
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var t0 = now();
    var vol = opts.vol != null ? opts.vol : 0.028;
    // 웃음 박자: 짧-짧-길 또는 랜덤 3~5회
    var bursts = 3 + Math.floor(Math.random() * 3);
    var base = 280 + Math.random() * 120;
    for (var i = 0; i < bursts; i++) {
      (function (i) {
        var t = t0 + i * (0.09 + Math.random() * 0.04);
        var o = c.createOscillator();
        var o2 = c.createOscillator();
        var g = c.createGain();
        var f = c.createBiquadFilter();
        o.type = "square";
        o2.type = "sawtooth";
        // 올라갔다 떨어지는 기계 웃음 피치
        var p0 = base * (1 + i * 0.08);
        o.frequency.setValueAtTime(p0, t);
        o.frequency.exponentialRampToValueAtTime(p0 * 1.35, t + 0.04);
        o.frequency.exponentialRampToValueAtTime(p0 * 0.85, t + 0.1);
        o2.frequency.setValueAtTime(p0 * 1.01, t);
        f.type = "bandpass";
        f.frequency.value = 900 + Math.random() * 600;
        f.Q.value = 2.5;
        var peak = v(vol * (0.7 + Math.random() * 0.4) * (1 - i * 0.08));
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1 + (i === bursts - 1 ? 0.06 : 0));
        o.connect(f);
        o2.connect(f);
        f.connect(g);
        g.connect(out());
        o.start(t);
        o2.start(t);
        o.stop(t + 0.14);
        o2.stop(t + 0.14);
        // 짧은 디지털 글리치 클릭
        playNoise({
          delay: i * 0.09,
          dur: 0.035,
          freq: 2800 + Math.random() * 1200,
          filter: "highpass",
          vol: vol * 0.9,
          q: 1.4,
        });
      })(i);
    }
    // 끝에 작은 정적 (코드 터미널 잔향)
    playNoise({
      delay: bursts * 0.1 + 0.02,
      dur: 0.12,
      freq: 1800,
      filter: "bandpass",
      vol: vol * 0.7,
      q: 0.8,
    });
  }

  /**
   * 3페이즈: 바이노럴 속삭임 — 좌우 패닝 교차 저음 보이스
   */
  function binauralWhisper(opts) {
    opts = opts || {};
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var ms = opts.ms != null ? opts.ms : 4200;
    var t0 = now();
    var dur = ms / 1000;
    try {
      var pan = c.createStereoPanner ? c.createStereoPanner() : null;
      var g = c.createGain();
      var f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 420;
      f.Q.value = 1.4;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v(0.045), t0 + 0.25);
      g.gain.setValueAtTime(v(0.04), t0 + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      // 두 개의 미세 디튠 사인 = 이질적 보이스
      var o1 = c.createOscillator();
      var o2 = c.createOscillator();
      o1.type = "sine";
      o2.type = "triangle";
      o1.frequency.value = 95;
      o2.frequency.value = 98.5;
      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      if (pan) {
        g.connect(pan);
        pan.connect(out());
        // 좌↔우 교차 패닝
        var steps = 12;
        for (var i = 0; i <= steps; i++) {
          var t = t0 + (dur * i) / steps;
          var p = Math.sin((i / steps) * Math.PI * 3) * 0.92;
          pan.pan.setValueAtTime(p, t);
        }
      } else {
        g.connect(out());
      }
      o1.start(t0);
      o2.start(t0);
      o1.stop(t0 + dur + 0.05);
      o2.stop(t0 + dur + 0.05);
      // 숨/노이즈 레이어
      playNoise({
        dur: Math.min(0.8, dur * 0.35),
        freq: 900,
        filter: "lowpass",
        vol: 0.03,
        q: 0.6,
      });
      setTimeout(function () {
        playNoise({
          delay: 0,
          dur: 0.35,
          freq: 700,
          filter: "bandpass",
          vol: 0.025,
          q: 0.8,
        });
      }, ms * 0.4);
    } catch (e) {
      whisper();
    }
  }

  /**
   * 3페이즈: 수중/고막 압박 — 먹먹한 이명 + 가슴을 치는 심박 럼블
   */
  function muffledHeartbeat(opts) {
    opts = opts || {};
    unlock();
    var c = ensureCtx();
    if (!c || !unlocked) return;
    var ms = opts.ms != null ? opts.ms : 5200;
    var t0 = now();
    var dur = ms / 1000;
    try {
      // 먹먹한 이명 패드
      var o = c.createOscillator();
      var o2 = c.createOscillator();
      var g = c.createGain();
      var f = c.createBiquadFilter();
      o.type = "sine";
      o2.type = "sine";
      o.frequency.value = 48;
      o2.frequency.value = 52;
      f.type = "lowpass";
      f.frequency.value = 180;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v(0.055), t0 + 0.4);
      g.gain.setValueAtTime(v(0.05), t0 + dur * 0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(out());
      o.start(t0);
      o2.start(t0);
      o.stop(t0 + dur + 0.05);
      o2.stop(t0 + dur + 0.05);
      // 심박 박동
      var beats = Math.floor(dur / 0.72);
      for (var i = 0; i < beats; i++) {
        (function (i) {
          var t = t0 + 0.35 + i * 0.72;
          // lub
          var b1 = c.createOscillator();
          var bg1 = c.createGain();
          b1.type = "sine";
          b1.frequency.setValueAtTime(55, t);
          b1.frequency.exponentialRampToValueAtTime(28, t + 0.12);
          bg1.gain.setValueAtTime(0.0001, t);
          bg1.gain.exponentialRampToValueAtTime(v(0.12), t + 0.02);
          bg1.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          b1.connect(bg1);
          bg1.connect(out());
          b1.start(t);
          b1.stop(t + 0.2);
          // dub
          var t2 = t + 0.14;
          var b2 = c.createOscillator();
          var bg2 = c.createGain();
          b2.type = "triangle";
          b2.frequency.setValueAtTime(42, t2);
          b2.frequency.exponentialRampToValueAtTime(22, t2 + 0.15);
          bg2.gain.setValueAtTime(0.0001, t2);
          bg2.gain.exponentialRampToValueAtTime(v(0.09), t2 + 0.015);
          bg2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.2);
          b2.connect(bg2);
          bg2.connect(out());
          b2.start(t2);
          b2.stop(t2 + 0.22);
        })(i);
      }
      // 물속 노이즈
      playNoise({
        dur: Math.min(1.2, dur * 0.4),
        freq: 280,
        filter: "lowpass",
        vol: 0.035,
        q: 0.5,
      });
    } catch (e) {
      rumble(2);
    }
  }

  function stopAll() {
    level = 0;
    if (beatTimer) clearTimeout(beatTimer);
    beatTimer = null;
    stopDrone();
    stopPhase2Bgm(true);
    stopPhase3Bgm(true);
  }

  function setMaster(n) {
    // 1.0 = 기본(이미 크게 튜닝), 최대 2.0
    masterVol = Math.max(0, Math.min(2, n));
    if (master) master.gain.value = masterVol;
  }

  // ---- 이벤트 연동 ----
  document.addEventListener("haunt-diary", function (ev) {
    var d = (ev && ev.detail) || {};
    if (d.discovered) unlock();
    if (d.page === 0 && d.discovered) {
      pulse("soft");
      breath();
    } else if (d.page === 1) {
      pulse("mid");
      whisper();
    } else if (d.page >= 2) {
      pulse("heavy");
      hddScratch();
      setTimeout(function () {
        if (level < 2) setLevel(2);
      }, 200);
      // 오늘 페이지 → 곧 stage2 — 미리 버퍼 로드 + 시도
      setTimeout(function () {
        try {
          loadP2BgmBuffer();
        } catch (e) {}
        if (p2BgmReady()) startPhase2Bgm();
      }, 800);
    }
  });

  document.addEventListener("haunt-stage", function (ev) {
    var s = ev && ev.detail && ev.detail.stage;
    if (s === 1) {
      unlock();
      pulse("soft");
    } else if (s === 2) {
      unlock();
      sting("soft");
      setTimeout(function () {
        rumble(1.4);
      }, 100);
      setLevel(2, { force: true });
      // 제스처 직후가 아닐 수 있어 즉시 + 재시도
      startPhase2Bgm();
      preloadP3Bgm();
      setTimeout(function () {
        startPhase2Bgm();
      }, 400);
      setTimeout(function () {
        startPhase2Bgm();
      }, 1500);
    } else if (s >= 3) {
      unlock();
      dreadHit();
      setLevel(3, { force: true });
      setTimeout(breath, 400);
      // stage 3(dread) 도 아직 2페이즈 구간이면 BGM 유지
      if (p2BgmReady()) startPhase2Bgm();
      else stopPhase2Bgm(false);
    }
  });

  document.addEventListener("haunt-phase3", function () {
    try {
      killP2BgmHard();
    } catch (e) {
      stopPhase2Bgm(true);
    }
    // 즉시 + 재시도 (디코드/제스처 타이밍)
    startPhase3Bgm();
    setTimeout(function () {
      startPhase3Bgm();
    }, 200);
    setTimeout(function () {
      startPhase3Bgm();
    }, 700);
    setTimeout(function () {
      startPhase3Bgm();
    }, 1600);
  });

  document.addEventListener("haunt-mood", function (ev) {
    var m = ev && ev.detail && typeof ev.detail.mood === "number" ? ev.detail.mood : 0;
    if (m <= 1) {
      /* 일기 초반: 드론 없이 조용 */
      if (level > 0 && m === 0) setLevel(0);
    } else if (m === 2) setLevel(1);
    else if (m === 3) setLevel(2);
    else setLevel(3);
  });

  document.addEventListener("haunt-climax-phase", function (ev) {
    var p = ev && ev.detail && ev.detail.phase;
    unlock();
    if (p === 1) {
      setLevel(3, { force: true });
      staticBurst(300);
      rumble(1.6);
      termBeep(220);
    } else if (p === 2) {
      hddScratch();
      metal();
      termBeep(440);
    } else if (p === 3) {
      dreadHit();
      staticBurst(250);
      setTimeout(function () {
        sting("blood");
      }, 200);
    } else if (p === 4) {
      sting("neon");
      setTimeout(function () {
        sting("blood");
      }, 220);
      setTimeout(function () {
        termBeep(660);
      }, 100);
    } else if (p === 5) {
      rumble(2);
      pulse("heavy");
      termBeep(180);
    }
  });

  document.addEventListener("haunt-ending", function () {
    /* 엔딩 텍스트 끝난 뒤 — 여운 무음 유지 */
  });

  var mo = new MutationObserver(function () {
    if (document.body.classList.contains("is-haunting")) {
      unlock();
      setLevel(3, { force: true });
      stopPhase2Bgm(true);
      stopPhase3Bgm(true);
    }
    if (document.body.classList.contains("is-ending")) {
      stopAll();
    }
    if (document.body.classList.contains("phase-3-active")) {
      try {
        killP2BgmHard();
      } catch (e) {
        stopPhase2Bgm(true);
      }
      startPhase3Bgm();
    }
    if (
      document.body.classList.contains("phase-2-active") &&
      p2BgmReady() &&
      !p3BgmReady()
    ) {
      startPhase2Bgm();
    }
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // 첫 상호작용에서 unlock (오디오 정책)
  function gest() {
    unlock();
    // BGM은 매 제스처마다 재시도 (자동재생 차단 대비)
    if (p3BgmReady()) startPhase3Bgm();
    else if (p2BgmReady()) startPhase2Bgm();
  }
  document.addEventListener("pointerdown", gest, true);
  document.addEventListener("keydown", gest, true);

  // 페이즈 BGM 폴링
  setInterval(function () {
    syncPhase2Bgm();
    syncPhase3Bgm();
  }, 1500);

  window.__hauntAudio = {
    unlock: unlock,
    setLevel: setLevel,
    pulse: pulse,
    typeClick: typeClick,
    termBeep: termBeep,
    hddScratch: hddScratch,
    rumble: rumble,
    sting: sting,
    whisper: whisper,
    staticBurst: staticBurst,
    breath: breath,
    signalDrop: signalDrop,
    dreadHit: dreadHit,
    metal: metal,
    codeLaugh: codeLaugh,
    approachLaugh: approachLaugh,
    binauralWhisper: binauralWhisper,
    muffledHeartbeat: muffledHeartbeat,
    stopAll: stopAll,
    setMaster: setMaster,
    startPhase2Bgm: startPhase2Bgm,
    stopPhase2Bgm: stopPhase2Bgm,
    startPhase3Bgm: startPhase3Bgm,
    stopPhase3Bgm: stopPhase3Bgm,
    p2BgmStatus: function () {
      return {
        ready: p2BgmReady(),
        playing: p2BgmPlaying,
        useWA: p2BgmUseWA,
        src: p2BgmSrc(),
        err: p2BgmLastErr,
        vol: P2_BGM_VOL,
        elPaused: p2BgmEl ? p2BgmEl.paused : null,
        elVol: p2BgmEl ? p2BgmEl.volume : null,
      };
    },
    p3BgmStatus: function () {
      var el = p3BgmEl || document.getElementById("p3BgmTrack");
      return {
        ready: p3BgmReady(),
        playing: p3BgmPlaying,
        paused: el ? el.paused : null,
        currentTime: el ? el.currentTime : null,
        vol: el ? el.volume : P3_BGM_VOL,
        src: el ? el.currentSrc || el.src : p3BgmSrc(),
        err: p3BgmLastErr,
        readyState: el ? el.readyState : null,
      };
    },
  };

  // DOM 오디오 선연결
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      ensureP3BgmEl();
    });
  } else {
    ensureP3BgmEl();
  }
})();
