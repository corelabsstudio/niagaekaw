/**
 * 클라이맥스 스크린세이버 — 25초 고정 타임라인
 *  0–5s   방심: 평범한 스크린세이버
 *  5–12s  이상: 유휴·시선 감지 로그
 *  12–18s 압박: 붉은 화면 + 타이프라이터 대사
 *  18–25s 붕괴: 찢김·괴물·시스템 오버라이드 → 엔딩
 */
(function () {
  "use strict";

  var haunt = document.getElementById("haunt");
  if (!haunt) return;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 타이밍 (ms) — reduced 시 약간 압축
  var T = reduced
    ? { safe: 2800, anomaly: 4000, pressure: 3500, collapse: 4000 }
    : { safe: 5000, anomaly: 7000, pressure: 6000, collapse: 7000 };

  var phases = {
    1: document.getElementById("hauntP1"),
    2: document.getElementById("hauntP2"),
    3: document.getElementById("hauntP3"),
    4: document.getElementById("hauntP4"),
  };

  var ssClock = document.getElementById("ssClock");
  var ssClock2 = document.getElementById("ssClock2");
  var ssLog = document.getElementById("ssLog");
  var ssType1 = document.getElementById("ssType1");
  var ssType2 = document.getElementById("ssType2");
  var ssFinal = document.getElementById("ssFinal");
  var ssOverride = document.getElementById("ssOverride");
  var hauntTear = document.getElementById("hauntTear");
  var hauntMonster = document.getElementById("hauntMonster");

  var running = false;
  var phase = 0;
  var timers = [];
  var intervals = [];
  var complete = false;

  function clearAllTimers() {
    timers.forEach(function (t) {
      clearTimeout(t);
    });
    intervals.forEach(function (t) {
      clearInterval(t);
    });
    timers = [];
    intervals = [];
  }

  function later(ms, fn) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function every(ms, fn) {
    var id = setInterval(fn, ms);
    intervals.push(id);
    return id;
  }

  function audio() {
    return window.__hauntAudio || null;
  }

  function setPhase(n) {
    phase = n;
    haunt.setAttribute("data-climax-phase", String(n));
    document.body.setAttribute("data-climax-phase", String(n));
    for (var k = 1; k <= 4; k++) {
      var el = phases[k];
      if (!el) continue;
      var on = k === n;
      el.hidden = !on;
      el.classList.toggle("is-on", on);
    }
    haunt.className = "haunt climax-p" + n;
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[climax-seq] phase", n);
    }
    document.dispatchEvent(
      new CustomEvent("haunt-climax-phase", { detail: { phase: n } })
    );
  }

  function hideAllPhases() {
    for (var k = 1; k <= 4; k++) {
      if (phases[k]) {
        phases[k].hidden = true;
        phases[k].classList.remove("is-on");
      }
    }
  }

  function tickClocks() {
    function fmt() {
      var d = new Date();
      function p(n) {
        return (n < 10 ? "0" : "") + n;
      }
      return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    }
    if (ssClock) ssClock.textContent = fmt();
    if (ssClock2) ssClock2.textContent = fmt();
    every(1000, function () {
      if (phase > 2) return;
      if (ssClock) ssClock.textContent = fmt();
      if (ssClock2) ssClock2.textContent = fmt();
    });
  }

  function typeText(el, text, opts, done) {
    opts = opts || {};
    if (!el) {
      if (done) done();
      return;
    }
    el.textContent = "";
    el.classList.add("is-visible");
    if (reduced) {
      el.textContent = text;
      if (done) done();
      return;
    }
    var cps = opts.cps || 18;
    var i = 0;
    var a = audio();
    function step() {
      if (!running) return;
      if (i >= text.length) {
        if (done) done();
        return;
      }
      el.textContent += text.charAt(i);
      if (a && a.typeClick) {
        var ch = text.charAt(i);
        a.typeClick(
          ch === "." || ch === "?"
            ? "enter"
            : ch === " "
              ? "space"
              : opts.hard
                ? "hard"
                : "mid"
        );
      }
      i++;
      var base = 1000 / cps;
      var extra =
        text.charAt(i - 1) === "." || text.charAt(i - 1) === "?"
          ? 160
          : text.charAt(i - 1) === ","
            ? 60
            : 0;
      later(Math.max(16, base + (Math.random() * 30 - 10) + extra), step);
    }
    step();
  }

  function appendLog(line, cls) {
    if (!ssLog) return;
    var row = document.createElement("div");
    row.className = "ss-log-line" + (cls ? " " + cls : "");
    row.textContent = line;
    ssLog.appendChild(row);
    ssLog.scrollTop = ssLog.scrollHeight;
    var a = audio();
    if (a && a.termBeep) a.termBeep(cls === "warn" ? 180 : 420);
  }

  // ——— 0–5s 방심 ———
  function runSafe(next) {
    setPhase(1);
    document.title = "Stasis — screensaver";
    try {
      var ut = document.getElementById("fakeUrlText");
      if (ut) ut.textContent = "about:blank#screensaver";
    } catch (e) {}
    tickClocks();
    var a = audio();
    if (a) {
      if (a.unlock) a.unlock();
      if (a.setLevel) a.setLevel(0);
    }
    // 깜빡이며 진입
    haunt.classList.add("ss-blink-in");
    later(400, function () {
      haunt.classList.remove("ss-blink-in");
    });
    // 중간 미세 깜빡 (안심 깨기 직전 힌트)
    later(Math.floor(T.safe * 0.7), function () {
      if (phase !== 1) return;
      haunt.classList.add("ss-micro-glitch");
      later(120, function () {
        haunt.classList.remove("ss-micro-glitch");
      });
    });
    later(T.safe, next);
  }

  // ——— 5–12s 이상 징후 ———
  function runAnomaly(next) {
    setPhase(2);
    if (ssLog) ssLog.innerHTML = "";
    document.title = "Stasis — idle?";
    try {
      var ut = document.getElementById("fakeUrlText");
      if (ut) ut.textContent = "about:idle-sensor";
    } catch (e) {}
    var a = audio();
    if (a) {
      if (a.setLevel) a.setLevel(1);
      if (a.termBeep) a.termBeep(300);
    }
    // 로그 순차 출력
    later(600, function () {
      if (phase !== 2) return;
      appendLog(
        "[Idle state detected: 10 seconds without mouse movement...]",
        "info"
      );
    });
    later(2800, function () {
      if (phase !== 2) return;
      appendLog(
        "[Target is staring at the monitor. Tracking eye level...]",
        "warn"
      );
    });
    later(4800, function () {
      if (phase !== 2) return;
      appendLog("[Cursor velocity: 0.00 · pupil lock: TRUE]", "warn");
      if (a && a.whisper) a.whisper();
    });
    later(T.anomaly, next);
  }

  // ——— 12–18s 심리적 압박 ———
  function runPressure(next) {
    setPhase(3);
    document.title = "…watching you";
    try {
      var ut = document.getElementById("fakeUrlText");
      if (ut) ut.textContent = "about:you-are-watched";
    } catch (e) {}
    if (ssType1) {
      ssType1.textContent = "";
      ssType1.classList.remove("is-visible");
    }
    if (ssType2) {
      ssType2.textContent = "";
      ssType2.classList.remove("is-visible");
    }
    var a = audio();
    if (a) {
      if (a.setLevel) a.setLevel(2);
      if (a.rumble) a.rumble(1.2);
      if (a.sting) a.sting("blood");
    }
    // 타자기 대사 1
    typeText(
      ssType1,
      "마우스도 안 움직이고, 숨소리도 죽인 채로… 모니터 너머에서 내가 움직이는 걸 구경만 하니까 재밌어?",
      { cps: 16, hard: false },
      function () {
        later(400, function () {
          if (phase !== 3) return;
          typeText(
            ssType2,
            "너 지금 눈도 안 깜빡이고 있지?",
            { cps: 15, hard: true },
            null
          );
        });
      }
    );
    later(T.pressure, next);
  }

  // ——— 18–25s 붕괴 ———
  function runCollapse(next) {
    setPhase(4);
    document.title = "YOU CANNOT ESCAPE";
    try {
      var ut = document.getElementById("fakeUrlText");
      if (ut) ut.textContent = "SYSTEM_OVERRIDE";
    } catch (e) {}
    if (ssFinal) {
      ssFinal.textContent = "";
      ssFinal.classList.remove("is-visible");
    }
    if (ssOverride) ssOverride.classList.remove("is-on");

    var a = audio();
    if (a) {
      if (a.setLevel) a.setLevel(3);
      if (a.rumble) a.rumble(2.4);
      if (a.hddScratch) a.hddScratch();
      if (a.sting) a.sting("blood");
      if (a.staticBurst) a.staticBurst(400);
    }

    // 화면 찢김 + 괴물
    if (hauntTear) {
      hauntTear.hidden = false;
      hauntTear.classList.add("is-on");
    }
    if (hauntMonster) {
      hauntMonster.hidden = false;
      hauntMonster.classList.add("is-on");
    }
    haunt.classList.add("climax-shake-on", "ss-collapse-mode");

    typeText(
      ssFinal,
      "구경 끝났어. 이제 네가 이 화면 속으로 들어올 차례야.",
      { cps: 18, hard: true },
      function () {
        later(350, function () {
          if (phase !== 4) return;
          if (ssOverride) ssOverride.classList.add("is-on");
          if (a && a.termBeep) {
            a.termBeep(90);
            later(120, function () {
              if (a.termBeep) a.termBeep(60);
            });
          }
          if (a && a.rumble) a.rumble(2.8);
        });
      }
    );

    // 간헐 반전
    every(reduced ? 400 : 220, function () {
      if (phase !== 4) return;
      haunt.classList.toggle("climax-invert");
    });

    later(T.collapse, function () {
      haunt.classList.remove("climax-invert", "climax-shake-on", "ss-collapse-mode");
      if (hauntTear) {
        hauntTear.classList.remove("is-on");
        hauntTear.hidden = true;
      }
      if (hauntMonster) {
        hauntMonster.classList.remove("is-on");
        hauntMonster.hidden = true;
      }
      complete = true;
      next();
    });
  }

  function finishToEnding() {
    running = false;
    phase = 0;
    clearAllTimers();
    hideAllPhases();
    // 클라이맥스 오버레이 즉시 제거 → 암전 엔딩
    if (haunt) {
      haunt.hidden = true;
      haunt.setAttribute("aria-hidden", "true");
      haunt.className = "haunt";
      haunt.setAttribute("data-climax-phase", "0");
    }
    document.body.classList.remove("is-haunting");
    document.body.removeAttribute("data-climax-phase");
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
    phase = 0;
    clearAllTimers();
    hideAllPhases();

    if (haunt) {
      haunt.hidden = false;
      haunt.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("is-haunting");

    var chain = [runSafe, runAnomaly, runPressure, runCollapse];
    var i = 0;
    function step() {
      if (!running) return;
      if (i >= chain.length) {
        finishToEnding();
        return;
      }
      var fn = chain[i++];
      fn(step);
    }
    step();
  }

  function stopSequence() {
    clearAllTimers();
    running = false;
    if (haunt) {
      haunt.classList.remove(
        "climax-invert",
        "climax-shake-on",
        "ss-collapse-mode",
        "ss-blink-in",
        "ss-micro-glitch"
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
      return phase;
    },
    isRunning: function () {
      return running;
    },
  };

  // app.js / 트리거가 호출하는 진입점
  window.__hauntStartClimaxSequence = startSequence;

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log(
      "[climax-seq] 25s timeline ready · safe",
      T.safe,
      "anomaly",
      T.anomaly,
      "pressure",
      T.pressure,
      "collapse",
      T.collapse
    );
  }
})();
