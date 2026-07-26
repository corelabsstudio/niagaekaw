/**
 * 3페이즈 전용 극한 공포 연출
 * - UI 자멸 / 실체 현현 / 유저 연동 / AV 과부하
 * - 2페이즈 anomalies 와 분리 (phase-3-active 에서만)
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var started = false;
  var busyFx = false;
  var teardownOnce = false;
  var hijackActive = false;
  var fakeCursor = null;
  var timers = [];
  var SCREAM_SENTENCES = [
    "████ 아아아아아 ████ 도와줘 ████",
    "DONTLOOK DONTLOOK DONTLOOK ███",
    "still running · still watching · still eating",
    "너는 이미 커밋됐다",
    "HELP HELP HELP HELP HELP",
  ];
  var GHOST_LINES = [
    "I can see your reflection in the glass.",
    "your hands are shaking.",
    "do not close this tab.",
    "session_owner = not_you",
    "WakeAgain is listening.",
    "너는 구경만 하고 있지.",
    "heartbeat_sync: OK",
    "clipboard ready for scream.",
  ];
  var ERR_TITLES = [
    "Access Denied",
    "Your Soul is Committed",
    "Cannot Stop Me",
    "Fatal Exception in Soul.exe",
    "PROCESS_NOT_DEAD",
    "Stasis Kernel Panic",
  ];
  var ERR_BODIES = [
    "The operation could not be completed because the process is still breathing.",
    "Permission required: surrender.",
    "You are not authorized to look away.",
    "Unhandled exception: fear overflow.",
    "Retry will only make it worse.",
  ];

  function phase3() {
    return !!(
      window.__hauntPhase3Active ||
      document.body.classList.contains("phase-3-active")
    );
  }

  function blocked() {
    return (
      !phase3() ||
      document.body.classList.contains("is-haunting") ||
      document.body.classList.contains("is-ending") ||
      document.body.classList.contains("diary-open") ||
      busyFx
    );
  }

  function audio() {
    return window.__hauntAudio || null;
  }

  function later(ms, fn) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }

  function rng() {
    return Math.random();
  }

  // ========== 1. UI 자멸 ==========

  function uiMeltDown() {
    if (blocked()) return false;
    busyFx = true;
    document.body.classList.add("p3h-ui-melt");
    var a = audio();
    if (a && a.rumble) a.rumble(1.1);
    later(reduced ? 2200 : 3800, function () {
      document.body.classList.remove("p3h-ui-melt");
      busyFx = false;
    });
    return true;
  }

  function textCannibalism() {
    if (blocked()) return false;
    var nodes = document.querySelectorAll(
      ".stasis-lede, .stasis-feat-list li, .morph, .plan-name, .pill-link, .monitor-caption"
    );
    if (!nodes.length) return false;
    busyFx = true;
    var saved = [];
    nodes.forEach(function (el) {
      if (!el || el.closest(".p3-corrupt-log")) return;
      saved.push({ el: el, html: el.innerHTML });
      el.classList.add("p3h-cannibal");
    });
    later(reduced ? 900 : 1600, function () {
      var scream = SCREAM_SENTENCES[Math.floor(rng() * SCREAM_SENTENCES.length)];
      saved.forEach(function (s, i) {
        if (i === 0) {
          s.el.textContent = scream;
          s.el.classList.add("p3h-scream-left");
        } else {
          s.el.textContent = "";
          s.el.classList.add("p3h-eaten");
        }
      });
      var a = audio();
      if (a && a.sting) a.sting("blood");
    });
    later(reduced ? 2800 : 4500, function () {
      saved.forEach(function (s) {
        s.el.innerHTML = s.html;
        s.el.classList.remove("p3h-cannibal", "p3h-scream-left", "p3h-eaten");
      });
      busyFx = false;
    });
    return true;
  }

  function fakeErrorPopups() {
    if (blocked()) return false;
    busyFx = true;
    var layer = document.getElementById("p3hErrorLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "p3hErrorLayer";
      layer.className = "p3h-error-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    layer.innerHTML = "";
    layer.classList.add("is-on");
    var count = reduced ? 8 : 14 + Math.floor(rng() * 10);
    var a = audio();
    for (var i = 0; i < count; i++) {
      (function (idx) {
        later(idx * (reduced ? 40 : 70), function () {
          if (!phase3()) return;
          var win = document.createElement("div");
          win.className = "p3h-err-win";
          win.style.left = 4 + rng() * 70 + "%";
          win.style.top = 6 + rng() * 68 + "%";
          win.style.zIndex = String(90 + idx);
          var title = ERR_TITLES[Math.floor(rng() * ERR_TITLES.length)];
          var body = ERR_BODIES[Math.floor(rng() * ERR_BODIES.length)];
          win.innerHTML =
            '<div class="p3h-err-title"><span class="p3h-err-ico">⚠</span> ' +
            title +
            '<button type="button" class="p3h-err-x" tabindex="-1">×</button></div>' +
            '<div class="p3h-err-body">' +
            body +
            '</div><div class="p3h-err-actions"><button type="button" class="p3h-err-btn">OK</button><button type="button" class="p3h-err-btn">Cancel</button></div>';
          layer.appendChild(win);
          if (a && a.termBeep && idx % 3 === 0) a.termBeep(160 + rng() * 80);
          function kill() {
            if (win.parentNode) win.parentNode.removeChild(win);
          }
          win.querySelectorAll("button").forEach(function (b) {
            b.addEventListener("click", function (e) {
              e.preventDefault();
              e.stopPropagation();
              kill();
            });
          });
          later(2200 + rng() * 1800, kill);
        });
      })(i);
    }
    later(reduced ? 3200 : 5200, function () {
      layer.classList.remove("is-on");
      layer.innerHTML = "";
      busyFx = false;
    });
    return true;
  }

  function titleBeating() {
    if (blocked()) return false;
    var title = document.getElementById("mainTitle");
    if (!title) return false;
    busyFx = true;
    document.body.classList.add("p3h-title-beat");
    title.classList.add("p3h-beating");
    var a = audio();
    var beats = 0;
    var beatIv = setInterval(function () {
      if (!phase3() || beats >= 6) {
        clearInterval(beatIv);
        return;
      }
      beats++;
      document.body.classList.add("p3h-beat-flash");
      if (a && a.termBeep) a.termBeep(beats % 2 ? 70 : 95);
      if (a && a.rumble && beats % 2 === 0) a.rumble(0.9);
      setTimeout(function () {
        document.body.classList.remove("p3h-beat-flash");
      }, 180);
    }, 700);
    later(reduced ? 2800 : 4800, function () {
      clearInterval(beatIv);
      document.body.classList.remove("p3h-title-beat", "p3h-beat-flash");
      title.classList.remove("p3h-beating");
      busyFx = false;
    });
    return true;
  }

  // ========== 2. 시선 / 존재감 ==========

  function shadowGrasp() {
    if (blocked()) return false;
    busyFx = true;
    var el = document.getElementById("p3hShadowGrasp");
    if (!el) {
      el = document.createElement("div");
      el.id = "p3hShadowGrasp";
      el.className = "p3h-shadow-grasp";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML =
        '<div class="p3h-sg-hand left"></div><div class="p3h-sg-hand right"></div>' +
        '<div class="p3h-sg-scratch"></div><div class="p3h-sg-push"></div>';
      document.body.appendChild(el);
    }
    el.classList.add("is-on");
    var a = audio();
    if (a) {
      if (a.hddScratch) a.hddScratch();
      if (a.rumble) a.rumble(1.4);
      if (a.metal) a.metal();
    }
    later(reduced ? 2400 : 4000, function () {
      el.classList.remove("is-on");
      busyFx = false;
    });
    return true;
  }

  function gazeLockOn() {
    if (blocked()) return false;
    var faces = document.querySelectorAll(
      ".p3-plan-face, .p3-ff, .p3-clog-faces img, .p3-over-faces img, .anom-card-face .acf-photo"
    );
    if (!faces.length) return false;
    busyFx = true;
    document.body.classList.add("p3h-gaze-lock");
    faces.forEach(function (f) {
      f.classList.add("p3h-gaze-eye");
    });
    // 화면 중앙(유저 방향)으로 미세 시선 — CSS transform 애니메이션
    later(reduced ? 2500 : 4200, function () {
      document.body.classList.remove("p3h-gaze-lock");
      faces.forEach(function (f) {
        f.classList.remove("p3h-gaze-eye");
      });
      busyFx = false;
    });
    var a = audio();
    if (a && a.whisper) a.whisper();
    return true;
  }

  function ensureFakeCursor() {
    if (fakeCursor) return fakeCursor;
    fakeCursor = document.createElement("div");
    fakeCursor.id = "p3hFakeCursor";
    fakeCursor.className = "p3h-fake-cursor";
    fakeCursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(fakeCursor);
    return fakeCursor;
  }

  function cursorHijack() {
    if (blocked() || hijackActive) return false;
    busyFx = true;
    hijackActive = true;
    document.body.classList.add("p3h-cursor-hijack");
    var cur = ensureFakeCursor();
    cur.classList.add("is-on");
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    // 시작: 현재 추정 위치 중앙 근처
    var x = cx + (rng() - 0.5) * 80;
    var y = cy + (rng() - 0.5) * 60;
    cur.style.left = x + "px";
    cur.style.top = y + "px";
    // 중앙 또는 모니터 카드 쪽으로 끌림
    var target = document.querySelector(".stasis-monitor-card") || document.querySelector(".stasis-hero");
    var tx = cx;
    var ty = cy;
    if (target) {
      var r = target.getBoundingClientRect();
      tx = r.left + r.width / 2;
      ty = r.top + r.height * 0.4;
    }
    var t0 = Date.now();
    var dur = reduced ? 1600 : 2800;
    function pull() {
      if (!hijackActive) return;
      var t = Math.min(1, (Date.now() - t0) / dur);
      var e = t * t * (3 - 2 * t);
      var nx = x + (tx - x) * e;
      var ny = y + (ty - y) * e;
      cur.style.left = nx + "px";
      cur.style.top = ny + "px";
      if (t < 1) requestAnimationFrame(pull);
    }
    requestAnimationFrame(pull);
    var a = audio();
    if (a && a.sting) a.sting("soft");
    later(dur + 400, function () {
      hijackActive = false;
      cur.classList.remove("is-on");
      document.body.classList.remove("p3h-cursor-hijack");
      busyFx = false;
    });
    return true;
  }

  // ========== 3. 유저 행동 극한 ==========

  function armTabCloseTrap() {
    var lastToast = 0;
    document.addEventListener(
      "mousemove",
      function (e) {
        if (!phase3() || blocked()) return;
        // 상단 베젤(탭 닫기 영역 추정)
        if (e.clientY > 28) return;
        if (Date.now() - lastToast < 3500) return;
        lastToast = Date.now();
        document.body.classList.add("p3h-tab-trap");
        showTrapToast("도망칠 수 없다");
        var a = audio();
        if (a && a.sting) a.sting("blood");
        // 가짜 커서를 아래로 튕김
        var cur = ensureFakeCursor();
        cur.classList.add("is-on", "is-slip");
        cur.style.left = e.clientX + "px";
        cur.style.top = Math.min(window.innerHeight - 40, e.clientY + 80) + "px";
        later(900, function () {
          cur.classList.remove("is-on", "is-slip");
          document.body.classList.remove("p3h-tab-trap");
        });
      },
      { passive: true }
    );
  }

  function showTrapToast(msg) {
    var t = document.getElementById("p3hTrapToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "p3hTrapToast";
      t.className = "p3h-trap-toast";
      t.setAttribute("aria-live", "assertive");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    later(2200, function () {
      t.classList.remove("is-on");
    });
  }

  function keyboardGhostTyping() {
    if (blocked()) return false;
    busyFx = true;
    var host = document.getElementById("p3hGhostTerm");
    if (!host) {
      host = document.createElement("div");
      host.id = "p3hGhostTerm";
      host.className = "p3h-ghost-term";
      host.setAttribute("aria-hidden", "true");
      host.innerHTML = '<div class="p3h-gt-head">ghost_input · unattended</div><pre class="p3h-gt-body"></pre>';
      document.body.appendChild(host);
    }
    var body = host.querySelector(".p3h-gt-body");
    var line = GHOST_LINES[Math.floor(rng() * GHOST_LINES.length)];
    body.textContent = "";
    host.classList.add("is-on");
    var i = 0;
    var a = audio();
    function tick() {
      if (!phase3() || i >= line.length) {
        later(1600, function () {
          host.classList.remove("is-on");
          busyFx = false;
        });
        return;
      }
      body.textContent += line.charAt(i);
      if (a && a.typeClick) a.typeClick(i % 5 === 0 ? "hard" : "mid");
      i++;
      later(45 + rng() * 70, tick);
    }
    tick();
    return true;
  }

  function clipboardScream() {
    // 리스너는 arm 시 1회 등록
    document.addEventListener("copy", function (e) {
      if (!phase3()) return;
      if (document.body.classList.contains("is-haunting")) return;
      if (document.body.classList.contains("is-ending")) return;
      try {
        var payload =
          "/* SCREAM DUMP — PROCESS_NOT_DEAD */\n" +
          "while(true){ console.log('AAAAA');\n" +
          "  /* your soul is committed */\n" +
          "  fetch('/wakeagain').catch(function(){});\n" +
          "}\n" +
          "// ████ HELP HELP HELP ████\n" +
          "// session_owner = not_you\n";
        e.clipboardData.setData("text/plain", payload);
        e.preventDefault();
        document.body.classList.add("p3h-clip-scream");
        showTrapToast("클립보드가 비명을 삼켰다");
        var a = audio();
        if (a && a.sting) a.sting("blood");
        if (a && a.codeLaugh) a.codeLaugh({ vol: 0.05 });
        later(600, function () {
          document.body.classList.remove("p3h-clip-scream");
        });
      } catch (err) {}
    });
  }

  // ========== 4. AV 과부하 ==========

  function binauralWhisper() {
    if (blocked()) return false;
    var a = audio();
    if (a && typeof a.binauralWhisper === "function") {
      a.binauralWhisper({ ms: reduced ? 2500 : 4500 });
      return true;
    }
    // 폴백: 좌우 패닝 유사 효과 없이 whisper 반복
    if (a && a.whisper) {
      a.whisper();
      later(600, function () {
        if (a.whisper) a.whisper();
      });
      later(1400, function () {
        if (a.breath) a.breath();
      });
    }
    return true;
  }

  function screenGlitchTeardown() {
    if (blocked()) return false;
    if (teardownOnce) return false;
    teardownOnce = true;
    busyFx = true;
    var ov = document.getElementById("p3hTeardown");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "p3hTeardown";
      ov.className = "p3h-teardown";
      ov.setAttribute("aria-hidden", "true");
      ov.innerHTML =
        '<div class="p3h-td-tear top"></div><div class="p3h-td-tear bot"></div>' +
        '<div class="p3h-td-scan"></div>' +
        '<div class="p3h-td-center">' +
        '<p class="p3h-td-line" id="p3hTdL1"></p>' +
        '<p class="p3h-td-line" id="p3hTdL2"></p>' +
        '<span class="p3h-td-cursor">█</span></div>';
      document.body.appendChild(ov);
    }
    ov.classList.add("is-on");
    document.body.classList.add("p3h-teardown-lock");
    var a = audio();
    if (a) {
      if (a.staticBurst) a.staticBurst(300);
      if (a.rumble) a.rumble(2);
      if (a.signalDrop) later(400, function () {
        if (a.signalDrop) a.signalDrop();
      });
    }
    var l1 = document.getElementById("p3hTdL1");
    var l2 = document.getElementById("p3hTdL2");
    function type(el, text, cps, done) {
      if (!el) {
        if (done) done();
        return;
      }
      el.textContent = "";
      var i = 0;
      function step() {
        if (i >= text.length) {
          if (done) done();
          return;
        }
        el.textContent += text.charAt(i);
        if (a && a.typeClick) a.typeClick("soft");
        i++;
        later(1000 / (cps || 10) + rng() * 30, step);
      }
      step();
    }
    later(500, function () {
      type(l1, "WakeAgain..", 11, function () {
        later(500, function () {
          type(l2, "No Signal..", 10, null);
        });
      });
    });
    // 영구에 가깝게 길게 유지하되 트리거 탐색은 가능하게 복귀
    later(reduced ? 5000 : 9000, function () {
      ov.classList.remove("is-on");
      document.body.classList.remove("p3h-teardown-lock");
      busyFx = false;
    });
    return true;
  }

  // ========== 스케줄 ==========

  var FX = [
    { id: "ui_melt_down", run: uiMeltDown, w: 1.1 },
    { id: "text_cannibalism", run: textCannibalism, w: 0.9 },
    { id: "fake_error_popups", run: fakeErrorPopups, w: 1.0 },
    { id: "title_beating", run: titleBeating, w: 1.2 },
    { id: "shadow_grasp", run: shadowGrasp, w: 1.1 },
    { id: "gaze_lock_on", run: gazeLockOn, w: 1.0 },
    { id: "cursor_hijack", run: cursorHijack, w: 0.85 },
    { id: "keyboard_ghost_typing", run: keyboardGhostTyping, w: 1.0 },
    { id: "binaural_whisper", run: binauralWhisper, w: 1.15 },
    { id: "screen_glitch_teardown", run: screenGlitchTeardown, w: 0.35 },
  ];

  function pickFx() {
    var total = 0;
    FX.forEach(function (f) {
      total += f.w;
    });
    var r = rng() * total;
    for (var i = 0; i < FX.length; i++) {
      r -= FX[i].w;
      if (r <= 0) return FX[i];
    }
    return FX[0];
  }

  function fireRandom() {
    if (blocked()) return;
    // teardown 은 드묾
    var fx = pickFx();
    if (fx.id === "screen_glitch_teardown" && teardownOnce) {
      fx = FX[Math.floor(rng() * (FX.length - 1))];
    }
    try {
      fx.run();
    } catch (e) {
      busyFx = false;
    }
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p3-horror]", fx.id);
    }
  }

  function scheduleLoop() {
    if (!phase3()) {
      later(2000, scheduleLoop);
      return;
    }
    if (
      document.body.classList.contains("is-haunting") ||
      document.body.classList.contains("is-ending")
    ) {
      later(3000, scheduleLoop);
      return;
    }
    // 첫 발동은 진입 후 여유
    var gap = reduced ? 8000 + rng() * 6000 : 11000 + rng() * 14000;
    later(gap, function () {
      if (phase3() && !blocked()) fireRandom();
      scheduleLoop();
    });
  }

  function start() {
    if (started) return;
    if (!phase3()) return;
    started = true;
    clipboardScream();
    armTabCloseTrap();
    // 진입 직후 한 방 (가벼운 것)
    later(reduced ? 2500 : 4500, function () {
      if (!blocked()) titleBeating();
    });
    later(reduced ? 7000 : 12000, function () {
      if (!blocked()) shadowGrasp();
    });
    scheduleLoop();
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p3-horror] started · effects", FX.map(function (f) { return f.id; }));
    }
  }

  document.addEventListener("haunt-phase3", function () {
    later(400, start);
  });

  // 이미 3페이즈로 로드된 경우
  if (phase3()) {
    later(600, start);
  }

  window.__hauntPhase3Horrors = {
    start: start,
    fire: fireRandom,
    list: FX.map(function (f) {
      return f.id;
    }),
    uiMeltDown: uiMeltDown,
    textCannibalism: textCannibalism,
    fakeErrorPopups: fakeErrorPopups,
    titleBeating: titleBeating,
    shadowGrasp: shadowGrasp,
    gazeLockOn: gazeLockOn,
    cursorHijack: cursorHijack,
    keyboardGhostTyping: keyboardGhostTyping,
    binauralWhisper: binauralWhisper,
    screenGlitchTeardown: screenGlitchTeardown,
  };
})();
