const { chromium } = require("playwright");
(async () => {
  console.log("1 launch");
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  console.log("2 page");
  const p = await b.newPage();
  console.log("3 goto");
  await p.goto("http://127.0.0.1:4196/?path=logo&hintfast=1", {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  console.log("4 loaded");
  await p.waitForTimeout(300);

  console.log("5 evaluate steps");
  const steps = await p.evaluate(() => {
    const out = [];
    function mark(n) {
      out.push(n);
    }
    mark("start");
    const panel = document.getElementById("diaryPanel");
    mark("panel=" + !!panel);
    try {
      panel.hidden = false;
      mark("unhide");
      document.body.classList.add("diary-open");
      mark("class");
      window.__hauntDiaryDiscovered = true;
      mark("flag");
    } catch (e) {
      out.push("err:" + e.message);
    }
    try {
      const n = document.body.getAnimations
        ? document.body.getAnimations().length
        : -1;
      const n2 = document.documentElement.getAnimations
        ? document.documentElement.getAnimations().length
        : -1;
      mark("anims body=" + n + " html=" + n2);
    } catch (e) {
      mark("animerr");
    }
    try {
      document.dispatchEvent(
        new CustomEvent("haunt-diary", {
          detail: { discovered: true, page: 0, unlocked: 0, boost: 1.2 },
        })
      );
      mark("event done");
    } catch (e) {
      mark("eventerr " + e.message);
    }
    return out;
  });
  console.log("steps:", steps.join(" | "));

  console.log("6 openDiary timed");
  const r = await Promise.race([
    p.evaluate(() => {
      const t0 = performance.now();
      window.__hauntOpenDiary();
      return { ms: performance.now() - t0, disc: !!window.__hauntDiaryDiscovered };
    }),
    new Promise((res) =>
      setTimeout(() => res({ ms: -1, err: "timeout" }), 3000)
    ),
  ]);
  console.log("openDiary", r);

  // step openDiary manually
  console.log("7 clearBodyLayoutHazards only");
  const r2 = await Promise.race([
    p.evaluate(() => {
      // re-implement cancel anims only
      const t0 = performance.now();
      try {
        if (document.body.getAnimations) {
          document.body.getAnimations().forEach((a) => a.cancel());
        }
      } catch (e) {}
      return performance.now() - t0;
    }),
    new Promise((res) => setTimeout(() => res(-1), 2000)),
  ]);
  console.log("cancel anims ms", r2);

  console.log("8 breath+pulse via audio");
  const r3 = await Promise.race([
    p.evaluate(() => {
      const t0 = performance.now();
      const a = window.__hauntAudio;
      if (a) {
        if (a.unlock) a.unlock();
        if (a.breath) a.breath();
        if (a.pulse) a.pulse("soft");
      }
      return { ms: performance.now() - t0, has: !!a };
    }),
    new Promise((res) => setTimeout(() => res({ ms: -1 }), 2000)),
  ]);
  console.log("audio", r3);

  await b.close();
  console.log("DONE");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
