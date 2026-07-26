/**
 * 엔딩 (클라이맥스 25초 이후)
 *  1) 급격한 암전 — 사운드·비주얼 1초 만에 완전 차단
 *  2) 타자기: WakeAgain..
 *  3) 타자기: No Signal..
 *  4) 깜빡이는 커서 유지 (도메인 링크 없음)
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var root = document.getElementById("endingVoid");
  var line1 = document.getElementById("endingL1");
  var line2 = document.getElementById("endingL2");

  if (!root) return;

  var played = false;
  var active = false;

  function audio() {
    return window.__hauntAudio || null;
  }

  /** 사운드 즉시 차단 */
  function killAudioHard() {
    try {
      var a = audio();
      if (!a) return;
      if (a.stopAll) a.stopAll();
      else if (a.setLevel) a.setLevel(0);
      if (a.signalDrop) a.signalDrop();
    } catch (e) {}
  }

  /** 클라이맥스/UI 오버레이 전부 끄기 */
  function hardBlackoutVisual() {
    try {
      var haunt = document.getElementById("haunt");
      if (haunt) {
        haunt.hidden = true;
        haunt.setAttribute("aria-hidden", "true");
        haunt.className = "haunt";
        haunt.setAttribute("data-climax-phase", "0");
      }
      document.body.classList.remove(
        "is-haunting",
        "phase-3-active",
        "phase3-settled",
        "phase3-enter",
        "diary-open"
      );
      document.body.removeAttribute("data-climax-phase");
      document.body.style.filter = "none";
      document.body.style.background = "#000";

      var bar = document.getElementById("p3DepthBar");
      if (bar) {
        bar.hidden = true;
        bar.classList.remove("is-on");
      }
      ["p2HintToast", "p3HintToast", "p3LayerToast", "findHintToast"].forEach(
        function (id) {
          var el = document.getElementById(id);
          if (el) {
            el.hidden = true;
            el.classList.remove("is-on");
          }
        }
      );
      ["p2MissionChip", "p3MissionChip"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.hidden = true;
      });
    } catch (e) {}
  }

  function typeLine(el, text, cps, done) {
    if (!el) {
      if (done) done();
      return;
    }
    el.textContent = "";
    el.classList.add("is-visible", "is-typing");
    // 커서: 타이핑 중에도 끝에 표시
    var cur = document.createElement("span");
    cur.className = "ending-cursor";
    cur.setAttribute("aria-hidden", "true");
    el.appendChild(cur);

    if (reduced) {
      el.textContent = text;
      el.appendChild(cur);
      el.classList.remove("is-typing");
      if (done) done();
      return;
    }

    var i = 0;
    var base = 1000 / (cps || 11);
    function step() {
      if (!active) return;
      if (i >= text.length) {
        el.classList.remove("is-typing");
        if (done) done();
        return;
      }
      // 커서 앞에 글자 삽입
      var ch = text.charAt(i);
      el.insertBefore(document.createTextNode(ch), cur);
      var a = audio();
      if (a && a.typeClick) {
        a.typeClick(
          ch === "." ? "enter" : ch === " " ? "space" : "soft"
        );
      }
      i++;
      var extra = ch === "." ? 280 : ch === " " ? 40 : 0;
      setTimeout(step, base + (Math.random() * 50 - 15) + extra);
    }
    step();
  }

  function startEnding(opts) {
    opts = opts || {};
    if (played && !opts.force) return;
    played = true;
    active = true;

    // 1) 즉시 암전 + 오디오 컷
    killAudioHard();
    hardBlackoutVisual();

    document.body.classList.add("is-ending");
    document.body.classList.remove("is-haunting", "diary-open");
    document.body.style.touchAction = "none";
    document.body.style.overflow = "hidden";

    try {
      var diary = document.getElementById("diaryPanel");
      if (diary) {
        diary.hidden = true;
        diary.setAttribute("aria-hidden", "true");
      }
    } catch (e) {}

    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    root.classList.remove("phase-text");
    root.classList.add("phase-silence", "phase-blackout");

    if (line1) {
      line1.textContent = "";
      line1.classList.remove("is-visible", "is-typing");
    }
    if (line2) {
      line2.textContent = "";
      line2.classList.remove("is-visible", "is-typing");
    }

    document.title = "No Signal";
    try {
      var urlText = document.getElementById("fakeUrlText");
      var tab = document.getElementById("fakeTabTitle");
      if (urlText) urlText.textContent = "about:blank";
      if (tab) tab.textContent = "…";
    } catch (e2) {}

    // 급격한 암전 유지 (~1초) 후 타자기
    var blackoutMs = opts.skipSilence ? 200 : reduced ? 700 : 1000;

    setTimeout(function () {
      if (!active) return;
      // 완전 무음 유지 — 타자기 키음만 아주 약하게
      killAudioHard();

      root.classList.remove("phase-silence");
      root.classList.add("phase-text");

      // WakeAgain..
      typeLine(line1, "WakeAgain..", reduced ? 20 : 10, function () {
        setTimeout(function () {
          if (!active) return;
          // No Signal..
          typeLine(line2, "No Signal..", reduced ? 18 : 9, function () {
            // 최종 커서만 line2 끝에 유지
            try {
              sessionStorage.setItem("haunt_ending", String(Date.now()));
            } catch (e3) {}
            document.dispatchEvent(new CustomEvent("haunt-ending"));
          });
        }, reduced ? 400 : 900);
      });
    }, blackoutMs);
  }

  // Esc 로 닫지 않음
  document.addEventListener("keydown", function (e) {
    if (!active) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
    }
  });

  try {
    if (/[?&]ending=1/.test(location.search || "")) {
      setTimeout(function () {
        startEnding({ skipSilence: false, force: true });
      }, 400);
    }
  } catch (e) {}

  window.__hauntStartEnding = startEnding;
  window.__hauntEndingActive = function () {
    return active;
  };
})();
