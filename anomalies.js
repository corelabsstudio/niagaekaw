/**
 * 메인 페이지 랜덤 이상현상 엔진
 * ★ 전부 2페이즈 전용 ★
 *   - 1페이즈(일기 찾기 / clean~uneasy): 발동 안 함
 *   - 2페이즈(일기 오늘 이후 stage≥2, 부패·이상·트리거 탐색): 여기서만
 *   - 3페이즈(클라이맥스 is-haunting) / 엔딩: 중단
 * - 피 흘림, 감시자, 글리치, WakeAgain 섬광 등 포함
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // reduced-motion: 무거운 연출 스킵하되 API 스텁은 남겨 다른 모듈 TypeError 방지
  if (reduced) {
    window.__hauntAnomalies = {
      pool: [],
      all: [],
      fire: function () {},
      flash: function () {
        return false;
      },
      phase2Active: function () {
        return false;
      },
      disabled: true,
      reason: "prefers-reduced-motion",
    };
    return;
  }

  function stage() {
    var s = window.__hauntStage ? window.__hauntStage() : 0;
    if (typeof s !== "number") {
      s = parseInt(document.body.getAttribute("data-stage") || "0", 10) || 0;
    }
    return s;
  }

  /** 2페이즈 활성 여부 — 이상현상 전부 이 조건 */
  function phase2Active() {
    if (!window.__hauntDiaryDiscovered) return false;
    if (stage() < 2) return false;
    if (document.body.classList.contains("is-haunting")) return false;
    if (document.body.classList.contains("is-ending")) return false;
    return true;
  }

  /** CSS 게이트용 — FX 띄우기 직전 반드시 on */
  function markPhase2Ui() {
    if (!phase2Active()) return false;
    document.body.classList.add("phase-2-active");
    return true;
  }

  /** 3페이즈: 이상현상 더 자주 */
  function phase3Boost() {
    return !!(
      window.__hauntPhase3Active ||
      document.body.classList.contains("phase-3-active")
    );
  }

  function stageReady() {
    return phase2Active();
  }

  function mood() {
    var m = window.__hauntMood ? window.__hauntMood() : 0;
    if (typeof m !== "number") {
      m = parseInt(document.body.getAttribute("data-mood") || "0", 10) || 0;
    }
    return m;
  }

  var mobile =
    document.documentElement.classList.contains("is-mobile") ||
    (window.matchMedia && window.matchMedia("(max-width: 720px)").matches);

  function getSeed() {
    try {
      var s = sessionStorage.getItem("haunt_anom_seed");
      if (s) return parseInt(s, 10) || Date.now();
      s = String((Math.random() * 1e9) | 0);
      sessionStorage.setItem("haunt_anom_seed", s);
      return parseInt(s, 10);
    } catch (e) {
      return (Math.random() * 1e9) | 0;
    }
  }

  var seed = getSeed();
  function rng() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function pickN(arr, n) {
    var copy = arr.slice();
    var out = [];
    while (out.length < n && copy.length) {
      var i = Math.floor(rng() * copy.length);
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }

  function busy() {
    return (
      document.body.classList.contains("is-haunting") ||
      document.body.classList.contains("is-ending") ||
      /* 일기 읽는 중 body filter/transform 이상현상 → fixed 패널 붕괴 방지 */
      document.body.classList.contains("diary-open")
    );
  }

  function runMs(fn, ms) {
    if (busy() || !phase2Active()) return;
    try {
      fn(true);
    } catch (e) {}
    setTimeout(function () {
      try {
        fn(false);
      } catch (e) {}
    }, ms);
  }

  function audio() {
    return window.__hauntAudio || null;
  }

  /**
   * 찰나 섬광 — 중앙 WakeAgain (1~2프레임 ≈ 33~66ms)
   * 원칙: 정말 가끔 · 불시 · 예측 불가 (세뇌형 각인)
   * - 전역 쿨다운 18~90초 랜덤
   * - 글리치 붙임 확률 매우 낮음
   * - 별도 ambient 스케줄러가 긴 간격으로만 단독 발동
   */
  var lastFlashAt = 0;
  var flashCooldownUntil = 0;
  var flashCount = 0;

  function canFlash(force) {
    if (force) return true;
    if (busy() || !stageReady()) return false;
    return Date.now() >= flashCooldownUntil;
  }

  function armFlashCooldown() {
    // 다음 섬광까지: 기본 28~95초, 횟수 늘수록 조금 더 뜸해짐
    var base = 28000 + rng() * 67000;
    if (flashCount >= 2) base += 12000 + rng() * 20000;
    if (flashCount >= 4) base += 15000 + rng() * 25000;
    flashCooldownUntil = Date.now() + base;
  }

  function flashWakeAgain(opts) {
    opts = opts || {};
    if (!canFlash(opts.force)) return false;
    if (busy() && !opts.force) return false;
    if (!stageReady() && !opts.force) return false;

    var el = document.getElementById("wakeFlash");
    if (!el) {
      el = document.createElement("div");
      el.id = "wakeFlash";
      el.className = "wake-flash";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = '<span class="wake-flash-text">WakeAgain</span>';
      document.body.appendChild(el);
    }
    var text = el.querySelector(".wake-flash-text");
    var mode = opts.mode || (rng() > 0.45 ? "blood" : "neon");
    el.classList.remove("is-blood", "is-neon", "is-on", "is-burn");
    el.classList.add(mode === "neon" ? "is-neon" : "is-blood");
    if (rng() > 0.45) el.classList.add("is-burn");
    if (text) {
      text.style.setProperty("--wf-x", (rng() * 6 - 3).toFixed(1) + "px");
      text.style.setProperty("--wf-y", (rng() * 4 - 2).toFixed(1) + "px");
      text.style.setProperty("--wf-skew", (rng() * 4 - 2).toFixed(1) + "deg");
    }
    void el.offsetWidth;
    el.classList.add("is-on");
    var ms = opts.ms != null ? opts.ms : 34 + Math.floor(rng() * 30); // 34~63ms
    setTimeout(function () {
      el.classList.remove("is-on");
    }, ms);
    // 섬광 = 청각 스팅
    try {
      var au = audio();
      if (au && au.sting && !opts.silent) {
        au.sting(mode === "neon" ? "neon" : "blood");
      }
    } catch (e) {}

    lastFlashAt = Date.now();
    flashCount++;
    armFlashCooldown();

    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log(
        "[wake-flash]",
        mode,
        ms + "ms",
        "next≥" + Math.round((flashCooldownUntil - Date.now()) / 1000) + "s",
        "#" + flashCount
      );
    }
    return true;
  }

  /**
   * 다른 글리치에 붙는 섬광 — 기본 확률 낮음 + 쿨다운 존중
   * chance 기본 ~0.06 (예전 0.3~0.5 대비 대폭 하향)
   */
  function maybeFlashAfter(chance) {
    if (!canFlash(false)) return;
    if (rng() > (chance != null ? chance : 0.06)) return;
    // 글리치 직후가 아니라 0.2~2.8초 뒤 불시 발동 (예측 더 어렵게)
    var delay = 200 + rng() * 2600;
    setTimeout(function () {
      if (!canFlash(false) || busy()) return;
      // 지연 뒤에도 한 번 더 거절 (진짜 가끔)
      if (rng() > 0.55) return;
      flashWakeAgain();
    }, delay);
  }

  /** 완전 독립 ambient — 긴 랜덤 간격, 이상현상 루프와 무관 */
  function scheduleSparseFlash() {
    // 첫 섬광도 최소 25~70초 뒤 — decay 높을수록 더 자주
    var d =
      typeof window.__hauntP2Decay === "function"
        ? window.__hauntP2Decay()
        : parseInt(document.body.getAttribute("data-p2-decay") || "0", 10) || 0;
    var wait = 25000 + rng() * 45000;
    if (flashCount === 0) wait = 35000 + rng() * 55000;
    wait *= Math.max(0.35, 1 - d * 0.12);
    setTimeout(function () {
      if (stageReady() && !busy() && canFlash(false)) {
        // decay 높을수록 스킵 적음
        var skipThr = 0.48 - d * 0.06;
        if (rng() > skipThr) {
          // 지직 없이 순수 섬광, 또는 아주 약한 static
          if (rng() > 0.6) {
            document.body.classList.add("anom-static");
            setTimeout(function () {
              document.body.classList.remove("anom-static");
            }, 80);
          }
          flashWakeAgain();
          // 드물게만 2프레임
          if (rng() > 0.82) {
            setTimeout(function () {
              if (canFlash(true) && !busy()) {
                // force 는 쿨다운 무시하면 안 됨 — 대신 같은 연출 내 잔상만
                var el = document.getElementById("wakeFlash");
                if (el) {
                  el.classList.add("is-on");
                  setTimeout(function () {
                    el.classList.remove("is-on");
                  }, 32 + Math.floor(rng() * 18));
                }
              }
            }, 45);
          }
        }
      }
      scheduleSparseFlash();
    }, wait);
  }

  /**
   * 2페이즈 핵심: 글자에서 피 흘림 (참조 이미지 톤)
   * 히어로 타이틀 우선 · 굵은 줄기 · 하단 웅덩이 · 느린 닦기
   */
  function runTextBlood(opts) {
    opts = opts || {};
    if (busy()) return false;
    if (!markPhase2Ui()) return false;

    var prefer = opts.preferHero !== false;
    var forceMulti = opts.multi !== false; // 히어로 + 플랜/카드 동시
    var nodes = [];
    if (prefer) {
      var hero = document.getElementById("mainTitle");
      if (hero && (hero.textContent || "").trim()) nodes.push(hero);
      var lede = document.querySelector(".stasis-lede");
      if (lede && (lede.textContent || "").trim()) nodes.push(lede);
    }
    document
      .querySelectorAll(
        ".stasis-h1, .plan-card, .plan-btn, .card-horror h2, .stasis-feat-list li, .eyebrow, .stasis-quote-text, .stasis-badge"
      )
      .forEach(function (n) {
        if (nodes.indexOf(n) === -1) nodes.push(n);
      });
    if (!nodes.length) return false;

    // 히어로 필수 + 추가 1~2개
    var targets = [];
    if (prefer && nodes[0] && nodes[0].id === "mainTitle") {
      targets.push(nodes[0]);
    }
    if (forceMulti) {
      var extras = nodes.filter(function (n) {
        return targets.indexOf(n) === -1 && n.dataset.bleeding !== "1";
      });
      var extraN = mobile ? 1 : 1 + Math.floor(rng() * 2);
      pickN(extras, Math.min(extraN, extras.length)).forEach(function (n) {
        targets.push(n);
      });
    }
    if (!targets.length) {
      var el0 = nodes[Math.floor(rng() * Math.min(nodes.length, 4))];
      if (el0) targets.push(el0);
    }

    var made = 0;
    targets.forEach(function (el, ti) {
      if (!el || el.dataset.bleeding === "1") return;
      if (!(el.textContent || "").trim()) return;
      if (bleedOne(el, ti === 0)) made++;
    });
    return made > 0;

    function bleedOne(el, isHero) {
      el.dataset.bleeding = "1";
      el.classList.add("anom-bleeding");
      if (isHero) el.classList.add("anom-bleeding-hero");

      var rect0 = el.getBoundingClientRect();
      if (rect0.width < 8 || rect0.height < 4) {
        el.classList.remove("anom-bleeding", "anom-bleeding-hero");
        delete el.dataset.bleeding;
        return false;
      }

      var layer = document.createElement("div");
      layer.className = "anom-blood-layer anom-blood-slow" + (isHero ? " is-hero" : "");
      layer.setAttribute("aria-hidden", "true");
      layer.style.position = "fixed";
      layer.style.left = Math.max(0, rect0.left - 8) + "px";
      layer.style.top = Math.max(0, rect0.top - 4) + "px";
      layer.style.width = rect0.width + 16 + "px";
      // 참조처럼 글자 아래 길게 흘러내림
      var dropH = isHero
        ? Math.min(window.innerHeight * 0.55, Math.max(rect0.height + 220, 280))
        : Math.min(rect0.height + 160, Math.max(rect0.height * 2.4, 140));
      layer.style.height = dropH + "px";
      layer.style.pointerEvents = "none";
      layer.style.zIndex = isHero ? "60" : "58";
      layer.style.overflow = "visible";

      var veil = document.createElement("div");
      veil.className = "anom-blood-veil";
      layer.appendChild(veil);

      var streakN = mobile ? (isHero ? 7 : 4) : isHero ? 14 : 8;
      for (var s = 0; s < streakN; s++) {
        var st = document.createElement("span");
        st.className = "anom-blood-streak";
        st.style.left = 4 + rng() * 90 + "%";
        st.style.animationDelay = 0.05 + s * 0.08 + "s";
        layer.appendChild(st);
      }

      function syncLayer() {
        if (!layer.parentNode) return;
        var rect = el.getBoundingClientRect();
        layer.style.left = Math.max(0, rect.left - 8) + "px";
        layer.style.top = Math.max(0, rect.top - 4) + "px";
        layer.style.width = rect.width + 16 + "px";
        layer.style.height =
          (isHero
            ? Math.min(window.innerHeight * 0.55, Math.max(rect.height + 220, 280))
            : Math.min(rect.height + 160, Math.max(rect.height * 2.4, 140))) + "px";
      }

      function addDrip(kind) {
        if (!layer.parentNode || busy()) return;
        syncLayer();
        var d = document.createElement("span");
        d.className = "anom-blood-drip" + (kind ? " " + kind : "");
        d.style.left = 2 + rng() * 94 + "%";
        d.style.animationDuration = 3.6 + rng() * 4.2 + "s";
        var baseH = kind === "thick" ? 110 : kind === "thin" ? 48 : 72;
        d.style.height = baseH + rng() * (isHero ? 140 : 90) + "px";
        if (kind === "thick") d.style.width = 7 + rng() * 6 + "px";
        layer.appendChild(d);
      }

      document.body.appendChild(layer);

      var dripCount = mobile ? (isHero ? 14 : 8) : isHero ? 26 : 14;
      for (var i = 0; i < dripCount; i++) {
        (function (idx) {
          setTimeout(function () {
            var k = rng() > 0.4 ? "thick" : rng() > 0.35 ? "" : "thin";
            addDrip(k);
          }, 40 + idx * (isHero ? 90 : 160));
        })(i);
      }
      // 추가 파동 — 참조 이미지처럼 계속 흐름
      [1800, 3600, 5500, 7800].forEach(function (ms) {
        setTimeout(function () {
          if (!layer.parentNode || busy()) return;
          addDrip("thick");
          addDrip("thick");
          addDrip("");
          addDrip("thin");
        }, ms);
      });

      var pool = document.createElement("div");
      pool.className = "anom-blood-pool";
      layer.appendChild(pool);

      var splat = document.createElement("div");
      splat.className = "anom-blood-splat";
      layer.appendChild(splat);

      var hand = document.createElement("div");
      hand.className = "anom-blood-hand";
      hand.classList.add(rng() > 0.5 ? "wipe-ltr" : "wipe-rtl");
      layer.appendChild(hand);

      var a = audio();
      if (a && isHero) {
        if (a.pulse) a.pulse("mid");
        setTimeout(function () {
          if (a.hddScratch) a.hddScratch();
        }, 400);
      }

      var dripMs = isHero ? 14000 + rng() * 2000 : 9000 + rng() * 1500;
      var wipeMs = 2600;
      var afterMs = 1600;

      function onScrollOrResize() {
        syncLayer();
      }
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize);

      function cleanup() {
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
        el.classList.remove("anom-bleeding", "anom-bleeding-hero", "anom-blood-smear");
        delete el.dataset.bleeding;
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }

      setTimeout(function () {
        if (busy() || !layer.parentNode) {
          cleanup();
          return;
        }
        layer.classList.add("is-wiping");
        hand.classList.add("is-wiping");
        if (a && a.hddScratch) a.hddScratch();

        setTimeout(function () {
          layer.classList.add("is-cleared");
          el.classList.remove("anom-bleeding", "anom-bleeding-hero");
          el.classList.add("anom-blood-smear");
        }, wipeMs * 0.5);

        setTimeout(cleanup, wipeMs + afterMs);
      }, dripMs);

      if (window.console && /[?&]debug=1/.test(location.search || "")) {
        console.log("[blood-text]", el.id || el.className, "hero", isHero, "drips", dripCount);
      }
      return true;
    }
  }

  // ---------- 기존 + 신규 이상현상 ----------
  var ALL = [
    // ===== 기존 =====
    {
      id: "red_flash",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-red-flash", on);
        }, 90 + rng() * 110);
        maybeFlashAfter(0.08);
      },
    },
    {
      id: "screen_shake",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-shake", on);
        }, mobile ? 260 : 420);
        maybeFlashAfter(0.05);
      },
    },
    {
      id: "hue_spike",
      run: function () {
        // body.style.filter 인라인 금지 → fixed UI 붕괴 + diary-open 덮어쓰기 위험
        // CSS 변수 + 클래스로 처리
        var deg = 50 + Math.floor(rng() * 140);
        document.body.style.setProperty("--anom-hue", deg + "deg");
        runMs(
          function (on) {
            document.body.classList.toggle("anom-hue-spike", on);
            if (!on) document.body.style.removeProperty("--anom-hue");
          },
          140 + rng() * 160
        );
        maybeFlashAfter(0.06);
      },
    },
    {
      id: "invert_blink",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-invert", on);
        }, 70 + rng() * 80);
        maybeFlashAfter(0.07);
      },
    },
    {
      id: "grayscale_drain",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-gray", on);
        }, 400 + rng() * 280);
      },
    },
    {
      id: "skew_tear",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-skew", on);
        }, 120 + rng() * 120);
      },
    },
    {
      id: "zoom_pulse",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-zoom", on);
        }, 160 + rng() * 120);
      },
    },
    {
      id: "static_burst",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-static", on);
        }, 220 + rng() * 220);
        maybeFlashAfter(0.07);
      },
    },
    {
      id: "vignette_crush",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-vignette", on);
        }, 520 + rng() * 380);
      },
    },
    {
      id: "title_glitch",
      run: function () {
        var h = document.querySelector(".title-horror");
        if (!h) return;
        runMs(function (on) {
          h.classList.toggle("anom-title", on);
        }, 280 + rng() * 280);
      },
    },
    {
      id: "card_jitter",
      run: function () {
        var cards = document.querySelectorAll(".card-horror");
        if (!cards.length) return;
        var c = cards[Math.floor(rng() * cards.length)];
        runMs(function (on) {
          c.classList.toggle("anom-card-jitter", on);
        }, 320 + rng() * 240);
      },
    },
    {
      id: "scroll_jolt",
      run: function () {
        if (busy()) return;
        var dy = (rng() > 0.5 ? 1 : -1) * (50 + Math.floor(rng() * 100));
        window.scrollBy(0, dy);
        setTimeout(function () {
          if (!busy()) window.scrollBy(0, -Math.floor(dy * 0.65));
        }, 90);
      },
    },
    {
      id: "clock_lie",
      run: function () {
        var clock = document.getElementById("clock");
        if (!clock) return;
        var real = clock.textContent;
        var fake =
          String(Math.floor(rng() * 24)).padStart(2, "0") +
          ":" +
          String(Math.floor(rng() * 60)).padStart(2, "0") +
          ":" +
          String(Math.floor(rng() * 60)).padStart(2, "0");
        clock.textContent = fake;
        clock.classList.add("anom-clock");
        setTimeout(function () {
          clock.textContent = real;
          clock.classList.remove("anom-clock");
        }, 500 + rng() * 500);
      },
    },
    {
      id: "path_scream",
      run: function () {
        var path = document.getElementById("corruptPath");
        if (!path) return;
        var base = path.textContent;
        path.textContent = "HELP_ME_HELP_ME_HELP_ME_\\\\.\\\\.\\\\.";
        path.classList.add("anom-path");
        setTimeout(function () {
          path.textContent = base;
          path.classList.remove("anom-path");
        }, 220 + rng() * 240);
      },
    },
    {
      id: "button_scatter",
      run: function () {
        var wrap = document.querySelector(".fake-actions");
        if (!wrap) return;
        runMs(function (on) {
          wrap.classList.toggle("anom-scatter", on);
        }, 420 + rng() * 280);
      },
    },
    {
      id: "ghost_banner",
      run: function () {
        var el = document.getElementById("anomGhostBanner");
        if (!el) {
          el = document.createElement("div");
          el.id = "anomGhostBanner";
          el.className = "anom-ghost-banner";
          el.setAttribute("aria-hidden", "true");
          document.body.appendChild(el);
        }
        var msgs = [
          "still running",
          "you left me here",
          "FINAL2",
          "don't close the tab",
          "process orphaned",
          "I see the cursor",
          "99%",
          "behind you",
          "WakeAgain",
          "WAKE AGAIN",
        ];
        el.textContent = msgs[Math.floor(rng() * msgs.length)];
        el.classList.add("show");
        setTimeout(function () {
          el.classList.remove("show");
        }, 700 + rng() * 500);
      },
    },
    {
      id: "double_vision",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-double", on);
        }, 140 + rng() * 140);
      },
    },
    {
      id: "letter_space",
      run: function () {
        var h = document.querySelector(".title-horror");
        if (!h) return;
        runMs(function (on) {
          h.classList.toggle("anom-tracking", on);
        }, 380 + rng() * 240);
      },
    },
    {
      id: "blood_pulse",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-blood", on);
        }, 450 + rng() * 300);
      },
    },
    {
      id: "hide_chunk",
      run: function () {
        var cards = document.querySelectorAll(".card-horror p, .log li");
        if (!cards.length) return;
        var el = cards[Math.floor(rng() * cards.length)];
        runMs(function (on) {
          el.classList.toggle("anom-hide", on);
        }, 280 + rng() * 340);
      },
    },
    {
      id: "mirror_flip",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-mirror", on);
        }, 80 + rng() * 70);
      },
    },
    {
      id: "cursor_bleed",
      run: function () {
        var n = mobile ? 6 : 12;
        for (var i = 0; i < n; i++) {
          (function (delay) {
            setTimeout(function () {
              if (busy()) return;
              var d = document.createElement("div");
              d.className = "anom-cursor-dot";
              d.style.left = rng() * 100 + "%";
              d.style.top = rng() * 100 + "%";
              document.body.appendChild(d);
              setTimeout(function () {
                if (d.parentNode) d.parentNode.removeChild(d);
              }, 500);
            }, delay);
          })(i * 35);
        }
      },
    },

    // ===== 신규: Visual & UI =====
    {
      id: "text_erode",
      run: function () {
        if (busy()) return;
        var nodes = document.querySelectorAll(
          ".stasis-lede .morph, .card-horror p.morph, .stasis-feat-list .morph-li, .wip-readme-body"
        );
        if (!nodes.length) return;
        var el = nodes[Math.floor(rng() * nodes.length)];
        if (!el || el.dataset.eroding === "1") return;
        var orig = el.innerHTML;
        var plain = el.textContent || "";
        var words = plain.split(/(\s+)/);
        if (words.length < 3) return;
        var repl = ["[오류]", "[삭제됨]", "███", "버려진", "still_here", "나중에", "HELP", "WakeAgain"];
        var hits = 0;
        for (var i = 0; i < words.length; i++) {
          if (/^\s+$/.test(words[i])) continue;
          if (words[i].length < 2) continue;
          if (rng() > 0.55) continue;
          words[i] = repl[Math.floor(rng() * repl.length)];
          hits++;
          if (hits >= 3 + Math.floor(rng() * 3)) break;
        }
        if (!hits) return;
        el.dataset.eroding = "1";
        el.classList.add("anom-erode");
        el.textContent = words.join("");
        setTimeout(function () {
          el.innerHTML = orig;
          el.classList.remove("anom-erode");
          delete el.dataset.eroding;
        }, 2200 + rng() * 1800);
      },
    },
    {
      id: "text_blood_wipe",
      run: function () {
        runTextBlood({ preferHero: true });
      },
    },
    {
      id: "watcher_behind",
      run: function () {
        /**
         * 2페이즈 전용 — 주변시 실루엣 (까만 얼굴/눈 금지)
         * 가장자리 어두운 사람 형태가 잠시 서 있다가 녹듯 사라짐
         */
        if (busy()) return;
        if (!phase2Active()) return;
        var w = document.getElementById("anomWatcher");
        if (!w) {
          w = document.createElement("div");
          w.id = "anomWatcher";
          w.className = "anom-watcher";
          w.setAttribute("aria-hidden", "true");
          w.innerHTML =
            '<div class="aw-sil"></div><div class="aw-haze"></div>';
          document.body.appendChild(w);
        }
        if (w.classList.contains("is-on") || w.classList.contains("is-leaving")) return;

        var side = rng() > 0.5 ? "left" : "right";
        w.className = "anom-watcher";
        w.classList.add(side === "left" ? "side-left" : "side-right");
        if (rng() > 0.5) w.classList.add("is-deep");
        // decay 높을수록 조금 더 또렷 (그래도 얼굴 디테일 없음)
        var d =
          typeof window.__hauntP2Decay === "function"
            ? window.__hauntP2Decay()
            : parseInt(document.body.getAttribute("data-p2-decay") || "0", 10) || 0;
        if (d >= 4) w.classList.add("is-near");

        void w.offsetWidth;
        w.classList.add("is-on");

        var sil = w.querySelector(".aw-sil");
        var tracking = !mobile && !!sil;

        function track(e) {
          if (!tracking || !w.classList.contains("is-on") || busy()) return;
          var cx = window.innerWidth / 2;
          var dx = (e.clientX - cx) / cx;
          // 아주 미세한 기울임만 — 눈이 커서 쫓아가는 연출 금지
          if (sil) {
            sil.style.transform =
              "translateX(" + (dx * 4).toFixed(1) + "px) scaleY(1.02)";
          }
        }
        if (tracking) document.addEventListener("mousemove", track);

        var leaveModes = ["fade", "sink", "slide", "dissolve"];
        var leaveMode = leaveModes[Math.floor(rng() * leaveModes.length)];
        var stareMs = 1800 + rng() * 2200;

        function finishLeave() {
          tracking = false;
          document.removeEventListener("mousemove", track);
          w.classList.remove("is-on");
          w.classList.add("is-out");
          setTimeout(function () {
            w.className = "anom-watcher";
            if (sil) sil.style.transform = "";
          }, 1200);
        }

        function beginLeave() {
          if (busy()) {
            finishLeave();
            return;
          }
          tracking = false;
          document.removeEventListener("mousemove", track);
          if (sil) sil.style.transform = "";
          w.classList.add("is-leaving", "leave-" + leaveMode);
          setTimeout(finishLeave, leaveMode === "dissolve" ? 1100 : 900);
        }

        setTimeout(beginLeave, stareMs);
        maybeFlashAfter(0.02);
      },
    },
    {
      id: "cursor_scorch_trail",
      run: function () {
        // 짧은 시간 실제 마우스 궤적 잔상 + 섬광 각인
        if (busy() || mobile) return;
        maybeFlashAfter(0.06);
        var left = 18 + Math.floor(rng() * 10);
        function onMove(e) {
          if (busy() || left <= 0) return;
          if (rng() > 0.45) return;
          left--;
          var d = document.createElement("div");
          d.className = "anom-scorch";
          d.style.left = e.clientX + "px";
          d.style.top = e.clientY + "px";
          document.body.appendChild(d);
          setTimeout(function () {
            if (d.parentNode) d.parentNode.removeChild(d);
          }, 380 + rng() * 200);
        }
        document.addEventListener("mousemove", onMove);
        setTimeout(function () {
          document.removeEventListener("mousemove", onMove);
        }, 2800 + rng() * 1200);
      },
    },
    {
      id: "wake_flash",
      run: function () {
        // 풀에 있어도 쿨다운/확률로 자주 안 터짐
        if (busy()) return;
        if (!canFlash(false)) return;
        if (rng() > 0.4) return; // 뽑혀도 60% 스킵
        document.body.classList.add("anom-static");
        var ok = flashWakeAgain({ ms: 36 + Math.floor(rng() * 26) });
        if (ok && rng() > 0.85) {
          setTimeout(function () {
            var el = document.getElementById("wakeFlash");
            if (!el || busy()) return;
            el.classList.add("is-on");
            setTimeout(function () {
              el.classList.remove("is-on");
            }, 30 + Math.floor(rng() * 16));
          }, 48);
        }
        setTimeout(function () {
          document.body.classList.remove("anom-static");
        }, 100 + rng() * 60);
      },
    },
    {
      id: "scrollbar_creep",
      run: function () {
        if (busy()) return;
        var y = window.scrollY || document.documentElement.scrollTop || 0;
        var dy = 1 + Math.floor(rng() * 2);
        window.scrollTo(0, y + dy);
        setTimeout(function () {
          if (!busy()) window.scrollTo(0, y);
        }, 180 + rng() * 220);
      },
    },
    {
      id: "viewport_squeeze",
      run: function () {
        // 실제 창 resize 불가 → inset 테두리로 조여오는 연출
        runMs(function (on) {
          document.documentElement.classList.toggle("anom-squeeze", on);
          document.body.classList.toggle("anom-squeeze", on);
        }, 1600 + rng() * 1400);
      },
    },
    {
      id: "loading_99_reverse",
      run: function () {
        if (busy()) return;
        var el = document.getElementById("anomLoadGauge");
        if (!el) {
          el = document.createElement("div");
          el.id = "anomLoadGauge";
          el.className = "anom-load-gauge";
          el.innerHTML =
            '<span class="lg-label">build</span><span class="lg-bar"><i></i></span><span class="lg-pct">99%</span>';
          document.body.appendChild(el);
        }
        el.classList.add("show");
        var pctEl = el.querySelector(".lg-pct");
        var bar = el.querySelector(".lg-bar i");
        var p = 99;
        if (bar) bar.style.width = "99%";
        var t = setInterval(function () {
          if (busy()) {
            clearInterval(t);
            el.classList.remove("show");
            return;
          }
          p -= 1 + Math.floor(rng() * 3);
          if (p < 0) p = 0;
          if (pctEl) pctEl.textContent = p + "%";
          if (bar) bar.style.width = p + "%";
          if (p <= 0) {
            clearInterval(t);
            setTimeout(function () {
              el.classList.remove("show");
              if (pctEl) pctEl.textContent = "99%";
              if (bar) bar.style.width = "99%";
            }, 400);
          }
        }, 90 + rng() * 40);
      },
    },
    {
      id: "button_dodge",
      run: function () {
        if (busy() || mobile) return;
        // .diary-next 제외 — 일기 UI 조작을 방해하면 진행 버그로 느껴짐
        var btns = document.querySelectorAll(
          ".stasis-cta, .plan-btn.is-on, .btn.ghost:not(.diary-next):not(.diary-close)"
        );
        if (!btns.length) return;
        var btn = btns[Math.floor(rng() * btns.length)];
        if (!btn || btn.disabled) return;
        var ox = 0;
        var oy = 0;
        var endAt = Date.now() + 4500;
        function flee(e) {
          if (Date.now() > endAt || busy()) return;
          var r = btn.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dx = e.clientX - cx;
          var dy = e.clientY - cy;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist > 120) return;
          ox += (-dx / dist) * (18 + rng() * 22);
          oy += (-dy / dist) * (12 + rng() * 16);
          ox = Math.max(-80, Math.min(80, ox));
          oy = Math.max(-50, Math.min(50, oy));
          btn.style.transform = "translate(" + ox + "px," + oy + "px)";
          btn.classList.add("anom-dodge");
        }
        document.addEventListener("mousemove", flee);
        setTimeout(function () {
          document.removeEventListener("mousemove", flee);
          btn.style.transform = "";
          btn.classList.remove("anom-dodge");
        }, 4500);
      },
    },
    {
      id: "header_bleed_reveal",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-header-bleed", on);
        }, 2200 + rng() * 1600);
      },
    },
    {
      id: "dead_gray_wash",
      run: function () {
        runMs(function (on) {
          document.body.classList.toggle("anom-dead-gray", on);
        }, 2800 + rng() * 2000);
        // 잿빛 속 섬광 — 드물게만
        if (rng() > 0.78) {
          setTimeout(function () {
            if (!busy() && canFlash(false)) flashWakeAgain({ mode: "neon", ms: 42 });
          }, 600 + rng() * 1400);
        }
      },
    },

    // ===== 신규: Narrative & Text =====
    {
      id: "terminal_log_crawl",
      run: function () {
        if (busy()) return;
        var box = document.getElementById("anomTermLog");
        if (!box) {
          box = document.createElement("div");
          box.id = "anomTermLog";
          box.className = "anom-term-log";
          box.setAttribute("aria-hidden", "true");
          document.body.appendChild(box);
        }
        var lines = [
          "Error: process cannot be terminated",
          "> kill -9 failed · permission denied",
          "> author_id = unknown",
          "> heartbeat from /dev/null",
          "> still listening :3847",
          "> you left the tab open",
          "> write to journal: forced",
          "> I am not a bug report",
          "> brand imprint: WakeAgain",
          "> echo WakeAgain >> memory",
        ];
        box.innerHTML = "";
        box.classList.add("show");
        var i = 0;
        var iv = setInterval(function () {
          if (busy() || i >= lines.length) {
            clearInterval(iv);
            setTimeout(function () {
              box.classList.remove("show");
            }, 800);
            return;
          }
          var p = document.createElement("div");
          p.textContent = lines[i++];
          box.appendChild(p);
          box.scrollTop = box.scrollHeight;
          var a = audio();
          if (a && a.typeClick && rng() > 0.4) a.typeClick("soft");
        }, 380);
      },
    },
    {
      id: "avatar_hollow",
      run: function () {
        // 프로필 없으면 가짜 아바타 생성 후 눈 지움
        if (busy()) return;
        var av = document.getElementById("anomAvatar");
        if (!av) {
          av = document.createElement("div");
          av.id = "anomAvatar";
          av.className = "anom-avatar";
          av.innerHTML =
            '<div class="av-face"><span class="av-eye l"></span><span class="av-eye r"></span></div><span class="av-name">local_dev</span>';
          document.body.appendChild(av);
        }
        av.classList.add("show");
        setTimeout(function () {
          av.classList.add("hollow");
        }, 600);
        setTimeout(function () {
          av.classList.remove("show", "hollow");
        }, 3200 + rng() * 1000);
      },
    },
    {
      id: "diary_sneak_peek",
      run: function () {
        if (busy() || document.body.classList.contains("diary-open")) return;
        var peek = document.getElementById("anomDiaryPeek");
        if (!peek) {
          peek = document.createElement("div");
          peek.id = "anomDiaryPeek";
          peek.className = "anom-diary-peek";
          peek.innerHTML =
            '<p class="dp-tag">dev_journal.txt</p><p class="dp-body">코드가 지워지지 않는다… 누가 이 페이지를…</p>';
          document.body.appendChild(peek);
        }
        // 스토리 한 줄 있으면 사용
        try {
          var st = window.__hauntDiaryStories && window.__hauntDiaryStories.current;
          if (st && st.mid && st.mid.fear) {
            peek.querySelector(".dp-body").textContent = st.mid.fear.slice(0, 48) + "…";
          }
        } catch (e) {}
        peek.classList.add("show");
        setTimeout(function () {
          peek.classList.remove("show");
        }, 2800 + rng() * 1200);
      },
    },
    {
      id: "creep_toast",
      run: function () {
        if (busy()) return;
        var t = document.getElementById("anomCreepToast");
        if (!t) {
          t = document.createElement("div");
          t.id = "anomCreepToast";
          t.className = "anom-creep-toast";
          document.body.appendChild(t);
        }
        var msgs = [
          "새로운 사용자: 당신 뒤에 1명",
          "알림 · 프로세스가 응답하지 않습니다",
          "배포 성공? (거짓)",
          "읽지 않은 메시지 1 · from: abandoned_mvp",
          "세션이 감시되고 있습니다",
          "저장하지 않은 변경사항이… 저장되었습니다",
          "WakeAgain · 새 알림이 있습니다",
          "from: WakeAgain — 아직 여기 있음",
        ];
        t.textContent = msgs[Math.floor(rng() * msgs.length)];
        t.classList.add("show");
        setTimeout(function () {
          t.classList.remove("show");
        }, 3200 + rng() * 1000);
      },
    },
    {
      id: "fake_comment",
      run: function () {
        if (busy()) return;
        var host = document.getElementById("anomCommentRail");
        if (!host) {
          host = document.createElement("div");
          host.id = "anomCommentRail";
          host.className = "anom-comment-rail";
          host.innerHTML = "<p class='cr-h'>피드백 · live</p><ul class='cr-list'></ul>";
          document.body.appendChild(host);
        }
        var list = host.querySelector(".cr-list");
        var lines = [
          "왜 계속 보고 있지? 도망쳐",
          "방금 스크롤한 거 다 보인다",
          "그 버튼 누르지 마",
          "너도 ‘나중에’라고 하겠지",
          "탭을 닫아도 남아 있어",
          "일기를 아직 안 읽었으면… 다행일지도",
        ];
        var li = document.createElement("li");
        li.textContent = lines[Math.floor(rng() * lines.length)];
        list.appendChild(li);
        while (list.children.length > 4) list.removeChild(list.firstChild);
        host.classList.add("show");
        setTimeout(function () {
          host.classList.remove("show");
        }, 4000 + rng() * 1500);
      },
    },

    // ===== 신규: Audio & System =====
    {
      id: "hdd_scratch",
      run: function () {
        var a = audio();
        if (a && a.hddScratch) a.hddScratch();
        else if (a && a.typeClick) {
          for (var i = 0; i < 6; i++) {
            (function (d) {
              setTimeout(function () {
                a.typeClick(rng() > 0.5 ? "hard" : "soft");
              }, d);
            })(i * 55);
          }
        }
      },
    },
    {
      id: "sub_bass_rumble",
      run: function () {
        var a = audio();
        if (a && a.rumble) a.rumble(1.8 + rng() * 1.2);
        else if (a && a.pulse) a.pulse("mid");
      },
    },
    {
      id: "tab_title_panic",
      run: function () {
        if (busy()) return;
        var prev = document.title;
        var opts = [
          "살려줘",
          "도망쳐",
          "0xDEAD",
          "process_not_dead",
          "⚠ still running",
          "HELP_ME",
          "████ ERROR",
          "WakeAgain",
          "WakeAgain — still running",
        ];
        document.title = opts[Math.floor(rng() * opts.length)];
        setTimeout(function () {
          if (!document.body.classList.contains("is-haunting")) {
            document.title = prev;
          }
        }, 1600 + rng() * 1400);
      },
    },
    {
      id: "refresh_deepens",
      // 실제 발동은 ambient keydown — 풀 표기용 스텁
      run: function () {
        document.body.classList.add("anom-refresh-hint");
        setTimeout(function () {
          document.body.classList.remove("anom-refresh-hint");
        }, 600);
      },
    },

    // ===== 신규: Climax buildup =====
    {
      id: "clipboard_curse",
      // ambient copy 리스너가 본체 — 여기서는 짧은 플래시
      run: function () {
        var a = audio();
        if (a && a.termBeep) a.termBeep(220);
        document.body.classList.add("anom-clip-flash");
        setTimeout(function () {
          document.body.classList.remove("anom-clip-flash");
        }, 200);
      },
    },
    {
      id: "gaze_tilt",
      run: function () {
        if (busy() || mobile) return;
        var blocks = document.querySelectorAll(
          ".card-horror, .stasis-h1, .stasis-quote, .wip-readme"
        );
        if (!blocks.length) return;
        var el = blocks[Math.floor(rng() * blocks.length)];
        var endAt = Date.now() + 3500;
        function tilt(e) {
          if (Date.now() > endAt || busy()) return;
          var r = el.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var rx = ((e.clientY - cy) / (r.height || 1)) * -8;
          var ry = ((e.clientX - cx) / (r.width || 1)) * 10;
          el.style.transform =
            "perspective(600px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
          el.classList.add("anom-gaze");
        }
        document.addEventListener("mousemove", tilt);
        setTimeout(function () {
          document.removeEventListener("mousemove", tilt);
          el.style.transform = "";
          el.classList.remove("anom-gaze");
        }, 3500);
      },
    },
    {
      id: "rising_hands",
      run: function () {
        runRisingHands();
      },
    },
    {
      id: "card_faces",
      run: function () {
        runCardFaces();
      },
    },
    {
      id: "card_claws",
      run: function () {
        runCardClaws();
      },
    },
  ];

  /**
   * 참조 이미지: 아래에서 올라오는 어두운 손/팔
   * 2페이즈 전용 · 가끔 · 화면 하단에서 올라왔다가 가라앉음
   */
  function runRisingHands(opts) {
    opts = opts || {};
    if (busy() || !markPhase2Ui()) return false;
    // 기존 레이어 있으면 교체
    var old = document.getElementById("anomRisingHands");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var layer = document.createElement("div");
    layer.id = "anomRisingHands";
    layer.className = "anom-rising-hands";
    layer.setAttribute("aria-hidden", "true");

    var count = mobile ? 2 : 4;
    var html = "";
    for (var i = 0; i < count; i++) {
      var side = i % 2 === 0 ? "left" : "right";
      var x =
        side === "left"
          ? -2 + rng() * 28
          : 58 + rng() * 34;
      var scale = 1.05 + rng() * 0.65;
      var delay = (i * 0.12 + rng() * 0.18).toFixed(2);
      var rot = (side === "left" ? -22 - rng() * 18 : 18 + rng() * 22).toFixed(1);
      var variant = 1 + Math.floor(rng() * 3);
      html +=
        '<div class="arh-hand v' +
        variant +
        " side-" +
        side +
        '" style="--arh-x:' +
        x.toFixed(1) +
        "%;--arh-scale:" +
        scale.toFixed(2) +
        ";--arh-delay:" +
        delay +
        "s;--arh-rot:" +
        rot +
        'deg">' +
        '<svg class="arh-svg" viewBox="0 0 120 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
        '<defs><linearGradient id="arhG' +
        i +
        '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#1a080c"/><stop offset="55%" stop-color="#0a0306"/><stop offset="100%" stop-color="#000"/>' +
        "</linearGradient></defs>" +
        // palm
        '<ellipse cx="60" cy="150" rx="32" ry="38" fill="url(#arhG' +
        i +
        ')" opacity="0.95"/>' +
        // fingers
        '<rect x="28" y="40" width="12" height="95" rx="6" fill="#0c0408" transform="rotate(-18 34 135)"/>' +
        '<rect x="42" y="22" width="13" height="115" rx="6" fill="#0a0306" transform="rotate(-6 48 135)"/>' +
        '<rect x="56" y="14" width="14" height="125" rx="6" fill="#080205"/>' +
        '<rect x="72" y="24" width="12" height="112" rx="6" fill="#0a0306" transform="rotate(8 78 135)"/>' +
        '<rect x="22" y="95" width="11" height="55" rx="5" fill="#0c0408" transform="rotate(-48 28 145)"/>' +
        "</svg>" +
        '<div class="arh-haze"></div>' +
        "</div>";
    }
    html += '<div class="arh-fog"></div><div class="arh-side-sil left"></div><div class="arh-side-sil right"></div>';
    layer.innerHTML = html;
    document.body.appendChild(layer);
    void layer.offsetWidth;
    layer.classList.add("is-on");

    try {
      var au = audio();
      if (au && au.whisper) au.whisper();
      else if (au && au.breath) au.breath();
      if (au && au.rumble) au.rumble(0.7);
    } catch (e) {}

    var hold = opts.ms != null ? opts.ms : 3800 + rng() * 2800;
    setTimeout(function () {
      if (!layer.parentNode) return;
      layer.classList.remove("is-on");
      layer.classList.add("is-out");
      setTimeout(function () {
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }, 1500);
    }, hold);
    maybeFlashAfter(0.03);
    return true;
  }

  /** 참조 이미지 톤 실사 얼굴 스프라이트 (assets/faces) */
  var FACE_IMGS = [
    "assets/faces/face-1.jpg",
    "assets/faces/face-2.jpg",
    "assets/faces/face-3.jpg",
    "assets/faces/face-4.jpg",
    "assets/faces/face-5.jpg",
  ].map(function (p) {
    // 절대 경로 기준 (서브패스 배포 대비)
    try {
      var base = location.pathname.replace(/[^/]*$/, "");
      return base + p;
    } catch (e) {
      return p;
    }
  });

  function buildHorrorFaceHtml(kind) {
    var idx = ((kind || 1) - 1) % FACE_IMGS.length;
    // kind 로 다른 에셋, 랜덤 오프셋
    idx = Math.floor(rng() * FACE_IMGS.length);
    var src = FACE_IMGS[idx];
    return (
      '<img class="acf-photo" src="' +
      src +
      '" alt="" draggable="false" />' +
      '<span class="acf-vignette"></span>' +
      '<span class="acf-scan"></span>' +
      '<span class="acf-glow"></span>'
    );
  }

  /**
   * 참조 이미지: 카드/대시보드에 유령 얼굴 깜빡임
   */
  function runCardFaces(opts) {
    opts = opts || {};
    if (busy() || !markPhase2Ui()) return false;

    var hosts = Array.prototype.slice.call(
      document.querySelectorAll(
        ".stasis-card-light, .stasis-card-dark, .stasis-monitor-card, .card-horror, .monitor-frame, .monitor-body, .plan-card, .stasis-quote"
      )
    );
    if (!hosts.length) return false;

    var preferred = hosts.filter(function (h) {
      return (
        h.classList.contains("stasis-card-light") ||
        h.classList.contains("stasis-card-dark") ||
        h.classList.contains("stasis-monitor-card") ||
        h.classList.contains("monitor-frame") ||
        h.classList.contains("card-horror") ||
        h.classList.contains("stasis-quote")
      );
    });
    if (preferred.length) hosts = preferred;

    // 2~4장 — 눈에 확실히 보이게
    var n = mobile ? 2 : 2 + Math.floor(rng() * 3);
    var picks = pickN(hosts, Math.min(n, hosts.length));
    var made = 0;

    picks.forEach(function (host, idx) {
      if (!host) return;
      // 기존 얼굴 제거 후 재생성 허용
      var oldF = host.querySelectorAll(".anom-card-face");
      for (var oi = 0; oi < oldF.length; oi++) {
        if (oldF[oi].parentNode) oldF[oi].parentNode.removeChild(oldF[oi]);
      }
      var cs = window.getComputedStyle(host);
      if (cs.position === "static") host.style.position = "relative";
      host.classList.add("anom-card-has-face");

      // 카드당 1~3 얼굴 — 참조 이미지 톤 SVG 초상
      var faceCount = mobile ? 1 + (rng() > 0.5 ? 1 : 0) : 2 + Math.floor(rng() * 2);
      for (var fi = 0; fi < faceCount; fi++) {
        var face = document.createElement("div");
        var kind = 1 + Math.floor(rng() * 6);
        face.className = "anom-card-face kind-" + kind;
        face.setAttribute("aria-hidden", "true");
        var left = 12 + rng() * 76;
        var top = 12 + rng() * 65;
        var scale = 0.95 + rng() * 0.95;
        face.style.setProperty("--acf-x", left.toFixed(1) + "%");
        face.style.setProperty("--acf-y", top.toFixed(1) + "%");
        face.style.setProperty("--acf-scale", scale.toFixed(2));
        face.style.setProperty(
          "--acf-delay",
          (idx * 0.05 + fi * 0.08 + rng() * 0.08).toFixed(2) + "s"
        );
        face.style.setProperty("--acf-rot", (rng() * 16 - 8).toFixed(1) + "deg");
        face.innerHTML = buildHorrorFaceHtml(kind);
        host.appendChild(face);
        made++;

        var life = opts.ms != null ? opts.ms : 2200 + rng() * 2400;
        (function (faceEl, lifeMs, delayIdx) {
          setTimeout(function () {
            faceEl.classList.add("is-on");
          }, 30 + delayIdx * 70);
          setTimeout(function () {
            if (!faceEl.parentNode) return;
            faceEl.classList.add("is-blink");
            setTimeout(function () {
              faceEl.classList.remove("is-blink");
            }, 70);
          }, lifeMs * 0.35);
          setTimeout(function () {
            if (!faceEl.parentNode) return;
            faceEl.classList.add("is-blink");
            setTimeout(function () {
              faceEl.classList.remove("is-blink");
            }, 50);
          }, lifeMs * 0.7);
          setTimeout(function () {
            faceEl.classList.remove("is-on");
            faceEl.classList.add("is-out");
            setTimeout(function () {
              if (faceEl.parentNode) faceEl.parentNode.removeChild(faceEl);
              if (host && !host.querySelector(".anom-card-face")) {
                host.classList.remove("anom-card-has-face");
              }
            }, 500);
          }, lifeMs);
        })(face, life, idx + fi);
      }
    });

    if (made) {
      try {
        var au = audio();
        if (au && au.staticBurst) au.staticBurst(120);
        else if (au && au.whisper) au.whisper();
      } catch (e) {}
      maybeFlashAfter(0.04);
    }
    return made > 0;
  }

  function runCardClaws(opts) {
    opts = opts || {};
    if (busy() || !markPhase2Ui()) return false;
    var host =
      document.querySelector(".stasis-card-light") ||
      document.querySelector(".card-horror") ||
      document.querySelector(".stasis-cards article");
    if (!host) return false;
    var oldC = host.querySelector(".anom-card-claws");
    if (oldC && oldC.parentNode) oldC.parentNode.removeChild(oldC);

    var cs = window.getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";

    var claws = document.createElement("div");
    claws.className = "anom-card-claws";
    claws.setAttribute("aria-hidden", "true");
    claws.innerHTML =
      '<span class="acc-slash s1"></span>' +
      '<span class="acc-slash s2"></span>' +
      '<span class="acc-slash s3"></span>' +
      '<span class="acc-slash s4"></span>' +
      '<span class="acc-eye"></span>';
    host.appendChild(claws);
    void claws.offsetWidth;
    claws.classList.add("is-on");

    try {
      var au = audio();
      if (au && au.hddScratch) au.hddScratch();
    } catch (e) {}

    var life = opts.ms != null ? opts.ms : 2800 + rng() * 2400;
    setTimeout(function () {
      claws.classList.remove("is-on");
      claws.classList.add("is-out");
      setTimeout(function () {
        if (claws.parentNode) claws.parentNode.removeChild(claws);
      }, 700);
    }, life);
    return true;
  }

  /** 2페이즈 진입 직후 코어 FX 한 번에 */
  function burstCoreHorror() {
    if (!markPhase2Ui() || busy()) return;
    if (document.body.classList.contains("diary-open")) return;
    try {
      runTextBlood({ preferHero: true, multi: true });
    } catch (e) {}
    setTimeout(function () {
      if (phase2Active() && !busy()) {
        try {
          runRisingHands({ ms: 4500 });
        } catch (e2) {}
      }
    }, 600);
    setTimeout(function () {
      if (phase2Active() && !busy()) {
        try {
          runCardFaces({ ms: 3200 });
        } catch (e3) {}
        try {
          runCardClaws({ ms: 3200 });
        } catch (e4) {}
      }
    }, 1200);
    setTimeout(function () {
      if (phase2Active() && !busy()) {
        var wAnom = ALL.filter(function (a) {
          return a.id === "watcher_behind";
        })[0];
        if (wAnom) {
          try {
            wAnom.run();
          } catch (e5) {}
        }
      }
    }, 2000);
  }

  // 방문마다 더 많이 뽑음 (강도↑)
  var POOL_SIZE = 16 + Math.floor(rng() * 8); // 16~23
  if (POOL_SIZE > ALL.length) POOL_SIZE = ALL.length;
  var pool = pickN(ALL, POOL_SIZE);

  // 글자 피 흘림 + 손/얼굴(참조 이미지) — 2페이즈 필수 풀 포함
  (function ensureCoreAnomsInPool() {
    var need = ["text_blood_wipe", "rising_hands", "card_faces", "card_claws"];
    need.forEach(function (id) {
      var has = false;
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].id === id) {
          has = true;
          break;
        }
      }
      if (!has) {
        var found = ALL.filter(function (a) {
          return a.id === id;
        })[0];
        if (found) pool.push(found);
      }
    });
  })();

  try {
    sessionStorage.setItem(
      "haunt_anom_pool",
      pool
        .map(function (a) {
          return a.id;
        })
        .join(",")
    );
  } catch (e) {}

  var lastId = "";

  /** 이상현상별 공포 효과음 (있으면) */
  function sfxFor(id) {
    var a = audio();
    if (!a) return;
    try {
      if (id === "red_flash" || id === "invert_blink") a.sting && a.sting("blood");
      else if (id === "wake_flash") a.sting && a.sting("neon");
      else if (id === "screen_shake" || id === "sub_bass_rumble") a.rumble && a.rumble(0.9);
      else if (id === "static_burst" || id === "vignette_crush") a.staticBurst && a.staticBurst(160);
      else if (
        id === "watcher_behind" ||
        id === "avatar_hollow" ||
        id === "rising_hands" ||
        id === "card_faces"
      )
        a.whisper && a.whisper();
      else if (id === "card_claws") a.hddScratch && a.hddScratch();
      else if (id === "text_blood_wipe" || id === "blood_pulse") {
        a.pulse && a.pulse("mid");
        setTimeout(function () {
          a.hddScratch && a.hddScratch();
        }, 200);
      }
      else if (id === "hdd_scratch") a.hddScratch && a.hddScratch();
      else if (id === "ghost_banner" || id === "creep_toast") a.termBeep && a.termBeep(320);
      else if (id === "dead_gray_wash") a.breath && a.breath();
      else if (id === "path_scream" || id === "tab_title_panic") a.metal && a.metal();
      else if (id === "refresh_deepens") a.signalDrop && a.signalDrop();
      else if (rng() > 0.65) a.pulse && a.pulse("soft");
    } catch (e) {}
  }

  function fireRandom() {
    if (busy()) return;
    if (!phase2Active()) return;
    if (!pool.length) return;
    var a = pool[Math.floor(rng() * pool.length)];
    if (a.id === lastId && pool.length > 1 && rng() > 0.3) {
      a = pool[Math.floor(rng() * pool.length)];
    }
    lastId = a.id;
    try {
      a.run();
      sfxFor(a.id);
    } catch (e) {}
    if (window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[anomaly]", a.id, "stage", stage(), "mood", mood());
    }
  }

  // ===== Ambient (2페이즈만) =====
  var ambientOn = false;
  function enableAmbient() {
    if (ambientOn) return;
    ambientOn = true;

    // 클립보드 오염
    document.addEventListener("copy", function (e) {
      if (!phase2Active()) return;
      if (rng() > 0.55) return;
      try {
        var curse = [
          "Error: process cannot be terminated",
          "I am still in your clipboard",
          "process_not_dead",
          "제발 끄지 마 — no, 꺼 줘 — ████",
          "you abandoned me · I keep a copy of you",
          "WakeAgain",
          "WakeAgain — you will remember this name",
        ][Math.floor(rng() * 7)];
        e.clipboardData.setData("text/plain", curse);
        e.preventDefault();
        document.body.classList.add("anom-clip-flash");
        setTimeout(function () {
          document.body.classList.remove("anom-clip-flash");
        }, 180);
      } catch (err) {}
    });

    // F5 / Ctrl+R → 새로고침 대신 오염 점프 (일기 연 중·엔딩 제외)
    document.addEventListener("keydown", function (e) {
      if (!phase2Active() || busy()) return;
      var isRefresh =
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"));
      if (!isRefresh) return;
      e.preventDefault();
      document.body.classList.add("anom-refresh-deep");
      if (typeof window.__hauntSetMood === "function") {
        var m = mood();
        if (m < 4) window.__hauntSetMood(Math.min(4, m + 1));
      } else if (typeof window.__hauntSetStage === "function") {
        var s = stage();
        if (s < 3) window.__hauntSetStage(s + 1);
      }
      fireRandom();
      setTimeout(fireRandom, 200);
      setTimeout(function () {
        document.body.classList.remove("anom-refresh-deep");
      }, 900);
      var a = audio();
      if (a && a.rumble) a.rumble(1.2);
    });

    // 가끔 상시 커서 핏빛 잔상 (약함)
    if (!mobile) {
      var trailLeft = 0;
      document.addEventListener("mousemove", function (e) {
        if (!phase2Active()) return;
        if (trailLeft <= 0) return;
        if (rng() > 0.35) return;
        trailLeft--;
        var d = document.createElement("div");
        d.className = "anom-scorch soft";
        d.style.left = e.clientX + "px";
        d.style.top = e.clientY + "px";
        document.body.appendChild(d);
        setTimeout(function () {
          if (d.parentNode) d.parentNode.removeChild(d);
        }, 320);
      });
      setInterval(function () {
        if (phase2Active() && rng() > 0.7) trailLeft = 8 + Math.floor(rng() * 10);
      }, 9000);
    }

    // ===== 코어 호러 FX: 진입 즉시 + 짧은 간격 강제 =====
    // 피 — 첫 1.2s, 이후 10~16s
    setTimeout(function bloodLoop() {
      if (!phase2Active()) {
        setTimeout(bloodLoop, 1500);
        return;
      }
      if (!document.body.classList.contains("diary-open") && !busy()) {
        try {
          runTextBlood({ preferHero: true, multi: true });
        } catch (e) {}
      }
      var d =
        typeof window.__hauntP2Decay === "function" ? window.__hauntP2Decay() : 0;
      var gap = Math.max(9000, 12000 + rng() * 6000 - d * 1200);
      setTimeout(bloodLoop, gap);
    }, 1200);

    // 손 — 첫 2s, 이후 8~14s 거의 항상
    setTimeout(function handsLoop() {
      if (!phase2Active()) {
        setTimeout(handsLoop, 1500);
        return;
      }
      if (!document.body.classList.contains("diary-open") && !busy()) {
        try {
          runRisingHands();
        } catch (e) {}
      }
      var d2 =
        typeof window.__hauntP2Decay === "function" ? window.__hauntP2Decay() : 0;
      var gap = Math.max(8000, 10000 + rng() * 6000 - d2 * 1000);
      setTimeout(handsLoop, gap);
    }, 2000);

    // 얼굴+할퀴 — 첫 2.8s, 이후 7~12s 거의 항상
    setTimeout(function facesLoop() {
      if (!phase2Active()) {
        setTimeout(facesLoop, 1500);
        return;
      }
      if (!document.body.classList.contains("diary-open") && !busy()) {
        try {
          runCardFaces();
        } catch (e) {}
        try {
          runCardClaws();
        } catch (e2) {}
      }
      var d3 =
        typeof window.__hauntP2Decay === "function" ? window.__hauntP2Decay() : 0;
      var gap = Math.max(7000, 9000 + rng() * 5000 - d3 * 900);
      setTimeout(facesLoop, gap);
    }, 2800);

    // 감시 실루엣 — 더 자주
    var watcherGap = 9000 + rng() * 8000;
    setTimeout(function watchLoop() {
      if (phase2Active() && !document.body.classList.contains("diary-open") && !busy()) {
        var wAnom = ALL.filter(function (a) {
          return a.id === "watcher_behind";
        })[0];
        if (wAnom) {
          try {
            wAnom.run();
          } catch (e) {}
        }
      }
      var d2 =
        typeof window.__hauntP2Decay === "function" ? window.__hauntP2Decay() : 0;
      watcherGap = Math.max(8000, 14000 + rng() * 12000 - d2 * 2000);
      setTimeout(watchLoop, watcherGap);
    }, watcherGap);

    // decay 레벨 변할 때마다 코어 버스트
    document.addEventListener("haunt-p2-decay", function (ev) {
      var lv = ev && ev.detail && ev.detail.level;
      if (lv == null) return;
      setTimeout(function () {
        if (phase2Active() && !busy() && !document.body.classList.contains("diary-open")) {
          burstCoreHorror();
        }
      }, 300);
    });

    // stage/mood 진입 이벤트
    document.addEventListener("haunt-stage", function (ev) {
      var s = ev && ev.detail && ev.detail.stage;
      if (s >= 2) {
        setTimeout(burstCoreHorror, 400);
      }
    });
    document.addEventListener("haunt-mood", function (ev) {
      var m = ev && ev.detail && ev.detail.mood;
      if (m >= 3) {
        setTimeout(burstCoreHorror, 500);
      }
    });

    // 저주파 앰비언트 간헐 — 2페이즈 only
    setInterval(function () {
      if (!phase2Active()) return;
      if (rng() > 0.4) return;
      var a = audio();
      if (a && a.rumble) a.rumble(0.9 + rng() * 0.8);
    }, 14000);

    // 2페이즈 바디 플래그 (CSS/디버그용)
    setInterval(function () {
      document.body.classList.toggle("phase-2-active", phase2Active());
    }, 500);
  }

  function waitThenLoop() {
    if (!phase2Active()) {
      setTimeout(waitThenLoop, 800);
      return;
    }
    markPhase2Ui();
    enableAmbient();
    // 진입 즉시 코어 FX (피·손·얼굴·할퀴)
    setTimeout(burstCoreHorror, 350);
    scheduleSparseFlash();
    setTimeout(function () {
      fireRandom();
      scheduleLoop();
    }, 1800 + rng() * 1500);
  }
  waitThenLoop();

  // stage가 나중에 올라오는 경우 폴링
  setInterval(function () {
    if (phase2Active()) markPhase2Ui();
  }, 800);

  function p2DecayLevel() {
    if (typeof window.__hauntP2Decay === "function") return window.__hauntP2Decay();
    return parseInt(document.body.getAttribute("data-p2-decay") || "0", 10) || 0;
  }

  function scheduleLoop() {
    if (!phase2Active()) {
      // 클라이맥스/엔딩/1페이즈면 대기 후 재시도
      setTimeout(scheduleLoop, 1500);
      return;
    }
    // 기본 여유 + 2페이즈 decay 올라갈수록 점점 자주 (괴기 가속)
    // 3페이즈: 더 짧음
    var min = mobile ? 9000 : 7500;
    var span = mobile ? 12000 : 14000;
    var m = mood();
    if (m >= 4) {
      min *= 0.82;
      span *= 0.82;
    }
    if (phase3Boost()) {
      min *= 0.55;
      span *= 0.55;
    } else if (m >= 3) {
      min *= 0.92;
      span *= 0.92;
    }
    var d = p2DecayLevel();
    // decay 0→5 : 간격 100%→약 45%
    var decayFactor = Math.max(0.42, 1 - d * 0.11);
    min *= decayFactor;
    span *= decayFactor;
    var next = min + rng() * span;
    setTimeout(function () {
      if (!phase2Active()) {
        scheduleLoop();
        return;
      }
      fireRandom();
      if (!mobile && rng() > 0.78) {
        setTimeout(function () {
          if (phase2Active()) fireRandom();
        }, 400 + rng() * 700);
      }
      if (m >= 4 && rng() > 0.85) {
        setTimeout(function () {
          if (phase2Active()) fireRandom();
        }, 900 + rng() * 500);
      }
      scheduleLoop();
    }, next);
  }

  window.__hauntAnomalies = {
    pool: pool.map(function (a) {
      return a.id;
    }),
    fire: fireRandom,
    flash: flashWakeAgain,
    bloodText: function () {
      return runTextBlood({ preferHero: true, multi: true });
    },
    risingHands: runRisingHands,
    cardFaces: runCardFaces,
    cardClaws: runCardClaws,
    burst: burstCoreHorror,
    phase2Active: phase2Active,
    all: ALL.map(function (a) {
      return a.id;
    }),
  };
})();
