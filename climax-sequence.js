/**
 * 클라이맥스 스크린세이버 — 60초 3막 상태머신
 *
 *  0–15s   ACT A  가짜 정상 (귀신 없음)
 *  15–30s  ACT B1 오염 — WEAK + exit failed
 *  30–45s  ACT B2 감염 — MEDIUM + esc / 커서 추적
 *  45–55s  ACT C  몰아치기 — STRONG 돌진
 *  55–60s  ACT D  하드 컷 무음 여운 → 엔딩 핸드오프
 *
 * 입력으로 세이버가 종료되지 않음. WakeAgain hard CTA 없음.
 * 로컬 단독 재생: ?ss=1 또는 ?climax=1 (+ 클릭으로 오디오 unlock)
 */
(function () {
  "use strict";

  var haunt = document.getElementById("haunt");
  if (!haunt) return;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TOTAL_MS = reduced ? 32000 : 60000;
  var MARK = reduced
    ? { a: 0, b1: 7000, b2: 14000, c: 21000, d: 27000, end: 32000 }
    : { a: 0, b1: 15000, b2: 30000, c: 45000, d: 55000, end: 60000 };

  /* 고정 실사 귀신 3장 (preload 필수) */
  var GHOST = {
    weak: "assets/horror/ghost_weak_phase2.png",
    med: "assets/horror/ghost_medium_phase3.png",
    strong: "assets/horror/ghost_strong_climax.png",
  };

  var running = false;
  var complete = false;
  var act = "";
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
  var lastPtr = { x: 0, y: 0, t: 0 };
  var moveAccum = 0;
  var moveWindowStart = 0;
  var preloaded = false;

  var el = {
    clock: document.getElementById("ssClock"),
    status: document.getElementById("ssStatus"),
    process: document.querySelector(".ss-process"),
    exitHint: document.getElementById("ssExitHint"),
    fail: document.getElementById("ssExitFail"),
    console: document.getElementById("ssConsoleLine"),
    logo: document.getElementById("ssFloatLogo"),
    ghostWeak: document.getElementById("ssGhostWeak"),
    ghostMed: document.getElementById("ssGhostMed"),
    ghostStrong: document.getElementById("ssGhostStrong"),
    ghostStrongTrail: document.getElementById("ssGhostStrongTrail"),
    debris: document.getElementById("ssDebris"),
    flashCopy: document.getElementById("ssFlashCopy"),
    afterglow: document.getElementById("ssAfterglow"),
    cursor: document.getElementById("ssFakeCursor"),
    scan: document.getElementById("ssScanlines"),
    escBtn: document.getElementById("ssEscBtn"),
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

  function safeImgSrc(img, src) {
    if (!img || !src) return;
    try {
      img.src = src;
      img.onerror = function () {
        if (window.console) {
          console.error("[climax] image 404:", src);
        }
      };
    } catch (e) {
      if (window.console) console.error("[climax] image set failed", e);
    }
  }

  function preloadGhosts() {
    if (preloaded) return;
    preloaded = true;
    ["weak", "med", "strong"].forEach(function (k) {
      try {
        var im = new Image();
        im.onerror = function () {
          if (window.console) console.error("[climax] preload 404:", GHOST[k]);
        };
        im.src = GHOST[k];
      } catch (e) {}
    });
    if (el.ghostWeak) {
      safeImgSrc(el.ghostWeak.querySelector("img"), GHOST.weak);
    }
    if (el.ghostMed) {
      safeImgSrc(el.ghostMed.querySelector("img"), GHOST.med);
    }
    if (el.ghostStrong) {
      safeImgSrc(el.ghostStrong.querySelector("img"), GHOST.strong);
    }
    if (el.ghostStrongTrail) {
      safeImgSrc(el.ghostStrongTrail.querySelector("img"), GHOST.strong);
    }
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
    try {
      if (a && a.startPhase3Bgm) a.startPhase3Bgm();
      else if (node.paused) node.play().catch(function () {});
    } catch (e2) {}
  }

  function sfx(key, vol, gap) {
    try {
      var a = audio();
      if (a && a.playSfx) {
        a.playSfx(key, { vol: vol, minGapMs: gap != null ? gap : 400 });
      }
    } catch (e) {
      if (window.console) console.error("[climax] sfx failed", key, e);
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
        node.currentTime = 0;
        node.volume = 0;
      } catch (e) {}
    }
    var a = audio();
    if (a) {
      try {
        if (a.stopPhase3Bgm) a.stopPhase3Bgm(true);
        if (a.stopPhase2Bgm) a.stopPhase2Bgm(true);
      } catch (e2) {}
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
    if (clockFrozen) {
      el.clock.textContent = frozenClock;
    } else if (act === "a" || !act) {
      /* 가짜 정상: 12:00:00 형태로 보이되 초는 흐르게 */
      var d = new Date();
      var s = d.getSeconds();
      function p(n) {
        return (n < 10 ? "0" : "") + n;
      }
      el.clock.textContent = "12:00:" + p(s);
    } else {
      el.clock.textContent = fmtClockLive();
    }
  }

  function hideGhost(g) {
    if (!g) return;
    g.classList.remove("is-on", "is-rush", "is-follow", "is-crop", "is-fade");
    g.hidden = true;
    g.style.opacity = "";
    g.style.left = "";
    g.style.top = "";
    g.style.removeProperty("--g-scale");
  }

  /**
   * which: weak | med | strong | strongTrail
   * opts: pos, opacity, ms, scale, rush, follow, x, y, crop
   */
  function showGhost(which, opts) {
    opts = opts || {};
    if (reduced && which === "strong" && opts.rush) {
      /* reduced-motion: 돌진 대신 페이드 */
      opts.rush = false;
      opts.ms = opts.ms || 900;
    }

    var g =
      which === "strongTrail"
        ? el.ghostStrongTrail || el.ghostStrong
        : which === "strong"
          ? el.ghostStrong
          : which === "med"
            ? el.ghostMed
            : el.ghostWeak;
    if (!g) return;

    var img = g.querySelector("img");
    var src =
      which === "strong" || which === "strongTrail"
        ? GHOST.strong
        : which === "med"
          ? GHOST.med
          : GHOST.weak;
    safeImgSrc(img, src);

    var baseClass =
      which === "strongTrail"
        ? "ss-ghost ss-ghost-strong ss-ghost-trail"
        : "ss-ghost ss-ghost-" +
          (which === "strong" ? "strong" : which === "med" ? "med" : "weak");

    g.className =
      baseClass +
      (opts.pos ? " pos-" + opts.pos : "") +
      (opts.crop ? " is-crop" : "") +
      (opts.follow ? " is-follow" : "") +
      (opts.rush ? " is-rush" : "") +
      (opts.fade !== false ? " is-fade" : "");

    if (opts.opacity != null) g.style.opacity = String(opts.opacity);
    else g.style.opacity = "";

    if (opts.scale != null) g.style.setProperty("--g-scale", String(opts.scale));
    else g.style.removeProperty("--g-scale");

    if (opts.x != null && opts.y != null) {
      g.style.left = Math.max(0, opts.x - 48) + "px";
      g.style.top = Math.max(0, opts.y - 48) + "px";
      g.classList.add("is-follow", "pos-follow");
    }

    g.hidden = false;
    /* reflow for CSS transition */
    void g.offsetWidth;
    g.classList.add("is-on");

    if (opts.rush && !reduced) {
      g.style.setProperty("--g-scale", "0.6");
      later(40, function () {
        if (!g || g.hidden) return;
        g.style.setProperty("--g-scale", String(opts.scaleEnd != null ? opts.scaleEnd : 1.1));
      });
    }

    var dur = opts.ms != null ? opts.ms : which === "weak" ? 650 : which === "med" ? 1000 : 1200;
    later(dur, function () {
      if (!g) return;
      g.classList.remove("is-on", "is-rush");
      later(reduced ? 0 : 280, function () {
        if (!g.classList.contains("is-on")) hideGhost(g);
      });
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
      new CustomEvent("haunt-climax-phase", {
        detail: { phase: phaseNum, act: name },
      })
    );
  }

  function showExitHint(show) {
    if (!el.exitHint) return;
    el.exitHint.hidden = !show;
    el.exitHint.classList.toggle("is-on", !!show);
    if (show) el.exitHint.textContent = "Press any key to exit";
  }

  function showFail(msg, ms) {
    if (!el.fail) return;
    el.fail.textContent = msg || "exit failed";
    el.fail.hidden = false;
    el.fail.classList.add("is-on");
    /* 0.5–0.8s */
    later(ms != null ? ms : 650, function () {
      el.fail.classList.remove("is-on");
      el.fail.hidden = true;
    });
  }

  function showConsole(msg, ms) {
    if (!el.console) return;
    el.console.textContent = msg;
    el.console.hidden = false;
    el.console.classList.add("is-on");
    later(ms != null ? ms : 800, function () {
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

  function setEscBtn(on) {
    if (!el.escBtn) return;
    el.escBtn.hidden = !on;
    el.escBtn.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function rgbPulse() {
    if (reduced) return;
    haunt.classList.add("ss-rgb-split");
    later(150, function () {
      haunt.classList.remove("ss-rgb-split");
    });
  }

  function randomCorner() {
    return Math.random() > 0.5 ? "tl" : "br";
  }

  /* —— 입력 배신 (세이버 종료 금지) —— */
  function betrayExit() {
    showFail("exit failed", 500 + Math.floor(Math.random() * 300));
    sfx("glitch", 0.45, 300);
  }

  function betrayEsc() {
    showConsole("esc is not defined", 800);
    sfx("glitch", 0.5, 200);
  }

  function spawnCursorGhost(x, y) {
    var t = elapsed();
    /* 현재 단계 귀신, 최소 WEAK, 0.4s */
    var which = t >= MARK.b2 ? "med" : "weak";
    if (t < MARK.b1) which = "weak";
    showGhost(which, {
      follow: true,
      x: x,
      y: y,
      opacity: which === "med" ? 0.4 : 0.22,
      ms: 400,
      fade: true,
    });
  }

  function onKey(e) {
    if (!running) return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    var t = elapsed();
    var key = e && e.key;

    /* ACT D: 입력 무시 (무음 여운 유지) */
    if (t >= MARK.d) return;

    /* ESC 배신 — B2부터 */
    if (key === "Escape" && t >= MARK.b2 && t < MARK.d) {
      betrayEsc();
      if (t >= MARK.c) {
        inputGlitchBoost = Math.min(3000, inputGlitchBoost + 400);
        glitchStormUntil = performance.now() + 350;
        if (!reduced) haunt.classList.add("ss-glitch-storm");
        later(360, function () {
          if (performance.now() > glitchStormUntil) {
            haunt.classList.remove("ss-glitch-storm");
          }
        });
      }
      return;
    }

    /* B1+ : any key → exit failed (세이버 유지) */
    if (t >= MARK.b1 && t < MARK.c) {
      betrayExit();
      return;
    }

    /* C: 입력해도 종료 안 됨, 글리치만 증가 */
    if (t >= MARK.c && t < MARK.d) {
      inputGlitchBoost = Math.min(3000, inputGlitchBoost + 400);
      glitchStormUntil = performance.now() + 350;
      if (!reduced) haunt.classList.add("ss-glitch-storm");
      later(360, function () {
        if (performance.now() > glitchStormUntil) {
          haunt.classList.remove("ss-glitch-storm");
        }
      });
      sfx("glitch", 0.55, 180);
      return;
    }

    /* A: 미세 비프만 */
    if (t < MARK.b1) {
      var a = audio();
      if (a && a.termBeep) a.termBeep(90);
    }
  }

  function onMove(e) {
    if (!running) return;
    var t = elapsed();
    var cx = e.clientX != null ? e.clientX : 0;
    var cy = e.clientY != null ? e.clientY : 0;
    var now = performance.now();

    /* 이동량 누적 (빠른 흔들기) */
    var dx = Math.abs(cx - lastPtr.x);
    var dy = Math.abs(cy - lastPtr.y);
    var speed = Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
    if (!speed) speed = dx + dy;

    if (!moveWindowStart || now - moveWindowStart > 280) {
      moveWindowStart = now;
      moveAccum = 0;
    }
    moveAccum += speed;
    lastPtr = { x: cx, y: cy, t: now };

    /* A: 가짜 커서 0.3s */
    if (t < MARK.b1 && el.cursor) {
      blinkCursor(true);
      el.cursor.style.left = cx + "px";
      el.cursor.style.top = cy + "px";
      later(300, function () {
        if (elapsed() < MARK.b1) blinkCursor(false);
      });
    }

    /* B2+: 빠른 이동 → 커서 쪽 귀신 0.4s */
    if (t >= MARK.b2 && t < MARK.d) {
      if (speed > 18 || moveAccum > 90) {
        if (performance.now() > ghostFollowUntil - 50) {
          ghostFollowUntil = performance.now() + 400;
          spawnCursorGhost(cx, cy);
        }
      }
    }

    if (t >= MARK.c && t < MARK.d) {
      inputGlitchBoost = Math.min(3000, inputGlitchBoost + 40);
    }
  }

  function onPointer(e) {
    if (!running) return;
    /* 모바일 터치 = key 배신과 동일 */
    onKey({
      key: "Tap",
      preventDefault: function () {},
      stopPropagation: function () {},
    });
  }

  function onEscBtn(e) {
    if (!running) return;
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    onKey({
      key: "Escape",
      preventDefault: function () {},
      stopPropagation: function () {},
    });
  }

  /* —— 타임라인 틱 —— */
  function tick() {
    if (!running) return;
    var t = elapsed();
    updateClock();

    if (t >= MARK.d) setAct("d");
    else if (t >= MARK.c) setAct("c");
    else if (t >= MARK.b2) setAct("b2");
    else if (t >= MARK.b1) setAct("b1");
    else setAct("a");

    /* ===== ACT A 0–15 가짜 정상 ===== */
    if (t < MARK.b1) {
      once("a-init", function () {
        document.title = "Stasis — screensaver";
        clockFrozen = false;
        setScan(false);
        setDebris(false);
        showExitHint(false);
        setEscBtn(false);
        if (el.status) el.status.textContent = "screen saver · idle";
        if (el.process) el.process.textContent = "process: idle";
        if (el.logo) {
          el.logo.hidden = false;
          el.logo.classList.add("is-on");
          el.logo.classList.remove("is-collapse");
        }
        if (el.afterglow) {
          el.afterglow.hidden = true;
          el.afterglow.textContent = "";
          el.afterglow.classList.remove("is-cursor", "is-line");
        }
        hideGhost(el.ghostWeak);
        hideGhost(el.ghostMed);
        hideGhost(el.ghostStrong);
        hideGhost(el.ghostStrongTrail);
        setBgmVol(0.22, 800);
        /* 거의 안 보이는 1프레임 — 귀신 아님 */
        if (!reduced) {
          later(9000, function () {
            if (elapsed() >= MARK.b1) return;
            haunt.classList.add("ss-micro-glitch");
            later(80, function () {
              haunt.classList.remove("ss-micro-glitch");
            });
          });
        }
      });
    }

    /* ===== ACT B1 15–30 오염 ===== */
    if (t >= MARK.b1 && t < MARK.b2) {
      once("b1-init", function () {
        document.title = "Stasis — still running";
        clockFrozen = true;
        frozenClock = "03:33:00";
        updateClock();
        if (el.status) el.status.textContent = "still running";
        if (el.process) el.process.textContent = "still running";
        setScan(true, reduced ? 0.03 : 0.05);
        setBgmVol(0.32, 900);
        showExitHint(true);
        setEscBtn(false);
      });

      /* ~0:18 glitch stinger */
      once("b1-glitch-18", function () {
        later(3000, function () {
          if (elapsed() >= MARK.b2) return;
          sfx("glitch", 0.65, 200);
          if (!reduced) {
            haunt.classList.add("ss-micro-glitch");
            later(120, function () {
              haunt.classList.remove("ss-micro-glitch");
            });
          }
        });
      });

      /* ~0:22 whisper */
      once("b1-whisper-22", function () {
        later(7000, function () {
          if (elapsed() >= MARK.b2) return;
          startWhisperLoop(0.25);
        });
      });

      /* WEAK 2회 — 구석, 0.5~0.8s, opacity 0.15~0.25 */
      once("b1-ghost-tl", function () {
        later(2000, function () {
          if (elapsed() >= MARK.b2) return;
          showGhost("weak", {
            pos: randomCorner(),
            opacity: 0.15 + Math.random() * 0.1,
            ms: 500 + Math.floor(Math.random() * 300),
          });
        });
        later(9000, function () {
          if (elapsed() >= MARK.b2) return;
          showGhost("weak", {
            pos: randomCorner(),
            opacity: 0.15 + Math.random() * 0.1,
            ms: 500 + Math.floor(Math.random() * 300),
          });
        });
      });
    }

    /* ===== ACT B2 30–45 감염 ===== */
    if (t >= MARK.b2 && t < MARK.c) {
      once("b2-init", function () {
        document.title = "…still here";
        showExitHint(false);
        setEscBtn(true);
        setDebris(true);
        if (el.status) el.status.textContent = "you closed the tab. i didn't.";
        if (el.process) el.process.textContent = "you closed the tab. i didn't.";
        setBgmVol(0.48, 1000);
        setScan(true, reduced ? 0.06 : 0.12);
      });

      /* MEDIUM 2~4초 간격, opacity 0.35~0.5, 0.9~1.2s */
      once("b2-ghost-pack", function () {
        var gaps = [1000, 3500, 7000, 11000];
        var poses = ["center", "left", "right", "center"];
        gaps.forEach(function (gMs, i) {
          later(gMs, function () {
            if (elapsed() >= MARK.c) return;
            showGhost("med", {
              pos: poses[i],
              opacity: 0.35 + Math.random() * 0.15,
              crop: i === 1,
              ms: 900 + Math.floor(Math.random() * 300),
            });
            if (i === 3 && !reduced) {
              haunt.classList.add("ss-slice-glitch");
              later(1000, function () {
                haunt.classList.remove("ss-slice-glitch");
              });
            }
          });
        });
      });

      /* 0:33 sob, 0:40 wail */
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

      /* RGB 글리치 3회 */
      once("b2-rgb", function () {
        later(4000, rgbPulse);
        later(7000, rgbPulse);
        later(11000, rgbPulse);
      });
    }

    /* ===== ACT C 45–55 몰아치기 ===== */
    if (t >= MARK.c && t < MARK.d) {
      once("c-init", function () {
        document.title = "…";
        setDebris(false);
        setEscBtn(false);
        if (el.logo) el.logo.classList.add("is-collapse");
        if (el.status) el.status.textContent = "";
        if (el.process) el.process.textContent = "";
        setBgmVol(0.72, 500);
        setScan(true, reduced ? 0.1 : 0.22);
        /* 0:45 glitch + evil laugh */
        sfx("glitch", 0.75, 100);
        sfx("laugh", 0.7, 100);
        /* STRONG 돌진 scale 0.6→1.1, opacity 0.8~1.0, 1.0~1.5s */
        showGhost("strong", {
          pos: "center",
          opacity: 0.8 + Math.random() * 0.2,
          rush: !reduced,
          scaleEnd: 1.1,
          ms: reduced ? 900 : 1200 + Math.floor(Math.random() * 300),
        });
        /* 잔상 레이어 1 */
        if (!reduced) {
          later(120, function () {
            if (elapsed() >= MARK.d) return;
            showGhost("strongTrail", {
              pos: "center",
              opacity: 0.35,
              rush: true,
              scaleEnd: 1.05,
              ms: 900,
            });
          });
        }
      });

      /* 0:48 블랙 0.25s 후 재등장 + wail full */
      once("c-black", function () {
        later(3000, function () {
          if (elapsed() >= MARK.d) return;
          haunt.classList.add("ss-blackout");
          setBgmVol(0.2, 200);
          later(250, function () {
            haunt.classList.remove("ss-blackout");
            setBgmVol(0.72, 200);
            sfx("wail", 0.9, 100);
            /* WEAK/MEDIUM 잔상 + STRONG (최대 2 레이어 잔상 유지) */
            showGhost("weak", {
              pos: "tl",
              opacity: 0.28,
              ms: 1400,
            });
            showGhost("med", {
              pos: "br",
              opacity: 0.48,
              ms: 1400,
            });
            showGhost("strong", {
              pos: "center",
              opacity: 0.9,
              rush: !reduced,
              scaleEnd: 1.12,
              ms: 1300,
            });
          });
        });
      });

      /* 0:52 플래시 카피 — hard CTA 금지, 허용 문구만 */
      once("c-storm", function () {
        later(7000, function () {
          if (elapsed() >= MARK.d) return;
          if (!reduced) {
            haunt.classList.add("ss-glitch-storm", "climax-shake-on");
          }
          sfx("laugh", 0.55, 200);
          flashCopy("abandoned ≠ dead", 400);
          later(1200, function () {
            haunt.classList.remove("ss-glitch-storm", "climax-shake-on");
          });
        });
      });
    }

    /* ===== ACT D 55–60 여운 ===== */
    if (t >= MARK.d) {
      once("d-init", function () {
        hardMuteAll();
        haunt.classList.remove(
          "ss-glitch-storm",
          "climax-shake-on",
          "ss-rgb-split",
          "ss-slice-glitch",
          "ss-blackout"
        );
        haunt.classList.add("ss-void");
        setScan(false);
        setDebris(false);
        showExitHint(false);
        setEscBtn(false);
        hideGhost(el.ghostWeak);
        hideGhost(el.ghostMed);
        hideGhost(el.ghostStrong);
        hideGhost(el.ghostStrongTrail);
        if (el.logo) el.logo.hidden = true;
        if (el.status) el.status.textContent = "";
        if (el.process) el.process.textContent = "";
        if (el.clock) el.clock.textContent = "";

        /* 완전 블랙 1.2~1.5s */
        var blackMs = reduced ? 800 : 1200 + Math.floor(Math.random() * 300);
        later(blackMs, function () {
          if (!running) return;
          if (el.afterglow) {
            el.afterglow.hidden = false;
            el.afterglow.classList.add("is-cursor");
            el.afterglow.classList.remove("is-line");
            el.afterglow.textContent = "_";
          }
        });
        later(blackMs + 1600, function () {
          if (!running) return;
          if (el.afterglow) {
            el.afterglow.classList.remove("is-cursor");
            el.afterglow.classList.add("is-line");
            el.afterglow.textContent =
              Math.random() > 0.45
                ? "you can leave. process remains."
                : "niagaekaw.site";
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
    detachInput();
    if (haunt) {
      haunt.hidden = true;
      haunt.setAttribute("aria-hidden", "true");
      haunt.className = "haunt";
      haunt.setAttribute("data-climax-phase", "0");
      haunt.removeAttribute("data-ss-act");
    }
    document.body.classList.remove("is-haunting", "ss-preview");
    document.body.removeAttribute("data-climax-phase");
    document.body.removeAttribute("data-ss-act");

    /* 로컬 프리뷰 모드면 엔딩 대신 오버레이만 정리 */
    if (window.__hauntSsPreviewOnly) {
      if (window.console) console.log("[climax-seq] preview complete");
      return;
    }

    if (typeof window.__hauntGoToEnding === "function") {
      window.__hauntGoToEnding();
    } else if (typeof window.__hauntStartEnding === "function") {
      window.__hauntStartEnding();
    }
  }

  function attachInput() {
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("touchstart", onPointer, { capture: true, passive: false });
    if (el.escBtn) {
      el.escBtn.addEventListener("click", onEscBtn, true);
      el.escBtn.addEventListener("pointerdown", onEscBtn, true);
    }
  }

  function detachInput() {
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("pointerdown", onPointer, true);
    document.removeEventListener("touchstart", onPointer, true);
    if (el.escBtn) {
      el.escBtn.removeEventListener("click", onEscBtn, true);
      el.escBtn.removeEventListener("pointerdown", onEscBtn, true);
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
    moveAccum = 0;
    clearTimers();
    preloadGhosts();

    if (haunt) {
      haunt.hidden = false;
      haunt.setAttribute("aria-hidden", "false");
      haunt.className = "haunt ss-act-a";
    }
    document.body.classList.add("is-haunting");

    [el.ghostWeak, el.ghostMed, el.ghostStrong, el.ghostStrongTrail].forEach(
      function (g) {
        hideGhost(g);
      }
    );

    var a = audio();
    try {
      if (a) {
        if (a.unlock) a.unlock();
        if (a.startPhase3Bgm) a.startPhase3Bgm();
      }
    } catch (e) {
      if (window.console) console.error("[climax] audio unlock failed", e);
    }
    setBgmVol(0.22, 400);

    attachInput();
    t0 = performance.now();
    setAct("a");
    raf = requestAnimationFrame(tick);

    if (window.console && /[?&](debug|ss|climax)=1/.test(location.search || "")) {
      console.log("[climax-seq] 60s screensaver start", MARK, reduced ? "(reduced)" : "");
    }
  }

  function stopSequence() {
    running = false;
    clearTimers();
    hardMuteAll();
    detachInput();
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
    preload: preloadGhosts,
  };

  window.__hauntStartClimaxSequence = startSequence;

  /* 로컬/단독 재생: ?ss=1 | ?climax=1 */
  function maybePreview() {
    var q = location.search || "";
    if (!/[?&](ss|climax)=1/.test(q)) return;
    window.__hauntSsPreviewOnly = true;
    document.body.classList.add("ss-preview");
    preloadGhosts();

    var bar = document.createElement("div");
    bar.id = "ssPreviewBar";
    bar.className = "ss-preview-bar";
    bar.innerHTML =
      '<button type="button" id="ssPreviewStart">▶ 클라이맥스 60s 재생</button>' +
      '<span class="ss-preview-note">클릭 후 오디오 unlock · ?ss=1</span>';
    document.body.appendChild(bar);

    var btn = document.getElementById("ssPreviewStart");
    if (btn) {
      btn.addEventListener("click", function () {
        bar.classList.add("is-hidden");
        var a = audio();
        if (a && a.unlock) a.unlock();
        startSequence();
      });
    }
    if (window.console) {
      console.log("[climax-seq] preview mode — click button to start");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybePreview);
  } else {
    maybePreview();
  }

  /* 페이지 로드 시 귀신 3장 선로드 (404만 로그) */
  if (document.readyState === "complete") {
    preloadGhosts();
  } else {
    window.addEventListener("load", preloadGhosts);
  }

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log("[climax-seq] 60s screensaver script loaded");
  }
})();
