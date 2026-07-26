/**
 * 유출된 개발자 일기
 * - mood 게이트 (3달→1달→오늘 천천히)
 * - 오늘 페이지: CRT/DOS 자동 타이핑 + 또독 키 소리
 *   · 사람 일기처럼 쓰이다가
 *   · 시스템이 가로채 스스로 이어 씀
 */
(function () {
  "use strict";

  var panel = document.getElementById("diaryPanel");
  var bodyEl = document.getElementById("diaryBody");
  var closeBtn = document.getElementById("diaryClose");
  var backdrop = document.getElementById("diaryBackdrop");
  var nextBtn = document.getElementById("diaryNext");
  var tabs = document.querySelectorAll(".diary-tab");
  var pages = document.querySelectorAll(".diary-page");
  var liveType = document.getElementById("diaryLiveType");
  var cursorLine = document.getElementById("diaryCursorLine");
  var termStatus = document.getElementById("diaryTermStatus");
  var sheet = panel ? panel.querySelector(".diary-sheet") : null;

  var page = 0;
  var unlocked = 0;
  var discovered = false;
  var reading = false;
  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var typeToken = 0; // cancel in-flight typing
  var todayDone = false;

  window.__hauntDiaryBoost = 1;
  window.__hauntDiaryDiscovered = false;
  window.__hauntDiaryPage = 0;

  /** 오늘 타이핑 시퀀스 — diary-stories.js 세션 변형 */
  function getTodaySeq() {
    if (window.__hauntDiaryStories && window.__hauntDiaryStories.todaySeq) {
      return window.__hauntDiaryStories.todaySeq;
    }
    return [
      { kind: "status", text: "> open dev_journal.txt — append mode_", delay: 400 },
      {
        kind: "p",
        className: "diary-human diary-last",
        text: "누군가 이 페이지에 접속했다면… 제발 내 코드를 꺼주",
        cps: 16,
      },
      { kind: "pause", ms: 700 },
      {
        kind: "status",
        text: "> INPUT HIJACK — writer_process attached_",
        delay: 200,
        beep: true,
      },
      {
        kind: "p",
        className: "diary-break diary-system",
        text: "바직— ████ process_not_dead ████",
        cps: 26,
        system: true,
        hardKeys: true,
      },
    ];
  }

  function audio() {
    return window.__hauntAudio || null;
  }

  function clickForChar(ch, hard) {
    var a = audio();
    if (!a || !a.typeClick) return;
    if (ch === "\n") a.typeClick("enter");
    else if (ch === " " || ch === "\t") a.typeClick("space");
    else if (hard) a.typeClick("hard");
    else if (/[a-zA-Z0-9가-힣]/.test(ch)) a.typeClick(Math.random() > 0.85 ? "hard" : "mid");
    else a.typeClick("soft");
  }

  function setBoost() {
    var b = 1;
    if (discovered) b = 1.2;
    if (unlocked >= 1) b = 1.45;
    if (unlocked >= 2) b = 1.85;
    if (page >= 2 && unlocked >= 2) b = 2.4;
    if (reading) b *= 1.15;
    if (page === 2 && !todayDone) b *= 1.1;
    window.__hauntDiaryBoost = b;
    window.__hauntDiaryPage = page;
    window.__hauntDiaryDiscovered = discovered;
    document.body.classList.toggle("diary-open", reading);
    document.body.classList.toggle("diary-found", discovered);
    document.body.classList.toggle("diary-typing", page === 2 && reading && !todayDone);
    document.dispatchEvent(
      new CustomEvent("haunt-diary", {
        detail: {
          discovered: discovered,
          page: page,
          unlocked: unlocked,
          boost: b,
          typing: page === 2 && !todayDone,
        },
      })
    );
  }

  function stopTyping() {
    typeToken++;
    if (cursorLine) cursorLine.hidden = true;
    document.body.classList.remove("diary-typing");
    try {
      clearDiaryFx();
    } catch (e) {}
  }

  function wait(ms, token) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(token === typeToken);
      }, ms);
    });
  }

  function typeString(el, text, opts, token) {
    opts = opts || {};
    var cps = opts.cps || 20;
    var hard = !!opts.hardKeys;
    var i = 0;
    return new Promise(function (resolve) {
      function step() {
        if (token !== typeToken) {
          resolve(false);
          return;
        }
        if (i >= text.length) {
          resolve(true);
          return;
        }
        var ch = text.charAt(i);
        el.textContent += ch;
        i++;
        clickForChar(ch, hard);
        // 스크롤 따라가기
        if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
        var base = 1000 / cps;
        var jitter = (Math.random() - 0.4) * base * 0.5;
        var extra = 0;
        if (ch === "." || ch === "…" || ch === "。") extra = 120 + Math.random() * 180;
        if (ch === "," || ch === "，") extra = 40;
        if (ch === " " && Math.random() > 0.9) extra = 60;
        if (reduced) {
          el.textContent = text;
          resolve(true);
          return;
        }
        setTimeout(step, Math.max(18, base + jitter + extra));
      }
      step();
    });
  }

  var DIARY_FX_CLASSES = [
    "diary-fx-rogue-cursor",
    "diary-fx-manic-flash",
    "diary-fx-backspace-gothic",
    "diary-fx-mad-rewrite",
    "diary-fx-rough-backspace",
    "diary-fx-autocomplete",
    "diary-fx-tab-complete",
    "diary-fx-smash",
    "diary-fx-session-warn",
    "diary-fx-stutter",
    "diary-fx-port-force",
    "diary-fx-redirect-clone",
    "diary-fx-conflict-merge",
    "diary-fx-flee-cursor",
    "diary-fx-tremor",
    "diary-fx-heartbeat",
    "diary-fx-disk-scratch",
    "diary-fx-remote-hijack",
    "diary-fx-compiler-scream",
    "diary-fx-final-session",
  ];

  function clearDiaryFx() {
    DIARY_FX_CLASSES.forEach(function (cls) {
      document.body.classList.remove(cls);
      if (panel) panel.classList.remove(cls);
      if (sheet) sheet.classList.remove(cls);
    });
    if (sheet) sheet.classList.remove("diary-warn-flood");
  }

  function applyDiaryFx(fx) {
    clearDiaryFx();
    if (!fx) return;
    var map = {
      rogue_cursor: "diary-fx-rogue-cursor",
      manic_flash: "diary-fx-manic-flash",
      backspace_gothic: "diary-fx-backspace-gothic",
      mad_rewrite: "diary-fx-mad-rewrite",
      rough_backspace: "diary-fx-rough-backspace",
      autocomplete: "diary-fx-autocomplete",
      tab_complete: "diary-fx-tab-complete",
      smash: "diary-fx-smash",
      session_warn: "diary-fx-session-warn",
      stutter: "diary-fx-stutter",
      port_force: "diary-fx-port-force",
      redirect_clone: "diary-fx-redirect-clone",
      conflict_merge: "diary-fx-conflict-merge",
      flee_cursor: "diary-fx-flee-cursor",
      tremor: "diary-fx-tremor",
      heartbeat: "diary-fx-heartbeat",
      disk_scratch: "diary-fx-disk-scratch",
      remote_hijack: "diary-fx-remote-hijack",
      compiler_scream: "diary-fx-compiler-scream",
      final_session: "diary-fx-final-session",
    };
    var cls = map[fx];
    if (!cls) return;
    document.body.classList.add(cls);
    if (panel) panel.classList.add(cls);
    if (sheet) sheet.classList.add(cls);
  }

  function typeIntoNode(textNode, caret, text, opts, token) {
    opts = opts || {};
    var cps = opts.cps || 18;
    var hard = !!opts.hard;
    var system = !!opts.system;
    var manic = !!opts.manic;
    var rogue = !!opts.rogue;
    var mad = !!opts.mad;
    var rough = !!opts.rough;
    var stutter = !!opts.stutter;
    var flee = !!opts.flee;
    var tremor = !!opts.tremor;
    var clone = !!opts.clone;
    var heartbeat = !!opts.heartbeat;
    var disk = !!opts.disk;
    var remote = !!opts.remote;
    var hostP = opts.hostP || null;
    var i = 0;
    var lastClone = 0;
    var beatPhase = 0;

    return new Promise(function (resolve) {
      function tick() {
        if (token !== typeToken) {
          resolve(false);
          return;
        }
        if (reduced) {
          textNode.textContent = text;
          if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
          resolve(true);
          return;
        }
        if (i >= text.length) {
          if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
          resolve(true);
          return;
        }

        // rough: 가끔 방금 쓴 글자 2~5개 거칠게 지우고 다시
        if (rough && i > 4 && Math.random() > 0.86) {
          var cut = 2 + Math.floor(Math.random() * 4);
          cut = Math.min(cut, i);
          textNode.textContent = (textNode.textContent || "").slice(0, -cut);
          i -= cut;
          if (i < 0) i = 0;
          if (caret) caret.classList.add("is-backspacing");
          clickForChar("\b", true);
          setTimeout(function () {
            if (caret) caret.classList.remove("is-backspacing");
            tick();
          }, 28 + Math.random() * 40);
          return;
        }

        var ch = text.charAt(i);
        textNode.textContent += ch;
        i++;
        clickForChar(ch, hard || system || manic || mad || tremor || disk);
        if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;

        // redirect: 중간중간 복제 고스트 라인
        if (clone && liveType && i - lastClone > 28 && Math.random() > 0.55) {
          lastClone = i;
          var ghost = document.createElement("p");
          ghost.className = "diary-redirect-ghost";
          ghost.setAttribute("aria-hidden", "true");
          ghost.textContent = (textNode.textContent || "").slice(-48);
          if (hostP && hostP.parentNode) {
            hostP.parentNode.insertBefore(ghost, hostP.nextSibling);
          } else {
            liveType.appendChild(ghost);
          }
          setTimeout(function () {
            ghost.classList.add("is-fade");
          }, 40);
        }

        // compiler scream: 경고 조각 뿌리기
        if (opts.scream && liveType && i % 36 === 0 && i > 0) {
          var warn = document.createElement("div");
          warn.className = "diary-scream-chip";
          warn.setAttribute("aria-hidden", "true");
          warn.textContent = [
            "WARNING",
            "C0RRUPT",
            "ID_LEAK",
            "RUN?",
            "████",
          ][Math.floor(Math.random() * 5)];
          warn.style.left = 8 + Math.random() * 70 + "%";
          warn.style.top = 12 + Math.random() * 60 + "%";
          if (sheet) {
            if (getComputedStyle(sheet).position === "static") {
              sheet.style.position = "relative";
            }
            sheet.appendChild(warn);
            setTimeout(function () {
              if (warn.parentNode) warn.parentNode.removeChild(warn);
            }, 900 + Math.random() * 500);
          }
        }

        if ((rogue || mad || tremor || disk) && caret && !flee && !remote) {
          var amp = mad ? 22 : disk ? 14 : tremor ? 16 : 18;
          var jx = (Math.random() - 0.5) * amp;
          var jy = (Math.random() - 0.5) * (mad ? 14 : tremor ? 12 : 10);
          caret.style.transform =
            "translate(" + jx.toFixed(1) + "px," + jy.toFixed(1) + "px)";
          if (Math.random() > (mad ? 0.55 : 0.82)) {
            caret.classList.add("is-rogue-jump");
            setTimeout(function () {
              caret.classList.remove("is-rogue-jump");
            }, mad ? 50 : 80);
          }
        }

        // flee / remote hijack: 캐럿이 구석·닫기 버튼 쪽으로 도망
        if ((flee || remote) && caret) {
          var prog = i / Math.max(1, text.length);
          var fxOff = remote
            ? 10 + Math.sin(prog * 12) * 30 + prog * 50
            : 8 + prog * 72;
          var fyOff = remote
            ? 6 + Math.cos(prog * 9) * 24 + prog * 40
            : 4 + prog * 48;
          caret.style.transform =
            "translate(" +
            fxOff.toFixed(1) +
            "px," +
            fyOff.toFixed(1) +
            "px) scale(" +
            (1 - prog * 0.22).toFixed(2) +
            ")";
          caret.classList.add(remote ? "is-remote-flee" : "is-fleeing");
        }

        // heartbeat: 쿵-쿵 리듬 (짧은 쌍 비트)
        var base = 1000 / cps;
        var jitter = (Math.random() - 0.35) * base * (manic ? 0.25 : 0.55);
        var extra = 0;
        if (heartbeat) {
          beatPhase = (beatPhase + 1) % 8;
          // 0,1 = 쿵쿵 / 2-7 = 긴 쉼
          if (beatPhase === 0) {
            base = 55;
            extra = 0;
            if (sheet) sheet.classList.add("diary-beat");
            setTimeout(function () {
              if (sheet) sheet.classList.remove("diary-beat");
            }, 90);
            try {
              var au = audio();
              if (au && au.termBeep) au.termBeep(110);
            } catch (eH) {}
          } else if (beatPhase === 1) {
            base = 55;
            extra = 0;
            try {
              var au2 = audio();
              if (au2 && au2.termBeep) au2.termBeep(90);
            } catch (eH2) {}
          } else if (beatPhase === 2) {
            extra = 280 + Math.random() * 120;
          } else {
            extra = 40 + Math.random() * 80;
          }
        } else if (stutter) {
          if (Math.random() > 0.78) extra += 220 + Math.random() * 480;
          if (Math.random() > 0.92) extra += 600 + Math.random() * 700;
          base *= 1.15 + Math.random() * 0.9;
        } else if (tremor) {
          if (Math.random() > 0.75) extra += 80 + Math.random() * 160;
          base *= 1.05 + Math.random() * 0.35;
        } else if (disk) {
          if (Math.random() > 0.85) base *= 0.3;
          if (Math.random() > 0.9) extra += 30;
        } else if (!manic) {
          if (ch === "." || ch === "…" || ch === "?" || ch === "!") extra = 140 + Math.random() * 160;
          if (ch === ",") extra = 50;
        } else {
          if (Math.random() > 0.88) base *= 0.35;
        }
        if (mad && Math.random() > 0.9) base *= 0.4;
        if (system && !manic && !stutter && !heartbeat) {
          base *= 0.85;
          jitter *= 0.4;
        }
        setTimeout(
          tick,
          Math.max(
            manic || disk ? 10 : stutter ? 20 : heartbeat ? 18 : 16,
            base + jitter + extra
          )
        );
      }
      tick();
    });
  }

  /** 자동완성/탭: 단어·구 단위로 툭툭 붙음 */
  function typeChunks(textNode, caret, text, opts, token) {
    opts = opts || {};
    var tabMode = !!opts.tab;
    // 공백/구두점 단위 청크
    var chunks = [];
    var buf = "";
    for (var c = 0; c < text.length; c++) {
      var ch = text.charAt(c);
      buf += ch;
      if (ch === " " || ch === "…" || ch === "." || ch === "?" || ch === "!" || ch === "," || ch === "·") {
        chunks.push(buf);
        buf = "";
      }
    }
    if (buf) chunks.push(buf);
    var ci = 0;

    return new Promise(function (resolve) {
      function nextChunk() {
        if (token !== typeToken) {
          resolve(false);
          return;
        }
        if (reduced) {
          textNode.textContent = text;
          if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
          resolve(true);
          return;
        }
        if (ci >= chunks.length) {
          if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
          resolve(true);
          return;
        }
        var piece = chunks[ci++];
        if (tabMode && caret) {
          caret.classList.add("is-tab-pulse");
          setTimeout(function () {
            caret.classList.remove("is-tab-pulse");
          }, 90);
        }
        // 청크 안은 빠르게 한 글자씩
        var j = 0;
        function charTick() {
          if (token !== typeToken) {
            resolve(false);
            return;
          }
          if (j >= piece.length) {
            if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
            // 다음 청크 전 짧은 멈춤 = 탭/완성 느낌
            setTimeout(nextChunk, tabMode ? 70 + Math.random() * 90 : 40 + Math.random() * 60);
            return;
          }
          textNode.textContent += piece.charAt(j);
          clickForChar(piece.charAt(j), true);
          j++;
          setTimeout(charTick, 12 + Math.random() * 18);
        }
        charTick();
      }
      nextChunk();
    });
  }

  function backspaceNode(textNode, caret, opts, token) {
    opts = opts || {};
    var cps = opts.cps || 48;
    return new Promise(function (resolve) {
      function tick() {
        if (token !== typeToken) {
          resolve(false);
          return;
        }
        var cur = textNode.textContent || "";
        if (!cur.length) {
          resolve(true);
          return;
        }
        textNode.textContent = cur.slice(0, -1);
        clickForChar("\b", true);
        if (caret) {
          caret.classList.add("is-backspacing");
        }
        if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
        setTimeout(tick, Math.max(12, 1000 / cps));
      }
      tick();
    });
  }

  async function runTodayTyping(token) {
    if (!liveType) return;
    liveType.innerHTML = "";
    todayDone = false;
    clearDiaryFx();
    if (cursorLine) cursorLine.hidden = false;
    if (sheet) sheet.classList.add("is-terminal");
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = "입력 중…";
    }

    var a = audio();
    if (a) {
      try {
        a.unlock();
        if (a.termBeep) a.termBeep(660);
      } catch (e) {}
    }

    var TODAY_SEQ = getTodaySeq();
    if (window.__hauntDiaryStories && window.__hauntDiaryStories.current) {
      var st = window.__hauntDiaryStories.current;
      if (window.console && /[?&]debug=1/.test(location.search || "")) {
        console.log(
          "[diary] typing story #" + st.id,
          st.title,
          st.today && st.today.fx
        );
      }
    }

    for (var s = 0; s < TODAY_SEQ.length; s++) {
      if (token !== typeToken) {
        clearDiaryFx();
        return;
      }
      var step = TODAY_SEQ[s];
      var ok = true;

      if (step.kind === "pause") {
        ok = await wait(step.ms || 500, token);
        if (!ok) {
          clearDiaryFx();
          return;
        }
        continue;
      }

      if (step.kind === "fx_start") {
        applyDiaryFx(step.fx);
        if (
          (step.fx === "manic_flash" ||
            step.fx === "smash" ||
            step.fx === "session_warn" ||
            step.fx === "redirect_clone" ||
            step.fx === "conflict_merge" ||
            step.fx === "compiler_scream" ||
            step.fx === "final_session" ||
            step.fx === "disk_scratch") &&
          sheet
        ) {
          sheet.classList.add("diary-manic-burst");
          setTimeout(function () {
            if (sheet) sheet.classList.remove("diary-manic-burst");
          }, 420);
        }
        if (step.fx === "compiler_scream" && sheet) {
          sheet.classList.add("diary-warn-flood");
        }
        if (
          (step.fx === "session_warn" ||
            step.fx === "conflict_merge" ||
            step.fx === "port_force" ||
            step.fx === "compiler_scream" ||
            step.fx === "disk_scratch" ||
            step.fx === "final_session") &&
          a
        ) {
          try {
            if (a.sting) a.sting("blood");
            else if (a.termBeep) a.termBeep(step.fx === "port_force" ? 180 : 220);
            if (step.fx === "port_force" && a.termBeep) {
              setTimeout(function () {
                try {
                  a.termBeep(320);
                } catch (e2) {}
              }, 120);
              setTimeout(function () {
                try {
                  a.termBeep(90);
                } catch (e3) {}
              }, 240);
            }
            if (step.fx === "disk_scratch" && a.termBeep) {
              setTimeout(function () {
                try {
                  a.termBeep(60);
                } catch (e4) {}
              }, 80);
            }
          } catch (eW) {}
        }
        ok = await wait(reduced ? 80 : 220, token);
        if (!ok) {
          clearDiaryFx();
          return;
        }
        continue;
      }

      if (step.kind === "fx_end") {
        clearDiaryFx();
        ok = await wait(120, token);
        if (!ok) return;
        continue;
      }

      if (step.kind === "status") {
        if (termStatus) {
          termStatus.textContent = step.text;
          termStatus.classList.add("is-flash");
          if (step.warn) termStatus.classList.add("is-warn");
          setTimeout(function () {
            if (termStatus) {
              termStatus.classList.remove("is-flash");
              termStatus.classList.remove("is-warn");
            }
          }, 320);
        }
        if (step.beep && a) {
          try {
            if (step.warn && a.sting) a.sting("blood");
            else if (a.termBeep) a.termBeep(s % 2 ? 990 : 770);
          } catch (eB) {}
        } else clickForChar(">", true);
        ok = await wait(step.delay || 350, token);
        if (!ok) {
          clearDiaryFx();
          return;
        }
        continue;
      }

      if (step.kind === "p") {
        var p = document.createElement("p");
        p.className = step.className || "";
        if (step.system) p.classList.add("is-system");
        liveType.appendChild(p);
        var caret = document.createElement("span");
        caret.className = "diary-inline-caret";
        caret.textContent = "█";
        p.appendChild(caret);
        var textNode = document.createTextNode("");
        p.insertBefore(textNode, caret);

        var text = step.text || "";
        var cps = step.cps || 18;
        var hard = !!step.hardKeys;
        var fx = step.fx || "";
        var manic =
          fx === "manic_flash" ||
          fx === "smash" ||
          fx === "session_warn" ||
          fx === "redirect_clone";
        var rogue = fx === "rogue_cursor" || fx === "port_force";
        var mad = fx === "mad_rewrite" || fx === "conflict_merge";
        var rough =
          (fx === "rough_backspace" || fx === "port_force") && !step.system;
        var gothic = fx === "backspace_gothic" && !step.system;
        var rewrite = (mad || fx === "conflict_merge") && !step.system;
        var auto =
          (fx === "autocomplete" || fx === "tab_complete") && !step.system;
        var stutter = fx === "stutter";
        var flee = fx === "flee_cursor" && !step.system;
        var tremor = fx === "tremor";
        var clone = fx === "redirect_clone" && !step.system;

        if ((manic || fx === "conflict_merge") && sheet && !reduced) {
          sheet.classList.add("diary-manic-burst");
          setTimeout(function () {
            if (sheet) sheet.classList.remove("diary-manic-burst");
          }, 160);
        }

        function ensureCaret(clsExtra) {
          if (!caret.parentNode) {
            caret = document.createElement("span");
            caret.className =
              "diary-inline-caret" + (clsExtra ? " " + clsExtra : "");
            caret.textContent = "█";
            p.appendChild(caret);
          } else if (clsExtra) {
            caret.className = "diary-inline-caret " + clsExtra;
          }
          return caret;
        }

        if ((gothic || rewrite) && !reduced) {
          ok = await typeIntoNode(
            textNode,
            caret,
            text,
            {
              cps: cps,
              hard: hard || mad,
              system: false,
              manic: false,
              rogue: mad || fx === "port_force",
              mad: mad,
              hostP: p,
            },
            token
          );
          if (!ok) {
            clearDiaryFx();
            return;
          }
          ok = await wait(rewrite ? 220 : 380, token);
          if (!ok) {
            clearDiaryFx();
            return;
          }
          ensureCaret("is-backspacing");
          ok = await backspaceNode(
            textNode,
            caret,
            { cps: rewrite ? 70 : 52 },
            token
          );
          if (!ok) {
            clearDiaryFx();
            return;
          }
          ok = await wait(rewrite ? 160 : 280, token);
          if (!ok) {
            clearDiaryFx();
            return;
          }
          if (gothic) {
            p.classList.add("diary-gothic");
            ensureCaret("diary-gothic-caret");
          } else if (fx === "conflict_merge") {
            p.classList.add("diary-conflict");
            ensureCaret("is-mad");
          } else {
            p.classList.add("diary-mad-rewrite");
            ensureCaret("is-mad");
          }
          ok = await typeIntoNode(
            textNode,
            caret,
            text,
            {
              cps: gothic ? Math.max(12, cps - 2) : Math.max(14, cps),
              hard: true,
              system: true,
              manic: rewrite,
              rogue: rewrite,
              mad: rewrite,
              hostP: p,
            },
            token
          );
          if (!ok) {
            clearDiaryFx();
            return;
          }
        } else if (auto && !reduced) {
          ok = await typeChunks(
            textNode,
            caret,
            text,
            { tab: fx === "tab_complete" },
            token
          );
          if (!ok) {
            clearDiaryFx();
            return;
          }
        } else {
          ok = await typeIntoNode(
            textNode,
            caret,
            text,
            {
              cps: cps,
              hard: hard,
              system: !!step.system,
              manic: manic,
              rogue: rogue,
              mad: mad,
              rough: rough,
              stutter: stutter,
              flee: flee,
              tremor: tremor,
              clone: clone,
              hostP: p,
            },
            token
          );
          if (!ok) {
            clearDiaryFx();
            return;
          }
        }

        var pauseMs = step.system
          ? manic
            ? 120
            : stutter
              ? 360
              : 280
          : manic
            ? 140
            : stutter
              ? 480
              : auto
                ? 200
                : 420;
        ok = await wait(pauseMs, token);
        if (!ok) {
          clearDiaryFx();
          return;
        }
      }
    }

    if (token !== typeToken) {
      clearDiaryFx();
      return;
    }
    todayDone = true;
    clearDiaryFx();
    if (cursorLine) cursorLine.hidden = true;
    document.body.classList.remove("diary-typing");
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.textContent = "닫기";
      nextBtn.dataset.mode = "close";
    }
    if (a && a.termBeep) a.termBeep(440);
    setBoost();
  }

  function showPage(i) {
    page = Math.max(0, Math.min(2, i));
    stopTyping();

    pages.forEach(function (p) {
      var idx = parseInt(p.getAttribute("data-page"), 10);
      var on = idx === page;
      p.hidden = !on;
      p.classList.toggle("is-on", on);
    });
    tabs.forEach(function (t) {
      var idx = parseInt(t.getAttribute("data-diary-page"), 10);
      t.classList.toggle("is-on", idx === page);
      t.disabled = idx > unlocked;
    });

    if (sheet) {
      sheet.classList.toggle("is-terminal", page === 2);
    }

    if (nextBtn) {
      nextBtn.disabled = false;
      if (page >= 2) {
        if (todayDone) {
          nextBtn.textContent = "닫기";
          nextBtn.dataset.mode = "close";
        } else {
          nextBtn.textContent = "입력 중…";
          nextBtn.dataset.mode = "close";
          nextBtn.disabled = true;
        }
      } else if (page >= unlocked) {
        nextBtn.textContent = "다음 페이지 →";
        nextBtn.dataset.mode = "unlock";
      } else {
        nextBtn.textContent = "다음 페이지 →";
        nextBtn.dataset.mode = "next";
      }
    }

    if (page === 2) {
      document.body.classList.add("diary-finale");
      var tok = typeToken;
      // 재방문 시 이미 끝난 경우 즉시 전체 표시
      if (todayDone && liveType && liveType.childNodes.length) {
        if (nextBtn) {
          nextBtn.disabled = false;
          nextBtn.textContent = "닫기";
        }
      } else {
        // 약간의 딜레이 후 타이핑 시작 (단말 켜지는 느낌)
        setTimeout(function () {
          if (tok !== typeToken) return;
          runTodayTyping(typeToken);
        }, reduced ? 0 : 450);
      }
    } else if (sheet) {
      sheet.classList.remove("is-terminal");
    }

    setBoost();
  }

  /** body 에 걸린 filter/transform 이상현상 — fixed 일기 패널 붕괴 원인 */
  function clearBodyLayoutHazards() {
    var b = document.body;
    // anom-* / page-tick 전부 제거 (목록 누락 방지)
    var drop = [];
    for (var i = 0; i < b.classList.length; i++) {
      var c = b.classList[i];
      if (c === "page-tick" || c.indexOf("anom-") === 0) drop.push(c);
    }
    for (var j = 0; j < drop.length; j++) b.classList.remove(drop[j]);
    // CSS 애니메이션이 filter 를 잡고 있으면 !important 규칙보다 우선함 → 강제 취소
    try {
      if (typeof b.getAnimations === "function") {
        b.getAnimations().forEach(function (a) {
          try {
            a.cancel();
          } catch (e1) {}
        });
      }
      if (document.documentElement && document.documentElement.getAnimations) {
        document.documentElement.getAnimations().forEach(function (a) {
          try {
            a.cancel();
          } catch (e2) {}
        });
      }
    } catch (e3) {}
    // 애니메이션 중간 filter 보간값까지 즉시 차단
    try {
      b.style.setProperty("filter", "none", "important");
      b.style.setProperty("transform", "none", "important");
      b.style.setProperty("animation", "none", "important");
      b.style.removeProperty("--anom-hue");
    } catch (e) {
      b.style.filter = "none";
      b.style.transform = "none";
    }
  }

  function releaseBodyLayoutLock() {
    var b = document.body;
    try {
      b.style.removeProperty("filter");
      b.style.removeProperty("transform");
      b.style.removeProperty("animation");
    } catch (e) {
      b.style.filter = "";
      b.style.transform = "";
      b.style.animation = "";
    }
  }

  function openDiary() {
    if (!panel) return;
    discovered = true;
    // 시간 힌트 중단 (아래 scheduleFindHints 가 심어 둔 타이머)
    if (typeof clearFindHints === "function") {
      try {
        clearFindHints();
      } catch (e) {}
    }
    reading = true;
    // 열기 직전: body layout 위험 클래스 제거 (filter/transform → fixed 깨짐)
    clearBodyLayoutHazards();
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("diary-open");
    if (panel.style) {
      panel.style.display = "";
      panel.style.position = "fixed";
      panel.style.inset = "0";
      panel.style.zIndex = "200";
      panel.style.filter = "none";
      panel.style.transform = "none";
    }
    if (sheet) {
      sheet.style.opacity = "1";
      sheet.style.filter = "none";
      sheet.style.transform = "";
    }
    if (audio()) {
      try {
        audio().unlock();
        if (audio().breath && page === 0) audio().breath();
        else if (audio().pulse) audio().pulse(page >= 2 ? "heavy" : page === 1 ? "mid" : "soft");
      } catch (e) {}
    }
    showPage(page);
    setBoost();
  }

  function closeDiary() {
    if (!panel) return;
    // 타이핑 중 닫으면 중단 (다시 열면 이어쓰기/재시작)
    if (page === 2 && !todayDone) {
      // 부분 입력이라도 유지 — 다시 열면 처음부터 재연출
      stopTyping();
      if (liveType) liveType.innerHTML = "";
    } else {
      stopTyping();
    }
    reading = false;
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("diary-open", "diary-typing");
    releaseBodyLayoutLock();
    if (sheet) sheet.classList.remove("is-terminal");
    setBoost();
  }

  function unlockNext() {
    // 페이지 전환 시 mood-dim 등 body 스타일 바뀌어도 fixed 유지
    clearBodyLayoutHazards();
    document.body.classList.add("diary-open");
    // 오디오 실패해도 페이지 넘김은 반드시 진행
    try {
      if (audio()) {
        audio().unlock();
        if (page === 0) audio().pulse("soft");
        else if (page === 1) audio().pulse("mid");
      }
    } catch (e) {}
    if (unlocked < 2) {
      unlocked += 1;
      showPage(unlocked);
    } else {
      showPage(Math.min(page + 1, 2));
    }
    // 시트 다시 보이게 보장 (CSS filter 글리치 대비)
    if (sheet) {
      sheet.style.transform = "";
      sheet.style.opacity = "1";
      sheet.style.filter = "none";
    }
    if (panel) {
      panel.hidden = false;
      panel.style.display = "";
      panel.style.position = "fixed";
      panel.style.inset = "0";
      panel.style.zIndex = "200";
      panel.style.filter = "none";
      panel.style.transform = "none";
    }
  }

  /**
   * 세션마다 발견 경로 1개만 활성 (스크롤 제거 · 21종 · 쉽게 안 찾히게)
   * 주소창 Find the diary = 호기심만
   */
  var FIND_PATHS = [
    "nav", "chip", "footer", "logo", "wip", "branch", "todo", "docs", "stub",
    "badge", "title", "caret", "freehold", "team", "fixme", "features",
    "skeleton", "readme", "console", "fakeurl", "type"
  ];

  var PATH_META = {
    nav: { hint: "nav ?" },
    chip: { hint: "camouflaged file" },
    footer: { hint: "footer dot" },
    logo: { hint: "logo double-click" },
    wip: { hint: "footer beta" },
    branch: { hint: "footer version" },
    todo: { hint: "Pricing pill" },
    docs: { hint: "Docs pill" },
    stub: { hint: "nav micro-dot" },
    badge: { hint: "hero badge" },
    title: { hint: "title triple-click" },
    caret: { hint: "under headline" },
    freehold: { hint: "hold Free 2s" },
    team: { hint: "Team card" },
    fixme: { hint: "fine print under plans" },
    features: { hint: "Features label" },
    skeleton: { hint: "monitor corner" },
    readme: { hint: "last deploy line" },
    console: { hint: "ship later" },
    fakeurl: { hint: "fake address bar" },
    type: { hint: "type diary/journal" }
  };

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

  /** 폰: 키보드 입력 경로(type) 제외 — 터치로 가능한 경로만 */
  function mobileSafePaths() {
    return FIND_PATHS.filter(function (p) {
      return p !== "type";
    });
  }

  function pickFindPath() {
    try {
      var mobile = isMobileHaunt();
      var forced = /[?&]path=([a-z]+)/.exec(location.search || "");
      if (forced && FIND_PATHS.indexOf(forced[1]) !== -1) {
        // 강제 type 이라도 모바일은 터치 대체로 유지 (arm에서 처리)
        sessionStorage.setItem("haunt_diary_path", forced[1]);
        return forced[1];
      }
      var saved = sessionStorage.getItem("haunt_diary_path");
      if (saved && FIND_PATHS.indexOf(saved) !== -1) {
        if (mobile && saved === "type") {
          // 예전 세션 type 고정 → 모바일 가능 경로로 재배정
          var remapped = mobileSafePaths()[(Math.random() * mobileSafePaths().length) | 0];
          sessionStorage.setItem("haunt_diary_path", remapped);
          return remapped;
        }
        return saved;
      }
      var pool = mobile ? mobileSafePaths() : FIND_PATHS.slice();
      var pick = pool[(Math.random() * pool.length) | 0];
      sessionStorage.setItem("haunt_diary_path", pick);
      return pick;
    } catch (e) {
      var fallback = isMobileHaunt() ? mobileSafePaths() : FIND_PATHS;
      return fallback[(Math.random() * fallback.length) | 0];
    }
  }

  var findPath = pickFindPath();
  window.__hauntDiaryFindPath = findPath;
  document.body.setAttribute("data-find-path", findPath);

  function wireHotspots() {
    var nodes = document.querySelectorAll("[data-find]");
    nodes.forEach(function (el) {
      var id = el.getAttribute("data-find");
      var active = id === findPath;
      el.classList.toggle("find-active", active);
      el.classList.toggle("find-dormant", !active);

      if (!active) {
        if (id === "nav" || id === "chip" || id === "footer") {
          el.classList.add("diary-path-off");
          el.setAttribute("aria-hidden", "true");
          if (el.tagName === "BUTTON") el.disabled = true;
        }
        return;
      }

      el.classList.add("find-hard");
      el.classList.remove("diary-path-off");
      if (el.tagName === "BUTTON") el.disabled = false;

      if (id === "logo") {
        var clicks = 0;
        var t = null;
        el.addEventListener("click", function (e) {
          e.preventDefault();
          clicks++;
          clearTimeout(t);
          t = setTimeout(function () { clicks = 0; }, 450);
          if (clicks >= 2) { clicks = 0; openDiary(); }
        });
        return;
      }

      if (id === "title") {
        var n = 0;
        var tt = null;
        el.addEventListener("click", function () {
          n++;
          clearTimeout(tt);
          tt = setTimeout(function () { n = 0; }, 600);
          if (n >= 3) { n = 0; openDiary(); }
        });
        return;
      }

      if (id === "freehold") {
        var holdTimer = null;
        var armed = false;
        function clearHold() {
          if (holdTimer) clearTimeout(holdTimer);
          holdTimer = null;
          armed = false;
          el.classList.remove("find-holding");
        }
        el.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          armed = true;
          el.classList.add("find-holding");
          holdTimer = setTimeout(function () {
            if (armed) openDiary();
            clearHold();
          }, 2000);
        });
        el.addEventListener("pointerup", clearHold);
        el.addEventListener("pointerleave", clearHold);
        el.addEventListener("pointercancel", clearHold);
        return;
      }

      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openDiary();
      });
    });

    if (findPath === "type") {
      var buf = "";
      document.addEventListener("keydown", function (e) {
        if (discovered || reading) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "Escape") return;
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          buf = (buf + e.key.toLowerCase()).slice(-12);
          if (buf.indexOf("diary") !== -1 || buf.indexOf("journal") !== -1) {
            buf = "";
            openDiary();
          }
        }
      });
      // 모바일/터치: 제목 5연타 또는 Free 카드 2초 홀드 대체
      var title = document.getElementById("mainTitle");
      var free =
        document.getElementById("planFree") ||
        document.querySelector("[data-find='freehold']");
      if (title) {
        var tn = 0;
        var tr = null;
        title.classList.add("find-hard", "find-active");
        title.addEventListener("click", function () {
          if (discovered || reading) return;
          tn++;
          clearTimeout(tr);
          tr = setTimeout(function () {
            tn = 0;
          }, 900);
          if (tn >= 5) {
            tn = 0;
            openDiary();
          }
        });
      }
      if (free) {
        var ht = null;
        var armed = false;
        free.classList.add("find-hard", "find-active");
        free.addEventListener("pointerdown", function (e) {
          if (discovered || reading) return;
          if (e.button != null && e.button !== 0) return;
          armed = true;
          free.classList.add("find-holding");
          ht = setTimeout(function () {
            if (armed) openDiary();
            armed = false;
            free.classList.remove("find-holding");
          }, 2000);
        });
        function clearFreeHold() {
          armed = false;
          if (ht) clearTimeout(ht);
          ht = null;
          free.classList.remove("find-holding");
        }
        free.addEventListener("pointerup", clearFreeHold);
        free.addEventListener("pointerleave", clearFreeHold);
        free.addEventListener("pointercancel", clearFreeHold);
      }
    }
  }

  wireHotspots();

  if (closeBtn) closeBtn.addEventListener("click", closeDiary);
  if (backdrop) backdrop.addEventListener("click", closeDiary);

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (nextBtn.disabled) return;
      try {
        if (nextBtn.dataset.mode === "close") {
          closeDiary();
          return;
        }
        if (page < unlocked) showPage(page + 1);
        else unlockNext();
      } catch (err) {
        if (window.console) console.warn("[diary] next failed", err);
        // 폴백: 최소한 페이지 인덱스만 진행
        try {
          if (unlocked < 2) unlocked += 1;
          showPage(Math.min(unlocked, 2));
        } catch (e2) {}
      }
    });
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      if (t.disabled) return;
      var idx = parseInt(t.getAttribute("data-diary-page"), 10);
      showPage(idx);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && reading) {
      if (!document.body.classList.contains("is-haunting")) closeDiary();
    }
  });

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log(
      "[diary] find path:",
      findPath,
      PATH_META[findPath] && PATH_META[findPath].hint,
      "/",
      FIND_PATHS.length
    );
  }

  document.dispatchEvent(
    new CustomEvent("haunt-find-path", {
      detail: {
        path: findPath,
        meta: PATH_META[findPath],
        paths: FIND_PATHS.slice(),
      },
    })
  );

  /**
   * 시간 힌트 — 1분 / 2분 / 3분 각 1개
   * 그 뒤에도 못 찾으면 "보지 말라" 마무리
   * (일기 열면 즉시 중단)
   */
  var FIND_LADDER = {
    nav: [
      "위쪽 어딘가… 거의 안 보이는 기호가 있다.",
      "메뉴 줄 오른쪽 끝. 배경과 거의 같은 색.",
      "상단 내비 맨 오른쪽 — 희미한 「?」를 눌러 봐.",
    ],
    chip: [
      "히어로 아래, 파일처럼 생긴 잔여물이 있다.",
      "점선 박스 말고… 작은 주석 한 줄. txt 확장자.",
      "「dev_journal.txt」 글자를 클릭해. (아이콘 없을 수 있음)",
    ],
    footer: [
      "페이지 맨 아래를 의심해 봐.",
      "푸터 저작권 줄 옆, 문장보다 작은 무언가.",
      "푸터의 「·」 점 — 그게 링크다.",
    ],
    logo: [
      "브랜드 이름이 그냥 로고가 아닐 수도.",
      "한 번으로는 부족하다. 빠르게.",
      "왼쪽 위 「Stasis」 로고를 더블클릭.",
    ],
    wip: [
      "맨 아래 푸터에 작은 라벨이 있다.",
      "버전 옆… beta 같은 단어.",
      "푸터의 「beta」 글자를 클릭.",
    ],
    branch: [
      "푸터 한구석 버전 문자열.",
      "v0. 으로 시작하는 숫자.",
      "푸터 「v0.9.2」 를 클릭.",
    ],
    todo: [
      "가운데 네비 필 메뉴.",
      "Pricing 항목.",
      "「Pricing」 을 클릭.",
    ],
    docs: [
      "가운데 네비 필 메뉴.",
      "Docs 항목.",
      "「Docs」 를 클릭.",
    ],
    stub: [
      "네비 필 끝 — 거의 안 보이는 점.",
      "Pricing · Docs 옆 여백.",
      "필 메뉴 오른쪽 끝 작은 점을 클릭.",
    ],
    badge: [
      "히어로 위 작은 뱃지.",
      "Uptime · Alerts 쪽.",
      "히어로 상단 뱃지를 클릭.",
    ],
    title: [
      "큰 제목이 수상하다.",
      "한 번, 두 번… 세 번.",
      "메인 타이틀을 빠르게 3번 클릭.",
    ],
    caret: [
      "제목 바로 아래 빈 공간.",
      "거의 투명한 한 줄.",
      "헤드라인 아래 희미한 줄을 클릭.",
    ],
    freehold: [
      "버튼은 눌리는 것만이 전부가 아니다.",
      "Free 요금 카드 — 잠깐 누르고 있어 봐.",
      "「Free」 카드를 2초 동안 길게 누름.",
    ],
    team: [
      "요금 카드 중 Team.",
      "사람 아이콘이 있는 카드.",
      "「Team」 카드를 클릭.",
    ],
    fixme: [
      "요금 카드 아래 작은 문장.",
      "No credit card… 같은 한 줄.",
      "플랜 아래 미세 카피를 클릭.",
    ],
    features: [
      "Features 카드 상단 라벨.",
      "FEATURES 라고 작게 적힌 줄.",
      "Features 카드 위쪽 라벨 클릭.",
    ],
    skeleton: [
      "다크 모니터 미리보기 구석.",
      "대시보드 프레임 오른쪽 아래.",
      "UI section 모니터 우측 하단을 클릭.",
    ],
    readme: [
      "어두운 배너 아래 작은 서명.",
      "last deploy 근처.",
      "「— Stasis · last deploy: today」 클릭.",
    ],
    console: [
      "페이지 아래 거의 안 보이는 코드 한 줄.",
      "ship later.",
      "「console.log('ship later');」 클릭.",
    ],
    fakeurl: [
      "진짜 브라우저 주소창이 아닐 수 있다.",
      "화면 맨 위, 가짜 크롬 바.",
      "상단 가짜 주소창(URL 입력칸)을 클릭.",
    ],
    type: [
      "클릭이 아닐 수도 있다. 입력.",
      "영어 단어. 일기와 관련된.",
      "키보드로 diary 또는 journal 을 쳐 봐.",
    ],
  };

  var toast = document.getElementById("findHintToast");
  var toastTag = document.getElementById("findHintTag");
  var toastText = document.getElementById("findHintText");
  var toastClose = document.getElementById("findHintClose");
  var hintTimers = [];
  var hintHideTimer = null;

  function clearFindHints() {
    for (var i = 0; i < hintTimers.length; i++) clearTimeout(hintTimers[i]);
    hintTimers = [];
    if (hintHideTimer) clearTimeout(hintHideTimer);
    hintHideTimer = null;
    if (toast) toast.hidden = true;
    document.body.classList.remove("find-hint-visible");
  }

  function showFindHint(level, message) {
    if (discovered || !toast || !toastText) return;
    if (toastTag) {
      toastTag.textContent = "HINT " + level + "/3";
      toastTag.classList.remove("is-end");
    }
    toastText.textContent = message;
    toast.hidden = false;
    document.body.classList.add("find-hint-visible");
    toast.classList.remove("is-out");
    toast.classList.add("is-in");
    if (hintHideTimer) clearTimeout(hintHideTimer);
    hintHideTimer = setTimeout(function () {
      if (!toast) return;
      toast.classList.remove("is-in");
      toast.classList.add("is-out");
      setTimeout(function () {
        if (toast && !discovered) toast.hidden = true;
        document.body.classList.remove("find-hint-visible");
      }, 400);
    }, 9000);
  }

  if (toastClose) {
    toastClose.addEventListener("click", function () {
      if (toast) toast.hidden = true;
      document.body.classList.remove("find-hint-visible");
    });
  }

  function scheduleFindHints() {
    clearFindHints();
    if (discovered) return;
    // 디버그 가속: ?hintfast=1 → 5s / 10s / 15s
    var fast = /[?&]hintfast=1/.test(location.search || "");
    var t1 = fast ? 5000 : 60000;
    var t2 = fast ? 10000 : 120000;
    var t3 = fast ? 15000 : 180000;

    var ladder = FIND_LADDER[findPath] || [
      "어딘가에 일기가 있다.",
      "클릭·홀드·더블클릭·타이핑을 의심.",
      "주소창 힌트와 페이지를 다시 훑어 봐.",
    ];

    hintTimers.push(
      setTimeout(function () {
        showFindHint(1, ladder[0] || "");
      }, t1)
    );
    hintTimers.push(
      setTimeout(function () {
        showFindHint(2, ladder[1] || "");
      }, t2)
    );
    hintTimers.push(
      setTimeout(function () {
        showFindHint(3, ladder[2] || "");
      }, t3)
    );
  }

  scheduleFindHints();

  // 제작자 전용: ?diary=1 즉시 오픈 / ?debug=1 경로 배지
  try {
    if (/[?&]diary=1/.test(location.search || "")) {
      setTimeout(function () {
        openDiary();
      }, 300);
    }
    if (/[?&]debug=1/.test(location.search || "") || localStorage.getItem("haunt_creator") === "1") {
      var badge = document.createElement("button");
      badge.type = "button";
      badge.className = "creator-pass";
      badge.innerHTML =
        "<strong>CREATOR</strong> path: <code>" +
        findPath +
        "</code> · 클릭=일기";
      badge.title = "제작자 패스 — 클릭하면 일기 오픈";
      badge.addEventListener("click", function () {
        openDiary();
      });
      document.body.appendChild(badge);
      // 한 번 켜면 로컬에 기억 (일반 공유 URL에는 안 붙음)
      if (/[?&]creator=1/.test(location.search || "")) {
        localStorage.setItem("haunt_creator", "1");
      }
    }
  } catch (e) {}

  setBoost();
})();
