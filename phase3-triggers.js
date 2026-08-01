/**
 * 3페이즈 → 클라이맥스 트리거
 * - 1페이즈(phase1-flash.js)·2페이즈(climax-triggers.js)와 동일한 방식: 후보 20곳 중 하나가
 *   랜덤으로 짧게(~1초) 반짝이다 사라지고, 다음 후보로 옮겨가며 반복. 반짝이는 순간 클릭하면
 *   클라이맥스가 발동.
 * - phase3Ready: __hauntPhase3Active (2페이즈 게이트 통과 후)
 * - 공개 빌드 (관리자 프리패스 없음)
 */
(function () {
  "use strict";

  function phase3Ready() {
    if (window.__hauntPhase3Active) return true;
    try {
      if (sessionStorage.getItem("haunt_phase3") === "1" && window.__hauntDiaryDiscovered) {
        window.__hauntPhase3Active = true;
        document.body.classList.add("phase-3-active");
        return true;
      }
    } catch (e) {}
    return false;
  }

  function busy() {
    return (
      document.body.classList.contains("is-haunting") ||
      document.body.classList.contains("is-ending") ||
      document.body.classList.contains("diary-open")
    );
  }

  function isMobileHaunt() {
    try {
      if (document.documentElement.classList.contains("is-mobile")) return true;
      if (document.documentElement.getAttribute("data-device") === "mobile") return true;
      var w = window.innerWidth || 1024;
      var coarse = false;
      try {
        coarse = window.matchMedia("(pointer: coarse)").matches;
      } catch (e0) {}
      return w <= 720 || (coarse && w <= 900);
    } catch (e) {
      return false;
    }
  }

  function summon() {
    if (typeof window.__hauntSummon === "function") {
      window.__hauntSummon();
      return true;
    }
    return false;
  }

  /** 클릭 가능 여부 (display:none·0크기 제외) */
  function isInteractable(el) {
    if (!el) return false;
    try {
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (parseFloat(cs.opacity) === 0) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function firstInteractable(cands) {
    for (var i = 0; i < cands.length; i++) {
      if (isInteractable(cands[i])) return cands[i];
    }
    return null;
  }

  /**
   * 3페이즈 후보 20곳 — 1·2페이즈와 동일한 방식의 리졸버 풀.
   * 매 뽑기마다 새로 resolve 하므로, 3페이즈 진행으로 바뀌는 UI(모니터 카드가
   * OVER 패널로 교체되는 등)도 항상 그 순간 보이는 요소로 자연스럽게 연결된다.
   */
  var RESOLVERS = [
    function () {
      return document.getElementById("topRec");
    },
    function () {
      return document.getElementById("navCta");
    },
    function () {
      return document.getElementById("planPro");
    },
    function () {
      return firstInteractable([
        document.querySelector("[data-find='docs']"),
        document.querySelector(".pill-dead"),
      ]);
    },
    function () {
      return firstInteractable([
        document.querySelector("[data-find='todo']"),
        document.querySelector(".pill-todo"),
      ]);
    },
    function () {
      return firstInteractable([
        document.querySelector(".stasis-monitor-card"),
        document.getElementById("p3AutopsyOver"),
        document.querySelector(".monitor-frame"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("eyebrow"),
        document.querySelector(".stasis-badge"),
        document.getElementById("mainTitle"),
      ]);
    },
    function () {
      return document.getElementById("mainTitle");
    },
    function () {
      return firstInteractable([
        document.querySelector("[data-find='wip']"),
        document.querySelector(".foot-beta"),
      ]);
    },
    function () {
      return firstInteractable([
        document.querySelector("[data-find='branch']"),
        document.querySelector(".foot-micro:not(.foot-beta)"),
      ]);
    },
    function () {
      return document.getElementById("fakeUrlBar");
    },
    function () {
      return firstInteractable([
        document.getElementById("planFree"),
        document.querySelector("[data-fake='2']"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("planTeam"),
        document.querySelector("[data-fake='3']"),
      ]);
    },
    function () {
      return document.getElementById("mainTitle");
    },
    function () {
      return firstInteractable([
        document.querySelector("[data-find='features']"),
        document.getElementById("h2log"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("cardWarn"),
        document.querySelector(".stasis-quote"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("cardWarn"),
        document.querySelector(".stasis-quote"),
        document.getElementById("mainTitle"),
      ]);
    },
    function () {
      return document.getElementById("clock");
    },
    function () {
      return document.getElementById("topRec");
    },
    function () {
      return document.getElementById("navCta");
    },
  ];

  var state = {
    timer: null,
    activeEl: null,
    running: false,
    flashCount: 0,
    lastIdx: -1,
  };

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function glowMs() {
    if (reduced) return isMobileHaunt() ? 1800 : 900;
    if (isMobileHaunt()) return 1000 + Math.random() * 1000; // 1~2s
    return 400 + Math.random() * 600; // 0.4~1s
  }

  function gapMs() {
    if (reduced) return 2800 + Math.random() * 2000;
    if (isMobileHaunt()) return 1400 + Math.random() * 2200;
    return 900 + Math.random() * 2200;
  }

  function blocked() {
    return !phase3Ready() || busy();
  }

  function markHot(el) {
    if (!el) return null;
    el.style.pointerEvents = "auto";
    el.style.cursor = "pointer";
    try {
      el.setAttribute("tabindex", "0");
    } catch (e0) {}
    return el;
  }

  function candidates() {
    var list = [];
    for (var i = 0; i < RESOLVERS.length; i++) {
      var el = RESOLVERS[i]();
      if (el) list.push(el);
    }
    return list;
  }

  function clearFlash() {
    if (state.activeEl) {
      state.activeEl.classList.remove(
        "p2-trig-hot",
        "p3-trig-hot",
        "find-flash",
        "find-flash-hit"
      );
      state.activeEl = null;
    }
  }

  function armFlash(el, idx) {
    clearFlash();
    if (!el || blocked()) return;
    markHot(el);
    el.classList.add("p2-trig-hot", "p3-trig-hot", "find-flash");
    state.activeEl = el;
    state.flashCount++;
    state.lastIdx = idx;
    var ms = glowMs();
    state.timer = setTimeout(function () {
      clearFlash();
      scheduleNext(gapMs());
    }, ms);
  }

  function pickAndFlash() {
    if (blocked()) {
      stop();
      return;
    }
    var pool = candidates();
    if (!pool.length) {
      scheduleNext(2000);
      return;
    }
    var idx = (Math.random() * pool.length) | 0;
    if (pool.length > 1 && idx === state.lastIdx) {
      idx = (idx + 1) % pool.length;
    }
    armFlash(pool[idx], idx);
  }

  function scheduleNext(ms) {
    if (state.timer) clearTimeout(state.timer);
    if (blocked()) return;
    state.timer = setTimeout(pickAndFlash, Math.max(80, ms | 0));
  }

  var fired = false;

  function onDone() {
    if (fired || busy()) return;
    if (!phase3Ready()) return;
    fired = true;
    stop();
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p3→climax] flash trigger clicked");
    }
    document.body.classList.add("phase3-climax-arm");
    setTimeout(function () {
      document.body.classList.remove("phase3-climax-arm");
      summon();
    }, 280);
  }

  function onPointer(ev) {
    if (blocked() || fired) return;
    var t = ev.target;
    if (!t || !t.closest) return;
    var el = t.closest(".find-flash");
    if (!el || el !== state.activeEl) return;
    ev.preventDefault();
    ev.stopPropagation();
    try {
      var a = window.__hauntAudio;
      if (a) {
        if (a.unlock) a.unlock();
        if (a.playSfx) a.playSfx("glitch", { vol: 0.65, minGapMs: 400 });
      }
    } catch (e0) {}
    onDone();
  }

  function start() {
    if (state.running || blocked() || fired) return;
    state.running = true;
    scheduleNext(600 + Math.random() * 900);
  }

  function stop() {
    state.running = false;
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    clearFlash();
  }

  function watchPhase3() {
    if (fired || blocked()) {
      stop();
    } else if (!state.running) {
      start();
    }
  }

  document.addEventListener("click", onPointer, true);
  document.addEventListener("pointerup", onPointer, true);

  function onPhase3Enter() {
    document.body.classList.add("phase-3-active");
    document.body.setAttribute("data-game-phase", "3");
    var p2ChipEl = document.getElementById("p2MissionChip");
    if (p2ChipEl) p2ChipEl.hidden = true;
    var p2ToastEl = document.getElementById("p2HintToast");
    if (p2ToastEl) p2ToastEl.hidden = true;
    var p3ToastEl = document.getElementById("p3HintToast");
    if (p3ToastEl) p3ToastEl.hidden = true;
    var p3ChipEl = document.getElementById("p3MissionChip");
    if (p3ChipEl) p3ChipEl.hidden = true;
    watchPhase3();
  }

  document.addEventListener("haunt-phase3", onPhase3Enter);

  // 이미 phase3 복구된 로드
  if (phase3Ready()) {
    setTimeout(onPhase3Enter, 400);
  }

  // 늦게 진입하는 경우/이벤트 놓친 경우 대비 폴링
  setInterval(watchPhase3, 2000);

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log("[p3-climax] flash-cycle trigger armed, pool size", RESOLVERS.length);
  }

  window.__hauntPhase3 = {
    ready: phase3Ready,
    status: function () {
      return {
        running: state.running,
        fired: fired,
        flashCount: state.flashCount,
        poolSize: candidates().length,
      };
    },
    flashNow: pickAndFlash,
    fire: function () {
      if (!phase3Ready()) {
        window.__hauntPhase3Active = true;
        document.body.classList.add("phase-3-active");
      }
      fired = false;
      onDone();
    },
  };
})();
