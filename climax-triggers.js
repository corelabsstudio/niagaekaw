/**
 * 2페이즈 → 3페이즈 게이트 트리거
 * - 1페이즈(phase1-flash.js)와 동일한 방식: 후보 20곳 중 하나가 랜덤으로 짧게(~1초) 반짝이다
 *   사라지고, 다음 후보로 옮겨가며 반복. 반짝이는 순간 클릭하면 3페이즈로 진입.
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
          detail: { at: Date.now(), from: "p2-trigger" },
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
      console.log("[phase] entered phase 3 via flash-trigger");
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
   * 2페이즈 후보 20곳 — 1페이즈([data-find])와 동일한 방식의 리졸버 풀.
   * 매 뽑기마다 새로 resolve 하므로, 페이즈 진행으로 숨겨지는 타깃(뱃지 등)도
   * 별도 재바인딩 없이 항상 그 순간 보이는 요소로 연결된다.
   */
  var RESOLVERS = [
    function () {
      return firstInteractable([
        document.getElementById("planFree"),
        document.querySelector(".plan-card.is-on"),
      ]);
    },
    function () {
      return document.getElementById("topRec");
    },
    function () {
      return firstInteractable([
        document.getElementById("planTeam"),
        document.querySelector(".plan-card.danger-btn"),
      ]);
    },
    function () {
      return document.querySelector("footer.foot");
    },
    function () {
      return document.getElementById("planPro");
    },
    function () {
      return document.getElementById("fakeUrlBar");
    },
    function () {
      return firstInteractable([
        document.getElementById("lede"),
        document.querySelector(".stasis-lede"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("resWait"),
        document.querySelector("[data-find='console']"),
      ]);
    },
    function () {
      return document.querySelector(".foot-beta");
    },
    function () {
      return document.querySelector(".foot-micro:not(.foot-beta)");
    },
    function () {
      return document.getElementById("mainTitle");
    },
    function () {
      return firstInteractable([
        document.getElementById("navCta"),
        document.getElementById("topRec"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("planFree"),
        document.getElementById("planTeam"),
      ]);
    },
    function () {
      return document.getElementById("eyebrow");
    },
    function () {
      return firstInteractable([
        document.getElementById("mainTitle"),
        document.getElementById("planTeam"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("corruptPath"),
        document.querySelector(".stasis-path-hide"),
        document.getElementById("navCta"),
        document.getElementById("topRec"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("eyebrow"),
        document.querySelector(".stasis-badge"),
        document.getElementById("mainTitle"),
        document.getElementById("topRec"),
      ]);
    },
    function () {
      return firstInteractable([
        document.getElementById("h2log"),
        document.querySelector(".stasis-card-light h2"),
        document.getElementById("mainTitle"),
      ]);
    },
    function () {
      return firstInteractable([
        document.querySelector(".stasis-quote-by"),
        document.getElementById("cardWarn"),
        document.querySelector(".stasis-quote"),
      ]);
    },
    function () {
      return document.getElementById("clock");
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
    return !phase2Ready() || busy() || !!window.__hauntPhase3Active;
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
      state.activeEl.classList.remove("p2-trig-hot", "find-flash", "find-flash-hit");
      state.activeEl = null;
    }
  }

  function armFlash(el, idx) {
    clearFlash();
    if (!el || blocked()) return;
    markHot(el);
    el.classList.add("p2-trig-hot", "find-flash");
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

  function onDone() {
    if (busy()) return;
    if (!phase2Ready()) return;
    if (window.__hauntPhase3Active) return;
    stop();
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p2→p3] flash trigger clicked");
    }
    tryEnterPhase3Strict();
  }

  function onPointer(ev) {
    if (blocked()) return;
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
    if (state.running || blocked()) return;
    state.running = true;
    scheduleNext(600 + Math.random() * 900);
  }

  function stop() {
    state.running = false;
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    clearFlash();
  }

  function watchPhase2() {
    if (blocked()) {
      stop();
    } else if (!state.running) {
      start();
    }
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
    setTimeout(watchPhase2, 800);
  });
  // 이미 조건을 만족한 채 로드된 경우 대비 폴링 (커스텀 이벤트를 놓친 경우 안전망)
  setInterval(watchPhase2, 2000);

  document.addEventListener("click", onPointer, true);
  document.addEventListener("pointerup", onPointer, true);

  // 공개 빌드: 관리자/프리패스 UI·단축키 없음
  window.__hauntCreatorPass = false;

  // 새로고침 시 이미 3페이즈였으면 복구
  try {
    if (sessionStorage.getItem("haunt_phase3") === "1" && window.__hauntDiaryDiscovered) {
      window.__hauntPhase3Active = true;
      applyPhase3Visuals({ quiet: true });
      document.body.classList.add("phase3-settled");
    }
  } catch (eRestore) {}

  // 이미 phase2Ready 인 채로 로드된 경우 바로 시작
  setTimeout(watchPhase2, 600);

  window.__hauntClimax = {
    role: "p2-to-p3-gate",
    phase2Ready: phase2Ready,
    enterPhase3: enterPhase3,
    status: function () {
      return {
        running: state.running,
        flashCount: state.flashCount,
        poolSize: candidates().length,
      };
    },
    flashNow: pickAndFlash,
    summon: function () {
      window.__hauntCreatorPass = true;
      window.__hauntDiaryDiscovered = true;
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      if (!window.__hauntPhase3Active) enterPhase3();
      summon();
    },
  };

  window.__hauntEnterPhase3 = enterPhase3;
})();
