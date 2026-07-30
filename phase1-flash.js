/**
 * Phase1 → Phase2 진입 재미 게이트
 * - 페이지上 모든 [data-find] 트리거를 대상으로
 * - 랜덤 하나가 짧게 빛남 → 그 순간 클릭하면 일기 오픈(2페이즈 입구)
 * - PC: 0.4~1.0s · 모바일: 1.0~2.0s
 * - 숨겨진 기존 경로(로고 연타 등)는 diary.js 가 그대로 유지
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    timer: null,
    activeEl: null,
    running: false,
    flashCount: 0,
    lastId: "",
  };

  function isMobile() {
    try {
      if (window.matchMedia && window.matchMedia("(max-width: 720px)").matches) {
        return true;
      }
    } catch (e0) {}
    try {
      return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "");
    } catch (e1) {
      return false;
    }
  }

  function discovered() {
    if (typeof window.__hauntDiaryIsDiscovered === "function") {
      return !!window.__hauntDiaryIsDiscovered();
    }
    return !!(
      window.__hauntDiaryDiscovered ||
      document.body.classList.contains("diary-found") ||
      document.body.classList.contains("phase-2-active")
    );
  }

  function blocked() {
    var b = document.body;
    return (
      discovered() ||
      b.classList.contains("diary-open") ||
      b.classList.contains("phase-2-active") ||
      b.classList.contains("phase-3-active") ||
      b.classList.contains("is-haunting") ||
      b.classList.contains("is-ending") ||
      window.__hauntPhase3Active === true
    );
  }

  function glowMs() {
    if (reduced) return isMobile() ? 1800 : 900;
    if (isMobile()) return 1000 + Math.random() * 1000; // 1~2s
    return 400 + Math.random() * 600; // 0.4~1s
  }

  function gapMs() {
    if (reduced) return 2800 + Math.random() * 2000;
    if (isMobile()) return 1400 + Math.random() * 2200;
    return 900 + Math.random() * 2200;
  }

  function candidates() {
    var list = [];
    var nodes = document.querySelectorAll("[data-find]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // 보이지 않는 레이어/완전 숨김은 제외하되, diary-path-off 는 플래시 때 잠시 살림
      var st = window.getComputedStyle ? getComputedStyle(el) : null;
      if (st && st.display === "none" && !el.classList.contains("diary-path-off")) {
        continue;
      }
      if (st && st.visibility === "hidden" && !el.classList.contains("diary-path-off")) {
        continue;
      }
      list.push(el);
    }
    return list;
  }

  function clearFlash() {
    if (state.activeEl) {
      var el = state.activeEl;
      el.classList.remove("find-flash", "find-flash-hit");
      // 플래시용으로 살렸던 숨김 요소 복구
      if (el.getAttribute("data-flash-was-off") === "1") {
        el.classList.add("diary-path-off");
        el.setAttribute("aria-hidden", "true");
        if (el.tagName === "BUTTON") el.disabled = true;
        el.removeAttribute("data-flash-was-off");
      }
      if (el.getAttribute("data-flash-was-inert") === "1") {
        el.style.pointerEvents = el.getAttribute("data-flash-pe") || "";
        el.removeAttribute("data-flash-was-inert");
        el.removeAttribute("data-flash-pe");
      }
      state.activeEl = null;
    }
  }

  function armFlash(el) {
    clearFlash();
    if (!el || blocked()) return;

    // 숨김 트리거(nav/chip/footer 등)도 잠깐 보이게
    if (el.classList.contains("diary-path-off")) {
      el.setAttribute("data-flash-was-off", "1");
      el.classList.remove("diary-path-off");
      el.removeAttribute("aria-hidden");
      if (el.tagName === "BUTTON") el.disabled = false;
    }

    // 클릭 가능 보장
    var pe = el.style.pointerEvents;
    if (pe === "none") {
      el.setAttribute("data-flash-was-inert", "1");
      el.setAttribute("data-flash-pe", pe);
      el.style.pointerEvents = "auto";
    }

    el.classList.add("find-flash");
    state.activeEl = el;
    state.flashCount++;
    state.lastId = el.getAttribute("data-find") || "";

    // 살짝 스크롤 유도 없이 화면 밖이면 스킵하고 다음으로
    try {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var vw = window.innerWidth || 400;
      var visible =
        r.width > 2 &&
        r.height > 2 &&
        r.bottom > 8 &&
        r.top < vh - 8 &&
        r.right > 8 &&
        r.left < vw - 8;
      if (!visible && el.getAttribute("data-flash-was-off") !== "1") {
        // 화면 밖 일반 요소는 짧게만 빛나고 끝 (클릭 거의 불가) — 다시 뽑기
        clearFlash();
        scheduleNext(120);
        return;
      }
    } catch (e) {}

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
    // 직전과 다른 요소 우선
    var filtered = pool.filter(function (el) {
      return (el.getAttribute("data-find") || "") !== state.lastId;
    });
    if (!filtered.length) filtered = pool;
    var el = filtered[(Math.random() * filtered.length) | 0];
    armFlash(el);
  }

  function scheduleNext(ms) {
    if (state.timer) clearTimeout(state.timer);
    if (blocked()) return;
    state.timer = setTimeout(pickAndFlash, Math.max(80, ms | 0));
  }

  function openFromFlash(el) {
    if (!el || !el.classList.contains("find-flash")) return false;
    if (blocked()) return false;
    el.classList.add("find-flash-hit");
    // SFX
    try {
      var a = window.__hauntAudio;
      if (a) {
        if (a.unlock) a.unlock();
        if (a.playSfx) a.playSfx("glitch", { vol: 0.65, minGapMs: 400 });
        else if (a.sting) a.sting("soft");
      }
    } catch (e0) {}
    clearTimeout(state.timer);
    state.timer = null;
    // 일기 오픈 → 2페이즈 입구
    try {
      if (typeof window.__hauntOpenDiary === "function") {
        window.__hauntOpenDiary();
      } else {
        document.dispatchEvent(new CustomEvent("haunt-force-diary"));
      }
    } catch (e1) {}
    stop();
    return true;
  }

  function onPointer(ev) {
    if (blocked()) return;
    var t = ev.target;
    if (!t || !t.closest) return;
    var el = t.closest("[data-find].find-flash, .find-flash");
    if (!el) return;
    // 빛나는 순간에만 통과
    if (!el.classList.contains("find-flash")) return;
    ev.preventDefault();
    ev.stopPropagation();
    openFromFlash(el);
  }

  function start() {
    if (state.running || blocked()) return;
    state.running = true;
    document.body.classList.add("phase1-flash-live");
    // 첫 반짝은 조금 여유 두고 (랜딩 읽기)
    scheduleNext(reduced ? 2500 : 1800 + Math.random() * 1200);
  }

  function stop() {
    state.running = false;
    document.body.classList.remove("phase1-flash-live");
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    clearFlash();
  }

  function watch() {
    var obs = new MutationObserver(function () {
      if (blocked()) stop();
      else if (!state.running) start();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("haunt-diary", function () {
      stop();
    });
  }

  function init() {
    // capture 단계에서 가로채기 (다른 핸들러보다 우선)
    document.addEventListener("click", onPointer, true);
    document.addEventListener("pointerup", onPointer, true);
    watch();
    // diary 모듈 로드 후
    setTimeout(function () {
      if (!blocked()) start();
    }, 600);

    window.__hauntPhase1Flash = {
      start: start,
      stop: stop,
      flashNow: pickAndFlash,
      status: function () {
        return {
          running: state.running,
          lastId: state.lastId,
          flashCount: state.flashCount,
          mobile: isMobile(),
        };
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
