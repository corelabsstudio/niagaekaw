/**
 * 방문자 / 동시접속 표시 (전원 공유)
 *
 * - 총 방문: counterapi.dev (브라우저당 1회 hit)
 * - 동시접속: 공유 JSON 스토어 heartbeat (GET→merge→PUT, 전원 동일 수치)
 * - 테스트 트래픽은 총 방문 +1 제외: localhost / ?debug=1 / webdriver 등
 *
 * 페이즈 카피:
 *   P1  접속 중 N · 총 방문자 M
 *   P2  이 페이지에 머물고 있는 영혼 N
 *   P3  소멸을 앞 둔 영혼 N
 */
(function () {
  "use strict";

  var COUNTER_NS = "niagaekaw";
  var COUNTER_KEY = "site";
  var TOTAL_FLAG = "niagaekaw_visit_hit_v1";
  var SESSION_KEY = "niagaekaw_sid_v1";

  /* 공유 presence 버킷 (jsonblob) — 모든 방문자가 같은 맵을 갱신 */
  var BLOB_ID = "019f9d23-b597-7b2f-ab77-b22be09d4a58";
  var BLOB_URL = "https://jsonblob.com/api/jsonBlob/" + BLOB_ID;

  var HEARTBEAT_MS = 8000;
  var STALE_MS = 35000;
  var JITTER_MS = 1200;

  var state = {
    live: 1,
    total: null,
    ready: false,
    timer: null,
    testTraffic: false,
  };

  /**
   * 집계 제외 (총 방문 +1 안 함). 숫자 조회·표시는 함.
   * - localhost / 127.0.0.1 / ::1 / file:
   * - ?debug=1 ?nocount=1 ?audit=1
   * - Playwright 등 navigator.webdriver
   */
  function isTestTraffic() {
    try {
      var h = (location.hostname || "").toLowerCase();
      if (
        h === "localhost" ||
        h === "127.0.0.1" ||
        h === "0.0.0.0" ||
        h === "[::1]" ||
        h === "::1" ||
        h.endsWith(".local")
      ) {
        return true;
      }
      if (location.protocol === "file:") return true;
    } catch (e0) {}

    try {
      var q = location.search || "";
      if (
        /[?&](debug|nocount|audit|hintfast|p3hint|p2hint)=1(?:&|$)/.test(q) ||
        /[?&](p3|p3t|path|summon|ending|diary)=/.test(q)
      ) {
        // 제작·테스트 쿼리: 집계 제외 (일반 유입 URL에는 안 붙음)
        return true;
      }
    } catch (e1) {}

    try {
      if (navigator.webdriver === true) return true;
    } catch (e2) {}

    try {
      if (window.__hauntNoCount === true) return true;
    } catch (e3) {}

    return false;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function sessionId() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (id) return id;
      id =
        "s_" +
        Math.random().toString(36).slice(2, 10) +
        "_" +
        Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (e) {
      return "s_anon_" + Date.now().toString(36);
    }
  }

  function phaseLevel() {
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

  function fmt(n) {
    if (n == null || isNaN(n)) return "—";
    n = Math.max(0, Math.floor(n));
    try {
      return n.toLocaleString("ko-KR");
    } catch (e) {
      return String(n);
    }
  }

  function render() {
    var hud = $("presenceHud");
    if (!hud) return;

    var phase = phaseLevel();
    hud.setAttribute("data-phase", String(phase));
    hud.classList.toggle("is-p2", phase === 2);
    hud.classList.toggle("is-p3", phase === 3);

    var live = Math.max(1, state.live | 0);
    var liveEl = $("presenceLiveCount");
    var liveLabel = $("presenceLiveLabel");
    var totalWrap = $("presenceTotalWrap");
    var totalCount = $("presenceTotalCount");
    var totalLabel = $("presenceTotalLabel");

    if (liveEl) liveEl.textContent = fmt(live);

    if (phase === 1) {
      if (liveLabel) liveLabel.textContent = "접속 중";
      if (totalWrap) totalWrap.hidden = false;
      if (totalLabel) {
        totalLabel.hidden = false;
        totalLabel.textContent = "총 방문자";
      }
      if (totalCount) {
        totalCount.hidden = false;
        totalCount.textContent = fmt(state.total);
      }
      hud.setAttribute(
        "aria-label",
        "접속 중 " +
          live +
          "명, 총 방문자 " +
          (state.total != null ? state.total : "집계 중")
      );
    } else if (phase === 2) {
      if (liveLabel) liveLabel.textContent = "이 페이지에 머물고 있는 영혼";
      if (totalWrap) totalWrap.hidden = true;
      if (totalLabel) totalLabel.hidden = true;
      if (totalCount) totalCount.hidden = true;
      hud.setAttribute("aria-label", "이 페이지에 머물고 있는 영혼 " + live);
    } else {
      if (liveLabel) liveLabel.textContent = "소멸을 앞 둔 영혼";
      if (totalWrap) totalWrap.hidden = true;
      if (totalLabel) totalLabel.hidden = true;
      if (totalCount) totalCount.hidden = true;
      hud.setAttribute("aria-label", "소멸을 앞 둔 영혼 " + live);
    }

    hud.classList.add("is-ready");
  }

  function setLive(n) {
    var next = Math.max(1, Math.floor(n) || 1);
    state.live = next;
    render();
  }

  function setTotal(n) {
    if (n == null || isNaN(n)) return;
    state.total = Math.max(0, Math.floor(n));
    render();
  }

  /* —— 총 방문자 —— */
  function fetchTotal() {
    var base =
      "https://api.counterapi.dev/v1/" +
      encodeURIComponent(COUNTER_NS) +
      "/" +
      encodeURIComponent(COUNTER_KEY);

    /* 테스트·로컬·디버그 쿼리: 조회만, +1 금지 */
    var skipHit = state.testTraffic === true;
    var shouldHit = false;
    if (!skipHit) {
      try {
        shouldHit = !localStorage.getItem(TOTAL_FLAG);
      } catch (e) {
        shouldHit = true;
      }
    }

    var url = shouldHit ? base + "/up" : base + "/";
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("counter " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (shouldHit && !skipHit) {
          try {
            localStorage.setItem(TOTAL_FLAG, "1");
          } catch (e2) {}
        }
        if (data && typeof data.count === "number") setTotal(data.count);
      })
      .catch(function () {});
  }

  /* —— 동시접속 heartbeat —— */
  function pruneSessions(sessions, now) {
    var out = {};
    var keys = Object.keys(sessions || {});
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var row = sessions[k];
      var ts = row && typeof row.ts === "number" ? row.ts : 0;
      if (now - ts <= STALE_MS) out[k] = { ts: ts };
    }
    return out;
  }

  function heartbeat() {
    var sid = sessionId();
    var now = Date.now();

    return fetch(BLOB_URL, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("blob get " + r.status);
        return r.json();
      })
      .then(function (data) {
        var sessions = pruneSessions((data && data.sessions) || {}, now);
        sessions[sid] = { ts: now };
        var count = Object.keys(sessions).length;
        setLive(count);

        return fetch(BLOB_URL, {
          method: "PUT",
          mode: "cors",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ sessions: sessions }),
        }).then(function () {
          return count;
        });
      })
      .catch(function () {
        /* 스토어 실패 시 최소 자기 자신 */
        setLive(Math.max(1, state.live));
      });
  }

  function scheduleHeartbeat() {
    var jitter = Math.floor(Math.random() * JITTER_MS);
    state.timer = setTimeout(function tick() {
      heartbeat().finally(function () {
        state.timer = setTimeout(tick, HEARTBEAT_MS + Math.floor(Math.random() * JITTER_MS));
      });
    }, 400 + jitter);
  }

  function watchPhase() {
    var obs = new MutationObserver(function () {
      render();
    });
    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    setInterval(render, 2000);
  }

  function ensureHud() {
    if ($("presenceHud")) return;
    var el = document.createElement("div");
    el.id = "presenceHud";
    el.className = "presence-hud";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<span class="presence-dot" aria-hidden="true"></span>' +
      '<span class="presence-live">' +
      '<span id="presenceLiveLabel" class="presence-label">접속 중</span> ' +
      '<strong id="presenceLiveCount" class="presence-num">—</strong>' +
      "</span>" +
      '<span id="presenceTotalWrap" class="presence-sep" aria-hidden="true">·</span>' +
      '<span class="presence-total">' +
      '<span id="presenceTotalLabel" class="presence-label">총 방문자</span> ' +
      '<strong id="presenceTotalCount" class="presence-num">—</strong>' +
      "</span>";
    document.body.appendChild(el);
  }

  function init() {
    state.testTraffic = isTestTraffic();
    ensureHud();
    /* API 대기 전에도 HUD 즉시 노출 (접속 중 1 · 총 —) */
    state.ready = true;
    setLive(1);
    render();
    watchPhase();
    fetchTotal();
    heartbeat()
      .catch(function () {})
      .finally(function () {
        render();
      });
    scheduleHeartbeat();
    /* 탭 종료 후 약 35초 내 스토어에서 자동 정리 (STALE_MS) */

    window.__hauntPresence = {
      getLive: function () {
        return state.live;
      },
      getTotal: function () {
        return state.total;
      },
      isTestTraffic: function () {
        return !!state.testTraffic;
      },
      refresh: render,
      beat: heartbeat,
    };

    if (state.testTraffic && window.console && /[?&]debug=1/.test(location.search || "")) {
      console.log("[presence] test traffic — total +1 skipped");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
