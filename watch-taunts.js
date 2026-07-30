/**
 * 2·3페이즈 — “보고 있다” 행동 반응 글귀 + LIVE 방문자 상승
 * presence.js 의 HUD 숫자와 연동 (horrorLive)
 */
(function () {
  "use strict";

  /** 사용자가 할 법한 행동을 이미 본 것처럼 말하는 글귀 (P2/P3) */
  var LINES = [
    "클릭 15번이면 네 심장이 멎는다.",
    "지금 스크롤한 그 위치, 이미 기록했다.",
    "마우스를 멈춘 3초. 네 호흡이 들린다.",
    "탭을 바꾸려 했지. 여기서 나가도 따라간다.",
    "복사를 했네. 클립보드에 네 이름도 넣었다.",
    "같은 버튼 두 번. 조급한 사람 냄새다.",
    "뒤로 가려다 말았지. 발자국이 남아 있다.",
    "화면을 너무 오래 보고 있다. 눈이 건조해.",
    "F5를 누르고 싶지? 새로고침해도 너는 여기다.",
    "커서가 왼쪽 아래에 오래 있었어. 숨는 버릇.",
    "가만히 있는 것도 선택이다. 기록된다.",
    "더블클릭. 다급할수록 잘 들린다.",
    "스크롤을 끝으로 밀었다. 바닥은 없다.",
    "창 크기를 줄였네. 작아져도 보인다.",
    "엔터를 찾고 있지. 입력할 곳은 네 안이다.",
    "세 번째 망설임. 카운트는 이미 시작됐다.",
    "방문자 수가 오르는 걸 보고 있지? 네가 원인이다.",
    "클릭할 때마다 LIVE 가 하나 는다. 느껴져?",
    "다른 탭에 갔다가 돌아왔지. 빈자리는 없었다.",
    "손가락이 멈췄다. 심장은 아직 안 멈췄다.",
    "그 카드, 또 누르려 한다. 패턴이 읽힌다.",
    "이 문장을 읽는 지금, 너도 카운트에 포함됐다.",
  ];

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    clicks: 0,
    scrolls: 0,
    keys: 0,
    copies: 0,
    idles: 0,
    shown: {},
    lastShow: 0,
    climbTimer: null,
    tauntTimer: null,
    idleTimer: null,
    active: false,
    toastEl: null,
  };

  function phase() {
    var b = document.body;
    if (
      window.__hauntPhase3Active === true ||
      b.classList.contains("phase-3-active")
    ) {
      return 3;
    }
    if (b.classList.contains("phase-2-active")) return 2;
    return 1;
  }

  function blocked() {
    var b = document.body;
    return (
      b.classList.contains("is-ending") ||
      b.classList.contains("diary-open") ||
      (b.classList.contains("is-haunting") && phase() < 3)
    );
  }

  function presence() {
    return window.__hauntPresence || null;
  }

  function ensureToast() {
    if (state.toastEl) return state.toastEl;
    var el = document.createElement("div");
    el.id = "watchTaunt";
    el.className = "watch-taunt";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<span class="watch-taunt-tag" aria-hidden="true">WATCH</span>' +
      '<p class="watch-taunt-text" id="watchTauntText"></p>';
    document.body.appendChild(el);
    state.toastEl = el;
    return el;
  }

  function pickLine(preferIdx) {
    if (preferIdx != null && LINES[preferIdx] && !state.shown[preferIdx]) {
      state.shown[preferIdx] = true;
      return LINES[preferIdx];
    }
    var pool = [];
    for (var i = 0; i < LINES.length; i++) {
      if (!state.shown[i]) pool.push(i);
    }
    if (!pool.length) {
      state.shown = {};
      for (i = 0; i < LINES.length; i++) pool.push(i);
    }
    var idx = pool[Math.floor(Math.random() * pool.length)];
    state.shown[idx] = true;
    return LINES[idx];
  }

  function showTaunt(text, force) {
    /* no-op: 머무름 중 MATCH/힌트 토스트 제거 */
    return;
  }

  function taunt(preferIdx) {
    showTaunt(pickLine(preferIdx));
  }

  /* —— LIVE 방문자 상승 (티저 영상 톤) —— */
  function seedHorrorLive() {
    var p = presence();
    if (!p) return;
    var real = Math.max(1, p.getLive() || 1);
    var total = p.getTotal();
    /* 실제 동시접속보다 훨씬 큰 ‘LIVE visitors’ 연출 시작점 */
    var base = Math.max(
      real * 180 + 40,
      total != null ? Math.floor(total * 0.35) : 0,
      840 + Math.floor(Math.random() * 400)
    );
    if (phase() === 3) base = Math.floor(base * 1.35) + 200;
    p.setHorrorLive(base);
  }

  function climbLive() {
    if (phase() < 2 || blocked()) return;
    var p = presence();
    if (!p || !p.setHorrorLive) return;
    var cur = p.getHorrorLive();
    if (cur == null || cur < 2) {
      seedHorrorLive();
      cur = p.getHorrorLive() || 900;
    }
    var jump =
      phase() === 3
        ? 3 + Math.floor(Math.random() * 28)
        : 1 + Math.floor(Math.random() * 14);
    /* 가끔 큰 점프 (티저 3,847 → 5,000+ 느낌) */
    if (Math.random() > 0.82) jump += 40 + Math.floor(Math.random() * 120);
    if (Math.random() > 0.94) jump += 200 + Math.floor(Math.random() * 400);
    p.setHorrorLive(cur + jump);
  }

  function startClimb() {
    stopClimb();
    seedHorrorLive();
    var tick = function () {
      climbLive();
      var gap =
        phase() === 3
          ? 1600 + Math.random() * 1800
          : 2400 + Math.random() * 2800;
      if (reduced) gap *= 1.4;
      state.climbTimer = setTimeout(tick, gap);
    };
    state.climbTimer = setTimeout(tick, 900);
  }

  function stopClimb() {
    if (state.climbTimer) {
      clearTimeout(state.climbTimer);
      state.climbTimer = null;
    }
    var p = presence();
    if (p && p.clearHorrorLive) p.clearHorrorLive();
  }

  function onClick() {
    if (phase() < 2 || blocked()) return;
    state.clicks++;
    climbLive();
    if (state.clicks === 3) taunt(10);
    else if (state.clicks === 7) taunt(11);
    else if (state.clicks === 12) taunt(0); /* 클릭 15번 예고 톤 */
    else if (state.clicks === 15) taunt(0);
    else if (state.clicks === 20) taunt(17);
    else if (state.clicks % 8 === 0) taunt();
  }

  function onScroll() {
    if (phase() < 2 || blocked()) return;
    state.scrolls++;
    if (state.scrolls === 1) taunt(1);
    else if (state.scrolls === 5) taunt(12);
    else if (state.scrolls % 6 === 0) taunt(Math.random() > 0.5 ? 1 : 12);
  }

  function onKey() {
    if (phase() < 2 || blocked()) return;
    state.keys++;
    if (state.keys === 2) taunt(8);
    else if (state.keys === 6) taunt(14);
    else if (state.keys % 9 === 0) taunt();
  }

  function onCopy() {
    if (phase() < 2 || blocked()) return;
    state.copies++;
    taunt(4);
  }

  function onVis() {
    if (phase() < 2 || blocked()) return;
    if (document.visibilityState === "visible") {
      taunt(18);
      climbLive();
    } else {
      taunt(3);
    }
  }

  function resetIdle() {
    clearTimeout(state.idleTimer);
    if (phase() < 2 || blocked()) return;
    state.idleTimer = setTimeout(function () {
      state.idles++;
      taunt(state.idles === 1 ? 2 : 10);
    }, reduced ? 12000 : 8000);
  }

  function ambientLoop() {
    clearTimeout(state.tauntTimer);
    if (phase() < 2 || blocked()) {
      state.tauntTimer = setTimeout(ambientLoop, 4000);
      return;
    }
    /* 가끔 아무 행동 없어도 한 줄 */
    if (Math.random() > 0.45) taunt();
    var wait = reduced ? 14000 + Math.random() * 8000 : 9000 + Math.random() * 7000;
    state.tauntTimer = setTimeout(ambientLoop, wait);
  }

  function activate() {
    if (state.active) {
      /* 페이즈 올라갈 때 시드 재조정 */
      if (phase() >= 2) seedHorrorLive();
      return;
    }
    if (phase() < 2) return;
    state.active = true;
    ensureToast();
    startClimb();
    ambientLoop();
    showTaunt(pickLine(21), true);
    setTimeout(function () {
      climbLive();
    }, 600);
  }

  function deactivate() {
    if (!state.active) return;
    state.active = false;
    stopClimb();
    clearTimeout(state.tauntTimer);
    clearTimeout(state.idleTimer);
    if (state.toastEl) {
      state.toastEl.classList.remove("is-on");
      state.toastEl.setAttribute("aria-hidden", "true");
    }
  }

  function watchPhase() {
    var last = 0;
    function check() {
      var p = phase();
      if (p >= 2 && !blocked()) activate();
      else deactivate();
      if (p !== last && p >= 2) {
        last = p;
        seedHorrorLive();
        if (p === 3) showTaunt("소멸 직전이다. 숫자만 오르고 있다.", true);
      }
      last = p;
    }
    var obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setInterval(check, 1500);
    check();
  }

  function bind() {
    document.addEventListener("click", onClick, true);
    document.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("visibilitychange", onVis);
    ["mousemove", "touchstart", "scroll", "keydown", "click"].forEach(function (ev) {
      document.addEventListener(ev, resetIdle, { passive: true });
    });
    resetIdle();
  }

  function init() {
    ensureToast();
    bind();
    watchPhase();
    window.__hauntWatchTaunts = {
      lines: LINES.slice(),
      show: showTaunt,
      climb: climbLive,
      seed: seedHorrorLive,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
