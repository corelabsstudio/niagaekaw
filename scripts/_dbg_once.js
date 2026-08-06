const { chromium } = require("playwright");
(async () => {
  console.log("launch");
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const p = await b.newPage();
  p.setDefaultTimeout(8000);
  p.on("pageerror", (e) => console.log("PAGEERR", e.message));
  p.on("console", (m) => {
    if (m.type() === "error") console.log("CON", m.text().slice(0, 120));
  });
  console.log("goto");
  await p.goto("http://127.0.0.1:4195/?path=logo&hintfast=1", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  console.log("loaded");
  await p.waitForTimeout(300);

  console.log("call openDiary");
  const r = await Promise.race([
    p.evaluate(() => {
      try {
        window.__hauntOpenDiary();
        return {
          ok: true,
          discovered: !!window.__hauntDiaryDiscovered,
          open: document.body.classList.contains("diary-open"),
        };
      } catch (e) {
        return { ok: false, err: String(e) };
      }
    }),
    new Promise((res) => setTimeout(() => res({ ok: false, err: "timeout evaluate" }), 5000)),
  ]);
  console.log("openDiary result", r);

  console.log("P2 setup");
  await p.goto("http://127.0.0.1:4195/?p3=hold_free&hintfast=1", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    window.__hauntDiaryDiscovered = true;
    document.body.classList.add("diary-found", "phase-2-active");
    document.body.classList.remove("diary-open");
    if (window.__hauntSetStage) window.__hauntSetStage(2);
    window.__hauntPhase3Active = false;
    try {
      sessionStorage.removeItem("haunt_phase3");
    } catch (e) {}
  });
  // showHint may re-arm
  const tid = await p.evaluate(() => {
    if (window.__hauntClimax && window.__hauntClimax.showHint) {
      window.__hauntClimax.showHint();
    }
    return window.__hauntClimaxTrigger;
  });
  console.log("tid", tid, "stage", await p.evaluate(() => window.__hauntStage && window.__hauntStage()));

  // fire hold without waiting on pointerup until after
  await p.evaluate(() => {
    const el = document.getElementById("planFree");
    if (!el) return;
    el.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        buttons: 1,
        button: 0,
      })
    );
  });
  console.log("pointerdown sent, wait 2s");
  await p.waitForTimeout(2100);
  const p3 = await p.evaluate(() => ({
    p3: !!window.__hauntPhase3Active,
    cls: document.body.classList.contains("phase-3-active"),
  }));
  console.log("after hold", p3);

  // climax direct
  console.log("climax start");
  await p.goto("http://127.0.0.1:4195/?ss=1", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(200);
  const c = await p.evaluate(() => {
    window.__hauntSsPreviewOnly = true;
    window.__hauntStartClimaxSequence();
    return {
      running: window.__hauntClimaxSequence.isRunning(),
      act: document.body.getAttribute("data-ss-act"),
      weak: document.querySelector("#ssGhostWeak img").src,
    };
  });
  console.log("climax", c);
  await p.keyboard.press("a");
  await p.waitForTimeout(100);
  console.log(
    "still",
    await p.evaluate(() => window.__hauntClimaxSequence.isRunning())
  );

  await b.close();
  console.log("DONE");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
