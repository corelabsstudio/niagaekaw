/**
 * 엔딩: 클라이맥스 이후
 *   1) 정적 (공백·무음)
 *   2) 풀 블랙
 *   3) wakeagain... / no signal...  (문구만 — 도메인·링크 없음)
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

  function stopAudioSoft() {
    try {
      if (window.__hauntAudio && window.__hauntAudio.setLevel) {
        window.__hauntAudio.setLevel(0);
      }
    } catch (e) {}
  }

  function typeLine(el, text, cps, done) {
    if (!el) {
      if (done) done();
      return;
    }
    el.textContent = "";
    el.classList.add("is-visible");
    if (reduced) {
      el.textContent = text;
      if (done) done();
      return;
    }
    var i = 0;
    var base = 1000 / (cps || 14);
    function step() {
      if (i >= text.length) {
        if (done) done();
        return;
      }
      el.textContent += text.charAt(i);
      i++;
      var extra = text.charAt(i - 1) === "." ? 180 : 0;
      setTimeout(step, base + (Math.random() * 40 - 10) + extra);
    }
    step();
  }

  function startEnding(opts) {
    opts = opts || {};
    if (played && !opts.force) return;
    played = true;
    active = true;

    stopAudioSoft();

    document.body.classList.add("is-ending");
    document.body.classList.remove("is-haunting", "diary-open");
    document.body.style.filter = "";
    document.body.style.touchAction = "none";

    try {
      var diary = document.getElementById("diaryPanel");
      if (diary) {
        diary.hidden = true;
        diary.setAttribute("aria-hidden", "true");
      }
      var toast = document.getElementById("findHintToast");
      if (toast) toast.hidden = true;
    } catch (e) {}

    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    root.classList.remove("phase-text");
    root.classList.add("phase-silence");

    if (line1) {
      line1.textContent = "";
      line1.classList.remove("is-visible");
    }
    if (line2) {
      line2.textContent = "";
      line2.classList.remove("is-visible");
    }

    document.title = "no signal";

    try {
      var urlText = document.getElementById("fakeUrlText");
      var tab = document.getElementById("fakeTabTitle");
      if (urlText) urlText.textContent = "wakeagain... no signal...";
      if (tab) tab.textContent = "no signal";
    } catch (e) {}

    var silenceMs = opts.skipSilence ? 200 : reduced ? 900 : 2200 + Math.random() * 800;

    setTimeout(function () {
      if (!active) return;
      root.classList.remove("phase-silence");
      root.classList.add("phase-text");

      typeLine(line1, "wakeagain...", 11, function () {
        setTimeout(function () {
          if (!active) return;
          typeLine(line2, "no signal...", 10, function () {
            if (line2) {
              var cur = document.createElement("span");
              cur.className = "ending-cursor";
              cur.setAttribute("aria-hidden", "true");
              line2.appendChild(cur);
            }
            try {
              sessionStorage.setItem("haunt_ending", String(Date.now()));
            } catch (e) {}
            document.dispatchEvent(new CustomEvent("haunt-ending"));
          });
        }, reduced ? 200 : 700);
      });
    }, silenceMs);
  }

  // Esc 로는 닫지 않음 — 여운 유지 (새로고침으로만 이탈)
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
