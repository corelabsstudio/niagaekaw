/**
 * 관리자 프리패스 패널
 * 활성화: ?admin=1 | ?creator=1 | ?debug=1 | localStorage haunt_creator=1
 * 단축키: Shift+Alt+A (패널 토글) · Shift+Alt+3 (클라이맥스) · Shift+Alt+4 (P3 트리거 발동)
 *
 * 트리거를 찾지 않고 단계 스킵:
 *  - 일기 열기
 *  - 2페이즈 강제
 *  - 3페이즈 진입 (P2 게이트 스킵)
 *  - 클라이맥스 (P3 게이트 스킵)
 */
(function () {
  "use strict";

  function isAdmin() {
    try {
      if (/[?&](admin|creator|debug|summon)=1/.test(location.search || "")) return true;
      if (localStorage.getItem("haunt_creator") === "1") return true;
      if (localStorage.getItem("haunt_admin") === "1") return true;
    } catch (e) {}
    return false;
  }

  function rememberAdmin() {
    try {
      if (/[?&](admin|creator)=1/.test(location.search || "")) {
        localStorage.setItem("haunt_creator", "1");
        localStorage.setItem("haunt_admin", "1");
      }
    } catch (e) {}
  }

  function unlockAudio() {
    try {
      var a = window.__hauntAudio;
      if (a && a.unlock) a.unlock();
    } catch (e) {}
  }

  function forceDiaryFound() {
    window.__hauntDiaryDiscovered = true;
    window.__hauntCreatorPass = true;
    try {
      sessionStorage.setItem("haunt_diary", "1");
    } catch (e) {}
    try {
      document.dispatchEvent(
        new CustomEvent("haunt-diary", {
          detail: { discovered: true, page: 0, from: "admin" },
        })
      );
    } catch (e2) {}
  }

  function forceStage2() {
    forceDiaryFound();
    unlockAudio();
    try {
      if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(2);
      if (typeof window.__hauntSetMood === "function") window.__hauntSetMood(3);
      if (typeof window.__hauntSetP2Decay === "function") window.__hauntSetP2Decay(2);
    } catch (e) {}
    document.body.classList.add("phase-2-active");
    try {
      if (window.__hauntAudio && window.__hauntAudio.startPhase2Bgm) {
        window.__hauntAudio.startPhase2Bgm();
      }
    } catch (e2) {}
  }

  function forcePhase3() {
    forceStage2();
    window.__hauntCreatorPass = true;
    if (typeof window.__hauntEnterPhase3 === "function") {
      window.__hauntEnterPhase3();
    } else if (window.__hauntClimax && typeof window.__hauntClimax.enterPhase3 === "function") {
      window.__hauntClimax.enterPhase3();
    } else {
      // 폴백
      window.__hauntPhase3Active = true;
      document.body.classList.add("phase-3-active");
      document.body.classList.remove("phase-2-active");
      try {
        sessionStorage.setItem("haunt_phase3", "1");
        document.dispatchEvent(new CustomEvent("haunt-phase3", { detail: { from: "admin" } }));
      } catch (e) {}
    }
    try {
      var au = window.__hauntAudio;
      if (au) {
        if (au.unlock) au.unlock();
        if (au.stopPhase2Bgm) au.stopPhase2Bgm(true);
        if (au.stopPhase3Bgm) au.stopPhase3Bgm(true);
      }
    } catch (eB) {}
  }

  function forceClimax() {
    forcePhase3();
    setTimeout(function () {
      window.__hauntCreatorPass = true;
      if (window.__hauntClimax && typeof window.__hauntClimax.summon === "function") {
        window.__hauntClimax.summon();
        return;
      }
      if (typeof window.__hauntSummon === "function") {
        window.__hauntSummon();
        return;
      }
      if (window.__hauntPhase3 && typeof window.__hauntPhase3.fire === "function") {
        window.__hauntPhase3.fire();
      }
    }, 280);
  }

  function openDiary() {
    forceDiaryFound();
    try {
      if (typeof window.__hauntOpenDiary === "function") {
        window.__hauntOpenDiary();
        return;
      }
    } catch (e) {}
    var btn = document.querySelector("[data-find], .diary-hint, #diaryHint");
    if (btn) {
      try {
        btn.click();
      } catch (e2) {}
    }
  }

  function showHints() {
    try {
      if (window.__hauntClimax && window.__hauntClimax.showHint) {
        window.__hauntClimax.showHint();
      }
    } catch (e) {}
    try {
      if (window.__hauntPhase3 && window.__hauntPhase3.showHint) {
        window.__hauntPhase3.showHint();
      }
    } catch (e2) {}
  }

  function currentTriggerLabel() {
    var p2 = window.__hauntClimax && window.__hauntClimax.id;
    var p3 = window.__hauntPhase3Trigger || (window.__hauntPhase3 && window.__hauntPhase3.id);
    var bits = [];
    if (p2) bits.push("P2:" + p2);
    if (p3) bits.push("P3:" + p3);
    return bits.length ? bits.join(" · ") : "—";
  }

  function refreshMeta(el) {
    if (!el) return;
    el.textContent = currentTriggerLabel();
  }

  function buildPanel() {
    if (document.getElementById("adminPassPanel")) return;

    // 예전 흩어진 배지 정리 (중복 방지)
    document.querySelectorAll(".creator-pass").forEach(function (n) {
      if (n.id !== "adminPassPanel") {
        try {
          n.parentNode.removeChild(n);
        } catch (e) {}
      }
    });

    var panel = document.createElement("div");
    panel.id = "adminPassPanel";
    panel.className = "admin-pass-panel creator-pass";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "관리자 프리패스");
    panel.innerHTML =
      '<div class="admin-pass-head">' +
      "<strong>ADMIN PASS</strong>" +
      '<button type="button" class="admin-pass-min" title="접기">−</button>' +
      "</div>" +
      '<p class="admin-pass-meta" id="adminPassMeta">—</p>' +
      '<div class="admin-pass-actions">' +
      '<button type="button" data-admin="diary">일기 열기</button>' +
      '<button type="button" data-admin="p2">2페이즈</button>' +
      '<button type="button" data-admin="p3" class="is-primary">▶ 3페이즈 (게이트 스킵)</button>' +
      '<button type="button" data-admin="climax" class="is-danger">▶ 클라이맥스 스킵</button>' +
      '<button type="button" data-admin="hint">힌트 강제 표시</button>' +
      "</div>" +
      '<p class="admin-pass-tip">URL: ?admin=1 · Shift+Alt+A 토글</p>';

    document.body.appendChild(panel);

    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      var t = e.target;
      if (!t || !t.getAttribute) return;
      if (t.classList.contains("admin-pass-min")) {
        panel.classList.toggle("is-min");
        t.textContent = panel.classList.contains("is-min") ? "+" : "−";
        return;
      }
      var act = t.getAttribute("data-admin");
      if (!act) return;
      unlockAudio();
      if (act === "diary") openDiary();
      else if (act === "p2") forceStage2();
      else if (act === "p3") forcePhase3();
      else if (act === "climax") forceClimax();
      else if (act === "hint") showHints();
      setTimeout(function () {
        refreshMeta(document.getElementById("adminPassMeta"));
      }, 200);
    });

    refreshMeta(document.getElementById("adminPassMeta"));
    setInterval(function () {
      refreshMeta(document.getElementById("adminPassMeta"));
    }, 3000);
  }

  function destroyPanel() {
    var p = document.getElementById("adminPassPanel");
    if (p && p.parentNode) p.parentNode.removeChild(p);
  }

  function enable() {
    rememberAdmin();
    window.__hauntCreatorPass = true;
    try {
      localStorage.setItem("haunt_admin", "1");
      localStorage.setItem("haunt_creator", "1");
    } catch (e) {}
    buildPanel();
  }

  // 단축키
  document.addEventListener("keydown", function (e) {
    // Shift+Alt+A — 관리자 패널 토글 (비관리자도 켤 수 있음 → 로컬 기억)
    if (e.shiftKey && e.altKey && (e.key === "a" || e.key === "A" || e.code === "KeyA")) {
      e.preventDefault();
      if (document.getElementById("adminPassPanel")) {
        destroyPanel();
      } else {
        enable();
      }
      return;
    }
    if (e.shiftKey && e.altKey && (e.key === "3" || e.code === "Digit3")) {
      e.preventDefault();
      enable();
      forceClimax();
    }
  });

  if (isAdmin()) {
    // 다른 creator 배지보다 나중에 그려 중복 제거
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(enable, 80);
      });
    } else {
      setTimeout(enable, 80);
    }
  }

  window.__hauntAdmin = {
    enable: enable,
    diary: openDiary,
    phase2: forceStage2,
    phase3: forcePhase3,
    climax: forceClimax,
    hint: showHints,
    isAdmin: isAdmin,
  };
})();
