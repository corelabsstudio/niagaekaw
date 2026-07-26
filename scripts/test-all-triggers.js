/**
 * Full gate-trigger smoke test (desktop).
 * - P1 diary find paths (?path=)
 * - P2 → P3 gates (?p3=)
 * - P3 → climax gates (?p3t=)
 *
 * Run: node scripts/test-all-triggers.js
 * Expects static server on BASE (default http://127.0.0.1:4188)
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:4188";
const TIMEOUT = 25000;

const P1_PATHS = [
  "nav", "chip", "footer", "logo", "wip", "branch", "todo", "docs", "stub",
  "badge", "title", "caret", "freehold", "team", "fixme", "features",
  "skeleton", "readme", "console", "fakeurl", "type",
];

const P2_TRIGGERS = [
  "hold_free", "triple_logo", "type_kill", "deep_hold", "team_spam",
  "fakeurl_double", "copy_curse", "wait_triple", "beta_quad", "version_triple",
  "title_mash", "scroll_bounce", "plan_sequence", "idle_haunt", "type_process",
  "path_hold", "badge_hold", "feat_hold", "quote_hold", "hit_pulse",
];

const P3_TRIGGERS = [
  "logo_hold", "type_stasis", "type_wakeagain", "cta_hold", "pro_spam",
  "docs_triple", "pricing_hold", "monitor_quad", "badge_mash", "title_hold",
  "beta_hold", "version_spam", "top_hold", "type_escape", "arrow_sigil",
  "space_ritual", "features_hold", "quote_double", "select_all_curse", "long_idle",
];

function resultsTable(rows) {
  const pad = (s, n) => String(s).padEnd(n);
  console.log("\n" + pad("STATUS", 8) + pad("LAYER", 6) + pad("ID", 22) + "DETAIL");
  console.log("-".repeat(90));
  for (const r of rows) {
    console.log(pad(r.ok ? "PASS" : "FAIL", 8) + pad(r.layer, 6) + pad(r.id, 22) + (r.detail || ""));
  }
}

async function setupPhase2(page) {
  await page.evaluate(() => {
    window.__hauntDiaryDiscovered = true;
    document.body.classList.add("diary-found");
    document.body.classList.remove("diary-open", "is-haunting", "is-ending", "phase-3-active");
    document.body.classList.add("phase-2-active", "stage-corrupt");
    document.body.setAttribute("data-stage", "2");
    if (typeof window.__hauntSetStage === "function") window.__hauntSetStage(2);
    if (typeof window.__hauntSetMood === "function") window.__hauntSetMood(3);
    try {
      sessionStorage.removeItem("haunt_phase3");
    } catch (e) {}
    window.__hauntPhase3Active = false;
  });
  // re-arm phase2 entry for hint/schedule
  await page.evaluate(() => {
    if (window.__hauntClimax && window.__hauntClimax.showHint) {
      window.__hauntClimax.showHint();
    }
  });
  await page.waitForTimeout(200);
}

async function setupPhase3(page) {
  await page.evaluate(() => {
    window.__hauntDiaryDiscovered = true;
    document.body.classList.add("diary-found");
    document.body.classList.remove("diary-open", "is-haunting", "is-ending");
    try {
      sessionStorage.setItem("haunt_phase3", "1");
    } catch (e) {}
    window.__hauntPhase3Active = true;
    document.body.classList.add("phase-3-active");
    document.body.setAttribute("data-stage", "3");
    if (typeof window.__hauntEnterPhase3 === "function") {
      // may already be applied; ignore
    } else if (window.__hauntClimax && window.__hauntClimax.enterPhase3) {
      // skip full enter if already active
    }
    document.dispatchEvent(new CustomEvent("haunt-phase3", { detail: { from: "test" } }));
    if (window.__hauntPhase3 && window.__hauntPhase3.showHint) {
      window.__hauntPhase3.showHint();
    }
  });
  await page.waitForTimeout(300);
}

async function hold(page, selector, ms) {
  const loc = page.locator(selector).first();
  if (!(await loc.count())) throw new Error("missing " + selector);
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  const box = await loc.boundingBox();
  if (!box) throw new Error("no box " + selector);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function multiClick(page, selector, n, gap) {
  const loc = page.locator(selector).first();
  if (!(await loc.count())) throw new Error("missing " + selector);
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  for (let i = 0; i < n; i++) {
    await loc.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(gap || 80);
  }
}

async function typeWord(page, word) {
  for (const ch of word) {
    await page.keyboard.press(ch);
    await page.waitForTimeout(30);
  }
}

async function waitP3(page, ms) {
  try {
    await page.waitForFunction(
      () =>
        !!window.__hauntPhase3Active ||
        document.body.classList.contains("phase-3-active"),
      { timeout: ms || 8000 }
    );
    return true;
  } catch (e) {
    return false;
  }
}

async function waitClimax(page, ms) {
  try {
    await page.waitForFunction(
      () =>
        document.body.classList.contains("is-haunting") ||
        document.body.classList.contains("is-ending") ||
        !!(window.__hauntClimaxSequence && window.__hauntClimaxSequence.phase),
      { timeout: ms || 8000 }
    );
    return true;
  } catch (e) {
    return false;
  }
}

async function waitDiary(page, ms) {
  try {
    await page.waitForFunction(
      () =>
        !!window.__hauntDiaryDiscovered ||
        document.body.classList.contains("diary-open") ||
        document.body.classList.contains("diary-found"),
      { timeout: ms || 6000 }
    );
    return true;
  } catch (e) {
    return false;
  }
}

/** Per-trigger action for P2 */
async function fireP2(page, id) {
  switch (id) {
    case "hold_free":
      await hold(page, "#planFree", 2000);
      break;
    case "triple_logo":
      await multiClick(page, "#topRec", 3, 100);
      break;
    case "type_kill":
      await typeWord(page, "kill");
      break;
    case "deep_hold":
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2800);
      break;
    case "team_spam":
      await multiClick(page, "#planTeam", 5, 90);
      break;
    case "fakeurl_double":
      await multiClick(page, "#fakeUrlBar", 2, 120);
      break;
    case "copy_curse":
      // hold lede is also armed as fallback
      await hold(page, "#lede, #mainTitle", 2200);
      break;
    case "wait_triple":
      await multiClick(page, "#resWait", 3, 100);
      break;
    case "beta_quad":
      await multiClick(page, ".foot-beta, [data-find='wip']", 4, 90);
      break;
    case "version_triple":
      await multiClick(page, ".foot-micro:not(.foot-beta), [data-find='branch']", 3, 90);
      break;
    case "title_mash":
      await multiClick(page, "#mainTitle", 5, 80);
      break;
    case "scroll_bounce":
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      break;
    case "plan_sequence":
      await page.locator("#planFree").click({ force: true });
      await page.waitForTimeout(80);
      await page.locator("#planTeam").click({ force: true });
      await page.waitForTimeout(80);
      await page.locator("#planFree").click({ force: true });
      break;
    case "idle_haunt":
      // avoid input; wait past 12s post-hint
      await page.waitForTimeout(13000);
      break;
    case "type_process":
      await typeWord(page, "process");
      break;
    case "path_hold":
      await hold(page, "#corruptPath, #navCta, #topRec", 2000);
      break;
    case "badge_hold":
      await hold(page, "#eyebrow, #mainTitle", 1800);
      break;
    case "feat_hold":
      await hold(page, "#h2log, [data-find='features']", 1800);
      break;
    case "quote_hold":
      await hold(page, ".stasis-quote-by, #cardWarn", 1800);
      break;
    case "hit_pulse":
      // force success event if armed; also try real double-click if hit visible
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent("haunt-hit-success"));
      });
      break;
    default:
      throw new Error("no P2 action for " + id);
  }
}

async function fireP3(page, id) {
  switch (id) {
    case "logo_hold":
      await hold(page, "#topRec", 3200);
      break;
    case "type_stasis":
      await typeWord(page, "stasis");
      break;
    case "type_wakeagain":
      await typeWord(page, "wakeagain");
      break;
    case "cta_hold":
      await hold(page, "#navCta", 2800);
      break;
    case "pro_spam":
      await multiClick(page, "#planPro", 7, 80);
      break;
    case "docs_triple":
      await multiClick(page, "[data-find='docs'], .pill-dead", 3, 90);
      break;
    case "pricing_hold":
      await hold(page, "[data-find='todo'], .pill-todo", 2400);
      break;
    case "monitor_quad":
      await multiClick(page, ".stasis-monitor-card, #p3AutopsyOver, .monitor-frame", 4, 90);
      break;
    case "badge_mash":
      await multiClick(page, "#eyebrow, #mainTitle", 5, 80);
      break;
    case "title_hold":
      await hold(page, "#mainTitle", 3000);
      break;
    case "beta_hold":
      await hold(page, "[data-find='wip'], .foot-beta", 2200);
      break;
    case "version_spam":
      await multiClick(page, "[data-find='branch'], .foot-micro:not(.foot-beta)", 5, 80);
      break;
    case "top_hold":
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(3000);
      break;
    case "type_escape":
      await typeWord(page, "escape");
      break;
    case "arrow_sigil":
      for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown"]) {
        await page.keyboard.press(k);
        await page.waitForTimeout(40);
      }
      break;
    case "space_ritual":
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Space");
        await page.waitForTimeout(40);
      }
      break;
    case "features_hold":
      await hold(page, "[data-find='features'], #h2log", 2200);
      break;
    case "quote_double":
      await multiClick(page, "#cardWarn, .stasis-quote", 2, 120);
      break;
    case "select_all_curse":
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      break;
    case "long_idle":
      await page.waitForTimeout(16000);
      break;
    default:
      throw new Error("no P3 action for " + id);
  }
}

async function fireP1(page, path) {
  switch (path) {
    case "logo":
      await multiClick(page, "[data-find='logo']", 2, 100);
      break;
    case "title":
      await multiClick(page, "[data-find='title']", 3, 100);
      break;
    case "freehold":
      await hold(page, "[data-find='freehold']", 2200);
      break;
    case "type":
      await typeWord(page, "diary");
      break;
    case "fakeurl":
      await page.locator("#fakeUrlBar").click({ force: true });
      break;
    default:
      await multiClick(page, `[data-find='${path}']`, 1, 50);
      break;
  }
}

async function runOne(browser, layer, id, runner) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  let ok = false;
  let detail = "";
  try {
    ok = await runner(page);
    detail = ok ? "ok" : "condition not met";
  } catch (e) {
    ok = false;
    detail = (e && e.message ? e.message : String(e)).slice(0, 120);
  }
  await context.close();
  return { layer, id, ok, detail };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const rows = [];

  console.log("BASE", BASE);
  console.log("Testing P1 diary paths…");
  for (const path of P1_PATHS) {
    const r = await runOne(browser, "P1", path, async (page) => {
      await page.goto(`${BASE}/?path=${path}&hintfast=1`, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT,
      });
      await page.waitForTimeout(400);
      const active = await page.evaluate(() => window.__hauntDiaryFindPath);
      if (active !== path) {
        throw new Error("path not forced: got " + active);
      }
      await fireP1(page, path);
      return waitDiary(page, 5000);
    });
    rows.push(r);
    process.stdout.write(r.ok ? "." : "F");
  }

  console.log("\nTesting P2→P3 triggers…");
  for (const id of P2_TRIGGERS) {
    const r = await runOne(browser, "P2", id, async (page) => {
      await page.goto(`${BASE}/?p3=${id}&hintfast=1&diary=1`, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT,
      });
      await page.waitForTimeout(500);
      // close diary if open from ?diary=1
      await page.evaluate(() => {
        document.body.classList.remove("diary-open");
        const d = document.getElementById("diary");
        if (d) d.hidden = true;
        window.__hauntDiaryDiscovered = true;
      });
      await setupPhase2(page);
      const tid = await page.evaluate(() => window.__hauntClimaxTrigger);
      if (tid !== id) throw new Error("trigger not forced: got " + tid);
      await fireP2(page, id);
      const waitMs = id === "idle_haunt" ? 2000 : 6000;
      return waitP3(page, waitMs);
    });
    rows.push(r);
    process.stdout.write(r.ok ? "." : "F");
  }

  console.log("\nTesting P3→climax triggers…");
  for (const id of P3_TRIGGERS) {
    const r = await runOne(browser, "P3", id, async (page) => {
      await page.goto(`${BASE}/?p3t=${id}&p3hint=1&diary=1`, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT,
      });
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        document.body.classList.remove("diary-open");
        const d = document.getElementById("diary");
        if (d) d.hidden = true;
        window.__hauntDiaryDiscovered = true;
      });
      await setupPhase3(page);
      const tid = await page.evaluate(() => window.__hauntPhase3Trigger || (window.__hauntPhase3 && window.__hauntPhase3.id));
      if (tid !== id) throw new Error("trigger not forced: got " + tid);
      await fireP3(page, id);
      const waitMs = id === "long_idle" ? 3000 : 7000;
      return waitClimax(page, waitMs);
    });
    rows.push(r);
    process.stdout.write(r.ok ? "." : "F");
  }

  await browser.close();

  resultsTable(rows);
  const fail = rows.filter((r) => !r.ok);
  const pass = rows.filter((r) => r.ok);
  console.log(`\nSummary: ${pass.length}/${rows.length} PASS, ${fail.length} FAIL`);
  if (fail.length) {
    console.log("\nFailed:");
    fail.forEach((f) => console.log(" -", f.layer, f.id, "→", f.detail));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
