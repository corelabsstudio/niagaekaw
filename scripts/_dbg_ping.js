const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const p = await b.newPage();
  console.log("goto");
  await p.goto("http://127.0.0.1:4196/?path=logo&hintfast=1", {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  for (let i = 0; i < 10; i++) {
    const t0 = Date.now();
    const v = await Promise.race([
      p.evaluate((n) => n + 1, i),
      new Promise((r) => setTimeout(() => r("TIMEOUT"), 2000)),
    ]);
    console.log("ping", i, v, "dt", Date.now() - t0);
    if (v === "TIMEOUT") {
      console.log("main thread blocked after", i, "pings");
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  // try openDiary with timeout
  const od = await Promise.race([
    p.evaluate(() => {
      window.__hauntOpenDiary();
      return "opened";
    }),
    new Promise((r) => setTimeout(() => r("TIMEOUT"), 2500)),
  ]);
  console.log("openDiary", od);
  await b.close();
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
