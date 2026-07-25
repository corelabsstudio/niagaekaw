/**
 * 2페이즈 → 3페이즈 클라이맥스 트리거
 * - 약 20종 풀, 세션마다 1개만 활성 (일기 찾기와 동일 패턴)
 * - phase2Ready: 일기 발견 + stage ≥ 2 (오늘 이후 부패)
 * - 제작자 프리패스: ?summon=1 · ?debug=1 · ?creator=1 · Shift+Alt+3
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

  function summon() {
    if (typeof window.__hauntSummon === "function") {
      window.__hauntSummon();
      return true;
    }
    return false;
  }

  function trySummon() {
    if (busy()) return;
    if (!phase2Ready() && !window.__hauntCreatorPass) {
      // 프리패스만 phase2 없이 허용
      return;
    }
    if (!phase2Ready() && window.__hauntCreatorPass) {
      // creator: force stage if needed
      if (typeof window.__hauntSetStage === "function") {
        try {
          window.__hauntSetStage(3);
        } catch (e) {}
      }
      if (typeof window.__hauntSetMood === "function") {
        try {
          window.__hauntSetMood(4);
        } catch (e) {}
      }
    }
    if (!phase2Ready() && !window.__hauntCreatorPass) return;
    summon();
  }

  function trySummonStrict() {
    if (busy()) return;
    if (!phase2Ready()) return;
    summon();
  }

  // ---------- 20 triggers ----------
  var TRIGGERS = [
    {
      id: "hold_free",
      hint: "Free 버튼을 길게",
      arm: function (done) {
        var btn = document.getElementById("planFree") || document.querySelector(".plan-btn.is-on");
        if (!btn) return;
        var t = null;
        function clear() {
          if (t) clearTimeout(t);
          t = null;
          btn.classList.remove("climax-holding");
        }
        btn.addEventListener("pointerdown", function (e) {
          if (!phase2Ready() || busy()) return;
          e.preventDefault();
          btn.classList.add("climax-holding");
          t = setTimeout(function () {
            clear();
            done();
          }, 2500);
        });
        btn.addEventListener("pointerup", clear);
        btn.addEventListener("pointerleave", clear);
        btn.addEventListener("pointercancel", clear);
      },
    },
    {
      id: "triple_logo",
      hint: "로고 3연타",
      arm: function (done) {
        var el = document.getElementById("topRec");
        if (!el) return;
        var n = 0;
        var tt = null;
        el.addEventListener("click", function (e) {
          if (!phase2Ready() || busy()) return;
          e.preventDefault();
          n++;
          clearTimeout(tt);
          tt = setTimeout(function () {
            n = 0;
          }, 700);
          if (n >= 3) {
            n = 0;
            done();
          }
        });
      },
    },
    {
      id: "type_kill",
      hint: "키보드 kill / wake",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase2Ready() || busy()) return;
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-8);
          if (buf.indexOf("kill") !== -1 || buf.indexOf("wake") !== -1) {
            buf = "";
            done();
          }
        });
      },
    },
    {
      id: "deep_hold",
      hint: "맨 아래 스크롤 유지",
      arm: function (done) {
        var hold = 0;
        var last = 0;
        setInterval(function () {
          if (!phase2Ready() || busy()) {
            hold = 0;
            return;
          }
          var el = document.documentElement;
          var max = el.scrollHeight - el.clientHeight;
          var r = max <= 0 ? 1 : el.scrollTop / max;
          var now = Date.now();
          if (r >= 0.92) {
            if (!last) last = now;
            hold += now - last;
            last = now;
            if (hold >= 4000) {
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
      hint: "Team 버튼 연타",
      arm: function (done) {
        var btn = document.getElementById("planTeam") || document.querySelector(".plan-btn.danger-btn");
        if (!btn) return;
        var n = 0;
        var reset = null;
        btn.addEventListener("click", function () {
          if (!phase2Ready() || busy()) return;
          n++;
          clearTimeout(reset);
          reset = setTimeout(function () {
            n = 0;
          }, 2500);
          if (n >= 5) {
            n = 0;
            done();
          }
        });
      },
    },
    {
      id: "fakeurl_double",
      hint: "가짜 주소창 더블클릭",
      arm: function (done) {
        var bar = document.getElementById("fakeUrlBar");
        if (!bar) return;
        // pointer events
        document.documentElement.classList.add("climax-fakeurl-live");
        bar.style.pointerEvents = "auto";
        var last = 0;
        bar.addEventListener("click", function (e) {
          if (!phase2Ready() || busy()) return;
          e.preventDefault();
          var now = Date.now();
          if (now - last < 400) {
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
          if (!phase2Ready() || busy()) return;
          done();
        });
      },
    },
    {
      id: "console_triple",
      hint: "ship later 줄 3번",
      arm: function (done) {
        var el = document.getElementById("resWait") || document.querySelector("[data-find='console']");
        if (!el) return;
        var n = 0;
        var t = null;
        el.addEventListener("click", function () {
          if (!phase2Ready() || busy()) return;
          n++;
          clearTimeout(t);
          t = setTimeout(function () {
            n = 0;
          }, 2000);
          if (n >= 3) {
            n = 0;
            done();
          }
        });
      },
    },
    {
      id: "wip_quad",
      hint: "푸터 beta 4번",
      arm: function (done) {
        var el =
          document.querySelector("[data-find='wip']") ||
          document.querySelector(".foot-beta") ||
          document.querySelector(".wip-pill");
        if (!el) return;
        var n = 0;
        var t = null;
        el.addEventListener("click", function () {
          if (!phase2Ready() || busy()) return;
          n++;
          clearTimeout(t);
          t = setTimeout(function () {
            n = 0;
          }, 2500);
          if (n >= 4) {
            n = 0;
            done();
          }
        });
      },
    },
    {
      id: "branch_triple",
      hint: "푸터 버전 3번",
      arm: function (done) {
        var el =
          document.querySelector("[data-find='branch']") ||
          document.querySelector(".foot-micro:not(.foot-beta)") ||
          document.querySelector(".wip-git code");
        if (!el) return;
        var n = 0;
        var t = null;
        el.addEventListener("click", function () {
          if (!phase2Ready() || busy()) return;
          n++;
          clearTimeout(t);
          t = setTimeout(function () {
            n = 0;
          }, 2500);
          if (n >= 3) {
            n = 0;
            done();
          }
        });
      },
    },
    {
      id: "title_mash",
      hint: "제목 5연타",
      arm: function (done) {
        var el = document.getElementById("mainTitle");
        if (!el) return;
        var n = 0;
        var t = null;
        el.addEventListener("click", function () {
          if (!phase2Ready() || busy()) return;
          n++;
          clearTimeout(t);
          t = setTimeout(function () {
            n = 0;
          }, 1800);
          if (n >= 5) {
            n = 0;
            done();
          }
        });
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
            if (!phase2Ready() || busy()) return;
            var el = document.documentElement;
            var max = el.scrollHeight - el.clientHeight;
            var r = max <= 0 ? 1 : el.scrollTop / max;
            if (r >= 0.9) {
              sawDeep = true;
              deepAt = Date.now();
            }
            if (sawDeep && r <= 0.12 && Date.now() - deepAt < 3500) {
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
          btn.addEventListener("click", function () {
            if (!phase2Ready() || busy()) return;
            var id = btn.getAttribute("data-fake");
            seq.push(id);
            if (seq.length > 3) seq.shift();
            if (seq.length === 3 && seq[0] === need[0] && seq[1] === need[1] && seq[2] === need[2]) {
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
          if (!phase2Ready() || busy()) {
            last = Date.now();
            return;
          }
          if (Date.now() - last >= 35000) {
            last = Date.now() + 999999;
            done();
          }
        }, 1000);
      },
    },
    {
      id: "type_process",
      hint: "키보드 process",
      arm: function (done) {
        var buf = "";
        document.addEventListener("keydown", function (e) {
          if (!phase2Ready() || busy()) return;
          if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
          buf = (buf + e.key.toLowerCase()).slice(-12);
          if (buf.indexOf("process") !== -1) {
            buf = "";
            done();
          }
        });
      },
    },
    {
      id: "caret_hold",
      hint: "헤드라인 주석 길게",
      arm: function (done) {
        var el = document.querySelector("[data-find='caret']") || document.querySelector(".wip-cursor-line");
        if (!el) return;
        var t = null;
        function clear() {
          if (t) clearTimeout(t);
          t = null;
        }
        el.addEventListener("pointerdown", function () {
          if (!phase2Ready() || busy()) return;
          t = setTimeout(function () {
            clear();
            done();
          }, 2000);
        });
        el.addEventListener("pointerup", clear);
        el.addEventListener("pointerleave", clear);
      },
    },
    {
      id: "mid_linger",
      hint: "페이지 중반에서 머물기",
      arm: function (done) {
        var hold = 0;
        var last = 0;
        setInterval(function () {
          if (!phase2Ready() || busy()) {
            hold = 0;
            last = 0;
            return;
          }
          var el = document.documentElement;
          var max = el.scrollHeight - el.clientHeight;
          var r = max <= 0 ? 0.5 : el.scrollTop / max;
          var now = Date.now();
          if (r >= 0.35 && r <= 0.62) {
            if (!last) last = now;
            hold += now - last;
            last = now;
            if (hold >= 6000) {
              hold = 0;
              done();
            }
          } else {
            last = 0;
            hold = Math.max(0, hold - 300);
          }
        }, 200);
      },
    },
    {
      id: "focus_flap",
      hint: "탭 밖으로 나갔다 3번",
      arm: function (done) {
        var n = 0;
        document.addEventListener("visibilitychange", function () {
          if (!phase2Ready() || busy()) return;
          if (document.hidden) n++;
          else if (n >= 3) {
            n = 0;
            done();
          }
        });
      },
    },
    {
      id: "esc_enter",
      hint: "Esc 다음 Enter",
      arm: function (done) {
        var armed = false;
        var t = null;
        document.addEventListener("keydown", function (e) {
          if (!phase2Ready() || busy()) return;
          if (e.key === "Escape") {
            armed = true;
            clearTimeout(t);
            t = setTimeout(function () {
              armed = false;
            }, 2500);
          } else if ((e.key === "Enter" || e.keyCode === 13) && armed) {
            armed = false;
            done();
          }
        });
      },
    },
    {
      id: "hit_pulse",
      hint: "깜빡이는 점 더블클릭 (초 짝수)",
      arm: function (done) {
        // app.js 히트존 펄스를 이 트리거일 때만 켬
        window.__hauntHitPulseMode = true;
        document.addEventListener("haunt-hit-success", function onHit() {
          document.removeEventListener("haunt-hit-success", onHit);
          done();
        });
      },
    },
    {
      id: "readme_hold",
      hint: "last edit 줄 길게",
      arm: function (done) {
        var el = document.querySelector("[data-find='readme']") || document.querySelector(".stasis-quote-by");
        if (!el) return;
        var t = null;
        function clear() {
          if (t) clearTimeout(t);
          t = null;
        }
        el.addEventListener("pointerdown", function () {
          if (!phase2Ready() || busy()) return;
          t = setTimeout(function () {
            clear();
            done();
          }, 2200);
        });
        el.addEventListener("pointerup", clear);
        el.addEventListener("pointerleave", clear);
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

  function unusedPool() {
    var used = readUsed();
    var pool = TRIGGERS.filter(function (t) {
      return used.indexOf(t.id) === -1;
    });
    // 20개 다 쓰면 리셋 후 다시 전체
    if (!pool.length) {
      writeUsed([]);
      return TRIGGERS.slice();
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
      return TRIGGERS[(Math.random() * TRIGGERS.length) | 0];
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

  /** 유저용 미션 힌트 (세션당 1회 토스트) — 너무 노골적이지 않게 */
  var MISSION = {
    hold_free: "요금제 중 ‘Free’… 잠깐 누르고 있어 봐.",
    triple_logo: "맨 위 브랜드 이름. 세 번.",
    type_kill: "키보드. 끝내는 말, 또는 다시 깨우는 말.",
    deep_hold: "페이지 맨 아래. 거기서 조금 더 머물러.",
    team_spam: "‘Team’ 이라 적힌 버튼. 여러 번.",
    fakeurl_double: "화면 맨 위, 가짜 주소창. 두 번.",
    copy_curse: "아무 글이나 복사해 봐. (Ctrl+C)",
    console_triple: "console.log 한 줄. 세 번 눌러.",
    wip_quad: "노란 WIP. 네 번.",
    branch_triple: "브랜치 이름 코드. 세 번.",
    title_mash: "큰 제목. 빠르게 여러 번.",
    scroll_bounce: "맨 아래까지 갔다가, 빨리 맨 위로.",
    plan_sequence: "Free → Team → 다시 Free.",
    idle_haunt: "아무 것도 하지 마. 가만히.",
    type_process: "키보드로 process.",
    caret_hold: "헤드라인 아래 // 주석. 길게.",
    mid_linger: "스크롤 중간쯤. 거기서 기다려.",
    focus_flap: "다른 탭으로 나갔다 와. 몇 번.",
    esc_enter: "Esc, 그다음 Enter.",
    hit_pulse: "화면 어딘가 희미한 점. 짝수 초에 더블클릭.",
    readme_hold: "last edit 줄. 길게 눌러.",
  };
  active.mission = MISSION[active.id] || active.hint || "이상 속에서 탈출 조건을 찾아라.";

  function onDone() {
    if (fired || busy()) return;
    if (!phase2Ready()) return;
    fired = true;
    hideP2Hint(true);
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[climax] trigger fired:", active.id);
    }
    trySummonStrict();
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
    if (alreadyHintedThisSession()) {
      // 이미 봤으면 칩만
      if (p2Chip) p2Chip.hidden = false;
      return;
    }
    markHinted();
    if (p2Text) {
      p2Text.textContent =
        "이상 구간이다. 탈출 조건이 하나 있다. — " + active.mission;
    }
    if (p2Toast) {
      p2Toast.hidden = false;
      p2Toast.classList.add("is-in");
      p2Toast.classList.remove("is-out");
    }
    document.body.classList.add("p2-hint-visible");
    // 자동으로 안 사라지게 조금 길게, 닫으면 칩 남김
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
    }, 12000);
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
    if (fired || busy()) return;
    if (p2Text) {
      p2Text.textContent = "탈출 조건 — " + active.mission;
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

  // phase2 진입 감지 → 힌트 1회
  function watchPhase2() {
    if (phase2Ready()) {
      // 일기 닫고 메인 볼 때 보이도록 약간 딜레이
      setTimeout(function () {
        if (phase2Ready() && !busy() && !fired) showP2Hint();
      }, 1800);
      return true;
    }
    return false;
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
    setTimeout(watchPhase2, 500);
  });
  // 이미 조건을 만족한 채 로드된 경우
  setInterval(function () {
    if (!p2HintShown && !alreadyHintedThisSession() && phase2Ready() && !busy() && !fired) {
      watchPhase2();
    }
  }, 3000);

  // 제작자 프리패스
  function isCreator() {
    try {
      if (/[?&](debug|creator|summon)=1/.test(location.search || "")) return true;
      if (localStorage.getItem("haunt_creator") === "1") return true;
    } catch (e) {}
    return false;
  }

  window.__hauntCreatorPass = isCreator();

  if (window.__hauntCreatorPass) {
    try {
      if (/[?&]creator=1/.test(location.search || "")) {
        localStorage.setItem("haunt_creator", "1");
      }
    } catch (e) {}

    var badge = document.createElement("div");
    badge.className = "creator-pass creator-p3";
    badge.innerHTML =
      "<strong>P3 PASS</strong> trigger: <code>" +
      active.id +
      "</code><br/><button type='button' class='p3-go'>▶ 클라이맥스</button>";
    badge.title = "제작자 프리패스";
    document.body.appendChild(badge);
    var go = badge.querySelector(".p3-go");
    if (go) {
      go.addEventListener("click", function (e) {
        e.stopPropagation();
        fired = false;
        window.__hauntCreatorPass = true;
        if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
        if (typeof window.__hauntSetMood === "function") window.__hauntSetMood(4);
        // diary flag for gate
        window.__hauntDiaryDiscovered = true;
        summon();
      });
    }
    badge.addEventListener("click", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("p3-go")) return;
      // click badge body: show hint only
    });
  }

  // Shift+Alt+3 = freepass summon
  document.addEventListener("keydown", function (e) {
    if (e.shiftKey && e.altKey && (e.key === "3" || e.code === "Digit3")) {
      e.preventDefault();
      window.__hauntCreatorPass = true;
      window.__hauntDiaryDiscovered = true;
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      summon();
    }
  });

  if (/[?&]summon=1/.test(location.search || "")) {
    setTimeout(function () {
      window.__hauntCreatorPass = true;
      window.__hauntDiaryDiscovered = true;
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      summon();
    }, 500);
  }

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
    summon: function () {
      window.__hauntCreatorPass = true;
      window.__hauntDiaryDiscovered = true;
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(3);
      summon();
    },
    phase2Ready: phase2Ready,
  };
})();
