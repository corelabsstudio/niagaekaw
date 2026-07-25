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
  if (reduced) return;

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
      document.body.classList.contains("is-ending")
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
    // 첫 섬광도 최소 25~70초 뒤에
    var wait = 25000 + rng() * 45000;
    if (flashCount === 0) wait = 35000 + rng() * 55000;
    setTimeout(function () {
      if (stageReady() && !busy() && canFlash(false)) {
        // 50% 확률로 스킵 → 다음 창으로 (불규칙)
        if (rng() > 0.48) {
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
        var deg = 50 + Math.floor(rng() * 140);
        runMs(
          function (on) {
            document.body.style.filter = on
              ? "hue-rotate(" + deg + "deg) contrast(1.28) saturate(1.55)"
              : "";
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
        /**
         * 글자에서 피가 천천히 흐름 → 보이지 않는 손이 스윽 닦음
         * 전체 약 15초 (drip ~11s + wipe ~2.5s + 잔상 ~1.5s)
         */
        if (busy()) return;
        var nodes = document.querySelectorAll(
          ".stasis-h1, .stasis-lede, .card-horror h2, .card-horror p, .stasis-feat-list li, .stasis-quote-text, .wip-readme-body, .eyebrow"
        );
        if (!nodes.length) return;
        var el = nodes[Math.floor(rng() * nodes.length)];
        if (!el || el.dataset.bleeding === "1") return;
        if (!(el.textContent || "").trim()) return;

        el.dataset.bleeding = "1";
        el.classList.add("anom-bleeding");

        function placeLayer() {
          var rect = el.getBoundingClientRect();
          if (rect.width < 8 || rect.height < 4) return null;
          var layer = document.createElement("div");
          layer.className = "anom-blood-layer anom-blood-slow";
          layer.setAttribute("aria-hidden", "true");
          layer.style.position = "fixed";
          layer.style.left = rect.left + "px";
          layer.style.top = rect.top + "px";
          layer.style.width = rect.width + "px";
          layer.style.height = Math.min(rect.height + 72, 160) + "px";
          layer.style.pointerEvents = "none";
          layer.style.zIndex = "57";
          layer.style.overflow = "hidden";
          return layer;
        }

        var layer = placeLayer();
        if (!layer) {
          el.classList.remove("anom-bleeding");
          delete el.dataset.bleeding;
          return;
        }

        function addDrip(delay) {
          if (!layer.parentNode || busy()) return;
          // 스크롤 대응: 위치 갱신
          var rect = el.getBoundingClientRect();
          layer.style.left = rect.left + "px";
          layer.style.top = rect.top + "px";
          layer.style.width = rect.width + "px";

          var d = document.createElement("span");
          d.className = "anom-blood-drip";
          d.style.left = 4 + rng() * 90 + "%";
          d.style.animationDelay = "0s";
          // 천천히 흘러내림 4.5~7.5초
          d.style.animationDuration = 4.5 + rng() * 3 + "s";
          d.style.height = 22 + rng() * 50 + "px";
          layer.appendChild(d);
        }

        document.body.appendChild(layer);

        // 처음 여러 방울 + 이후 천천히 추가 (전체 흐름감)
        var dripCount = mobile ? 4 : 7;
        for (var i = 0; i < dripCount; i++) {
          (function (idx) {
            setTimeout(function () {
              addDrip(idx);
            }, 200 + idx * (900 + rng() * 500));
          })(i);
        }
        // 중반에 추가 방울
        setTimeout(function () {
          if (!busy() && layer.parentNode) {
            addDrip(0);
            addDrip(1);
          }
        }, 5500);
        setTimeout(function () {
          if (!busy() && layer.parentNode) addDrip(0);
        }, 8500);

        var hand = document.createElement("div");
        hand.className = "anom-blood-hand";
        if (rng() > 0.5) hand.classList.add("wipe-ltr");
        else hand.classList.add("wipe-rtl");
        layer.appendChild(hand);

        var a = audio();
        if (a && a.typeClick) {
          setTimeout(function () {
            a.typeClick("soft");
          }, 400);
        }

        // ~11초 흘림 후 닦기 (총 ~15초)
        var dripMs = 10500 + rng() * 800;
        var wipeMs = 2200;
        var afterMs = 1500;

        // 스크롤 시 레이어 추적
        function onScrollOrResize() {
          if (!layer.parentNode) return;
          var rect = el.getBoundingClientRect();
          layer.style.left = rect.left + "px";
          layer.style.top = rect.top + "px";
          layer.style.width = rect.width + "px";
        }
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize);

        function cleanup() {
          window.removeEventListener("scroll", onScrollOrResize);
          window.removeEventListener("resize", onScrollOrResize);
          el.classList.remove("anom-bleeding", "anom-blood-smear");
          delete el.dataset.bleeding;
          if (layer.parentNode) layer.parentNode.removeChild(layer);
        }

        setTimeout(function () {
          if (busy()) {
            cleanup();
            return;
          }
          layer.classList.add("is-wiping");
          hand.classList.add("is-wiping");
          if (a && a.hddScratch) a.hddScratch();
          else if (a && a.typeClick) a.typeClick("mid");

          setTimeout(function () {
            layer.classList.add("is-cleared");
            el.classList.remove("anom-bleeding");
            el.classList.add("anom-blood-smear");
          }, wipeMs * 0.55);

          setTimeout(function () {
            cleanup();
          }, wipeMs + afterMs);
        }, dripMs);
      },
    },
    {
      id: "watcher_behind",
      run: function () {
        /**
         * 화면 뒤 감시자
         * - 잠시 응시(커서 추적)
         * - 사라질 때 패턴:
         *   eyes_close | look_left | look_right | look_away_down | glance_then_close
         * - 그 동작 후 페이드아웃 (계속 빤히 보지 않음)
         */
        if (busy()) return;
        var w = document.getElementById("anomWatcher");
        if (!w) {
          w = document.createElement("div");
          w.id = "anomWatcher";
          w.className = "anom-watcher";
          w.setAttribute("aria-hidden", "true");
          w.innerHTML =
            '<div class="aw-figure">' +
            '<div class="aw-head"><span class="aw-eye l"></span><span class="aw-eye r"></span></div>' +
            '<div class="aw-body"></div>' +
            "</div>";
          document.body.appendChild(w);
        }
        if (w.classList.contains("is-on") || w.classList.contains("is-leaving")) return;

        var side = rng() > 0.5 ? "left" : "right";
        w.className = "anom-watcher";
        w.classList.add(side === "left" ? "side-left" : "side-right");
        if (rng() > 0.55) w.classList.add("is-deep");

        void w.offsetWidth;
        w.classList.add("is-on");

        var eyes = w.querySelectorAll(".aw-eye");
        var figure = w.querySelector(".aw-figure");
        var tracking = true;

        function track(e) {
          if (!tracking || !w.classList.contains("is-on") || busy()) return;
          var cx = window.innerWidth / 2;
          var cy = window.innerHeight / 2;
          var dx = (e.clientX - cx) / cx;
          var dy = (e.clientY - cy) / cy;
          eyes.forEach(function (eye) {
            eye.style.transform =
              "translate(" + (dx * 3.2).toFixed(2) + "px," + (dy * 2.2).toFixed(2) + "px)";
          });
          if (figure) {
            figure.style.transform =
              "translate(" + (dx * 5).toFixed(1) + "px," + (dy * 3.5).toFixed(1) + "px)";
          }
        }
        if (!mobile) document.addEventListener("mousemove", track);

        var leaveModes = [
          "eyes_close",
          "look_left",
          "look_right",
          "look_away_down",
          "glance_then_close",
        ];
        var leaveMode = leaveModes[Math.floor(rng() * leaveModes.length)];

        // 응시는 짧게 (2~4.5초) — 오래 빤히 보지 않음
        var stareMs = 2000 + rng() * 2500;

        function clearMotionClasses() {
          w.classList.remove(
            "aw-eyes-close",
            "aw-look-left",
            "aw-look-right",
            "aw-look-down",
            "aw-glance",
            "aw-twitch",
            "is-leaving",
            "is-out"
          );
        }

        function finishLeave() {
          tracking = false;
          if (!mobile) document.removeEventListener("mousemove", track);
          w.classList.remove("is-on");
          w.classList.add("is-out");
          setTimeout(function () {
            clearMotionClasses();
            w.classList.remove("is-deep", "side-left", "side-right", "is-out");
            eyes.forEach(function (eye) {
              eye.style.transform = "";
            });
            if (figure) figure.style.transform = "";
            w.className = "anom-watcher";
          }, 1100);
        }

        function beginLeave() {
          if (busy()) {
            finishLeave();
            return;
          }
          tracking = false;
          if (!mobile) document.removeEventListener("mousemove", track);
          // 인라인 track transform 제거 후 CSS 연출
          eyes.forEach(function (eye) {
            eye.style.transform = "";
          });
          if (figure) figure.style.transform = "";

          w.classList.add("is-leaving");
          w.classList.remove("aw-twitch");

          if (leaveMode === "eyes_close") {
            w.classList.add("aw-eyes-close");
            setTimeout(finishLeave, 700);
          } else if (leaveMode === "look_left") {
            w.classList.add("aw-look-left");
            setTimeout(finishLeave, 900);
          } else if (leaveMode === "look_right") {
            w.classList.add("aw-look-right");
            setTimeout(finishLeave, 900);
          } else if (leaveMode === "look_away_down") {
            w.classList.add("aw-look-down");
            setTimeout(finishLeave, 850);
          } else {
            // glance_then_close: 왼쪽 흘낏 → 눈 감기 → 퇴장
            w.classList.add("aw-glance");
            setTimeout(function () {
              w.classList.remove("aw-glance");
              w.classList.add("aw-eyes-close");
              setTimeout(finishLeave, 650);
            }, 550);
          }
        }

        setTimeout(beginLeave, stareMs);
        maybeFlashAfter(0.03);
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
        var btns = document.querySelectorAll(
          ".stasis-cta, .plan-btn.is-on, .diary-next, .btn.ghost"
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
  ];

  // 방문마다 더 많이 뽑음 (강도↑)
  var POOL_SIZE = 16 + Math.floor(rng() * 8); // 16~23
  if (POOL_SIZE > ALL.length) POOL_SIZE = ALL.length;
  var pool = pickN(ALL, POOL_SIZE);

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

    // F5 / Ctrl+R → 새로고침 대신 오염 점프
    document.addEventListener("keydown", function (e) {
      if (!phase2Active()) return;
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

    // 드물게 배경 감시자 — 2페이즈 only
    var watcherGap = 40000 + rng() * 50000;
    setTimeout(function watchLoop() {
      if (phase2Active() && rng() > 0.4) {
        var wAnom = ALL.filter(function (a) {
          return a.id === "watcher_behind";
        })[0];
        if (wAnom) {
          try {
            wAnom.run();
          } catch (e) {}
        }
      }
      watcherGap = 45000 + rng() * 70000;
      setTimeout(watchLoop, watcherGap);
    }, watcherGap);

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
      setTimeout(waitThenLoop, 1000);
      return;
    }
    enableAmbient();
    // 섬광 ambient — 2페이즈 · 이상현상 루프와 분리
    scheduleSparseFlash();
    setTimeout(function () {
      fireRandom();
      scheduleLoop();
    }, 2800 + rng() * 4000);
  }
  waitThenLoop();

  function scheduleLoop() {
    if (!phase2Active()) {
      // 클라이맥스/엔딩/1페이즈면 대기 후 재시도
      setTimeout(scheduleLoop, 1500);
      return;
    }
    var min = mobile ? 7000 : 5500;
    var span = mobile ? 10000 : 11000;
    var m = mood();
    if (m >= 4) {
      min *= 0.75;
      span *= 0.75;
    } else if (m >= 3) {
      min *= 0.88;
      span *= 0.88;
    }
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
    phase2Active: phase2Active,
    all: ALL.map(function (a) {
      return a.id;
    }),
  };
})();
