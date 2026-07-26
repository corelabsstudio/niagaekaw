/**
 * Deep site audit for niagaekaw
 * - console/page errors
 * - missing assets (faces, audio, atmospheres)
 * - required DOM ids
 * - presence HUD visibility
 * - full flow P1 diary → P2 → P3 → climax → ending
 * - sample triggers each layer
 * - mobile viewport smoke
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:4195";

const REQUIRED_IDS = [
  "planFree", "planPro", "planTeam", "topRec", "navCta", "mainTitle", "lede",
  "fakeUrlBar", "hauntHit", "clock", "cardWarn", "p3HintToast", "p2HintToast",
  "presenceHud", "corruptPath", "h2log", "p3AutopsyOver", "p3FloatFaces",
  "p2MissionChip", "p3MissionChip", "p3LayerToast",
];

const ASSETS = [
  "assets/faces/face-1.jpg", "assets/faces/face-2.jpg", "assets/faces/face-3.jpg",
  "assets/faces/face-4.jpg", "assets/faces/face-5.jpg", "assets/faces/face-6.jpg",
  "assets/faces/face-7.jpg", "assets/faces/face-8.jpg", "assets/faces/face-9.jpg",
  "assets/audio/Stalled_Rotor.mp3", "assets/audio/Iron_Chest_Cavity.mp3",
  "assets/p2-ref-atmosphere.png", "assets/p3-ref-atmosphere.png",
  "assets/p3-ref-atmosphere-only.png",
  "styles.css", "app.js", "presence.js", "haunt-audio.js", "diary-stories.js",
  "diary.js", "climax-triggers.js", "phase3-triggers.js", "climax-sequence.js",
  "ending.js", "anomalies.js", "phase3-horrors.js",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function collectPage(page) {
  const errors = [];
  const logs = [];
  page.on("pageerror", (e) => errors.push("PAGE: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") logs.push("CONSOLE: " + m.text());
  });
  page.on("requestfailed", (req) => {
    logs.push("REQFAIL: " + req.url() + " " + (req.failure() && req.failure().errorText));
  });
  return { errors, logs };
}

async function checkAssets(page) {
  const results = [];
  for (const path of ASSETS) {
    const url = BASE.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    const status = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u, { method: "GET", cache: "no-store" });
        return r.status;
      } catch (e) {
        return -1;
      }
    }, url);
    results.push({ path, status, ok: status >= 200 && status < 400 });
  }
  return results;
}

async function forceP2(page) {
  await page.evaluate(() => {
    document.body.classList.remove("diary-open", "is-haunting", "is-ending", "phase-3-active");
    const d = document.getElementById("diary");
    if (d) d.hidden = true;
    window.__hauntDiaryDiscovered = true;
    document.body.classList.add("diary-found", "phase-2-active", "stage-corrupt");
    document.body.setAttribute("data-stage", "2");
    if (window.__hauntSetStage) window.__hauntSetStage(2);
    if (window.__hauntSetMood) window.__hauntSetMood(3);
    window.__hauntPhase3Active = false;
    try {
      sessionStorage.removeItem("haunt_phase3");
    } catch (e) {}
  });
}

async function forceP3(page) {
  await page.evaluate(() => {
    document.body.classList.remove("diary-open", "is-haunting", "is-ending");
    window.__hauntDiaryDiscovered = true;
    window.__hauntPhase3Active = true;
    document.body.classList.add("phase-3-active", "diary-found");
    document.body.setAttribute("data-stage", "3");
    try {
      sessionStorage.setItem("haunt_phase3", "1");
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("haunt-phase3", { detail: { from: "audit" } }));
  });
  await sleep(400);
}

async function main() {
  const report = {
    base: BASE,
    assets: [],
    ids: [],
    presence: null,
    flow: {},
    triggers: {},
    mobile: {},
    encoding: null,
    console: [],
    pageErrors: [],
    issues: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const bag = await collectPage(page);

  // --- load clean ---
  await page.goto(BASE + "/?hintfast=1", { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(1200);

  // assets
  report.assets = await checkAssets(page);

  // required ids
  report.ids = await page.evaluate((ids) => {
    return ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return { id, ok: false, reason: "missing" };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        id,
        ok: true,
        display: cs.display,
        visibility: cs.visibility,
        w: Math.round(r.width),
        h: Math.round(r.height),
        hiddenAttr: !!el.hidden,
      };
    });
  }, REQUIRED_IDS);

  // presence HUD
  report.presence = await page.evaluate(() => {
    const hud = document.getElementById("presenceHud");
    if (!hud) return { ok: false, reason: "no hud" };
    const cs = getComputedStyle(hud);
    const r = hud.getBoundingClientRect();
    const live = document.getElementById("presenceLiveCount");
    const total = document.getElementById("presenceTotalCount");
    const liveLabel = document.getElementById("presenceLiveLabel");
    const totalLabel = document.getElementById("presenceTotalLabel");
    return {
      ok: cs.opacity !== "0" && cs.visibility !== "hidden" && r.width > 20,
      text: (hud.innerText || "").replace(/\s+/g, " ").trim(),
      liveLabel: liveLabel && liveLabel.textContent,
      totalLabel: totalLabel && totalLabel.textContent,
      live: live && live.textContent,
      total: total && total.textContent,
      api: !!(window.__hauntPresence),
      rect: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) },
      z: cs.zIndex,
      opacity: cs.opacity,
    };
  });
  await sleep(2500);
  // refresh presence numbers after API
  report.presence.after = await page.evaluate(() => {
    return {
      live: window.__hauntPresence && window.__hauntPresence.getLive(),
      total: window.__hauntPresence && window.__hauntPresence.getTotal(),
      text: (document.getElementById("presenceHud") && document.getElementById("presenceHud").innerText || "").replace(/\s+/g, " ").trim(),
    };
  });

  // encoding check on labels
  report.encoding = await page.evaluate(() => {
    const s = document.body.innerText;
    const bad = (s.match(/\uFFFD/g) || []).length;
    const sample = {
      liveLabel: (document.getElementById("presenceLiveLabel") || {}).textContent,
      totalLabel: (document.getElementById("presenceTotalLabel") || {}).textContent,
      title: document.title,
      h1: (document.getElementById("mainTitle") || {}).textContent,
    };
    // detect mojibake common patterns
    const moji = /Ã.|Â.|ì.|ë.|í.|ï¿½|��/.test(
      (sample.liveLabel || "") + (sample.totalLabel || "")
    );
    return { replacementChars: bad, mojibakeSuspect: moji, sample };
  });

  // diary stories
  report.stories = await page.evaluate(() => {
    const api = window.__hauntDiaryStories;
    if (!api) return { ok: false };
    const list = api.all || api.list || (api.STORIES ? api.STORIES : null);
    // try internal
    let count = null;
    try {
      if (api.current) count = "has-current";
    } catch (e) {}
    return {
      ok: !!api,
      keys: Object.keys(api || {}),
      countHint: count,
    };
  });

  // --- FLOW: diary ---
  await page.goto(BASE + "/?path=logo&hintfast=1", { waitUntil: "domcontentloaded" });
  await sleep(400);
  await page.evaluate(() => {
    const logo = document.getElementById("topRec");
    logo.click();
    logo.click();
  });
  await sleep(800);
  report.flow.diaryOpen = await page.evaluate(() => ({
    discovered: !!window.__hauntDiaryDiscovered,
    open: document.body.classList.contains("diary-open"),
    found: document.body.classList.contains("diary-found"),
  }));

  // advance diary roughly via buttons if present
  await page.evaluate(async () => {
    function sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }
    // try next buttons several times
    for (let i = 0; i < 12; i++) {
      const next =
        document.querySelector(".diary-next:not([disabled])") ||
        document.querySelector("#diaryNext") ||
        document.querySelector("[data-diary-next]");
      if (next) {
        next.click();
        await sleep(350);
      } else break;
    }
    // close if still open
    const close = document.getElementById("diaryClose") || document.querySelector(".diary-close");
    if (close) close.click();
    document.body.classList.remove("diary-open");
  });
  await sleep(500);

  // force P2 state for visuals
  await forceP2(page);
  await sleep(500);
  report.flow.p2 = await page.evaluate(() => ({
    stage: document.body.getAttribute("data-stage"),
    phase2: document.body.classList.contains("phase-2-active"),
    stageClass: document.body.className,
    monitorFaces: document.querySelectorAll(".p2-mf").length,
    anomaliesApi: !!(window.__hauntAnomalies),
  }));

  // fire a couple P2 triggers via forced pages
  const p2Samples = ["hold_free", "triple_logo", "title_mash", "badge_hold", "monitor_quad"];
  // monitor_quad is P3 - skip. use quote_hold
  const p2Test = ["hold_free", "triple_logo", "title_mash", "badge_hold", "feat_hold"];
  for (const id of p2Test) {
    const p = await context.newPage();
    const b = await collectPage(p);
    await p.goto(BASE + "/?p3=" + id + "&hintfast=1&diary=1", { waitUntil: "domcontentloaded" });
    await sleep(400);
    const ok = await p.evaluate(async (id) => {
      document.body.classList.remove("diary-open", "is-haunting", "is-ending", "phase-3-active");
      const d = document.getElementById("diary");
      if (d) d.hidden = true;
      window.__hauntDiaryDiscovered = true;
      document.body.classList.add("diary-found", "phase-2-active", "stage-corrupt", "stage-dread");
      document.body.setAttribute("data-stage", "2");
      if (window.__hauntSetStage) window.__hauntSetStage(2);
      window.__hauntPhase3Active = false;
      try {
        sessionStorage.removeItem("haunt_phase3");
      } catch (e) {}
      if (window.__hauntClimax) window.__hauntClimax.showHint();
      if (window.__hauntP2RebindHold) window.__hauntP2RebindHold();
      await new Promise((r) => setTimeout(r, 200));
      if (window.__hauntClimaxTrigger !== id) return { ok: false, reason: "wrong trigger " + window.__hauntClimaxTrigger };
      function vis(el) {
        if (!el) return false;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        const r = el.getBoundingClientRect();
        return r.width >= 2 && r.height >= 2;
      }
      function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
      }
      async function hold(el, ms) {
        el.scrollIntoView({ block: "center" });
        el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" }));
        await sleep(ms);
        el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" }));
      }
      async function clicks(el, n) {
        el.scrollIntoView({ block: "center" });
        for (let i = 0; i < n; i++) {
          el.click();
          await sleep(80);
        }
      }
      const map = {
        hold_free: () => document.getElementById("planFree"),
        triple_logo: () => document.getElementById("topRec"),
        title_mash: () => document.getElementById("mainTitle"),
        badge_hold: () => [document.getElementById("mainTitle"), document.getElementById("topRec")].find(vis),
        feat_hold: () => [document.getElementById("h2log"), document.getElementById("mainTitle")].find(vis),
      };
      const el = map[id]();
      if (!el) return { ok: false, reason: "no el" };
      if (id === "triple_logo" || id === "title_mash") await clicks(el, id === "triple_logo" ? 3 : 5);
      else await hold(el, 2000);
      await sleep(700);
      return {
        ok: !!(window.__hauntPhase3Active || document.body.classList.contains("phase-3-active")),
      };
    }, id);
    report.triggers["p2:" + id] = ok;
    report.console.push(...b.logs);
    report.pageErrors.push(...b.errors);
    await p.close();
  }

  // P3 samples
  const p3Test = ["logo_hold", "monitor_quad", "pro_spam", "type_stasis", "quote_double"];
  for (const id of p3Test) {
    const p = await context.newPage();
    const b = await collectPage(p);
    await p.goto(BASE + "/?p3t=" + id + "&p3hint=1&diary=1", { waitUntil: "domcontentloaded" });
    await sleep(400);
    const ok = await p.evaluate(async (id) => {
      document.body.classList.remove("diary-open", "is-haunting", "is-ending");
      const d = document.getElementById("diary");
      if (d) d.hidden = true;
      window.__hauntDiaryDiscovered = true;
      window.__hauntPhase3Active = true;
      document.body.classList.add("phase-3-active", "diary-found");
      document.body.setAttribute("data-stage", "3");
      try {
        sessionStorage.setItem("haunt_phase3", "1");
      } catch (e) {}
      document.dispatchEvent(new CustomEvent("haunt-phase3", { detail: { from: "audit" } }));
      if (window.__hauntPhase3 && window.__hauntPhase3.showHint) window.__hauntPhase3.showHint();
      await new Promise((r) => setTimeout(r, 300));
      const tid = window.__hauntPhase3Trigger || (window.__hauntPhase3 && window.__hauntPhase3.id);
      if (tid !== id) return { ok: false, reason: "wrong " + tid };
      function vis(el) {
        if (!el) return false;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        const r = el.getBoundingClientRect();
        return r.width >= 2 && r.height >= 2;
      }
      function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
      }
      async function hold(el, ms) {
        el.scrollIntoView({ block: "center" });
        el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" }));
        await sleep(ms);
        el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" }));
      }
      async function clicks(el, n) {
        el.scrollIntoView({ block: "center" });
        for (let i = 0; i < n; i++) {
          el.click();
          await sleep(80);
        }
      }
      async function typeWord(w) {
        for (const ch of w) {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true }));
        }
      }
      if (id === "logo_hold") await hold(document.getElementById("topRec"), 3200);
      else if (id === "monitor_quad") {
        const el = [document.querySelector(".stasis-monitor-card"), document.getElementById("p3AutopsyOver")].find(vis);
        await clicks(el, 4);
      } else if (id === "pro_spam") {
        const btn = document.getElementById("planPro");
        if (btn) {
          btn.disabled = false;
          btn.removeAttribute("disabled");
        }
        await clicks(btn, 7);
      } else if (id === "type_stasis") await typeWord("stasis");
      else if (id === "quote_double") await clicks(document.getElementById("cardWarn") || document.querySelector(".stasis-quote"), 2);
      await sleep(900);
      return {
        ok:
          document.body.classList.contains("is-haunting") ||
          document.body.classList.contains("is-ending") ||
          !!(window.__hauntClimaxSequence && window.__hauntClimaxSequence.phase),
      };
    }, id);
    report.triggers["p3:" + id] = ok;
    report.console.push(...b.logs);
    report.pageErrors.push(...b.errors);
    await p.close();
  }

  // climax + ending shortcuts
  await page.goto(BASE + "/?summon=1", { waitUntil: "domcontentloaded" });
  await sleep(1500);
  report.flow.summon = await page.evaluate(() => ({
    haunting: document.body.classList.contains("is-haunting"),
    ending: document.body.classList.contains("is-ending"),
    hasHaunt: !!document.querySelector(".haunt"),
  }));

  await page.goto(BASE + "/?ending=1", { waitUntil: "domcontentloaded" });
  await sleep(2000);
  report.flow.ending = await page.evaluate(() => ({
    ending: document.body.classList.contains("is-ending"),
    text: (document.body.innerText || "").slice(0, 200),
    hasWake: /wakeagain|no signal/i.test(document.body.innerText || ""),
  }));

  // P3 visual layers
  await page.goto(BASE + "/?diary=1&p3hint=1", { waitUntil: "domcontentloaded" });
  await sleep(400);
  await forceP3(page);
  report.flow.p3visual = await page.evaluate(() => {
    const over = document.getElementById("p3AutopsyOver");
    const floats = document.querySelectorAll(".p3-ff");
    const monitor = document.querySelector(".monitor-frame");
    const mcs = monitor && getComputedStyle(monitor);
    return {
      phase3: document.body.classList.contains("phase-3-active"),
      autopsyOn: over && over.classList.contains("is-on"),
      autopsyDisplay: over && getComputedStyle(over).display,
      floatCount: floats.length,
      monitorDisplay: mcs && mcs.display,
      planShattered: document.querySelectorAll(".plan-card.is-shattered").length,
      depthBar: !!(document.getElementById("p3DepthBar") && !document.getElementById("p3DepthBar").hidden),
    };
  });

  // mobile smoke
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });
  const mp = await mobile.newPage();
  const mb = await collectPage(mp);
  await mp.goto(BASE + "/?path=logo&hintfast=1", { waitUntil: "domcontentloaded" });
  await sleep(800);
  report.mobile.load = await mp.evaluate(() => ({
    isMobileClass: document.documentElement.classList.contains("is-mobile") || document.documentElement.getAttribute("data-device") === "mobile",
    width: window.innerWidth,
    presence: !!(document.getElementById("presenceHud") && getComputedStyle(document.getElementById("presenceHud")).opacity !== "0"),
    presenceText: (document.getElementById("presenceHud") && document.getElementById("presenceHud").innerText || "").replace(/\s+/g, " ").trim(),
  }));
  await mp.evaluate(() => {
    const logo = document.getElementById("topRec");
    if (logo) {
      logo.click();
      logo.click();
    }
  });
  await sleep(700);
  report.mobile.diary = await mp.evaluate(() => ({
    discovered: !!window.__hauntDiaryDiscovered,
    open: document.body.classList.contains("diary-open"),
  }));
  // mobile p2 hold_free
  await mp.goto(BASE + "/?p3=hold_free&hintfast=1&diary=1", { waitUntil: "domcontentloaded" });
  await sleep(400);
  report.mobile.p2hold = await mp.evaluate(async () => {
    document.body.classList.remove("diary-open", "phase-3-active");
    window.__hauntDiaryDiscovered = true;
    document.body.classList.add("diary-found", "phase-2-active", "stage-corrupt");
    document.body.setAttribute("data-stage", "2");
    if (window.__hauntSetStage) window.__hauntSetStage(2);
    window.__hauntPhase3Active = false;
    if (window.__hauntClimax) window.__hauntClimax.showHint();
    await new Promise((r) => setTimeout(r, 200));
    const el = document.getElementById("planFree");
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, pointerType: "touch" }));
    await new Promise((r) => setTimeout(r, 2000));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 1, pointerType: "touch" }));
    await new Promise((r) => setTimeout(r, 700));
    return {
      ok: !!(window.__hauntPhase3Active || document.body.classList.contains("phase-3-active")),
      trigger: window.__hauntClimaxTrigger,
    };
  });
  report.console.push(...mb.logs);
  report.pageErrors.push(...mb.errors);
  await mobile.close();

  // consolidate errors from main bag
  report.console.push(...bag.logs);
  report.pageErrors.push(...bag.errors);

  // build issues list
  for (const a of report.assets) {
    if (!a.ok) report.issues.push({ sev: "high", area: "asset", msg: a.path + " status " + a.status });
  }
  for (const id of report.ids) {
    if (!id.ok) report.issues.push({ sev: "high", area: "dom", msg: "missing #" + id.id });
  }
  if (!report.presence || !report.presence.ok) {
    report.issues.push({ sev: "high", area: "presence", msg: "HUD not visible" });
  }
  if (report.encoding && (report.encoding.replacementChars > 0 || report.encoding.mojibakeSuspect)) {
    report.issues.push({
      sev: "medium",
      area: "encoding",
      msg: "possible broken Korean text in UI",
      sample: report.encoding.sample,
    });
  }
  if (!report.flow.diaryOpen || !report.flow.diaryOpen.discovered) {
    report.issues.push({ sev: "high", area: "flow", msg: "diary discovery failed (logo path)" });
  }
  for (const [k, v] of Object.entries(report.triggers)) {
    if (!v || !v.ok) report.issues.push({ sev: "high", area: "trigger", msg: k + " failed", detail: v });
  }
  if (!report.mobile.p2hold || !report.mobile.p2hold.ok) {
    report.issues.push({ sev: "high", area: "mobile", msg: "mobile hold_free failed" });
  }
  if (!report.flow.ending || !report.flow.ending.hasWake) {
    report.issues.push({ sev: "medium", area: "ending", msg: "ending text not detected cleanly" });
  }

  // unique console
  report.console = [...new Set(report.console)].slice(0, 40);
  report.pageErrors = [...new Set(report.pageErrors)].slice(0, 40);

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
