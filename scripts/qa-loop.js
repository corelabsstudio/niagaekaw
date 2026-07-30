/**
 * niagaekaw deep QA loop
 * - assets 200
 * - required APIs / DOM
 * - console/page errors on load
 * - P1 diary paths (sample + critical)
 * - all P2→P3 triggers
 * - all P3→climax triggers
 * - climax sequence acts + input betrayal
 * - mobile 390 viewport smoke
 *
 * BASE=http://127.0.0.1:4195 node scripts/qa-loop.js
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = (process.env.BASE || "http://127.0.0.1:4195").replace(/\/$/, "");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "_qa_report.json");

const ASSETS = [
  "assets/horror/ghost_weak_phase2.png",
  "assets/horror/ghost_medium_phase3.png",
  "assets/horror/ghost_strong_climax.png",
  "assets/audio/bgm_phase3_climax.mp3",
  "assets/audio/bgm_phase2_eerie.mp3",
  "assets/audio/sfx_wail_cry.mp3",
  "assets/audio/sfx_sob_whimper.mp3",
  "assets/audio/sfx_evil_laugh.mp3",
  "assets/audio/sfx_glitch_stinger.mp3",
  "assets/audio/sfx_whisper_texture.mp3",
  "assets/faces/face-1.jpg",
  "assets/faces/face-5.jpg",
  "assets/faces/face-9.jpg",
  "assets/diary-photos/photo-01.jpg",
  "assets/diary-photos/photo-16.jpg",
  "climax-sequence.js",
  "climax-triggers.js",
  "phase3-triggers.js",
  "diary.js",
  "haunt-audio.js",
  "styles.css",
];

const P1_PATHS = [
  "logo",
  "title",
  "nav",
  "freehold",
  "type",
  "fakeurl",
  "console",
  "footer",
];

const P2_TRIGGERS = [
  "hold_free",
  "triple_logo",
  "type_kill",
  "deep_hold",
  "team_spam",
  "fakeurl_double",
  "copy_curse",
  "wait_triple",
  "beta_quad",
  "version_triple",
  "title_mash",
  "scroll_bounce",
  "plan_sequence",
  "type_process",
  "path_hold",
  "badge_hold",
  "feat_hold",
  "quote_hold",
  "hit_pulse",
  // idle_haunt last (slow)
  "idle_haunt",
];

const P3_TRIGGERS = [
  "logo_hold",
  "type_stasis",
  "type_wakeagain",
  "cta_hold",
  "pro_spam",
  "docs_triple",
  "pricing_hold",
  "monitor_quad",
  "badge_mash",
  "title_hold",
  "beta_hold",
  "version_spam",
  "top_hold",
  "type_escape",
  "arrow_sigil",
  "space_ritual",
  "features_hold",
  "quote_double",
  "select_all_curse",
  "long_idle",
];

function log(...a) {
  console.log(new Date().toISOString().slice(11, 19), ...a);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Pure-DOM interactions (Playwright mouse.click hangs on <a href="#"> navigation wait).
 */
async function hasEl(page, selector) {
  return page.evaluate((sel) => !!document.querySelector(sel), selector);
}

async function multiClick(page, selector, n, gap) {
  const ok = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    try {
      el.scrollIntoView({ block: "center", inline: "center" });
    } catch (e) {}
    window.__qaClickEl = el;
    return true;
  }, selector);
  if (!ok) throw new Error("missing " + selector);
  // 연타 윈도우(armClicks) 안에서도 리셋되지 않게 클릭 사이 간격 유지
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => {
      const el = window.__qaClickEl;
      if (!el) return;
      const opts = { bubbles: true, cancelable: true, view: window, buttons: 1, button: 0 };
      el.dispatchEvent(new PointerEvent("pointerdown", opts));
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new PointerEvent("pointerup", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.dispatchEvent(new MouseEvent("click", opts));
    });
    await sleep(gap || 90);
  }
}

async function hold(page, selector, ms) {
  // Prefer the armed hot target (p2-trig-hot / climax-holding / find-hard) among comma list
  const ok = await page.evaluate((sel) => {
    const parts = String(sel)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    let el = null;
    const ranked = [];
    for (const s of parts) {
      const nodes = document.querySelectorAll(s);
      for (const n of nodes) ranked.push(n);
    }
    if (!ranked.length) {
      el = document.querySelector(sel);
    } else {
      el =
        ranked.find(
          (n) =>
            n.classList.contains("p2-trig-hot") ||
            n.classList.contains("p3-trig-hot") ||
            n.classList.contains("climax-holding") ||
            n.classList.contains("p2-trig-signature")
        ) ||
        ranked.find((n) => {
          const r = n.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        }) ||
        ranked[0];
    }
    if (!el) return false;
    try {
      el.scrollIntoView({ block: "center", inline: "center" });
    } catch (e) {}
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: 1,
      pointerId: 1,
      button: 0,
    };
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    window.__qaHoldEl = el;
    return true;
  }, selector);
  if (!ok) throw new Error("missing " + selector);
  // hold slightly past trigger thresholds (up to ~2.5s + slack)
  await sleep(Math.max(ms, 2200) + 200);
  await page.evaluate(() => {
    const el = window.__qaHoldEl;
    if (!el) return;
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: 0,
      pointerId: 1,
      button: 0,
    };
    el.dispatchEvent(new PointerEvent("pointerup", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    window.__qaHoldEl = null;
  });
}

async function typeWord(page, word) {
  await page.evaluate((w) => {
    for (const ch of w) {
      const opts = { key: ch, code: "Key" + ch.toUpperCase(), bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent("keydown", opts));
      document.dispatchEvent(new KeyboardEvent("keypress", opts));
      document.dispatchEvent(new KeyboardEvent("keyup", opts));
    }
  }, word);
  await sleep(80);
}

async function fireP2(page, id) {
  switch (id) {
    case "hold_free":
      return hold(page, "#planFree", 2000);
    case "triple_logo":
      return multiClick(page, "#topRec", 3, 90);
    case "type_kill":
      return typeWord(page, "kill");
    case "deep_hold":
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      return sleep(2800);
    case "team_spam":
      return multiClick(page, "#planTeam", 5, 80);
    case "fakeurl_double":
      return multiClick(page, "#fakeUrlBar", 2, 100);
    case "copy_curse":
      // primary: copy event; hold is desktop fallback
      await page.evaluate(() => {
        try {
          const lede = document.getElementById("lede") || document.getElementById("mainTitle");
          if (lede) {
            const range = document.createRange();
            range.selectNodeContents(lede);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
          document.execCommand("copy");
          document.dispatchEvent(new Event("copy", { bubbles: true }));
        } catch (e) {}
      });
      await sleep(200);
      return hold(page, "#lede, #mainTitle, .stasis-lede", 2400);
    case "wait_triple":
      // 하단 문장 — 스크롤 후 연타 간격 여유
      await page.evaluate(() => {
        const el = document.getElementById("resWait");
        if (el) el.scrollIntoView({ block: "center", behavior: "instant" });
      });
      await sleep(200);
      return multiClick(page, "#resWait", 3, 150);
    case "beta_quad":
      // foot-beta 가 좁음 — 명시적으로 첫 .foot-beta 타겟
      return multiClick(page, ".foot-beta", 4, 120);
    case "version_triple":
      return multiClick(page, ".foot-micro:not(.foot-beta), [data-find='branch']", 3, 80);
    case "title_mash":
      return multiClick(page, "#mainTitle", 5, 70);
    case "scroll_bounce":
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      return sleep(150);
    case "plan_sequence":
      // Free → Team → Free — HTMLElement.click() 만 사용 (pointer 연쇄가 다른 핸들러와 충돌)
      for (const id of ["planFree", "planTeam", "planFree"]) {
        const ok = await page.evaluate((bid) => {
          const el = document.getElementById(bid);
          if (!el) return false;
          try {
            el.scrollIntoView({ block: "center", inline: "center" });
          } catch (e) {}
          el.click();
          return true;
        }, id);
        if (!ok) throw new Error("missing #" + id);
        await sleep(180);
      }
      return;
    case "idle_haunt":
      return sleep(13000);
    case "type_process":
      return typeWord(page, "process");
    case "path_hold":
      return hold(page, "#corruptPath, #navCta, #topRec", 2000);
    case "badge_hold":
      return hold(page, "#eyebrow, #mainTitle", 1800);
    case "feat_hold":
      return hold(page, "#h2log, [data-find='features']", 1800);
    case "quote_hold":
      return hold(page, ".stasis-quote-by, #cardWarn", 1800);
    case "hit_pulse":
      return page.evaluate(() =>
        document.dispatchEvent(new CustomEvent("haunt-hit-success"))
      );
    default:
      throw new Error("no P2 " + id);
  }
}

async function fireP3(page, id) {
  switch (id) {
    case "logo_hold":
      return hold(page, "#topRec", 3200);
    case "type_stasis":
      return typeWord(page, "stasis");
    case "type_wakeagain":
      return typeWord(page, "wakeagain");
    case "cta_hold":
      return hold(page, "#navCta", 2800);
    case "pro_spam":
      return multiClick(page, "#planPro", 7, 70);
    case "docs_triple":
      return multiClick(page, "[data-find='docs'], .pill-dead", 3, 80);
    case "pricing_hold":
      return hold(page, "[data-find='todo'], .pill-todo", 2400);
    case "monitor_quad":
      return multiClick(
        page,
        ".stasis-monitor-card, #p3AutopsyOver, .monitor-frame",
        4,
        80
      );
    case "badge_mash":
      return multiClick(page, "#eyebrow, #mainTitle", 5, 70);
    case "title_hold":
      return hold(page, "#mainTitle", 3000);
    case "beta_hold":
      return hold(page, "[data-find='wip'], .foot-beta", 2200);
    case "version_spam":
      return multiClick(
        page,
        "[data-find='branch'], .foot-micro:not(.foot-beta)",
        5,
        70
      );
    case "top_hold":
      // 힌트/레이아웃 때문에 스크롤이 밀리면 hold 리셋됨 → 상단 고정 유지
      await page.evaluate(() => {
        function pin() {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        pin();
        if (window.__qaTopPin) clearInterval(window.__qaTopPin);
        window.__qaTopPin = setInterval(pin, 80);
      });
      await sleep(4500);
      await page.evaluate(() => {
        if (window.__qaTopPin) clearInterval(window.__qaTopPin);
        window.__qaTopPin = null;
      });
      return;
    case "type_escape":
      return typeWord(page, "escape");
    case "arrow_sigil":
      for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown"]) {
        await page.keyboard.press(k);
        await sleep(35);
      }
      return;
    case "space_ritual":
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Space");
        await sleep(35);
      }
      return;
    case "features_hold":
      return hold(page, "[data-find='features'], #h2log", 2200);
    case "quote_double":
      return multiClick(page, "#cardWarn, .stasis-quote", 2, 100);
    case "select_all_curse":
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      return;
    case "long_idle":
      return sleep(16000);
    default:
      throw new Error("no P3 " + id);
  }
}

async function fireP1(page, pathId) {
  switch (pathId) {
    case "logo":
      return multiClick(page, "[data-find='logo']", 2, 90);
    case "title":
      return multiClick(page, "[data-find='title']", 3, 90);
    case "freehold":
      return hold(page, "[data-find='freehold']", 2200);
    case "type":
      return typeWord(page, "diary");
    case "fakeurl":
      return multiClick(page, "#fakeUrlBar", 1, 50);
    default:
      return multiClick(page, `[data-find='${pathId}']`, 1, 50);
  }
}

async function withPage(browser, opts, fn) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 900 },
    isMobile: !!opts.mobile,
    hasTouch: !!opts.mobile,
    userAgent: opts.mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  const pageErrors = [];
  const consoleErrors = [];
  const reqFails = [];
  page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("requestfailed", (req) => {
    const u = req.url();
    if (/favicon|chrome-extension/i.test(u)) return;
    reqFails.push(u.split("?")[0]);
  });
  try {
    const result = await Promise.race([
      fn(page, { pageErrors, consoleErrors, reqFails }),
      sleep(opts.hardTimeout || 45000).then(() => {
        throw new Error("hard timeout " + (opts.hardTimeout || 45000) + "ms");
      }),
    ]);
    return {
      ok: false,
      ...result,
      pageErrors: pageErrors.slice(0, 12),
      consoleErrors: consoleErrors.slice(0, 12),
      reqFails: [...new Set(reqFails)].slice(0, 12),
    };
  } catch (e) {
    return {
      ok: false,
      detail: String((e && e.message) || e).slice(0, 160),
      pageErrors: pageErrors.slice(0, 12),
      consoleErrors: consoleErrors.slice(0, 12),
      reqFails: [...new Set(reqFails)].slice(0, 12),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  log("QA start BASE=", BASE);
  const report = {
    base: BASE,
    startedAt: new Date().toISOString(),
    assets: [],
    apis: null,
    p1: [],
    p2: [],
    p3: [],
    climax: null,
    mobile: null,
    loadErrors: null,
    summary: {},
  };

  // filesystem assets
  for (const a of ASSETS) {
    const fp = path.join(ROOT, a);
    const ok = fs.existsSync(fp) && fs.statSync(fp).size > 0;
    report.assets.push({ path: a, ok, size: ok ? fs.statSync(fp).size : 0 });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
  } catch (e) {
    log("chromium launch failed", e.message);
    process.exit(2);
  }

  // --- load + APIs ---
  log("load + APIs");
  report.loadErrors = await withPage(browser, {}, async (page, bag) => {
    await page.goto(BASE + "/?hintfast=1", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await sleep(800);
    const apis = await page.evaluate(() => ({
      presence: !!window.__hauntPresence,
      audio: !!window.__hauntAudio,
      diaryStories: !!window.__hauntDiaryStories,
      diaryOpen: typeof window.__hauntOpenDiary === "function",
      climaxSeq: !!(
        window.__hauntClimaxSequence && window.__hauntClimaxSequence.start
      ),
      climaxTrig: !!window.__hauntClimax,
      phase3: !!window.__hauntPhase3,
      summon: typeof window.__hauntSummon === "function",
      stage: typeof window.__hauntStage === "function" ? window.__hauntStage() : null,
      anomalies: !!window.__hauntAnomalies,
      phase1: !!window.__hauntPhase1Flash,
      haunt: !!document.getElementById("haunt"),
      ghostWeak: !!document.getElementById("ssGhostWeak"),
      ghostMed: !!document.getElementById("ssGhostMed"),
      ghostStrong: !!document.getElementById("ssGhostStrong"),
      ghostTrail: !!document.getElementById("ssGhostStrongTrail"),
      escBtn: !!document.getElementById("ssEscBtn"),
      p3Bgm: !!document.getElementById("p3BgmTrack"),
      diary: !!(
        document.getElementById("diaryPanel") || document.getElementById("diary")
      ),
    }));
    report.apis = apis;

    // HTTP asset check
    const httpAssets = [];
    for (const a of ASSETS) {
      const st = await page.evaluate(async (u) => {
        try {
          const r = await fetch(u, { cache: "no-store" });
          return r.status;
        } catch (e) {
          return -1;
        }
      }, BASE + "/" + a);
      httpAssets.push({ path: a, status: st, ok: st >= 200 && st < 400 });
    }
    report.httpAssets = httpAssets;

    return {
      ok: Object.values(apis).every((v) => v !== false && v !== null),
      apis,
      pageErrors: bag.pageErrors,
      consoleErrors: bag.consoleErrors,
      reqFails: bag.reqFails,
    };
  });

  // --- P1 ---
  log("P1 diary paths", P1_PATHS.length);
  for (const id of P1_PATHS) {
    const r = await withPage(browser, {}, async (page) => {
      await page.goto(`${BASE}/?path=${id}&hintfast=1`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await sleep(400);
      const active = await page.evaluate(() => window.__hauntDiaryFindPath);
      if (active !== id) throw new Error("path forced got " + active);
      await fireP1(page, id);
      const found = await page
        .waitForFunction(
          () =>
            !!window.__hauntDiaryDiscovered ||
            document.body.classList.contains("diary-open") ||
            document.body.classList.contains("diary-found"),
          { timeout: 6000 }
        )
        .then(() => true)
        .catch(() => false);
      return { ok: found, active };
    });
    report.p1.push({ id, ok: !!r.ok, detail: r.ok ? "ok" : "not discovered", err: r.pageErrors });
    process.stdout.write(r.ok ? "." : "F");
  }
  console.log("");

  // --- P2 ---
  log("P2→P3", P2_TRIGGERS.length);
  for (const id of P2_TRIGGERS) {
    const r = await withPage(browser, {}, async (page) => {
      await page.goto(`${BASE}/?p3=${id}&hintfast=1&diary=1`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await sleep(450);
      await page.evaluate(() => {
        document.body.classList.remove(
          "diary-open",
          "is-haunting",
          "is-ending",
          "phase-3-active"
        );
        const d = document.getElementById("diary");
        if (d) d.hidden = true;
        window.__hauntDiaryDiscovered = true;
        document.body.classList.add(
          "diary-found",
          "phase-2-active",
          "stage-corrupt"
        );
        document.body.setAttribute("data-stage", "2");
        if (window.__hauntSetStage) window.__hauntSetStage(2);
        if (window.__hauntSetMood) window.__hauntSetMood(3);
        try {
          sessionStorage.removeItem("haunt_phase3");
        } catch (e) {}
        window.__hauntPhase3Active = false;
        if (window.__hauntClimax && window.__hauntClimax.showHint) {
          window.__hauntClimax.showHint();
        }
      });
      await sleep(250);
      const tid = await page.evaluate(() => window.__hauntClimaxTrigger);
      if (tid !== id) throw new Error("trigger forced got " + tid);
      await fireP2(page, id);
      // 트리거 후 상태 반영 여유
      await sleep(200);
      const waitMs =
        id === "idle_haunt" ? 2500 : id === "plan_sequence" ? 9000 : 8000;
      const ok = await page
        .waitForFunction(
          () =>
            !!window.__hauntPhase3Active ||
            document.body.classList.contains("phase-3-active"),
          { timeout: waitMs }
        )
        .then(() => true)
        .catch(() => false);
      return { ok, tid };
    });
    report.p2.push({
      id,
      ok: !!r.ok,
      detail: r.ok ? "ok" : "no phase3",
      pageErrors: r.pageErrors,
      consoleErrors: r.consoleErrors,
    });
    process.stdout.write(r.ok ? "." : "F");
  }
  console.log("");

  // --- P3 ---
  log("P3→climax", P3_TRIGGERS.length);
  for (const id of P3_TRIGGERS) {
    const r = await withPage(browser, {}, async (page) => {
      await page.goto(`${BASE}/?p3t=${id}&p3hint=1&diary=1`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await sleep(450);
      await page.evaluate(() => {
        document.body.classList.remove("diary-open", "is-haunting", "is-ending");
        const d = document.getElementById("diary");
        if (d) d.hidden = true;
        window.__hauntDiaryDiscovered = true;
        try {
          sessionStorage.setItem("haunt_phase3", "1");
        } catch (e) {}
        window.__hauntPhase3Active = true;
        document.body.classList.add("phase-3-active", "diary-found");
        document.body.setAttribute("data-stage", "3");
        document.dispatchEvent(
          new CustomEvent("haunt-phase3", { detail: { from: "qa" } })
        );
        if (window.__hauntPhase3 && window.__hauntPhase3.showHint) {
          window.__hauntPhase3.showHint();
        }
      });
      await sleep(300);
      const tid = await page.evaluate(
        () =>
          window.__hauntPhase3Trigger ||
          (window.__hauntPhase3 && window.__hauntPhase3.id)
      );
      if (tid !== id) throw new Error("trigger forced got " + tid);
      await fireP3(page, id);
      const waitMs = id === "long_idle" ? 3500 : 8000;
      const ok = await page
        .waitForFunction(
          () =>
            document.body.classList.contains("is-haunting") ||
            document.body.classList.contains("is-ending") ||
            !!(
              window.__hauntClimaxSequence &&
              window.__hauntClimaxSequence.isRunning &&
              window.__hauntClimaxSequence.isRunning()
            ),
          { timeout: waitMs }
        )
        .then(() => true)
        .catch(() => false);
      return { ok, tid };
    });
    report.p3.push({
      id,
      ok: !!r.ok,
      detail: r.ok ? "ok" : "no climax",
      pageErrors: r.pageErrors,
      consoleErrors: r.consoleErrors,
    });
    process.stdout.write(r.ok ? "." : "F");
  }
  console.log("");

  // --- Climax sequence deep ---
  log("climax sequence + betrayal");
  report.climax = await withPage(browser, {}, async (page) => {
    await page.goto(BASE + "/?ss=1", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await sleep(400);
    await page.evaluate(() => {
      window.__hauntSsPreviewOnly = true;
      if (window.__hauntAudio && window.__hauntAudio.unlock) {
        try {
          window.__hauntAudio.unlock();
        } catch (e) {}
      }
      window.__hauntStartClimaxSequence();
    });
    await sleep(500);

    const a0 = await page.evaluate(() => ({
      running: !!(
        window.__hauntClimaxSequence && window.__hauntClimaxSequence.isRunning()
      ),
      act: document.body.getAttribute("data-ss-act"),
      phase: window.__hauntClimaxSequence
        ? window.__hauntClimaxSequence.phase()
        : 0,
      status: (document.getElementById("ssStatus") || {}).textContent,
      weak: (document.querySelector("#ssGhostWeak img") || {}).src || "",
      strong: (document.querySelector("#ssGhostStrong img") || {}).src || "",
    }));

    // key during A should not stop
    await page.keyboard.press("a");
    await sleep(200);
    const stillA = await page.evaluate(
      () =>
        !!(
          window.__hauntClimaxSequence &&
          window.__hauntClimaxSequence.isRunning()
        )
    );

    // force time jump via internal t0 patch is hard; re-test betrayal by faking elapsed
    // instead advance by re-running with MARK override if exposed — not exposed.
    // Simulate B1 by dispatching after waiting? too slow.
    // Monkey-patch: set t0 in closure impossible.
    // Use evaluate to call showFail path by advancing performance? 
    // Alternative: re-start sequence and poll at 16s is long — do short reduced-motion?
    // prefers-reduced-motion makes 32s still long.

    // Betrayal UI elements
    const ui = await page.evaluate(() => ({
      exitHint: !!document.getElementById("ssExitHint"),
      fail: !!document.getElementById("ssExitFail"),
      console: !!document.getElementById("ssConsoleLine"),
      esc: !!document.getElementById("ssEscBtn"),
      trail: !!document.getElementById("ssGhostStrongTrail"),
      scan: !!document.getElementById("ssScanlines"),
    }));

    // Manually exercise betrayal helpers by triggering key after forcing act via body attr
    // and dispatching — the handlers use elapsed() from t0.
    // Jump t0 backward by restarting and setting a fake: expose test hook temporarily via eval hack
    // Overwrite start time: we can reassign by calling stop/start and then...
    // Best approach: inject test by replacing Date/performance — not reliable.

    // Fast-forward: call stop, then monkey-patch __hauntClimaxSequence with direct DOM checks
    // already done. For betrayal logic, evaluate internal by simulating:
    await page.evaluate(() => {
      // Force B1 state visually + call public key path if we advance t0
      // Hack: redefine performance.now offset
      if (!window.__qaPerfOffset) {
        const orig = performance.now.bind(performance);
        window.__qaPerfOffset = 0;
        performance.now = function () {
          return orig() + (window.__qaPerfOffset || 0);
        };
      }
    });
    // restart with offset
    await page.evaluate(() => {
      if (window.__hauntClimaxSequence && window.__hauntClimaxSequence.stop) {
        window.__hauntClimaxSequence.stop();
      }
      window.__hauntSsPreviewOnly = true;
      window.__qaPerfOffset = 0;
      window.__hauntStartClimaxSequence();
    });
    await sleep(300);
    // jump to B1 (~16s)
    await page.evaluate(() => {
      window.__qaPerfOffset = 16000;
    });
    await sleep(200);
    // tick needs rAF — wait a frame cycle
    await sleep(400);
    const actB1 = await page.evaluate(() => ({
      act: document.body.getAttribute("data-ss-act"),
      phase: window.__hauntClimaxSequence
        ? window.__hauntClimaxSequence.phase()
        : 0,
      elapsed: window.__hauntClimaxSequence
        ? window.__hauntClimaxSequence.elapsed()
        : 0,
    }));

    await page.keyboard.press("x");
    await sleep(150);
    const failVisible = await page.evaluate(() => {
      const f = document.getElementById("ssExitFail");
      return f && !f.hidden && f.classList.contains("is-on");
    });
    const stillRunB1 = await page.evaluate(
      () =>
        !!(
          window.__hauntClimaxSequence &&
          window.__hauntClimaxSequence.isRunning()
        )
    );

    // jump to B2
    await page.evaluate(() => {
      window.__qaPerfOffset = 32000;
    });
    await sleep(500);
    await page.keyboard.press("Escape");
    await sleep(150);
    const escLine = await page.evaluate(() => {
      const c = document.getElementById("ssConsoleLine");
      return c && !c.hidden ? c.textContent : "";
    });
    const stillRunB2 = await page.evaluate(
      () =>
        !!(
          window.__hauntClimaxSequence &&
          window.__hauntClimaxSequence.isRunning()
        )
    );

    // jump to C then D quickly
    await page.evaluate(() => {
      window.__qaPerfOffset = 46000;
    });
    await sleep(600);
    const actC = await page.evaluate(() =>
      document.body.getAttribute("data-ss-act")
    );
    const strongOn = await page.evaluate(() => {
      const g = document.getElementById("ssGhostStrong");
      return g && !g.hidden && g.classList.contains("is-on");
    });

    await page.evaluate(() => {
      window.__qaPerfOffset = 56000;
    });
    await sleep(700);
    const actD = await page.evaluate(() =>
      document.body.getAttribute("data-ss-act")
    );

    // wait for end
    await page.evaluate(() => {
      window.__qaPerfOffset = 61000;
    });
    await sleep(1200);
    const ended = await page.evaluate(
      () =>
        !!(
          window.__hauntClimaxSequence &&
          window.__hauntClimaxSequence.isComplete &&
          window.__hauntClimaxSequence.isComplete()
        ) ||
        !(
          window.__hauntClimaxSequence &&
          window.__hauntClimaxSequence.isRunning()
        )
    );

    return {
      ok:
        a0.running &&
        stillA &&
        /ghost_weak/.test(a0.weak) &&
        /ghost_strong/.test(a0.strong) &&
        ui.exitHint &&
        ui.esc &&
        ui.trail &&
        stillRunB1 &&
        stillRunB2 &&
        !!actD,
      a0,
      stillA,
      ui,
      actB1,
      failVisible,
      stillRunB1,
      escLine,
      stillRunB2,
      actC,
      strongOn,
      actD,
      ended,
    };
  });

  // --- mobile smoke ---
  log("mobile 390 smoke");
  report.mobile = await withPage(
    browser,
    { viewport: { width: 390, height: 844 }, mobile: true },
    async (page) => {
      await page.goto(`${BASE}/?p3=hold_free&hintfast=1&diary=1`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await sleep(400);
      await page.evaluate(() => {
        document.body.classList.remove("diary-open");
        const d = document.getElementById("diary");
        if (d) d.hidden = true;
        window.__hauntDiaryDiscovered = true;
        document.body.classList.add("diary-found", "phase-2-active");
        if (window.__hauntSetStage) window.__hauntSetStage(2);
        window.__hauntPhase3Active = false;
        if (window.__hauntClimax && window.__hauntClimax.showHint) {
          window.__hauntClimax.showHint();
        }
      });
      await sleep(200);
      const tid = await page.evaluate(() => window.__hauntClimaxTrigger);
      try {
        await hold(page, "#planFree", 2200);
      } catch (e) {
        return { ok: false, detail: String(e.message || e), tid };
      }
      const ok = await page
        .waitForFunction(
          () =>
            !!window.__hauntPhase3Active ||
            document.body.classList.contains("phase-3-active"),
          { timeout: 7000 }
        )
        .then(() => true)
        .catch(() => false);
      return { ok, tid, detail: ok ? "hold_free mobile ok" : "no p3" };
    }
  );

  await browser.close();

  // summary
  const p1ok = report.p1.filter((x) => x.ok).length;
  const p2ok = report.p2.filter((x) => x.ok).length;
  const p3ok = report.p3.filter((x) => x.ok).length;
  const assetOk = (report.httpAssets || report.assets).filter((x) => x.ok)
    .length;
  const assetN = (report.httpAssets || report.assets).length;
  report.summary = {
    assets: `${assetOk}/${assetN}`,
    p1: `${p1ok}/${report.p1.length}`,
    p2: `${p2ok}/${report.p2.length}`,
    p3: `${p3ok}/${report.p3.length}`,
    climax: report.climax && report.climax.ok,
    mobile: report.mobile && report.mobile.ok,
    loadPageErrors: (report.loadErrors && report.loadErrors.pageErrors) || [],
    loadConsole: (report.loadErrors && report.loadErrors.consoleErrors) || [],
  };

  const fails = [];
  (report.httpAssets || []).forEach((a) => {
    if (!a.ok) fails.push("asset " + a.path + " status=" + a.status);
  });
  report.p1.forEach((x) => {
    if (!x.ok) fails.push("P1 " + x.id);
  });
  report.p2.forEach((x) => {
    if (!x.ok) fails.push("P2 " + x.id);
  });
  report.p3.forEach((x) => {
    if (!x.ok) fails.push("P3 " + x.id);
  });
  if (!report.climax || !report.climax.ok) fails.push("climax sequence");
  if (!report.mobile || !report.mobile.ok) fails.push("mobile hold_free");
  if (report.apis) {
    Object.entries(report.apis).forEach(([k, v]) => {
      if (v === false || v === null) fails.push("api " + k);
    });
  }

  report.fails = fails;
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");

  log("==== SUMMARY ====");
  log(JSON.stringify(report.summary, null, 2));
  if (fails.length) {
    log("FAILS (" + fails.length + "):");
    fails.forEach((f) => log(" -", f));
  } else {
    log("ALL PASS");
  }
  log("report →", OUT);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
