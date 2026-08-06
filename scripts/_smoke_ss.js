const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") u = "/index.html";
  const f = path.join(root, u.replace(/^\//, ""));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  const ext = path.extname(f);
  const types = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".mp3": "audio/mpeg",
    ".jpg": "image/jpeg",
    ".ttf": "font/ttf",
  };
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(8766, "127.0.0.1", r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => logs.push("PAGEERR: " + e.message));

  await page.goto("http://127.0.0.1:8766/?ss=1", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForFunction(
    () => typeof window.__hauntStartClimaxSequence === "function",
    null,
    { timeout: 10000 }
  );
  await page.evaluate(() => {
    window.__hauntSsPreviewOnly = true;
    if (window.__hauntAudio && window.__hauntAudio.unlock) {
      try {
        window.__hauntAudio.unlock();
      } catch (e) {}
    }
    window.__hauntStartClimaxSequence();
  });
  await page.waitForTimeout(600);

  const a = await page.evaluate(() => ({
    running: !!(
      window.__hauntClimaxSequence && window.__hauntClimaxSequence.isRunning()
    ),
    phase: window.__hauntClimaxSequence
      ? window.__hauntClimaxSequence.phase()
      : -1,
    act: document.body.getAttribute("data-ss-act"),
    weakSrc: (document.querySelector("#ssGhostWeak img") || {}).src || "",
    medSrc: (document.querySelector("#ssGhostMed img") || {}).src || "",
    strongSrc: (document.querySelector("#ssGhostStrong img") || {}).src || "",
    clock: (document.getElementById("ssClock") || {}).textContent,
    status: (document.getElementById("ssStatus") || {}).textContent,
    process: (document.querySelector(".ss-process") || {}).textContent,
  }));

  // ACT A: key should not end sequence
  await page.keyboard.press("a");
  await page.waitForTimeout(200);
  const stillRunning = await page.evaluate(
    () =>
      !!(window.__hauntClimaxSequence && window.__hauntClimaxSequence.isRunning())
  );

  const imgs = await page.evaluate(async () => {
    const srcs = [
      "assets/horror/ghost_weak_phase2.png",
      "assets/horror/ghost_medium_phase3.png",
      "assets/horror/ghost_strong_climax.png",
    ];
    const out = [];
    for (const s of srcs) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => {
        const i = new Image();
        i.onload = () => {
          out.push({ s, ok: true, w: i.naturalWidth });
          res();
        };
        i.onerror = () => {
          out.push({ s, ok: false });
          res();
        };
        i.src = s;
      });
    }
    return out;
  });

  const ui = await page.evaluate(() => ({
    exitHint: !!document.getElementById("ssExitHint"),
    fail: !!document.getElementById("ssExitFail"),
    console: !!document.getElementById("ssConsoleLine"),
    esc: !!document.getElementById("ssEscBtn"),
    trail: !!document.getElementById("ssGhostStrongTrail"),
  }));

  console.log(
    JSON.stringify(
      {
        a,
        stillRunning,
        ui,
        imgs,
        logs: logs.filter((l) => /error|PAGEERR|climax/i.test(l)).slice(0, 30),
      },
      null,
      2
    )
  );

  const ok =
    a.running &&
    stillRunning &&
    a.act === "a" &&
    /ghost_weak_phase2/.test(a.weakSrc) &&
    /ghost_medium_phase3/.test(a.medSrc) &&
    /ghost_strong_climax/.test(a.strongSrc) &&
    imgs.every((x) => x.ok) &&
    ui.exitHint &&
    ui.esc &&
    ui.trail;

  await browser.close();
  server.close();
  if (!ok) {
    console.error("SMOKE FAIL");
    process.exit(1);
  }
  console.log("SMOKE PASS");
})().catch((e) => {
  console.error(e);
  try {
    server.close();
  } catch (_) {}
  process.exit(1);
});
