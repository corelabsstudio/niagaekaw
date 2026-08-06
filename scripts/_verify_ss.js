const fs = require("fs");
const js = fs.readFileSync("climax-sequence.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

const checks = [
  ["GHOST weak path", /ghost_weak_phase2\.png/.test(js)],
  ["GHOST med path", /ghost_medium_phase3\.png/.test(js)],
  ["GHOST strong path", /ghost_strong_climax\.png/.test(js)],
  ["exit failed", /exit failed/.test(js)],
  ["esc is not defined", /esc is not defined/.test(js)],
  ["cursor spawn", /spawnCursorGhost/.test(js)],
  ["ACT D mute", /hardMuteAll/.test(js)],
  ["no wakeagain.com", !/wakeagain\.com/i.test(js)],
  ["no WAKE flash CTA", !/flashCopy\(["']WAKE["']/.test(js)],
  ["MARK b1 15000", /b1:\s*15000/.test(js)],
  ["MARK d 55000", /d:\s*55000/.test(js)],
  ["preview ?ss=1", /(ss\|climax)=1/.test(js)],
  ["html weak src", /ghost_weak_phase2\.png/.test(html)],
  ["html trail", /ssGhostStrongTrail/.test(html)],
  ["html esc btn", /ssEscBtn/.test(html)],
  ["html cache ss60v2", /ss60v2/.test(html)],
  ["css pointer-events", /pointer-events:\s*none !important/.test(css)],
  ["css reduced motion", /prefers-reduced-motion: reduce/.test(css)],
  ["css esc btn", /\.ss-esc-btn/.test(css)],
  ["css preview bar", /ss-preview-bar/.test(css)],
];

let fail = 0;
for (const [n, ok] of checks) {
  console.log((ok ? "OK " : "FAIL ") + n);
  if (!ok) fail++;
}

const assets = [
  "assets/horror/ghost_weak_phase2.png",
  "assets/horror/ghost_medium_phase3.png",
  "assets/horror/ghost_strong_climax.png",
];
for (const a of assets) {
  const ok = fs.existsSync(a) && fs.statSync(a).size > 100000;
  console.log((ok ? "OK " : "FAIL ") + "file " + a);
  if (!ok) fail++;
}

process.exit(fail ? 1 : 0);
