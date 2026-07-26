/**
 * 3페이즈 → 클라이맥스 트리거
 * - 별도 20종 풀 (2페이즈 게이트 트리거와 분리)
 * - phase3Ready: __hauntPhase3Active (2페이즈 게이트 통과 후)
 * - 힌트: 3페이즈 진입 후 5분 (300s). ?hintfast=1 이면 8초
 * - 공개 빌드 (관리자 프리패스 없음)
 */
(function () {
  "use strict";

  function stage() {
    if (typeof window.__hauntStage === "function") return window.__hauntStage();
    return parseInt(document.body.getAttribute("data-stage") || "0", 10) || 0;
  }

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

  var DESKTOP_ONLY_IDS = {
    type_stasis: 1,
    type_wakeagain: 1,
    type_escape: 1,
    arrow_sigil: 1,
    space_ritual: 1,
    select_all_curse: 1,
  };

  var missionRevealed = false;
  var hotTargets = [];

  function markHot(el, extraClass) {
    if (!el) return null;
    el.classList.add("p2-trig-hot", "p3-trig-hot");
    if (extraClass) el.classList.add(extraClass);
    el.style.pointerEvents = "auto";
    el.style.cursor = "pointer";
    try {
      el.setAttribute("tabindex", "0");
    } catch (e0) {}
    try {
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) {
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
    var g = document.getElementById("p3TypeGuide");
    if (!g) {
      g = document.createElement("div");
      g.id = "p3TypeGuide";
      g.className = "p2-type-guide p3-type-guide";
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
    var g = document.getElementById("p3ScrollCue");
    if (!g) {
      g = document.createElement("div");
      g.id = "p3ScrollCue";
      g.className = "p2-scroll-cue";
      document.body.appendChild(g);
    }
    if (kind === "top") {
      g.textContent = "↑ 맨 위로 · 잠시 머무르기";
      g.className = "p2-scroll-cue is-on is-top";
    } else if (kind === "idle") {
      g.textContent = "손 떼고 가만히…";
      g.className = "p2-scroll-cue is-on is-center";
    } else {
      g.className = "p2-scroll-cue";
    }
    g.hidden = false;
  }

  function hideMissionAids() {
    var g = document.getElementById("p3TypeGuide");
    if (g) {
      g.classList.remove("is-on");
      g.hidden = true;
    }
    var s = document.getElementById("p3ScrollCue");
    if (s) {
      s.classList.remove("is-on");
      s.hidden = true;
    }
    document.body.classList.remove("trig-hint-live", "p3-trig-reveal");
    document.documentElement.classList.remove("trig-hint-live");
  }

  function revealMissionTargets() {
    missionRevealed = true;
    window.__hauntP3HintRevealed = true;
    document.body.classList.add("trig-hint-live", "p3-trig-reveal");
    document.documentElement.classList.add("trig-hint-live");
    var id = active && active.id;
    if (id === "type_stasis") showTypeGuide("stasis");
    else if (id === "type_wakeagain") showTypeGuide("wakeagain");
    else if (id === "type_escape") showTypeGuide("escape");
    else if (id === "arrow_sigil") showTypeGuide("↑ ↑ ↓ ↓");
    else if (id === "space_ritual") showTypeGuide("Space × 12");
    else if (id === "select_all_curse") showTypeGuide("Ctrl+A");
    else if (id === "top_hold") showScrollCue("top");
    else if (id === "long_idle") showScrollCue("idle");
    var hot = hotTargets[0] || document.querySelector(".p3-trig-hot, .p2-trig-hot");
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

  function armHoldEl(el, ms, done, holdClass) {
    if (!el) return false;
    markHot(el);
    var t = null;
    var cls = holdClass || "p3-holding";
    function clear() {
      if (t) clearTimeout(t);
      t = null;
      el.classList.remove(cls);
    }
    el.addEventListener("pointerdown", function (e) {
      if (!phase3Ready() || busy()) return;
      if (e.button != null && e.button !== 0) return;
      try {
        e.preventDefault();
      } catch (err) {}
      el.classList.add(cls);
      var holdFor = missionRevealed ? Math.min(ms, 1600) : ms;
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

  function armTapEl(el, need, windowMs, done) {
    if (!el) return false;
    markHot(el, "mobile-trig-alt");
    var n = 0;
    var reset = null;
    var win = windowMs || 2500;
    if (isMobileHaunt()) win = Math.max(win, 3000);
    el.addEventListener("click", function () {
      if (!phase3Ready() || busy()) return;
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

  function summon() {
    if (typeof window.__hauntSummon === "function") {
      window.__hauntSummon();
      return true;
    }
    return false;
  }

  // ---------- 20 NEW climax-unlock triggers (2페이즈 게이트와 다른 동작) ----------
  var TRIGGERS = [
    {
      id: "logo_hold",
      hint: "로고 길게",
      arm: function (done) {
        armHoldEl(document.getElementById("topRec"), 3000, done);
      },
    },
    {
      id: "type_stasis",
      hint: "키보드 stasis",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase3Ready() || busy()) return;
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-12);
          if (buf.indexOf("stasis") !== -1) {
            buf = "";
            done();
          }
        });
        // 모바일: 로고 6연타
        armTapEl(document.getElementById("topRec"), 6, 3200, done);
      },
    },
    {
      id: "type_wakeagain",
      hint: "키보드 wakeagain",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase3Ready() || busy()) return;
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-16);
          if (buf.indexOf("wakeagain") !== -1) {
            buf = "";
            done();
          }
        });
        // 모바일: Get started 6연타
        armTapEl(document.getElementById("navCta"), 6, 3200, done);
      },
    },
    {
      id: "cta_hold",
      hint: "Get started 길게",
      arm: function (done) {
        var btn = document.getElementById("navCta");
        armHoldEl(btn, 2500, done);
      },
    },
    {
      id: "pro_spam",
      hint: "Pro 카드 연타",
      arm: function (done) {
        var btn = document.getElementById("planPro");
        if (!btn) return;
        try {
          btn.disabled = false;
          btn.removeAttribute("disabled");
        } catch (e) {}
        markHot(btn);
        armTapEl(btn, 7, 3200, done);
      },
    },
    {
      id: "docs_triple",
      hint: "Docs 3연타",
      arm: function (done) {
        var el = document.querySelector("[data-find='docs']") || document.querySelector(".pill-dead");
        armTapEl(el, 3, 2800, done);
      },
    },
    {
      id: "pricing_hold",
      hint: "Pricing 길게",
      arm: function (done) {
        var el = document.querySelector("[data-find='todo']") || document.querySelector(".pill-todo");
        armHoldEl(el, 2200, done);
      },
    },
    {
      id: "monitor_quad",
      hint: "모니터 프레임 4번",
      arm: function (done) {
        var el =
          document.querySelector(".monitor-frame") ||
          document.querySelector(".stasis-monitor-card") ||
          document.querySelector(".stasis-card-dark");
        armTapEl(el, 4, 3000, done);
      },
    },
    {
      id: "badge_mash",
      hint: "상단 뱃지 5연타",
      arm: function (done) {
        var el = document.getElementById("eyebrow") || document.querySelector(".stasis-badge");
        if (!el || getComputedStyle(el).display === "none" || el.offsetParent === null) {
          el = document.getElementById("mainTitle") || document.getElementById("topRec");
        }
        armTapEl(el, 5, 2500, done);
      },
    },
    {
      id: "title_hold",
      hint: "제목 길게",
      arm: function (done) {
        armHoldEl(document.getElementById("mainTitle"), 2800, done);
      },
    },
    {
      id: "beta_hold",
      hint: "푸터 beta 길게",
      arm: function (done) {
        var el =
          document.querySelector("[data-find='wip']") ||
          document.querySelector(".foot-beta");
        armHoldEl(el, 2000, done);
      },
    },
    {
      id: "version_spam",
      hint: "버전 숫자 5번",
      arm: function (done) {
        var el =
          document.querySelector("[data-find='branch']") ||
          document.querySelector(".foot-micro:not(.foot-beta)");
        armTapEl(el, 5, 3200, done);
      },
    },
    {
      id: "top_hold",
      hint: "맨 위 스크롤 유지",
      arm: function (done) {
        var hold = 0;
        var last = 0;
        setInterval(function () {
          if (!phase3Ready() || busy()) {
            hold = 0;
            last = 0;
            return;
          }
          var el = document.documentElement;
          var max = el.scrollHeight - el.clientHeight;
          var r = max <= 0 ? 0 : el.scrollTop / max;
          var now = Date.now();
          var thr = missionRevealed ? 0.1 : 0.06;
          var need = missionRevealed ? 2500 : 3500;
          if (r <= thr) {
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
      id: "type_escape",
      hint: "키보드 escape",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase3Ready() || busy()) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-10);
          if (buf.indexOf("escape") !== -1) {
            buf = "";
            done();
          }
        });
        // 모바일: Free 카드 8연타
        var free =
          document.getElementById("planFree") ||
          document.querySelector("[data-fake='2']");
        armTapEl(free, 8, 3500, done);
      },
    },
    {
      id: "arrow_sigil",
      hint: "↑↑↓↓ 화살표",
      arm: function (done) {
        var need = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown"];
        var seq = [];
        document.addEventListener("keydown", function (e) {
          if (!phase3Ready() || busy()) return;
          if (need.indexOf(e.key) === -1) {
            seq = [];
            return;
          }
          seq.push(e.key);
          if (seq.length > need.length) seq.shift();
          if (seq.length === need.length) {
            var ok = true;
            for (var i = 0; i < need.length; i++) {
              if (seq[i] !== need[i]) ok = false;
            }
            if (ok) {
              seq = [];
              done();
            }
          }
        });
        // 터치/클릭 대체: Free → Free → Team → Team (데스크톱 힌트 후에도 가능)
        var seqM = [];
        var needM = ["2", "2", "3", "3"];
        document.querySelectorAll("[data-fake]").forEach(function (btn) {
          markHot(btn, "mobile-trig-alt");
          btn.addEventListener("click", function () {
            if (!phase3Ready() || busy()) return;
            var id = btn.getAttribute("data-fake");
            if (id !== "2" && id !== "3") return;
            seqM.push(id);
            if (seqM.length > 4) seqM.shift();
            if (
              seqM.length === 4 &&
              seqM[0] === needM[0] &&
              seqM[1] === needM[1] &&
              seqM[2] === needM[2] &&
              seqM[3] === needM[3]
            ) {
              seqM = [];
              done();
            }
          });
        });
      },
    },
    {
      id: "space_ritual",
      hint: "스페이스 12번",
      arm: function (done) {
        var n = 0;
        var t = null;
        document.addEventListener("keydown", function (e) {
          if (!phase3Ready() || busy()) return;
          if (e.code !== "Space" && e.key !== " ") return;
          try {
            e.preventDefault();
          } catch (err) {}
          n++;
          clearTimeout(t);
          t = setTimeout(function () {
            n = 0;
          }, missionRevealed ? 6000 : 4500);
          var need = missionRevealed ? 8 : 12;
          if (n >= need) {
            n = 0;
            done();
          }
        });
        // 클릭 대체 (모바일·데스크톱)
        armTapEl(document.getElementById("mainTitle"), isMobileHaunt() ? 12 : 8, 5000, done);
      },
    },
    {
      id: "features_hold",
      hint: "Features 라벨 길게",
      arm: function (done) {
        var el =
          document.querySelector("[data-find='features']") ||
          document.getElementById("h2log");
        armHoldEl(el, 2000, done);
      },
    },
    {
      id: "quote_double",
      hint: "다크 배너 더블클릭",
      arm: function (done) {
        var el =
          document.getElementById("cardWarn") ||
          document.querySelector(".stasis-quote");
        if (!el) return;
        markHot(el, "mobile-trig-alt");
        var last = 0;
        var dblMs = isMobileHaunt() ? 700 : 500;
        el.addEventListener("click", function () {
          if (!phase3Ready() || busy()) return;
          var now = Date.now();
          if (now - last < dblMs) {
            last = 0;
            done();
          } else last = now;
        });
      },
    },
    {
      id: "select_all_curse",
      hint: "전체 선택 (Ctrl+A)",
      arm: function (done) {
        document.addEventListener("keydown", function (e) {
          if (!phase3Ready() || busy()) return;
          if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
            done();
          }
        });
        var quote =
          document.getElementById("cardWarn") ||
          document.querySelector(".stasis-quote") ||
          document.getElementById("mainTitle");
        armHoldEl(quote, 2000, done);
      },
    },
    {
      id: "long_idle",
      hint: "오래 가만히 (무입력)",
      arm: function (done) {
        var last = Date.now();
        function bump() {
          last = Date.now();
        }
        ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach(function (ev) {
          window.addEventListener(ev, bump, { passive: true });
        });
        setInterval(function () {
          if (!phase3Ready() || busy()) {
            last = Date.now();
            return;
          }
          // 힌트 전 25초 / 힌트 후 15초
          var need = missionRevealed ? 15000 : 25000;
          if (Date.now() - last >= need) {
            last = Date.now() + 999999;
            done();
          }
        }, 1000);
      },
    },
  ];

  var USED_KEY = "haunt_p3_climax_used";
  var CURRENT_KEY = "haunt_p3_climax_trigger";
  var ENTERED_AT_KEY = "haunt_p3_entered_at";

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
    if (!pool.length) {
      writeUsed([]);
      return filterMobilePool(TRIGGERS);
    }
    return pool;
  }

  function pickTrigger() {
    try {
      try {
        sessionStorage.removeItem(CURRENT_KEY);
      } catch (e0) {}

      var forced = /[?&]p3t=([a-z0-9_]+)/.exec(location.search || "");
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
  window.__hauntPhase3Trigger = active.id;
  document.body.setAttribute("data-p3-climax-trigger", active.id);

  var MISSION = {
    logo_hold: "왼쪽 위 ‘Stasis’ 로고를 길게 누르세요.",
    type_stasis: "키보드로 stasis 입력. (또는 로고 연타)",
    type_wakeagain: "키보드로 wakeagain 입력. (또는 Get started 연타)",
    cta_hold: "‘Get started’ 버튼을 길게 누르세요.",
    pro_spam: "‘Pro’ 요금 카드를 일곱 번 클릭하세요.",
    docs_triple: "상단 내비 ‘Docs’를 세 번 클릭하세요.",
    pricing_hold: "상단 내비 ‘Pricing’을 길게 누르세요.",
    monitor_quad: "모니터/다크 카드 프레임을 네 번 클릭하세요.",
    badge_mash: "상태 뱃지(또는 큰 제목)를 다섯 번 클릭하세요.",
    title_hold: "큰 제목을 길게 누르세요.",
    beta_hold: "맨 아래 푸터 beta를 길게 누르세요.",
    version_spam: "맨 아래 푸터 버전 숫자를 다섯 번 클릭하세요.",
    top_hold: "맨 위로 스크롤한 뒤 2~3초 머무르세요.",
    type_escape: "키보드로 escape 입력. (또는 Free 카드 연타)",
    arrow_sigil: "화살표 ↑↑↓↓ 또는 Free→Free→Team→Team.",
    space_ritual: "스페이스를 여러 번 (힌트 후 8회). 또는 제목 연타.",
    features_hold: "Features 쪽 제목을 길게 누르세요.",
    quote_double: "어두운 인용 배너를 더블클릭하세요.",
    select_all_curse: "Ctrl+A 전체 선택. (또는 어두운 배너 길게)",
    long_idle: "손 떼고 가만히. (힌트 후 약 15초)",
  };
  var MISSION_MOBILE = {
    type_stasis: "왼쪽 위 로고를 여섯 번 탭하세요.",
    type_wakeagain: "Get started를 여섯 번 탭하세요.",
    type_escape: "Free 요금 카드를 여덟 번 탭하세요.",
    arrow_sigil: "Free → Free → Team → Team 순서.",
    space_ritual: "큰 제목을 열두 번 탭하세요.",
    select_all_curse: "어두운 인용 배너를 길게 누르세요.",
    badge_mash: "큰 제목을 빠르게 다섯 번 탭하세요.",
    quote_double: "어두운 인용 배너를 두 번 탭하세요.",
    long_idle: "손 떼고 가만히. 힌트 후 약 15초.",
  };
  if (isMobileHaunt() && MISSION_MOBILE[active.id]) {
    active.mission = MISSION_MOBILE[active.id];
  } else {
    active.mission = MISSION[active.id] || active.hint || "마지막 조건을 찾아라.";
  }

  function onDone() {
    if (fired || busy()) return;
    if (!phase3Ready()) return;
    fired = true;
    hideMissionAids();
    hideP3Hint(true);
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p3→climax] trigger fired:", active.id);
    }
    // 클라이맥스 직전 플래시
    document.body.classList.add("phase3-climax-arm");
    setTimeout(function () {
      document.body.classList.remove("phase3-climax-arm");
      summon();
    }, 280);
  }

  try {
    active.arm(onDone);
  } catch (e) {
    if (window.console) console.warn("[p3] arm failed", active.id, e);
  }

  // ----- 3페이즈 힌트: 진입 후 5분 -----
  var p3Toast = document.getElementById("p3HintToast");
  var p3Text = document.getElementById("p3HintText");
  var p3Close = document.getElementById("p3HintClose");
  var p3Chip = document.getElementById("p3MissionChip");
  var p3HintShown = false;
  var HINT_MS = 5 * 60 * 1000; // 5분
  if (/[?&]hintfast=1/.test(location.search || "")) HINT_MS = 8000;
  if (/[?&]p3hint=1/.test(location.search || "")) HINT_MS = 3000;

  function sessionHintKey() {
    return "haunt_p3_hint_" + active.id;
  }

  function alreadyHinted() {
    try {
      return sessionStorage.getItem(sessionHintKey()) === "1";
    } catch (e) {
      return p3HintShown;
    }
  }

  function markHinted() {
    p3HintShown = true;
    try {
      sessionStorage.setItem(sessionHintKey(), "1");
    } catch (e) {}
  }

  function getEnteredAt() {
    try {
      var v = sessionStorage.getItem(ENTERED_AT_KEY);
      if (v) return parseInt(v, 10) || 0;
    } catch (e) {}
    return 0;
  }

  function setEnteredAt(ts) {
    try {
      sessionStorage.setItem(ENTERED_AT_KEY, String(ts || Date.now()));
    } catch (e) {}
  }

  function showP3Hint() {
    if (fired || busy()) return;
    if (!phase3Ready()) return;
    if (document.body.classList.contains("diary-open")) {
      setTimeout(function () {
        if (!fired && phase3Ready() && !busy()) showP3Hint();
      }, 1200);
      return;
    }
    // 힌트 순간부터 타깃 공개
    revealMissionTargets();
    if (alreadyHinted()) {
      if (p3Chip) p3Chip.hidden = false;
      return;
    }
    markHinted();
    if (p3Text) {
      p3Text.textContent =
        "3페이즈. 클라이맥스 조건이 하나 있다. — " + active.mission;
    }
    if (p3Toast) {
      p3Toast.hidden = false;
      p3Toast.classList.add("is-in");
      p3Toast.classList.remove("is-out");
    }
    document.body.classList.add("p3-hint-visible");
    setTimeout(function () {
      if (p3Toast && !p3Toast.hidden) {
        p3Toast.classList.remove("is-in");
        p3Toast.classList.add("is-out");
        setTimeout(function () {
          if (p3Toast) p3Toast.hidden = true;
          document.body.classList.remove("p3-hint-visible");
          if (p3Chip && !fired) p3Chip.hidden = false;
        }, 400);
      }
    }, 16000);
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p3] mission hint:", active.id, active.mission);
    }
  }

  function hideP3Hint(all) {
    if (p3Toast) {
      p3Toast.hidden = true;
      p3Toast.classList.remove("is-in");
    }
    document.body.classList.remove("p3-hint-visible");
    if (all && p3Chip) p3Chip.hidden = true;
  }

  function reShowFromChip() {
    if (fired || busy()) return;
    revealMissionTargets();
    if (p3Text) p3Text.textContent = "클라이맥스 조건 — " + active.mission;
    if (p3Toast) {
      p3Toast.hidden = false;
      p3Toast.classList.add("is-in");
      p3Toast.classList.remove("is-out");
    }
    document.body.classList.add("p3-hint-visible");
  }

  if (p3Close) {
    p3Close.addEventListener("click", function () {
      hideP3Hint(false);
      if (p3Chip && !fired) p3Chip.hidden = false;
    });
  }
  if (p3Chip) {
    p3Chip.addEventListener("click", function () {
      reShowFromChip();
    });
  }

  var hintTimer = null;
  function scheduleHintFromEntry() {
    if (hintTimer) clearTimeout(hintTimer);
    if (!phase3Ready() || fired) return;
    if (alreadyHinted()) {
      revealMissionTargets();
      if (p3Chip && !fired) p3Chip.hidden = false;
      return;
    }
    var entered = getEnteredAt();
    if (!entered) {
      entered = Date.now();
      setEnteredAt(entered);
    }
    var wait = Math.max(0, HINT_MS - (Date.now() - entered));
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[p3] hint in", Math.round(wait / 1000) + "s", "trigger", active.id);
    }
    // 대기 중 미세 칩: 힌트 전엔 숨김. 5분 후 토스트.
    hintTimer = setTimeout(function () {
      if (!fired && phase3Ready() && !busy()) showP3Hint();
    }, wait);
  }

  function onPhase3Enter() {
    if (!getEnteredAt()) setEnteredAt(Date.now());
    document.body.classList.add("phase-3-active");
    document.body.setAttribute("data-game-phase", "3");
    // 2페이즈 칩 숨김
    var p2Chip = document.getElementById("p2MissionChip");
    if (p2Chip) p2Chip.hidden = true;
    var p2Toast = document.getElementById("p2HintToast");
    if (p2Toast) p2Toast.hidden = true;
    scheduleHintFromEntry();
    // 진입 토스트 (힌트 아님 — 층이 바뀌었다는 신호만)
    showLayerToast();
  }

  function showLayerToast() {
    if (busy()) return;
    var el = document.getElementById("p3LayerToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "p3LayerToast";
      el.className = "p3-layer-toast";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML =
        '<span class="p3-layer-tag">PHASE 3</span><p>더 깊은 층이다. 아직 끝나지 않았다.</p>';
      document.body.appendChild(el);
    }
    el.classList.add("is-on");
    setTimeout(function () {
      el.classList.remove("is-on");
    }, 4200);
  }

  document.addEventListener("haunt-phase3", function () {
    onPhase3Enter();
  });

  // 이미 phase3 복구된 로드
  if (phase3Ready()) {
    setTimeout(onPhase3Enter, 400);
  }

  // 늦게 진입하는 경우 폴링
  setInterval(function () {
    if (phase3Ready() && !getEnteredAt()) {
      onPhase3Enter();
    }
  }, 1500);

  // 공개 빌드: 관리자 프리패스 / p3fire / 단축키 제거

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log(
      "[p3-climax] trigger:",
      active.id,
      "—",
      active.hint,
      "| hint after",
      HINT_MS / 1000 + "s in phase3",
      "| used",
      readUsed().length + "/" + TRIGGERS.length
    );
  }

  window.__hauntPhase3 = {
    id: active.id,
    hint: active.hint,
    mission: active.mission,
    ready: phase3Ready,
    hintMs: HINT_MS,
    showHint: showP3Hint,
    fire: function () {
      if (!phase3Ready()) {
        window.__hauntPhase3Active = true;
        document.body.classList.add("phase-3-active");
      }
      fired = false;
      onDone();
    },
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
  };
})();
