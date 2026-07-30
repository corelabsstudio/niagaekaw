/**
 * 클라이맥스 스크린세이버 — 60초 타임라인
 *  (climax_screensaver_60s_script.md)
 *
 *  0–15s   ACT A  가짜 정상 세이버
 *  15–30s  ACT B1 오염 시작
 *  30–45s  ACT B2 감염 가속
 *  45–55s  ACT C  몰아치기
 *  55–60s  ACT D  여운 → 엔딩 핸드오프
 *
 * 입력 배신: mousemove/keydown 해도 종료되지 않음
 */
(function () {
  "use strict";

  var haunt = document.getElementById("haunt");
  if (!haunt) return;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TOTAL_MS = reduced ? 32000 : 60000;

  // 구간 경계 (ms)
  var MARK = reduced
    ? { a: 0, b1: 7000, b2: 14000, c: 21000, d: 27000, end: 32000 }
    : { a: 0, b1: 15000, b2: 30000, c: 45000, d: 55000, end: 60000 };

  var FACE_POOL = [
    "assets/faces/face-1.jpg",
    "assets/faces/face-2.jpg",
    "assets/faces/face-3.jpg",
    "assets/faces/face-4.jpg",
    "assets/faces/face-5.jpg",
    "assets/faces/face-6.jpg",
    "assets/faces/face-7.jpg",
    "assets/faces/face-8.jpg",
    "assets/faces/face-9.jpg",
  ];

  var running = false;
  var complete = false;
  var act = ""; // a | b1 | b2 | c | d
  var t0 = 0;
  var raf = 0;
  var fired = {};
  var timers = [];
  var clockFrozen = false;
  var frozenClock = "03:33:00";
  var ghostFollowUntil = 0;
  var glitchStormUntil = 0;
  var inputGlitchBoost = 0;
  var whisperLoopOn = false;
  var whisperTimer = null;

  var el = {
    clock: document.getElementById("ssClock"),
    status: document.getElementById("ssStatus"),
    exitHint: document.getElementById("ssExitHint"),
    fail: document.getElementById("ssExitFail"),
    console: document.getElementById("ssConsoleLine"),
    logo: document.getElementById("ssFloatLogo"),
    ghostWeak: document.getElementById("ssGhostWeak"),
    ghostMed: document.getElementById("ssGhostMed"),
    ghostStrong: document.getElementById("ssGhostStrong"),
    debris: document.getElementById("ssDebris"),
    flashCopy: document.getElementById("ssFlashCopy"),
    afterglow: document.getElementById("ssAfterglow"),
    cursor: document.getElementById("ssFakeCursor"),
    scan: document.getElementById("ssScanlines"),
  };

  function later(ms, fn) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function (id) {
      clearTimeout(id);
    });
    timers = [];
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (whisperTimer) {
      clearInterval(whisperTimer);
      whisperTimer = null;
    }
  }

  function audio() {
    return window.__hauntAudio || null;
  }

  function elapsed() {
    return Math.max(0, performance.now() - t0);
  }

  function once(key, fn) {
    if (fired[key]) return;
    fired[key] = true;
    try {
      fn();
    } catch (e) {
      if (window.console && /[?&]debug=1/.test(location.search || "")) {
        console.warn("[climax]", key, e);
      }
    }
  }

  function faceSrc(i) {
    return FACE_POOL[i % FACE_POOL.length];
  }

  function setBgmVol(target, ms) {
    var a = audio();
    var node = document.getElementById("p3BgmTrack");
    if (!node) return;
    ms = ms == null ? 600 : ms;
    var from = typeof node.volume === "number" ? node.volume : 0;
    var steps = Math.max(6, Math.floor(ms / 40));
    var i = 0;
    var iv = setInterval(function () {
      i++;
      var t = Math.min(1, i / steps);
      try {
        node.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      } catch (e) {}
      if (i >= steps) clearInterval(iv);
    }, 40);
    // ensure playing
    try {
      if (a && a.startPhase3Bgm) a.startPhase3Bgm();
      else if (node.paused) node.play().catch(function () {});
    } catch (e2) {}
  }

  function sfx(key, vol, gap) {
    var a = audio();
    if (a && a.playSfx) {
      a.playSfx(key, { vol: vol, minGapMs: gap != null ? gap : 400 });
    }
  }

  function hardMuteAll() {
    whisperLoopOn = false;
    if (whisperTimer) {
      clearInterval(whisperTimer);
      whisperTimer = null;
    }
    var node = document.getElementById("p3BgmTrack");
    if (node) {
      try {
        node.pause();
        node.volume = 0;
      } catch (e) {}
    }
    var a = audio();
    if (a) {
      if (a.stopPhase3Bgm) a.stopPhase3Bgm(true);
      if (a.stopPhase2Bgm) a.stopPhase2Bgm(true);
    }
  }

  function startWhisperLoop(vol) {
    if (whisperLoopOn) return;
    whisperLoopOn = true;
    sfx("whisperTex", vol || 0.25, 0);
    whisperTimer = setInterval(function () {
      if (!whisperLoopOn || !running) return;
      sfx("whisperTex", vol || 0.25, 0);
    }, 2800);
  }

  function fmtClockLive() {
    var d = new Date();
    function p(n) {
      return (n < 10 ? "0" : "") + n;
    }
    return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function updateClock() {
    if (!el.clock) return;
    el.clock.textContent = clockFrozen ? frozenClock : fmtClockLive();
  }

  function showGhost(which, opts) {
    opts = opts || {};
    var g =
      which === "strong"
        ? el.ghostStrong
        : which === "med"
          ? el.ghostMed
          : el.ghostWeak;
    if (!g) return;
    var img = g.querySelector("img");
    if (img) {
      try {
        img.src = faceSrc(Math.floor(Math.random() * FACE_POOL.length));
      } catch (e) {}
    }
    g.className =
      "ss-ghost ss-ghost-" +
      which +
      (opts.pos ? " pos-" + opts.pos : "") +
      (opts.crop ? " is-crop" : "") +
      (opts.follow ? " is-follow" : "") +
      (opts.rush ? " is-rush" : "");
    if (opts.opacity != null) g.style.opacity = String(opts.opacity);
    else g.style.opacity = "";
    if (opts.scale != null) g.style.setProperty("--g-scale", String(opts.scale));
    else g.style.removeProperty("--g-scale");
    g.hidden = false;
    g.classList.add("is-on");
    var dur = opts.ms != null ? opts.ms : 800;
    later(dur, function () {
      if (!g) return;
      g.classList.remove("is-on", "is-rush", "is-follow", "is-crop");
      g.hidden = true;
      g.style.opacity = "";
    });
  }

  function flashCopy(text, ms) {
    if (!el.flashCopy) return;
    el.flashCopy.textContent = text;
    el.flashCopy.hidden = false;
    el.flashCopy.classList.add("is-on");
    later(ms || 400, function () {
      el.flashCopy.classList.remove("is-on");
      el.flashCopy.hidden = true;
    });
  }

  function setAct(name) {
    if (act === name) return;
    act = name;
    haunt.setAttribute("data-ss-act", name);
    document.body.setAttribute("data-ss-act", name);
    haunt.className = "haunt ss-act-" + name;
    var phaseNum =
      name === "a" ? 1 : name === "b1" ? 2 : name === "b2" ? 3 : name === "c" ? 4 : 5;
    document.body.setAttribute("data-climax-phase", String(phaseNum));
    document.dispatchEvent(
      new CustomEvent("haunt-climax-phase", { detail: { phase: phaseNum, act: name } })
    );
  }

  function showExitHint(show) {
    if (!el.exitHint) return;
    el.exitHint.hidden = !show;
    el.exitHint.classList.toggle("is-on", !!show);
  }

  function showFail(msg, ms) {
    if (!el.fail) return;
    el.fail.textContent = msg || "exit failed";
    el.fail.hidden = false;
    el.fail.classList.add("is-on");
    later(ms || 500, function () {
      el.fail.classList.remove("is-on");
      el.fail.hidden = true;
    });
  }

  function showConsole(msg, ms) {
    if (!el.console) return;
    el.console.textContent = msg;
    el.console.hidden = false;
    el.console.classList.add("is-on");
    later(ms || 1200, function () {
      el.console.classList.remove("is-on");
      el.console.hidden = true;
    });
  }

  function blinkCursor(show) {
    if (!el.cursor) return;
    el.cursor.hidden = !show;
    el.cursor.classList.toggle("is-on", !!show);
  }

  function setScan(on, strength) {
    if (!el.scan) return;
    el.scan.hidden = !on;
    el.scan.style.opacity = on ? String(strength != null ? strength : 0.05) : "0";
  }

  function setDebris(on) {
    if (!el.debris) return;
    el.debris.hidden = !on;
    el.debris.classList.toggle("is-on", !!on);
  }

  function rgbPulse() {
    haunt.classList.add("ss-rgb-split");
    later(150, function () {
      haunt.classList.remove("ss-rgb-split");
    });
  }

  /* —— 입력 배신 —— */
  function onKey(e) {
    if (!running) return;
    e.preventDefault();
    e.stopPropagation();
    var t = elapsed();
    // B1: Press any key → exit failed
    if (t >= MARK.b1 && t < MARK.b2) {
      showFail("exit failed", 500);
      sfx("glitch", 0.45, 300);
      return;
    }
    // B2: ESC
    if (t >= MARK.b2 && t < MARK.c) {
      if (e.key === "Escape") {
        showConsole("esc is not defined", 1400);
        sfx("glitch", 0.5, 200);
      } else {
        showFail("exit failed", 400);
      }
      return;
    }
    // C: 입력할수록 글리치
    if (t >= MARK.c && t < MARK.d) {
      inputGlitchBoost = Math.min(3000, inputGlitchBoost + 400);
      glitchStormUntil = performance.now() + 350;
      haunt.classList.add("ss-glitch-storm");
      later(360, function () {
        if (performance.now() > glitchStormUntil) {
          haunt.classList.remove("ss-glitch-storm");
        }
      });
      sfx("glitch", 0.55, 180);
      return;
    }
    // A: 옵션 실패 톤
    if (t < MARK.b1) {
      var a = audio();
      if (a && a.termBeep) a.termBeep(90);
    }
  }

  function onMove(e) {
    if (!running) return;
    var t = elapsed();
    // A: 커서 0.3s 보였다 사라짐
    if (t < MARK.b1 && el.cursor) {
      blinkCursor(true);
      if (e && e.clientX != null) {
        el.cursor.style.left = e.clientX + "px";
        el.cursor.style.top = e.clientY + "px";
      }
      later(300, function () {
        if (elapsed() < MARK.b1) blinkCursor(false);
      });
    }
    // B2: 격한 움직임 → 귀신이 커서 추적 0.4s
    if (t >= MARK.b2 && t < MARK.c) {
      var speed =
        (Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0)) || 0;
      if (speed > 18 || inputGlitchBoost > 0) {
        ghostFollowUntil = performance.now() + 400;
        if (el.ghostMed) {
          el.ghostMed.hidden = false;
          el.ghostMed.classList.add("is-on", "is-follow", "pos-follow");
          el.ghostMed.style.left = (e.clientX || 0) - 40 + "px";
          el.ghostMed.style.top = (e.clientY || 0) - 40 + "px";
          later(420, function () {
            if (performance.now() > ghostFollowUntil && el.ghostMed) {
              el.ghostMed.classList.remove("is-on", "is-follow");
              el.ghostMed.hidden = true;
            }
          });
        }
      }
    }
    // C: 입력 무시 대신 글리치
    if (t >= MARK.c && t < MARK.d) {
      inputGlitchBoost = Math.min(3000, inputGlitchBoost + 80);
    }
  }

  function onPointer(e) {
    if (!running) return;
    // 모바일 탭 = key 배신
    onKey({
      key: "Tap",
      preventDefault: function () {},
      stopPropagation: function () {},
    });
  }

  /* —— 타임라인 틱 —— */
  function tick() {
    if (!running) return;
    var t = elapsed();
    updateClock();

    // ACT 전환
    if (t >= MARK.d) setAct("d");
    else if (t >= MARK.c) setAct("c");
    else if (t >= MARK.b2) setAct("b2");
    else if (t >= MARK.b1) setAct("b1");
    else setAct("a");

    // ===== ACT A 0–15 =====
    if (t < MARK.b1) {
      once("a-init", function () {
        document.title = "Stasis — screensaver";
        clockFrozen = false;
        setScan(false);
        setDebris(false);
        showExitHint(false);
        if (el.status) el.status.textContent = "screen saver · idle";
        if (el.logo) {
          el.logo.hidden = false;
          el.logo.classList.add("is-on");
        }
        if (el.afterglow) {
          el.afterglow.hidden = true;
          el.afterglow.textContent = "";
        }
        setBgmVol(0.22, 800);
        // 거의 안 보이는 1프레임 글리치
        later(reduced ? 2000 : 9000, function () {
          if (elapsed() >= MARK.b1) return;
          haunt.classList.add("ss-micro-glitch");
          later(80, function () {
            haunt.classList.remove("ss-micro-glitch");
          });
        });
      });
    }

    // ===== ACT B1 15–30 =====
    if (t >= MARK.b1 && t < MARK.b2) {
      once("b1-init", function () {
        document.title = "Stasis — still running";
        clockFrozen = true;
        frozenClock = "03:33:00";
        updateClock();
        if (el.status) el.status.textContent = "still running";
        setScan(true, 0.05);
        setBgmVol(0.32, 900);
        showExitHint(true);
      });
      once("b1-glitch-18", function () {
        // ~0:18 absolute → relative 15+3
        later(3000, function () {
          if (elapsed() >= MARK.b2) return;
          sfx("glitch", 0.65, 200);
          haunt.classList.add("ss-micro-glitch");
          later(120, function () {
            haunt.classList.remove("ss-micro-glitch");
          });
        });
      });
      once("b1-whisper-22", function () {
        later(7000, function () {
          if (elapsed() >= MARK.b2) return;
          startWhisperLoop(0.25);
        });
      });
      once("b1-ghost-tl", function () {
        later(2000, function () {
          if (elapsed() >= MARK.b2) return;
          showGhost("weak", { pos: "tl", opacity: 0.18, ms: 800 });
        });
        later(9000, function () {
          if (elapsed() >= MARK.b2) return;
          showGhost("weak", { pos: "br", opacity: 0.18, ms: 600 });
        });
      });
    }

    // ===== ACT B2 30–45 =====
    if (t >= MARK.b2 && t < MARK.c) {
      once("b2-init", function () {
        document.title = "…still here";
        showExitHint(false);
        setDebris(true);
        if (el.status) el.status.textContent = "you closed the tab. i didn't.";
        setBgmVol(0.48, 1000);
        setScan(true, 0.12);
      });
      once("b2-ghost-pack", function () {
        // 0:31, 0:36, 0:41 relative to b2 start (0, 6s, 11s)
        later(1000, function () {
          if (elapsed() >= MARK.c) return;
          showGhost("med", { pos: "center", opacity: 0.35, ms: 1200 });
        });
        later(6000, function () {
          if (elapsed() >= MARK.c) return;
          showGhost("med", { pos: "left", opacity: 0.45, crop: true, ms: 900 });
        });
        later(11000, function () {
          if (elapsed() >= MARK.c) return;
          showGhost("med", { pos: "right", opacity: 0.4, ms: 1000 });
          haunt.classList.add("ss-slice-glitch");
          later(1000, function () {
            haunt.classList.remove("ss-slice-glitch");
          });
        });
      });
      once("b2-sfx", function () {
        later(3000, function () {
          if (elapsed() >= MARK.c) return;
          sfx("sob", 0.62, 500);
        });
        later(10000, function () {
          if (elapsed() >= MARK.c) return;
          sfx("wail", 0.45, 800);
        });
      });
      once("b2-rgb", function () {
        later(4000, rgbPulse);
        later(7000, rgbPulse);
        later(11000, rgbPulse);
      });
    }

    // ===== ACT C 45–55 =====
    if (t >= MARK.c && t < MARK.d) {
      once("c-init", function () {
        document.title = "WAKE";
        setDebris(false);
        if (el.logo) el.logo.classList.add("is-collapse");
        if (el.status) el.status.textContent = "";
        setBgmVol(0.72, 500);
        setScan(true, 0.22);
        sfx("glitch", 0.75, 100);
        sfx("laugh", 0.7, 100);
        // STRONG rush
        if (el.ghostStrong) {
          var img = el.ghostStrong.querySelector("img");
          if (img) img.src = faceSrc(3);
          el.ghostStrong.hidden = false;
          el.ghostStrong.classList.add("is-on", "is-rush", "pos-center");
          el.ghostStrong.style.setProperty("--g-scale", "0.6");
          later(50, function () {
            el.ghostStrong.style.setProperty("--g-scale", "1.1");
          });
        }
      });
      once("c-black", function () {
        later(3000, function () {
          if (elapsed() >= MARK.d) return;
          haunt.classList.add("ss-blackout");
          setBgmVol(0.2, 200);
          later(250, function () {
            haunt.classList.remove("ss-blackout");
            setBgmVol(0.72, 200);
            sfx("wail", 0.85, 100);
            // layers: weak/med/strong residual
            showGhost("weak", { pos: "tl", opacity: 0.3, ms: 1400 });
            showGhost("med", { pos: "br", opacity: 0.5, ms: 1400 });
            if (el.ghostStrong) {
              el.ghostStrong.hidden = false;
              el.ghostStrong.classList.add("is-on", "pos-center");
              el.ghostStrong.style.opacity = "0.85";
              el.ghostStrong.style.setProperty("--g-scale", "1.15");
            }
          });
        });
      });
      once("c-storm", function () {
        later(7000, function () {
          if (elapsed() >= MARK.d) return;
          haunt.classList.add("ss-glitch-storm", "climax-shake-on");
          sfx("laugh", 0.6, 200);
          flashCopy("abandoned ≠ dead", 400);
          later(500, function () {
            flashCopy("WAKE", 400);
          });
          later(1000, function () {
            flashCopy("again", 400);
          });
        });
      });
    }

    // ===== ACT D 55–60 =====
    if (t >= MARK.d) {
      once("d-init", function () {
        hardMuteAll();
        haunt.classList.remove(
          "ss-glitch-storm",
          "climax-shake-on",
          "ss-rgb-split",
          "ss-slice-glitch"
        );
        haunt.classList.add("ss-void");
        setScan(false);
        setDebris(false);
        showExitHint(false);
        ["ghostWeak", "ghostMed", "ghostStrong"].forEach(function (k) {
          if (el[k]) {
            el[k].hidden = true;
            el[k].classList.remove("is-on");
          }
        });
        if (el.logo) el.logo.hidden = true;
        if (el.status) el.status.textContent = "";
        if (el.clock) el.clock.textContent = "";
        // 1.5s pure black then cursor
        later(1500, function () {
          if (!running) return;
          if (el.afterglow) {
            el.afterglow.hidden = false;
            el.afterglow.classList.add("is-cursor");
            el.afterglow.textContent = "_";
          }
          var a = audio();
          if (a && a.termBeep) a.termBeep(120);
        });
        later(3000, function () {
          if (!running) return;
          if (el.afterglow) {
            el.afterglow.classList.remove("is-cursor");
            el.afterglow.classList.add("is-line");
            el.afterglow.textContent =
              Math.random() > 0.5
                ? "niagaekaw.site"
                : "you can leave. process remains.";
          }
        });
      });
    }

    if (t >= MARK.end) {
      finishToEnding();
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  function finishToEnding() {
    running = false;
    complete = true;
    clearTimers();
    hardMuteAll();
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("pointerdown", onPointer, true);
    if (haunt) {
      haunt.hidden = true;
      haunt.setAttribute("aria-hidden", "true");
      haunt.className = "haunt";
      haunt.setAttribute("data-climax-phase", "0");
      haunt.removeAttribute("data-ss-act");
    }
    document.body.classList.remove("is-haunting");
    document.body.removeAttribute("data-climax-phase");
    document.body.removeAttribute("data-ss-act");
    if (typeof window.__hauntGoToEnding === "function") {
      window.__hauntGoToEnding();
    } else if (typeof window.__hauntStartEnding === "function") {
      window.__hauntStartEnding();
    }
  }

  function startSequence() {
    if (running) return;
    running = true;
    complete = false;
    fired = {};
    clockFrozen = false;
    act = "";
    inputGlitchBoost = 0;
    clearTimers();

    if (haunt) {
      haunt.hidden = false;
      haunt.setAttribute("aria-hidden", "false");
      haunt.className = "haunt ss-act-a";
    }
    document.body.classList.add("is-haunting");

    // preload faces on ghost imgs
    [el.ghostWeak, el.ghostMed, el.ghostStrong].forEach(function (g, i) {
      if (!g) return;
      var img = g.querySelector("img");
      if (img) img.src = faceSrc(i * 3);
      g.hidden = true;
    });

    var a = audio();
    if (a) {
      if (a.unlock) a.unlock();
      if (a.startPhase3Bgm) a.startPhase3Bgm();
    }
    setBgmVol(0.22, 400);

    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("pointerdown", onPointer, true);

    t0 = performance.now();
    setAct("a");
    raf = requestAnimationFrame(tick);

    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[climax-seq] 60s screensaver timeline start", MARK);
    }
  }

  function stopSequence() {
    running = false;
    clearTimers();
    hardMuteAll();
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("pointerdown", onPointer, true);
    if (haunt) {
      haunt.classList.remove(
        "ss-glitch-storm",
        "climax-shake-on",
        "ss-rgb-split",
        "ss-void",
        "ss-blackout",
        "ss-micro-glitch",
        "ss-slice-glitch"
      );
    }
  }

  window.__hauntClimaxSequence = {
    start: startSequence,
    stop: stopSequence,
    isComplete: function () {
      return complete;
    },
    phase: function () {
      return act === "a"
        ? 1
        : act === "b1"
          ? 2
          : act === "b2"
            ? 3
            : act === "c"
              ? 4
              : act === "d"
                ? 5
                : 0;
    },
    isRunning: function () {
      return running;
    },
    elapsed: function () {
      return running ? elapsed() : 0;
    },
  };

  window.__hauntStartClimaxSequence = startSequence;

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log("[climax-seq] 60s screensaver script loaded");
  }
})();
