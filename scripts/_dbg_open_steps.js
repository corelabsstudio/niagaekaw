const { chromium } = require("playwright");

async function step(page, name, fn, ms) {
  const t0 = Date.now();
  const r = await Promise.race([
    page.evaluate(fn),
    new Promise((res) => setTimeout(() => res("__TIMEOUT__"), ms || 5000)),
  ]);
  console.log(
    name.padEnd(22),
    r === "__TIMEOUT__" ? "TIMEOUT" : "ok    ",
    (Date.now() - t0 + "ms").padStart(8),
    r !== "__TIMEOUT__" && typeof r !== "object" ? r : r !== "__TIMEOUT__" ? JSON.stringify(r).slice(0, 120) : ""
  );
  return r;
}

(async () => {
  const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:4196/?path=logo&hintfast=1", {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await p.waitForTimeout(200);

  await step(p, "ping", () => 1);

  await step(p, "unhide-only", () => {
    const panel = document.getElementById("diaryPanel");
    panel.hidden = false;
    return "unhidden";
  }, 8000);

  await step(p, "ping2", () => 2);

  await step(p, "class-diary-open", () => {
    document.body.classList.add("diary-open");
    return "classed";
  }, 8000);

  await step(p, "ping3", () => 3);

  await step(p, "style-panel", () => {
    const panel = document.getElementById("diaryPanel");
    panel.style.display = "";
    panel.style.position = "fixed";
    panel.style.inset = "0";
    panel.style.zIndex = "200";
    return "styled";
  }, 8000);

  await step(p, "ping4", () => 4);

  await step(p, "sheet-class", () => {
    const sheet = document.querySelector(".diary-sheet");
    if (!sheet) return "no-sheet";
    sheet.classList.add("is-notebook-open");
    return "sheet";
  }, 8000);

  await step(p, "ping5", () => 5);

  // disconnect observers then open
  await step(p, "disconnect-mo", () => {
    // can't easily disconnect foreign observers
    return "skip";
  });

  await step(p, "openDiary-long", () => {
    window.__hauntOpenDiary();
    return "done";
  }, 10000);

  await step(p, "ping6", () => 6);

  await b.close();
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
