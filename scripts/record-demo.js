/**
 * niagaekaw 시연 녹화 (커서 보이는 탐색형)
 * → .demo-record/*.webm
 */
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DESKTOP = path.join(process.env.USERPROFILE || "C:\\Users\\hysoo", "Desktop");
const OUT_DIR = path.join(ROOT, ".demo-record");
const MP4 = path.join(DESKTOP, "niagaekaw-demo.mp4");
const PORT = 8765;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function startServer() {
  return new Promise(function (resolve) {
    const server = http.createServer(function (req, res) {
      try {
        let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        if (urlPath === "/") urlPath = "/index.html";
        const filePath = path.join(
          ROOT,
          urlPath.replace(/^\//, "").replace(/\//g, path.sep)
        );
        if (
          !filePath.startsWith(ROOT) ||
          !fs.existsSync(filePath) ||
          fs.statSync(filePath).isDirectory()
        ) {
          res.writeHead(404);
          res.end("not found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
        });
        fs.createReadStream(filePath).pipe(res);
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    server.listen(PORT, "127.0.0.1", function () {
      resolve(server);
    });
  });
}

function sleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

/** 화면에 보이는 가짜 커서 (Playwright 녹화에 OS 커서가 안 잡힘) */
async function injectCursor(page) {
  await page.addInitScript(function () {
    // early
  });
  await page.evaluate(function () {
    if (document.getElementById("__demoCursor")) return;
    var c = document.createElement("div");
    c.id = "__demoCursor";
    c.setAttribute("aria-hidden", "true");
    c.style.cssText =
      "position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483646;" +
      "pointer-events:none;margin:0;transform:translate(-2px,-2px);" +
      "background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' stroke='%23000' stroke-width='1.2' d='M4 3l1.2 16.5 4.3-4.2 3.8 7.2 2.2-1.2-3.9-7.1L19 12.5 4 3z'/%3E%3C/svg%3E\") no-repeat center/contain;" +
      "filter:drop-shadow(0 1px 2px rgba(0,0,0,.65));transition:transform .05s linear;";
    document.documentElement.appendChild(c);
    window.__demoCursorMove = function (x, y, click) {
      var el = document.getElementById("__demoCursor");
      if (!el) return;
      el.style.left = x + "px";
      el.style.top = y + "px";
      if (click) {
        el.style.transform = "translate(-2px,-2px) scale(0.86)";
        setTimeout(function () {
          el.style.transform = "translate(-2px,-2px) scale(1)";
        }, 90);
      }
    };
  });
}

async function moveCursor(page, x, y, steps) {
  steps = steps || 12;
  await page.mouse.move(x, y, { steps: steps });
  await page.evaluate(
    function (p) {
      if (window.__demoCursorMove) window.__demoCursorMove(p.x, p.y, false);
    },
    { x: x, y: y }
  );
}

async function clickAt(page, x, y) {
  await moveCursor(page, x, y, 16);
  await sleep(120);
  await page.evaluate(
    function (p) {
      if (window.__demoCursorMove) window.__demoCursorMove(p.x, p.y, true);
    },
    { x: x, y: y }
  );
  await page.mouse.click(x, y);
  await sleep(200);
}

async function clickAdmin(page, action) {
  const sel = '[data-admin="' + action + '"]';
  await page.waitForSelector(sel, { timeout: 15000 });
  const box = await page.locator(sel).boundingBox();
  if (box) {
    await clickAt(page, box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await page.click(sel);
  }
}

async function main() {
  if (!fs.existsSync(DESKTOP)) {
    throw new Error("Desktop not found: " + DESKTOP);
  }
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = await startServer();
  console.log("[demo] server http://127.0.0.1:" + PORT);

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    hasTouch: false,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  try {
    await page.goto("http://127.0.0.1:" + PORT + "/?admin=1&hintfast=1", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await injectCursor(page);
    // 재주입 (navigation 후)
    await page.evaluate(function () {
      /* cursor already via evaluate after load */
    });
    await injectCursor(page);

    // —— 0~3초: 평범한 랜딩 탐색 ——
    await moveCursor(page, 200, 180, 18);
    await sleep(600);
    await moveCursor(page, 640, 280, 20); // 히어로
    await sleep(700);
    await moveCursor(page, 900, 120, 14); // 내비
    await sleep(500);
    await moveCursor(page, 400, 400, 16);
    await sleep(800);

    // —— 중반: 스크롤하며 이상함 ——
    await moveCursor(page, 640, 500, 12);
    await page.mouse.wheel(0, 480);
    await sleep(900);
    await moveCursor(page, 500, 360, 14);
    await sleep(700);
    await page.mouse.wheel(0, 520);
    await sleep(1000);
    await moveCursor(page, 700, 420, 12);
    await sleep(800);

    // 2페이즈 진입 (관리자)
    await clickAdmin(page, "p2");
    await sleep(1200);
    await moveCursor(page, 300, 200, 14);
    await sleep(600);
    await page.mouse.wheel(0, 400);
    await sleep(1500);
    await moveCursor(page, 900, 500, 18);
    await sleep(1000);
    await page.mouse.wheel(0, 350);
    await sleep(1200);

    // 3페이즈
    await clickAdmin(page, "p3");
    await sleep(1500);
    await moveCursor(page, 640, 300, 16);
    await sleep(1200);
    await page.mouse.wheel(0, 300);
    await sleep(1500);
    await moveCursor(page, 200, 400, 14);
    await sleep(1000);

    // 클라이맥스
    await clickAdmin(page, "climax");
    await sleep(28000);
    await sleep(3500);
  } catch (err) {
    console.error("[demo] record error", err);
  }

  await page.close();
  await context.close();
  await browser.close();
  server.close();

  const files = fs.readdirSync(OUT_DIR).filter(function (f) {
    return f.endsWith(".webm");
  });
  if (!files.length) throw new Error("no webm recorded");
  const webm = path.join(OUT_DIR, files[0]);
  console.log("[demo] raw:", webm);

  let ffmpeg;
  try {
    ffmpeg = execFileSync(
      "python",
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      { encoding: "utf8" }
    ).trim();
  } catch (e) {
    throw new Error("ffmpeg missing");
  }

  console.log("[demo] converting →", MP4);
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webm,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-movflags",
      "+faststart",
      "-an",
      MP4,
    ],
    { stdio: "inherit" }
  );
  console.log(
    "[demo] DONE",
    MP4,
    "(" + Math.round(fs.statSync(MP4).size / 1024) + " KB)"
  );
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
