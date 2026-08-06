/**
 * 모바일 쇼츠용 세로 녹화 (9:16)
 * 출력: .demo-shorts-mobile/raw.webm → Desktop/niagaekaw-shorts-mobile-raw.mp4
 *
 * 타임라인 (~22s):
 *  0-4   클린 SaaS 랜딩 탐색
 *  4-8   스크롤·위화감
 *  8-13  2페이즈 공포
 * 13-18  3페이즈 심화
 * 18-22  클라이맥스 직전 힌트만 (풀 엔딩 미포함)
 */
const { chromium, devices } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DESKTOP = path.join(process.env.USERPROFILE || "C:\\Users\\hysoo", "Desktop");
const OUT_DIR = path.join(ROOT, ".demo-shorts-mobile");
const MP4 = path.join(DESKTOP, "niagaekaw-shorts-mobile-raw.mp4");
const PORT = 8767;

// 세로 소스 — 업스케일 품질 위해 540x960 녹화
const VW = 540;
const VH = 960;

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

async function forcePhase(page, which) {
  await page.evaluate(function (which) {
    window.__hauntNoCount = true;
    window.__hauntDiaryDiscovered = true;
    try {
      if (typeof window.__hauntSetStage === "function") {
        if (which === "p2") window.__hauntSetStage(2);
        else window.__hauntSetStage(3);
      }
      if (typeof window.__hauntSetMood === "function") {
        window.__hauntSetMood(which === "p2" ? 3 : 4);
      }
      if (typeof window.__hauntSetP2Decay === "function") {
        window.__hauntSetP2Decay(which === "p2" ? 3 : 5);
      }
    } catch (e) {}
    document.body.classList.add("diary-found", "phase-2-active");
    document.body.classList.remove("diary-open");
    var d = document.getElementById("diary");
    if (d) d.hidden = true;

    if (which === "p3" || which === "climax") {
      if (typeof window.__hauntEnterPhase3 === "function") {
        window.__hauntEnterPhase3();
      } else {
        window.__hauntPhase3Active = true;
        document.body.classList.add("phase-3-active");
        try {
          sessionStorage.setItem("haunt_phase3", "1");
          document.dispatchEvent(
            new CustomEvent("haunt-phase3", { detail: { from: "shorts" } })
          );
        } catch (e2) {}
      }
    }
    if (which === "climax") {
      setTimeout(function () {
        if (typeof window.__hauntSummon === "function") window.__hauntSummon();
        else if (window.__hauntClimax && window.__hauntClimax.summon)
          window.__hauntClimax.summon();
      }, 300);
    }
  }, which);
  await sleep(which === "climax" ? 500 : 800);
}

async function tap(page, x, y) {
  await page.touchscreen.tap(x, y);
  await sleep(180);
}

async function main() {
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = await startServer();
  console.log("[shorts-m] http://127.0.0.1:" + PORT);

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  const iphone = devices["iPhone 13 Pro"] || devices["iPhone 12"];
  const context = await browser.newContext({
    ...iphone,
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: VW, height: VH },
    },
  });

  const page = await context.newPage();

  try {
    // nocount-safe params for tests
    await page.goto(
      "http://127.0.0.1:" + PORT + "/?hintfast=1&nocount=1",
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );
    await page.evaluate(function () {
      window.__hauntNoCount = true;
    });
    await sleep(900);

    // —— 0~4s 클린: 히어로 보며 살짝 스크롤 ——
    await sleep(600);
    await page.evaluate(function () {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await sleep(700);
    await page.evaluate(function () {
      window.scrollBy({ top: 120, behavior: "smooth" });
    });
    await sleep(900);
    await page.evaluate(function () {
      window.scrollBy({ top: 200, behavior: "smooth" });
    });
    await sleep(1000);
    // Free 카드 쪽 탭
    await tap(page, VW * 0.28, VH * 0.55);
    await sleep(700);

    // —— 4~8s 스크롤 더 깊게 ——
    await page.evaluate(function () {
      window.scrollBy({ top: 380, behavior: "smooth" });
    });
    await sleep(1200);
    await page.evaluate(function () {
      window.scrollBy({ top: 420, behavior: "smooth" });
    });
    await sleep(1300);
    await tap(page, VW * 0.5, VH * 0.45);
    await sleep(800);

    // —— 8~13s 2페이즈 ——
    await forcePhase(page, "p2");
    await sleep(400);
    // 이상현상 강제 몇 개
    await page.evaluate(function () {
      try {
        if (window.__hauntAnomalies && window.__hauntAnomalies.fire) {
          window.__hauntAnomalies.fire("red_flash");
        }
        if (window.__hauntAnomalies && window.__hauntAnomalies.monitorFaces) {
          window.__hauntAnomalies.monitorFaces({ ms: 2800 });
        }
      } catch (e) {}
    });
    await sleep(900);
    await page.evaluate(function () {
      window.scrollBy({ top: 280, behavior: "smooth" });
    });
    await sleep(1100);
    await page.evaluate(function () {
      try {
        if (window.__hauntAnomalies && window.__hauntAnomalies.fire) {
          window.__hauntAnomalies.fire("card_faces");
          window.__hauntAnomalies.fire("screen_shake");
        }
      } catch (e) {}
    });
    await sleep(1400);
    await page.evaluate(function () {
      window.scrollBy({ top: 200, behavior: "smooth" });
    });
    await sleep(1000);

    // —— 13~18s 3페이즈 ——
    await forcePhase(page, "p3");
    await sleep(600);
    await page.evaluate(function () {
      window.scrollTo({ top: 80, behavior: "smooth" });
    });
    await sleep(1000);
    await page.evaluate(function () {
      try {
        if (window.__hauntPhase3Horrors && window.__hauntPhase3Horrors.fire) {
          var list = window.__hauntPhase3Horrors.list || [];
          if (list.length) window.__hauntPhase3Horrors.fire(list[0]);
        }
      } catch (e) {}
    });
    await sleep(1200);
    await page.evaluate(function () {
      window.scrollBy({ top: 350, behavior: "smooth" });
    });
    await sleep(1400);
    await tap(page, VW * 0.5, VH * 0.4);
    await sleep(900);

    // —— 18~22s 클라이맥스 시작만 (2.5초) 후 정지용 여유 ——
    await forcePhase(page, "climax");
    await sleep(2800);
    // 풀 시퀀스 전에 컷 — 검은 화면으로 페이드 연출은 편집에서
    await sleep(400);
  } catch (err) {
    console.error("[shorts-m] error", err);
  }

  await page.close();
  await context.close();
  await browser.close();
  server.close();

  const files = fs.readdirSync(OUT_DIR).filter(function (f) {
    return f.endsWith(".webm");
  });
  if (!files.length) throw new Error("no webm");
  const webm = path.join(OUT_DIR, files[0]);
  console.log("[shorts-m] raw", webm);

  const ffmpeg = execFileSync(
    "python",
    ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
    { encoding: "utf8" }
  ).trim();

  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webm,
      "-vf",
      "scale=1080:1920:flags=lanczos,setsar=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "medium",
      "-crf",
      "17",
      "-r",
      "30",
      "-movflags",
      "+faststart",
      "-an",
      MP4,
    ],
    { stdio: "inherit" }
  );
  console.log(
    "[shorts-m] DONE",
    MP4,
    Math.round(fs.statSync(MP4).size / 1024) + "KB"
  );
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
