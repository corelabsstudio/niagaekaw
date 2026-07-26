/**
 * 2페이즈 → 3페이즈 게이트 트리거
 * - 약 20종 풀, 세션마다 1개만 활성
 * - phase2Ready: 일기 발견 + stage ≥ 2
 * - 발동 시 클라이맥스가 아니라 **3페이즈 진입** (클라이맥스는 phase3-triggers.js)
 * - 공개 빌드 (관리자 프리패스 없음)
 */
(function () {
  "use strict";

  function stage() {
    if (typeof window.__hauntStage === "function") return window.__hauntStage();
    return parseInt(document.body.getAttribute("data-stage") || "0", 10) || 0;
  }

  function phase2Ready() {
    if (!window.__hauntDiaryDiscovered) return false;
    return stage() >= 2;
  }

  function busy() {
    return (
      document.body.classList.contains("is-haunting") ||
      document.body.classList.contains("is-ending") ||
      /* 일기 읽는 중 클라이맥스 끼어들기 방지 */
      document.body.classList.contains("diary-open")
    );
  }

  var p3FxStarted = false;
  var P3_FACE_POOL = [
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

  function p3FaceSrc() {
    return P3_FACE_POOL[Math.floor(Math.random() * P3_FACE_POOL.length)];
  }

  /** 플랜 카드: 산산조각 상시 + 눈/얼굴 랜덤 맥동 */
  function shatterAllPlansPermanent() {
    document.querySelectorAll(".plan-btn.plan-card").forEach(function (card) {
      card.classList.add("p3-plan-ready", "is-shattered", "is-smashed");
      var face = card.querySelector(".p3-plan-face");
      if (face) {
        try {
          face.src = p3FaceSrc();
        } catch (e) {}
      }
    });
  }

  function pulsePlanShatter() {
    if (!document.body.classList.contains("phase-3-active")) return;
    if (document.body.classList.contains("diary-open")) return;
    if (document.body.classList.contains("is-haunting")) return;
    var cards = document.querySelectorAll(".plan-btn.plan-card");
    if (!cards.length) return;
    // 상시 깨진 상태 유지 + 1~3장 눈 다시 깜빡
    cards.forEach(function (card) {
      card.classList.add("is-shattered", "is-smashed");
    });
    var order = Array.prototype.slice.call(cards).sort(function () {
      return Math.random() - 0.5;
    });
    var n = 1 + Math.floor(Math.random() * Math.min(3, order.length));
    var picks = order.slice(0, n);
    picks.forEach(function (card, i) {
      setTimeout(function () {
        if (!document.body.classList.contains("phase-3-active")) return;
        var face = card.querySelector(".p3-plan-face");
        if (face) {
          try {
            face.src = p3FaceSrc();
          } catch (e) {}
        }
        card.classList.add("is-eyes", "is-scream");
        setTimeout(function () {
          card.classList.remove("is-scream");
        }, 400);
        setTimeout(function () {
          card.classList.remove("is-eyes");
        }, 1800 + Math.random() * 1600);
      }, i * (100 + Math.random() * 180));
    });
  }

  /** 출몰 얼굴 크기 — 작게 / 보통 / 크게 / 가끔 초대형 */
  function randomP3FaceScale() {
    var r = Math.random();
    if (r < 0.25) return 0.35 + Math.random() * 0.3; // tiny
    if (r < 0.55) return 0.7 + Math.random() * 0.45; // mid
    if (r < 0.85) return 1.2 + Math.random() * 0.55; // large
    return 1.85 + Math.random() * 0.9; // huge scare
  }

  /** 화면 떠다니는 얼굴 — 평소 숨김, 가끔 출몰 (크기 랜덤) */
  function pulseP3FloatFaces() {
    if (!document.body.classList.contains("phase-3-active")) return;
    if (document.body.classList.contains("diary-open")) return;
    if (document.body.classList.contains("is-haunting")) return;
    var root = document.getElementById("p3FloatFaces");
    if (!root) return;
    var faces = Array.prototype.slice.call(root.querySelectorAll(".p3-ff"));
    if (!faces.length) return;
    faces.forEach(function (f) {
      f.classList.remove("is-on", "is-out");
    });
    var n = 1 + Math.floor(Math.random() * 3);
    var picks = faces
      .slice()
      .sort(function () {
        return Math.random() - 0.5;
      })
      .slice(0, n);
    var life = 1600 + Math.random() * 2200;
    picks.forEach(function (f, i) {
      try {
        f.src = p3FaceSrc();
      } catch (e) {}
      // 랜덤 위치 + 크기(작고↔크게)
      f.style.left = 6 + Math.random() * 78 + "%";
      f.style.top = 12 + Math.random() * 62 + "%";
      f.style.setProperty("--ff-rot", (-18 + Math.random() * 36).toFixed(1) + "deg");
      f.style.setProperty("--ff-scale", randomP3FaceScale().toFixed(2));
      setTimeout(function () {
        if (!document.body.classList.contains("phase-3-active")) return;
        f.classList.add("is-on");
      }, i * 90);
    });
    setTimeout(function () {
      picks.forEach(function (f, i) {
        setTimeout(function () {
          f.classList.remove("is-on");
          f.classList.add("is-out");
          setTimeout(function () {
            f.classList.remove("is-out");
          }, 700);
        }, i * 80);
      });
    }, life);
  }

  function corruptLogPanels() {
    var light = document.querySelector(".stasis-card-light");
    var dark = document.querySelector(".stasis-card-dark");
    if (light) light.classList.add("p3-log-corrupted");
    if (dark) dark.classList.add("p3-autopsy-corrupted");
    var bb = document.getElementById("p3BlackboxLog");
    if (bb) {
      bb.setAttribute("aria-hidden", "false");
      bb.classList.add("is-on");
    }
    var over = document.getElementById("p3AutopsyOver");
    if (over) {
      over.setAttribute("aria-hidden", "false");
      over.classList.add("is-on");
    }
    // 기존 리스트/KPI 숨김은 CSS
    var h2log = document.getElementById("h2log");
    if (h2log) h2log.textContent = "// blackbox_log";
    var h2notes = document.getElementById("h2notes");
    if (h2notes) h2notes.textContent = "// autopsy";
  }

  function startPhase3FxLoops() {
    if (p3FxStarted) return;
    p3FxStarted = true;
    shatterAllPlansPermanent();
    corruptLogPanels();
    // 진입 직후 눈 + 얼굴
    setTimeout(function () {
      pulsePlanShatter();
      pulseP3FloatFaces();
    }, 600);
    setTimeout(function planLoop() {
      if (!document.body.classList.contains("phase-3-active")) {
        setTimeout(planLoop, 4000);
        return;
      }
      if (
        !document.body.classList.contains("diary-open") &&
        !document.body.classList.contains("is-haunting")
      ) {
        pulsePlanShatter();
      }
      setTimeout(planLoop, 5500 + Math.random() * 7000);
    }, 4000);
    setTimeout(function faceLoop() {
      if (!document.body.classList.contains("phase-3-active")) {
        setTimeout(faceLoop, 4000);
        return;
      }
      if (
        !document.body.classList.contains("diary-open") &&
        !document.body.classList.contains("is-haunting")
      ) {
        pulseP3FloatFaces();
      }
      setTimeout(faceLoop, 6500 + Math.random() * 9000);
    }, 2800);
  }

  /** 3페이즈 지속 UI — 참조 목업 핏빛 심층 */
  function applyPhase3Visuals(opts) {
    opts = opts || {};
    var body = document.body;
    body.classList.add("phase-3-active");
    body.setAttribute("data-game-phase", "3");
    body.classList.remove("phase-2-active");

    // 상단 깊이 띠
    var bar = document.getElementById("p3DepthBar");
    if (bar) {
      bar.hidden = false;
      bar.setAttribute("aria-hidden", "false");
      bar.classList.add("is-on");
    }
    var depthMsg = document.getElementById("p3DepthMsg");
    if (depthMsg && !opts.quiet) {
      depthMsg.textContent = "한 층 더 내려왔다 · 잠든 것들이 깨어난다";
    }

    // 가짜 주소창
    try {
      var urlText = document.getElementById("fakeUrlText");
      if (urlText) {
        urlText.dataset.p3Prev = urlText.textContent || "";
        urlText.textContent = "about:blank#depth/3/not-done";
      }
      var chrome = document.getElementById("fakeChrome");
      if (chrome) chrome.classList.add("is-phase3");
    } catch (eU) {}

    // 히어로 — 실제 DOM UI만 (배경 이미지 카피 사용 금지)
    try {
      var t1 = document.getElementById("titleL1");
      var t2 = document.getElementById("titleL2");
      if (t1) {
        t1.dataset.p3Prev = t1.textContent || "";
        t1.textContent = "잠들어 있던 것들이";
      }
      if (t2) {
        t2.dataset.p3Prev = t2.textContent || "";
        t2.textContent = "깨어날 준비를 하고 있다.";
      }
      var lede = document.getElementById("lede");
      if (lede) {
        lede.classList.add("p3-lede", "p3-lede-melt");
        // morph 잔여 텍스트 정리 — 경고 한 줄만
        var morphs = lede.querySelectorAll(".morph");
        if (morphs.length) {
          morphs.forEach(function (m, i) {
            if (i === 0) {
              m.innerHTML =
                "구경만 하던 화면이, 이제 살과 회로로 대답한다.";
            } else {
              m.textContent = "";
              m.setAttribute("aria-hidden", "true");
            }
          });
        }
        var wh = document.getElementById("whisper");
        if (wh) {
          wh.textContent = "탈출구는 없다.";
          wh.style.opacity = "0.85";
        }
      }
      var mainTitle = document.getElementById("mainTitle");
      if (mainTitle) {
        mainTitle.classList.add("p3-title", "p3-title-melt");
      }
      var hero = document.querySelector(".stasis-hero");
      if (hero) hero.classList.add("p3-hero-ui");
      document.querySelectorAll(".plan-btn.plan-card").forEach(function (c) {
        c.classList.add("p3-plan-ready");
      });
    } catch (eT) {}

    startPhase3FxLoops();

    // 진입 즉시 레이어 토스트
    if (!opts.quiet) {
      var layer = document.getElementById("p3LayerToast");
      var layerText = document.getElementById("p3LayerText");
      if (layerText) {
        layerText.textContent =
          "어둠이 살이 되었다. 촉수가 화면을 찢는다. 지표는 끝났다 — OVER.";
      }
      if (layer) {
        layer.classList.add("is-on");
        layer.setAttribute("aria-hidden", "false");
        setTimeout(function () {
          layer.classList.remove("is-on");
          layer.setAttribute("aria-hidden", "true");
        }, 4200);
      }
    }
  }

  function enterPhase3() {
    if (window.__hauntPhase3Active) return true;
    window.__hauntPhase3Active = true;
    try {
      sessionStorage.setItem("haunt_phase3", "1");
      sessionStorage.setItem("haunt_p3_entered_at", String(Date.now()));
    } catch (e) {}
    // stage/mood 최대 끌어올림 — 3페이즈 비주얼
    try {
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      if (typeof window.__hauntSetMood === "function") window.__hauntSetMood(4);
      if (typeof window.__hauntSetP2Decay === "function") window.__hauntSetP2Decay(5);
      else {
        document.body.setAttribute("data-p2-decay", "5");
        document.body.classList.add("p2-d5");
      }
    } catch (e2) {}

    applyPhase3Visuals({ quiet: false });

    try {
      document.dispatchEvent(
        new CustomEvent("haunt-phase3", {
          detail: { at: Date.now(), from: "p2-trigger", trigger: active && active.id },
        })
      );
    } catch (e3) {}
    // 강한 진입 연출
    document.body.classList.add("phase3-enter");
    setTimeout(function () {
      document.body.classList.remove("phase3-enter");
      document.body.classList.add("phase3-settled");
    }, 2200);
    try {
      var au = window.__hauntAudio;
      if (au) {
        if (au.stopPhase2Bgm) au.stopPhase2Bgm(true);
        if (au.stopPhase3Bgm) au.stopPhase3Bgm(true);
        if (au.rumble) au.rumble(1.6);
        if (au.sting) setTimeout(function () { au.sting("blood"); }, 180);
        if (au.whisper) setTimeout(function () { au.whisper(); }, 500);
      }
    } catch (e4) {}
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[phase] entered phase 3 via", active && active.id);
    }
    return true;
  }

  function summon() {
    if (typeof window.__hauntSummon === "function") {
      window.__hauntSummon();
      return true;
    }
    return false;
  }

  function trySummon() {
    // 하위 호환: 프리패스는 클라이맥스 직행 허용
    if (busy()) return;
    if (!window.__hauntCreatorPass) return;
    window.__hauntDiaryDiscovered = true;
    try {
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      if (typeof window.__hauntSetMood === "function") window.__hauntSetMood(4);
    } catch (e) {}
    summon();
  }

  function tryEnterPhase3Strict() {
    if (busy()) return;
    if (!phase2Ready()) return;
    if (window.__hauntPhase3Active) return;
    enterPhase3();
  }

  /**
   * 2페이즈 게이트 트리거 20 — 클린 SaaS 레이아웃 기준
   * (WIP 띠/caret/TODO 등 클린 전용 요소 사용 금지)
   * 대상: 로고·플랜카드·제목·카드·푸터·가짜주소창·경로·시계·배지 등
   */
  function p2Only(fn) {
    return function () {
      if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
      return fn.apply(this, arguments);
    };
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

  /** 폰에서 기본 뽑기 제외 (키보드/복사 전용) — 강제 뽑기 시 터치 대체 arm 유지 */
  var DESKTOP_ONLY_IDS = {
    type_kill: 1,
    type_process: 1,
    copy_curse: 1,
  };

  /** 힌트 후 풀 수 있게: 타깃 표시·히트영역·가시성 */
  var missionRevealed = false;
  var hotTargets = [];

  function markHot(el, extraClass) {
    if (!el) return null;
    el.classList.add("p2-trig-hot");
    if (extraClass) el.classList.add(extraClass);
    el.style.pointerEvents = "auto";
    el.style.cursor = "pointer";
    try {
      el.setAttribute("tabindex", "0");
    } catch (e0) {}
    // 숨김 요소 복구 (뱃지 등)
    try {
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") {
        el.classList.add("p2-trig-force-show");
      }
      if (el.offsetParent === null && el !== document.body) {
        el.classList.add("p2-trig-force-show");
      }
    } catch (e1) {}
    if (hotTargets.indexOf(el) === -1) hotTargets.push(el);
    return el;
  }

  function showTypeGuide(text) {
    var g = document.getElementById("p2TypeGuide");
    if (!g) {
      g = document.createElement("div");
      g.id = "p2TypeGuide";
      g.className = "p2-type-guide";
      g.setAttribute("aria-live", "polite");
      document.body.appendChild(g);
    }
    g.innerHTML =
      '<span class="p2-type-tag">TYPE</span><kbd class="p2-type-keys">' +
      text +
      "</kbd>";
    g.classList.add("is-on");
    g.hidden = false;
  }

  function showScrollCue(kind) {
    // kind: deep | bounce
    var g = document.getElementById("p2ScrollCue");
    if (!g) {
      g = document.createElement("div");
      g.id = "p2ScrollCue";
      g.className = "p2-scroll-cue";
      g.setAttribute("aria-hidden", "true");
      document.body.appendChild(g);
    }
    if (kind === "deep") {
      g.textContent = "↓ 맨 아래로 · 잠시 머무르기";
      g.className = "p2-scroll-cue is-on is-bottom";
    } else if (kind === "bounce") {
      g.textContent = "↓ 맨 아래 → 곧 ↑ 맨 위";
      g.className = "p2-scroll-cue is-on is-bottom";
    } else if (kind === "idle") {
      g.textContent = "손 떼고 가만히…";
      g.className = "p2-scroll-cue is-on is-center";
    } else {
      g.className = "p2-scroll-cue";
    }
    g.hidden = false;
  }

  function hideMissionAids() {
    var g = document.getElementById("p2TypeGuide");
    if (g) {
      g.classList.remove("is-on");
      g.hidden = true;
    }
    var s = document.getElementById("p2ScrollCue");
    if (s) {
      s.classList.remove("is-on");
      s.hidden = true;
    }
    document.body.classList.remove("trig-hint-live", "p2-trig-reveal");
    document.documentElement.classList.remove("trig-hint-live");
  }

  function revealMissionTargets() {
    missionRevealed = true;
    window.__hauntHintRevealed = true;
    document.body.classList.add("trig-hint-live", "p2-trig-reveal");
    document.documentElement.classList.add("trig-hint-live");

    // 페이즈 전환으로 숨은 홀드 타깃 재바인딩 (badge/path/feat/quote 등)
    if (typeof window.__hauntP2RebindHold === "function") {
      try {
        window.__hauntP2RebindHold();
      } catch (eRe) {}
    }

    // 활성 트리거별 추가 가이드
    var id = active && active.id;
    if (id === "type_kill") showTypeGuide("kill 또는 wake");
    else if (id === "type_process") showTypeGuide("process");
    else if (id === "copy_curse") showTypeGuide("아무 글 드래그 → Ctrl+C");
    else if (id === "deep_hold") showScrollCue("deep");
    else if (id === "scroll_bounce") showScrollCue("bounce");
    else if (id === "idle_haunt") showScrollCue("idle");

    // 보이는 핫 타깃으로 스크롤 (숨은 요소 스킵)
    var hot = null;
    for (var hi = 0; hi < hotTargets.length; hi++) {
      if (isInteractable(hotTargets[hi])) {
        hot = hotTargets[hi];
        break;
      }
    }
    if (!hot) {
      var cands = document.querySelectorAll(
        ".p2-trig-hot, .p2-trig-banner, .p2-trig-signature"
      );
      for (var ci = 0; ci < cands.length; ci++) {
        if (isInteractable(cands[ci])) {
          hot = cands[ci];
          break;
        }
      }
    }
    if (hot && typeof hot.scrollIntoView === "function") {
      try {
        hot.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } catch (e2) {
        try {
          hot.scrollIntoView(true);
        } catch (e3) {}
      }
    }
  }

  /** 클릭/홀드 가능 여부 (display:none·0크기 제외) */
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
    // 폴백: 첫 존재하는 노드 (force-show로 살릴 수 있음)
    for (var j = 0; j < cands.length; j++) {
      if (cands[j]) return cands[j];
    }
    return null;
  }

  function armHold(el, ms, done, holdClass) {
    if (!el) return false;
    markHot(el);
    // 힌트 후에는 홀드 시간 완화
    var needMs = ms;
    var t = null;
    var cls = holdClass || "climax-holding";
    function clear() {
      if (t) clearTimeout(t);
      t = null;
      el.classList.remove(cls);
    }
    el.addEventListener("pointerdown", function (e) {
      if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
      if (e.button != null && e.button !== 0) return;
      try {
        e.preventDefault();
      } catch (err) {}
      el.classList.add(cls);
      var holdFor = missionRevealed ? Math.min(needMs, 1600) : needMs;
      t = setTimeout(function () {
        clear();
        done();
      }, holdFor);
    });
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointerleave", clear);
    el.addEventListener("pointercancel", clear);
    return true;
  }

  /**
   * 페이즈 전환 후 타깃이 숨겨질 수 있는 홀드 — 힌트/입력 시점에 재해석
   * resolve() 가 보이는 요소를 반환해야 함.
   */
  function armHoldResolved(resolve, ms, done, holdClass) {
    if (typeof resolve !== "function") return armHold(resolve, ms, done, holdClass);
    var current = resolve();
    if (current) markHot(current);
    var needMs = ms;
    var t = null;
    var cls = holdClass || "climax-holding";
    var bound = [];

    function clearHold(el) {
      if (t) clearTimeout(t);
      t = null;
      if (el) el.classList.remove(cls);
    }

    function bind(el) {
      if (!el || bound.indexOf(el) !== -1) return;
      bound.push(el);
      markHot(el);
      el.addEventListener("pointerdown", function (e) {
        if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
        if (e.button != null && e.button !== 0) return;
        // 숨은 타깃이면 재해석 후 재시도 안내만
        var live = resolve();
        if (live && live !== el) {
          bind(live);
          try {
            live.scrollIntoView({ block: "center", inline: "nearest" });
          } catch (e0) {}
        }
        var target = isInteractable(el) ? el : live || el;
        try {
          e.preventDefault();
        } catch (err) {}
        target.classList.add(cls);
        var holdFor = missionRevealed ? Math.min(needMs, 1600) : needMs;
        clearHold(target);
        t = setTimeout(function () {
          clearHold(target);
          done();
        }, holdFor);
      });
      el.addEventListener("pointerup", function () {
        clearHold(el);
      });
      el.addEventListener("pointerleave", function () {
        clearHold(el);
      });
      el.addEventListener("pointercancel", function () {
        clearHold(el);
      });
    }

    bind(current);
    // 힌트 시 재해석용 훅
    var prevReveal = window.__hauntP2RebindHold;
    window.__hauntP2RebindHold = function () {
      if (typeof prevReveal === "function") {
        try {
          prevReveal();
        } catch (e1) {}
      }
      var next = resolve();
      if (next) bind(next);
    };
    return true;
  }

  function armClicks(el, need, windowMs, done) {
    if (!el) return false;
    markHot(el);
    var n = 0;
    var reset = null;
    var win = windowMs || 2200;
    if (isMobileHaunt()) win = Math.max(win, 3200);
    // 힌트 후: 클릭 창 더 여유
    el.addEventListener("click", function (e) {
      if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
      n++;
      clearTimeout(reset);
      var w = missionRevealed ? Math.max(win, 4000) : win;
      reset = setTimeout(function () {
        n = 0;
      }, w);
      if (n >= need) {
        n = 0;
        done();
      }
    });
    return true;
  }

  /** 모바일 터치 대체: 대상 연타 / 길게 누르기 */
  function armMobileTapAlt(el, need, done, hotClass) {
    if (!el) return false;
    markHot(el, hotClass || "mobile-trig-alt");
    return armClicks(el, need, 3200, done);
  }
  function armMobileHoldAlt(el, ms, done) {
    if (!el) return false;
    markHot(el, "mobile-trig-alt");
    return armHold(el, ms, done);
  }

  var TRIGGERS = [
    {
      id: "hold_free",
      hint: "Free 카드 길게",
      arm: function (done) {
        var btn =
          document.getElementById("planFree") ||
          document.querySelector(".plan-card.is-on") ||
          document.querySelector("[data-fake='2']");
        armHold(btn, 1800, done);
      },
    },
    {
      id: "triple_logo",
      hint: "로고 3연타",
      arm: function (done) {
        armClicks(document.getElementById("topRec"), 3, 1400, done);
      },
    },
    {
      id: "type_kill",
      hint: "키보드 kill / wake",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-8);
          if (buf.indexOf("kill") !== -1 || buf.indexOf("wake") !== -1) {
            buf = "";
            done();
          }
        });
        var team =
          document.getElementById("planTeam") ||
          document.querySelector("[data-fake='3']");
        // 데스크톱도 힌트 후 Team 7연타 대체 가능
        armMobileTapAlt(team, isMobileHaunt() ? 7 : 5, done);
      },
    },
    {
      id: "deep_hold",
      hint: "맨 아래 스크롤 유지",
      arm: function (done) {
        var hold = 0;
        var last = 0;
        setInterval(function () {
          if (!phase2Ready() || busy() || window.__hauntPhase3Active) {
            hold = 0;
            last = 0;
            return;
          }
          var el = document.documentElement;
          var max = el.scrollHeight - el.clientHeight;
          var r = max <= 0 ? 1 : el.scrollTop / max;
          var now = Date.now();
          var need = missionRevealed ? 2200 : 3000;
          var thr = missionRevealed ? 0.88 : 0.9;
          if (r >= thr) {
            if (!last) last = now;
            hold += now - last;
            last = now;
            if (hold >= need) {
              hold = 0;
              done();
            }
          } else {
            last = 0;
            hold = 0;
          }
        }, 200);
      },
    },
    {
      id: "team_spam",
      hint: "Team 카드 연타",
      arm: function (done) {
        var btn =
          document.getElementById("planTeam") ||
          document.querySelector("[data-fake='3']") ||
          document.querySelector(".plan-card.danger-btn");
        armClicks(btn, 5, 3200, done);
      },
    },
    {
      id: "fakeurl_double",
      hint: "가짜 주소창 더블클릭",
      arm: function (done) {
        var bar = document.getElementById("fakeUrlBar");
        if (!bar) return;
        document.documentElement.classList.add("climax-fakeurl-live");
        markHot(bar, "mobile-trig-alt");
        var chrome = document.querySelector(".fake-chrome");
        if (chrome) chrome.classList.add("p2-trig-fakeurl");
        var last = 0;
        var dblMs = isMobileHaunt() ? 700 : 500;
        bar.addEventListener("click", function (e) {
          if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
          e.preventDefault();
          var now = Date.now();
          if (now - last < dblMs) {
            last = 0;
            done();
          } else last = now;
        });
      },
    },
    {
      id: "copy_curse",
      hint: "아무 텍스트나 복사",
      arm: function (done) {
        document.addEventListener("copy", function () {
          if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
          done();
        });
        var lede =
          document.getElementById("lede") ||
          document.querySelector(".stasis-lede") ||
          document.getElementById("mainTitle");
        markHot(lede);
        // 데스크톱도 길게 누르기로 대체 가능
        armHold(lede, 2000, done);
      },
    },
    {
      id: "wait_triple",
      hint: "하단 기다림 문장 3번",
      arm: function (done) {
        var el =
          document.getElementById("resWait") ||
          document.querySelector("[data-find='console']") ||
          document.querySelector(".stasis-later .morph");
        armClicks(el, 3, 2800, done);
      },
    },
    {
      id: "beta_quad",
      hint: "푸터 beta 4번",
      arm: function (done) {
        var el =
          document.querySelector(".foot-beta") ||
          document.querySelector("[data-find='wip']");
        armClicks(el, 4, 3200, done);
      },
    },
    {
      id: "version_triple",
      hint: "푸터 버전 3번",
      arm: function (done) {
        var el =
          document.querySelector(".foot-micro:not(.foot-beta)") ||
          document.querySelector("[data-find='branch']");
        armClicks(el, 3, 3200, done);
      },
    },
    {
      id: "title_mash",
      hint: "제목 5연타",
      arm: function (done) {
        armClicks(document.getElementById("mainTitle"), 5, 2800, done);
      },
    },
    {
      id: "scroll_bounce",
      hint: "맨 아래 → 맨 위 빠르게",
      arm: function (done) {
        var sawDeep = false;
        var deepAt = 0;
        window.addEventListener(
          "scroll",
          function () {
            if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
            var el = document.documentElement;
            var max = el.scrollHeight - el.clientHeight;
            var r = max <= 0 ? 1 : el.scrollTop / max;
            var deepThr = missionRevealed ? 0.85 : 0.9;
            var topThr = missionRevealed ? 0.18 : 0.12;
            var win = missionRevealed ? 5000 : 4000;
            if (r >= deepThr) {
              sawDeep = true;
              deepAt = Date.now();
            }
            if (sawDeep && r <= topThr && Date.now() - deepAt < win) {
              sawDeep = false;
              done();
            }
          },
          { passive: true }
        );
      },
    },
    {
      id: "plan_sequence",
      hint: "Free → Team → Free 순서",
      arm: function (done) {
        var seq = [];
        var need = ["2", "3", "2"];
        document.querySelectorAll("[data-fake]").forEach(function (btn) {
          markHot(btn);
          btn.addEventListener("click", function () {
            if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
            var id = btn.getAttribute("data-fake");
            seq.push(id);
            if (seq.length > 3) seq.shift();
            if (
              seq.length === 3 &&
              seq[0] === need[0] &&
              seq[1] === need[1] &&
              seq[2] === need[2]
            ) {
              seq = [];
              done();
            }
          });
        });
      },
    },
    {
      id: "idle_haunt",
      hint: "가만히 있기 (무입력)",
      arm: function (done) {
        var last = Date.now();
        function bump() {
          last = Date.now();
        }
        ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach(function (ev) {
          window.addEventListener(ev, bump, { passive: true });
        });
        setInterval(function () {
          if (!phase2Ready() || busy() || window.__hauntPhase3Active) {
            last = Date.now();
            return;
          }
          // 힌트 전 20초 / 힌트 후 12초
          var need = missionRevealed ? 12000 : 20000;
          if (Date.now() - last >= need) {
            last = Date.now() + 999999;
            done();
          }
        }, 500);
      },
    },
    {
      id: "type_process",
      hint: "키보드 process",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase2Ready() || busy() || window.__hauntPhase3Active) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-12);
          if (buf.indexOf("process") !== -1) {
            buf = "";
            done();
          }
        });
        armMobileTapAlt(document.getElementById("mainTitle"), 5, done);
      },
    },
    {
      id: "path_hold",
      hint: "상단 경로 문자열 길게",
      arm: function (done) {
        // 2페이즈에서 경로가 숨겨지면 Get started / 로고로 폴백 (힌트 시 재해석)
        armHoldResolved(
          function () {
            return firstInteractable([
              document.getElementById("corruptPath"),
              document.querySelector(".stasis-path-hide"),
              document.getElementById("navCta"),
              document.getElementById("topRec"),
            ]);
          },
          1800,
          done
        );
      },
    },
    {
      id: "badge_hold",
      hint: "상태 뱃지 길게",
      arm: function (done) {
        // stage-corrupt/dread 에서 eyebrow display:none → 큰 제목으로 폴백
        armHoldResolved(
          function () {
            return firstInteractable([
              document.getElementById("eyebrow"),
              document.querySelector(".stasis-badge"),
              document.querySelector("[data-find='badge']"),
              document.getElementById("mainTitle"),
              document.getElementById("topRec"),
            ]);
          },
          1600,
          done
        );
      },
    },
    {
      id: "feat_hold",
      hint: "Features 제목 길게",
      arm: function (done) {
        armHoldResolved(
          function () {
            return firstInteractable([
              document.getElementById("h2log"),
              document.querySelector(".stasis-card-light h2"),
              document.querySelector("[data-find='features']"),
              document.getElementById("mainTitle"),
            ]);
          },
          1600,
          done
        );
      },
    },
    {
      id: "quote_hold",
      hint: "하단 서명 줄 길게",
      arm: function (done) {
        armHoldResolved(
          function () {
            var ban =
              document.getElementById("cardWarn") ||
              document.querySelector(".stasis-quote");
            if (ban) ban.classList.add("p2-trig-banner");
            var el = firstInteractable([
              document.querySelector(".stasis-quote-by"),
              document.querySelector("[data-find='readme']"),
              ban,
            ]);
            if (el && el.classList.contains("stasis-quote-by")) {
              markHot(el, "p2-trig-signature");
            }
            return el;
          },
          1600,
          done
        );
      },
    },
    {
      id: "hit_pulse",
      hint: "깜빡이는 점 더블클릭 (초 짝수)",
      arm: function (done) {
        window.__hauntHitPulseMode = true;
        document.body.classList.add("hit-pulse-mode");
        document.documentElement.classList.add("hit-pulse-mode");
        var clk = document.getElementById("clock");
        if (clk) {
          markHot(clk);
          clk.classList.add("hit-pulse-clock");
        }
        document.addEventListener("haunt-hit-success", function onHit() {
          document.removeEventListener("haunt-hit-success", onHit);
          document.body.classList.remove("hit-pulse-mode");
          document.documentElement.classList.remove("hit-pulse-mode");
          done();
        });
      },
    },
  ];

  var USED_KEY = "haunt_climax_used";
  var CURRENT_KEY = "haunt_climax_trigger"; // 이번 로드 전용 (새로고침 시 재사용 안 함)

  function readUsed() {
    try {
      var raw = localStorage.getItem(USED_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeUsed(arr) {
    try {
      localStorage.setItem(USED_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function markUsed(id) {
    var used = readUsed();
    if (used.indexOf(id) === -1) {
      used.push(id);
      writeUsed(used);
    }
    return used;
  }

  function filterMobilePool(list) {
    if (!isMobileHaunt()) return list.slice();
    return list.filter(function (t) {
      return !DESKTOP_ONLY_IDS[t.id];
    });
  }

  function unusedPool() {
    var used = readUsed();
    var base = filterMobilePool(TRIGGERS);
    var pool = base.filter(function (t) {
      return used.indexOf(t.id) === -1;
    });
    // 다 쓰면 리셋 후 모바일 안전 풀 전체
    if (!pool.length) {
      // used 중 모바일 가능 id만 리셋 대상 — 전체 used 클리어 후 모바일 풀
      writeUsed([]);
      return filterMobilePool(TRIGGERS);
    }
    return pool;
  }

  /**
   * 1) 새로고침마다 새로 뽑음 (session sticky 제거)
   * 2) 이미 뽑힌 트리거는 localStorage 로 제외, 전부 소진 시 리셋
   */
  function pickTrigger() {
    try {
      // 이전 세션 고정값 제거 — 새로고침 = 새 뽑기
      try {
        sessionStorage.removeItem(CURRENT_KEY);
      } catch (e0) {}

      var forced = /[?&]p3=([a-z0-9_]+)/.exec(location.search || "");
      if (forced) {
        for (var i = 0; i < TRIGGERS.length; i++) {
          if (TRIGGERS[i].id === forced[1]) {
            markUsed(forced[1]);
            try {
              sessionStorage.setItem(CURRENT_KEY, forced[1]);
            } catch (e1) {}
            return TRIGGERS[i];
          }
        }
      }

      var pool = unusedPool();
      var pick = pool[(Math.random() * pool.length) | 0];
      markUsed(pick.id);
      try {
        sessionStorage.setItem(CURRENT_KEY, pick.id);
      } catch (e2) {}
      return pick;
    } catch (e) {
      var fb = filterMobilePool(TRIGGERS);
      return fb[(Math.random() * fb.length) | 0];
    }
  }

  var active = pickTrigger();
  var fired = false;
  window.__hauntClimaxTrigger = active.id;
  document.body.setAttribute("data-p3-trigger", active.id);
  document.body.setAttribute(
    "data-p3-remaining",
    String(
      Math.max(
        0,
        TRIGGERS.length -
          readUsed().filter(function (id) {
            return TRIGGERS.some(function (t) {
              return t.id === id;
            });
          }).length
      )
    )
  );

  /** 유저용 미션 힌트 — 힌트가 뜨면 풀 수 있을 만큼 구체적으로 */
  var MISSION = {
    hold_free: "요금제 ‘Free’ 카드(빛나는 테두리)를 길게 누르세요.",
    triple_logo: "왼쪽 위 ‘Stasis’ 로고를 세 번 클릭하세요.",
    type_kill: "키보드로 kill 또는 wake 입력. (또는 빨간 테두리 Team 카드 연타)",
    deep_hold: "페이지 맨 아래까지 스크롤한 뒤 2~3초 머무르세요.",
    team_spam: "‘Team’ 요금 카드를 빠르게 다섯 번 클릭하세요.",
    fakeurl_double: "맨 위 가짜 주소창(URL 바)을 더블클릭하세요.",
    copy_curse: "아무 글이나 드래그해 Ctrl+C. (또는 본문 길게 누르기)",
    wait_triple: "페이지 아래 ‘기다린다’ 문장을 세 번 클릭하세요.",
    beta_quad: "맨 아래 푸터의 beta 글자를 네 번 클릭하세요.",
    version_triple: "맨 아래 푸터 버전(v0.x)을 세 번 클릭하세요.",
    title_mash: "화면 큰 제목을 빠르게 다섯 번 클릭하세요.",
    scroll_bounce: "맨 아래까지 스크롤 → 바로 맨 위로 올리세요.",
    plan_sequence: "요금 카드 순서: Free → Team → Free 클릭.",
    idle_haunt: "마우스·키보드 손 떼고 가만히 계세요. (힌트 후 약 12초)",
    type_process: "키보드로 process 입력. (또는 큰 제목 다섯 번)",
    path_hold: "상단 경로 글자(또는 Get started)를 길게 누르세요.",
    badge_hold:
      "큰 제목(Simple monitoring…)을 길게 누르세요. (2페이즈에선 상단 뱃지 숨김)",
    feat_hold:
      "아래로 스크롤 → Features 카드 큰 제목(// blackbox_log 등)을 길게 누르세요.",
    quote_hold:
      "아래로 스크롤 → 어두운 인용 카드 맨 아랫줄 서명을 길게 누르세요.",
    hit_pulse: "상단 시계가 ·GO(짝수 초)일 때, 빨간 깜빡 점을 더블클릭.",
  };
  var MISSION_MOBILE = {
    type_kill: "빨간 테두리 ‘Team’ 카드를 일곱 번 탭하세요.",
    type_process: "큰 제목을 다섯 번 탭하세요.",
    copy_curse: "본문(설명 문단)을 길게 누르세요.",
    fakeurl_double: "맨 위 가짜 주소창을 빠르게 두 번 탭하세요.",
    path_hold: "상단 경로 글자(또는 Get started)를 길게 누르세요.",
    badge_hold: "큰 제목을 길게 누르세요.",
    quote_hold: "어두운 카드 맨 아랫줄(서명)을 길게 누르세요.",
    hit_pulse: "상단 시계 ·GO 일 때, 빨간 깜빡 점을 두 번 탭하세요.",
    idle_haunt: "손 떼고 가만히. 힌트 후 약 12초.",
  };
  if (isMobileHaunt() && MISSION_MOBILE[active.id]) {
    active.mission = MISSION_MOBILE[active.id];
  } else {
    active.mission = MISSION[active.id] || active.hint || "이상 속에서 다음 층으로 가는 조건을 찾아라.";
  }
  if (isMobileHaunt()) {
    document.documentElement.classList.add("haunt-mobile-opt");
  }

  function onDone() {
    if (fired || busy()) return;
    if (!phase2Ready()) return;
    // 이미 3페이즈면 무시 (클라이맥스는 phase3-triggers)
    if (window.__hauntPhase3Active) return;
    fired = true;
    hideMissionAids();
    hideP2Hint(true);
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p2→p3] gate trigger fired:", active.id);
    }
    tryEnterPhase3Strict();
  }

  // 트리거 장착 (항상 리스너 등록, 발동은 phase2Ready 검사)
  try {
    active.arm(onDone);
  } catch (e) {
    if (window.console) console.warn("[climax] arm failed", active.id, e);
  }

  // ----- 2페이즈 미션 힌트: 방문(세션)당 1회 -----
  var p2Toast = document.getElementById("p2HintToast");
  var p2Text = document.getElementById("p2HintText");
  var p2Close = document.getElementById("p2HintClose");
  var p2Chip = document.getElementById("p2MissionChip");
  var p2HintShown = false;

  function sessionHintKey() {
    return "haunt_p2_hint_" + active.id;
  }

  function alreadyHintedThisSession() {
    try {
      return sessionStorage.getItem(sessionHintKey()) === "1";
    } catch (e) {
      return p2HintShown;
    }
  }

  function markHinted() {
    p2HintShown = true;
    try {
      sessionStorage.setItem(sessionHintKey(), "1");
    } catch (e) {}
  }

  function showP2Hint() {
    if (fired || busy()) return;
    if (!phase2Ready()) return;
    // 일기 연 중에는 미루기 — 닫힌 뒤 다시 시도
    if (document.body.classList.contains("diary-open")) {
      setTimeout(function () {
        if (!fired && phase2Ready() && !busy()) showP2Hint();
      }, 1200);
      return;
    }
    // 힌트가 뜨는 순간부터 타깃 공개 (풀 수 있게)
    revealMissionTargets();
    if (alreadyHintedThisSession()) {
      if (p2Chip) p2Chip.hidden = false;
      return;
    }
    markHinted();
    if (p2Text) {
      p2Text.textContent =
        "2페이즈. 다음 층(3페이즈)으로 가는 조건이 하나 있다. — " + active.mission;
    }
    if (p2Toast) {
      p2Toast.hidden = false;
      p2Toast.classList.add("is-in");
      p2Toast.classList.remove("is-out");
    }
    document.body.classList.add("p2-hint-visible");
    // 자동으로 안 사라지게 조금 길게, 닫으면 칩 남김 (타깃 강조는 유지)
    setTimeout(function () {
      if (p2Toast && !p2Toast.hidden) {
        p2Toast.classList.remove("is-in");
        p2Toast.classList.add("is-out");
        setTimeout(function () {
          if (p2Toast) p2Toast.hidden = true;
          document.body.classList.remove("p2-hint-visible");
          if (p2Chip && !fired) p2Chip.hidden = false;
        }, 400);
      }
    }, 16000);
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[climax] P2 mission hint:", active.id, active.mission);
    }
  }

  function hideP2Hint(all) {
    if (p2Toast) {
      p2Toast.hidden = true;
      p2Toast.classList.remove("is-in");
    }
    document.body.classList.remove("p2-hint-visible");
    if (all && p2Chip) p2Chip.hidden = true;
  }

  function reShowHintFromChip() {
    if (fired || busy() || window.__hauntPhase3Active) return;
    revealMissionTargets();
    if (p2Text) {
      p2Text.textContent = "3페이즈 진입 조건 — " + active.mission;
    }
    if (p2Toast) {
      p2Toast.hidden = false;
      p2Toast.classList.add("is-in");
      p2Toast.classList.remove("is-out");
    }
    document.body.classList.add("p2-hint-visible");
  }

  if (p2Close) {
    p2Close.addEventListener("click", function () {
      hideP2Hint(false);
      if (p2Chip && !fired) p2Chip.hidden = false;
    });
  }
  if (p2Chip) {
    p2Chip.addEventListener("click", function () {
      reShowHintFromChip();
    });
  }

  // 2페이즈 힌트: 진입 직후가 아니라 탐험 시간 뒤 (기본 2분)
  // 3페이즈와 같이 ?hintfast=1 이면 8초
  var P2_HINT_MS = 2 * 60 * 1000;
  if (/[?&]hintfast=1/.test(location.search || "")) P2_HINT_MS = 8000;
  if (/[?&]p2hint=1/.test(location.search || "")) P2_HINT_MS = 5000;

  var p2EnteredAt = 0;
  var p2HintTimer = null;

  function markP2Entered() {
    if (!phase2Ready()) return false;
    if (!p2EnteredAt) {
      p2EnteredAt = Date.now();
      try {
        var saved = sessionStorage.getItem("haunt_p2_entered_at");
        if (saved) {
          var n = parseInt(saved, 10);
          if (!isNaN(n) && n > 0) p2EnteredAt = n;
          else sessionStorage.setItem("haunt_p2_entered_at", String(p2EnteredAt));
        } else {
          sessionStorage.setItem("haunt_p2_entered_at", String(p2EnteredAt));
        }
      } catch (e) {}
    }
    scheduleP2Hint();
    return true;
  }

  function scheduleP2Hint() {
    if (fired || window.__hauntPhase3Active) return;
    if (!phase2Ready()) return;
    // 이미 힌트 본 세션: 칩 + 타깃 공개 유지 (풀 수 있게)
    if (p2HintShown || alreadyHintedThisSession()) {
      revealMissionTargets();
      if (p2Chip && !fired) p2Chip.hidden = false;
      return;
    }
    if (p2HintTimer) return; // 한 번만 예약

    var elapsed = Date.now() - (p2EnteredAt || Date.now());
    var wait = Math.max(0, P2_HINT_MS - elapsed);
    // 일기 연 동안에도 타이머는 가되, showP2Hint 가 diary-open 이면 미룸
    p2HintTimer = setTimeout(function () {
      p2HintTimer = null;
      if (fired || window.__hauntPhase3Active) return;
      if (!phase2Ready() || busy()) {
        // 바쁘면 조금 뒤 재시도
        p2HintTimer = setTimeout(function () {
          p2HintTimer = null;
          if (!fired && phase2Ready() && !busy()) showP2Hint();
        }, 4000);
        return;
      }
      showP2Hint();
    }, wait);

    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log(
        "[climax] P2 hint scheduled in",
        Math.round(wait / 1000) + "s",
        "(delay",
        Math.round(P2_HINT_MS / 1000) + "s)"
      );
    }
  }

  // phase2 진입 감지 → 힌트 예약 (즉시 표시 안 함)
  function watchPhase2() {
    return markP2Entered();
  }
  document.addEventListener("haunt-stage", function (ev) {
    var s = ev && ev.detail && ev.detail.stage;
    if (s >= 2) watchPhase2();
  });
  document.addEventListener("haunt-mood", function (ev) {
    var m = ev && ev.detail && ev.detail.mood;
    if (m >= 3) watchPhase2();
  });
  document.addEventListener("haunt-diary", function () {
    // 일기 닫힌 뒤에 2페이즈가 열리므로, 상태 안정 후 진입 시각 기록
    setTimeout(watchPhase2, 800);
  });
  // 이미 조건을 만족한 채 로드된 경우 — 폴링으로 진입만 감지
  setInterval(function () {
    if (!p2HintShown && !alreadyHintedThisSession() && phase2Ready() && !fired) {
      watchPhase2();
    }
  }, 3000);

  // 공개 빌드: 관리자/프리패스 UI·단축키 없음
  window.__hauntCreatorPass = false;

  // 새로고침 시 이미 3페이즈였으면 복구
  try {
    if (sessionStorage.getItem("haunt_phase3") === "1" && window.__hauntDiaryDiscovered) {
      window.__hauntPhase3Active = true;
      fired = true;
      hideP2Hint(true);
      applyPhase3Visuals({ quiet: true });
      document.body.classList.add("phase3-settled");
    }
  } catch (eRestore) {}

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    var usedNow = readUsed();
    console.log(
      "[climax] this load trigger:",
      active.id,
      "—",
      active.hint,
      "| used",
      usedNow.length + "/" + TRIGGERS.length,
      usedNow,
      "| remaining after this pick",
      unusedPool()
        .filter(function (t) {
          return t.id !== active.id;
        })
        .map(function (t) {
          return t.id;
        })
    );
  }

  window.__hauntClimax = {
    id: active.id,
    hint: active.hint,
    mission: active.mission,
    role: "p2-to-p3-gate",
    all: TRIGGERS.map(function (t) {
      return { id: t.id, hint: t.hint, mission: MISSION[t.id] || t.hint };
    }),
    used: function () {
      return readUsed().slice();
    },
    remaining: function () {
      return unusedPool().map(function (t) {
        return t.id;
      });
    },
    resetUsed: function () {
      writeUsed([]);
      try {
        sessionStorage.removeItem(CURRENT_KEY);
      } catch (e) {}
    },
    showHint: showP2Hint,
    enterPhase3: enterPhase3,
    summon: function () {
      window.__hauntCreatorPass = true;
      window.__hauntDiaryDiscovered = true;
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      if (!window.__hauntPhase3Active) enterPhase3();
      summon();
    },
    phase2Ready: phase2Ready,
  };

  window.__hauntEnterPhase3 = enterPhase3;
})();
