const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const p = await b.newPage();
  p.on("pageerror", (e) => console.log("PAGE", e.message));
  p.on("console", (m) => {
    if (/climax|phase|error|warn/i.test(m.text())) console.log("CON", m.type(), m.text().slice(0, 160));
  });
  await p.goto("http://127.0.0.1:4196/?p3=hold_free&hintfast=1&diary=1", {
    waitUntil: "domcontentloaded",
  });
  await p.waitForTimeout(500);
  const pre = await p.evaluate(() => ({
    tid: window.__hauntClimaxTrigger,
    disc: !!window.__hauntDiaryDiscovered,
    stage: window.__hauntStage && window.__hauntStage(),
    p3: !!window.__hauntPhase3Active,
    diaryOpen: document.body.classList.contains("diary-open"),
    free: !!document.getElementById("planFree"),
  }));
  console.log("pre", pre);

  await p.evaluate(() => {
    document.body.classList.remove("diary-open", "is-haunting", "is-ending", "phase-3-active");
    const d = document.getElementById("diaryPanel");
    if (d) d.hidden = true;
    window.__hauntDiaryDiscovered = true;
    document.body.classList.add("diary-found", "phase-2-active", "stage-corrupt");
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
  await p.waitForTimeout(400);

  const mid = await p.evaluate(() => ({
    tid: window.__hauntClimaxTrigger,
    stage: window.__hauntStage && window.__hauntStage(),
    ready:
      !!window.__hauntDiaryDiscovered &&
      (window.__hauntStage ? window.__hauntStage() : 0) >= 2,
    freeHot: document.getElementById("planFree")
      ? document.getElementById("planFree").className
      : null,
    p3: !!window.__hauntPhase3Active,
  }));
  console.log("mid", mid);

  await p.evaluate(() => {
    const el = document.getElementById("planFree");
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
  console.log("down");
  await p.waitForTimeout(2200);
  const after = await p.evaluate(() => ({
    p3: !!window.__hauntPhase3Active,
    body: document.body.classList.contains("phase-3-active"),
    stage: window.__hauntStage && window.__hauntStage(),
    holding: document.getElementById("planFree").classList.contains("climax-holding"),
  }));
  console.log("after hold", after);

  // try direct enter
  const direct = await p.evaluate(() => {
    if (window.__hauntEnterPhase3) {
      window.__hauntEnterPhase3();
      return {
        p3: !!window.__hauntPhase3Active,
        body: document.body.classList.contains("phase-3-active"),
      };
    }
    return { no: true };
  });
  console.log("direct enter", direct);

  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
