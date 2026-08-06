# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

"cursed-haunt" — 겉보기엔 평범한 SaaS 랜딩 페이지("Stasis — simple monitoring")로 위장한 한국어 호러 ARG. 순수 정적 HTML/CSS/JS(프레임워크·번들러 없음). 사용자가 숨겨진 "다이어리"를 찾으면(21가지 발견 경로 중 1) 페이즈가 진행되며 점점 이상 현상(피, 글리치, 감시자)이 드러나고, 최종적으로 `signal.html`(`wakeagain...` / `no signal...` 텍스트만 있는 검은 터미널 화면)로 끝난다.

**중요:** `GABIA_DNS.md`에 따르면 이 저장소의 원본 소스는 `WakeAgain/experiments/cursed-haunt`에 있으며, 배포/`git push`를 위해 `projects/niagaekaw-site`로 복사된 것이다. 라이브 저장소는 `github.com/corelabsstudio/niagaekaw`.

## 명령어

```bash
python -m http.server 4173     # 로컬 서빙 (또는 open-local.bat 이 위 명령 실행 + 브라우저 오픈)
```

- `npm test`는 스텁("no test specified")이며 실제 QA는 없음.
- 실질 QA는 Playwright 기반 Node 스크립트 (`playwright` 가 유일한 npm 의존성):
  - `BASE=http://127.0.0.1:4195 node scripts/qa-loop.js` — 에셋/DOM/트리거 체크
  - `node scripts/full-site-audit.js`, `node scripts/test-all-triggers.js`, `python scripts/audit-live-and-copy.py`
- lint 설정 없음, CI(`.github/workflows`) 없음.
- 데모 영상 제작용: `scripts/record-demo.js`, `scripts/make-shorts-a.py` (출력은 `.demo-record/`/`.demo-shorts/`, gitignore 대상).

## 아키텍처

- `index.html` — 진입점. 가짜 브라우저 크롬 UI + 이펙트용 `fx-layer` div 레이어(피/스태틱/스캔라인/비네트).
- 기능 로직은 관심사별로 평평하게 분리된 최상위 JS 파일들:
  `address-bar.js`, `app.js`(디바이스 프로필/디스패치), `anomalies.js`, `climax-sequence.js`, `climax-triggers.js`, `corruption-progress.js`, `diary.js`/`diary-stories.js`, `dread-ambient.js`, `ending.js`, `haunt-audio.js`, `phase1-flash.js`, `phase3-horrors.js`, `phase3-triggers.js`, `presence.js`, `watch-taunts.js`.
- `signal.html` — 독립된 "no signal" 엔딩 페이지.
- `assets/` — 오디오, 다이어리 사진, 얼굴 이미지, 폰트, 호러 이미지.
- `body.json`/`body-clear.json` — GitHub Pages API 페이로드(`{"cname":"niagaekaw.site", "source":{"branch":"main","path":"/"}}`).
- 배포: 정적 GitHub Pages, `CNAME`(`niagaekaw.site`) + `.nojekyll`. DNS는 Gabia(한국 도메인 등록업체) 경유 — A레코드를 GitHub Pages IP(185.199.108~111.153)로, 선택적으로 `www` CNAME을 `corelabsstudio.github.io.`로 설정 (`GABIA_DNS.md` 참고).

## 컨벤션

- 디버그 진입점은 쿼리 파라미터(`?diary=1`, `?summon=1`, `?debug=1` 등)와 콘솔 훅(`window.__hauntStage()`, `__hauntClimax`, `__hauntAnomalies`, `__hauntDiaryStories`), 단축키(Shift+Alt+3)로 노출됨 — 제작자용, `README.md`에 문서화.
- 유일한 외부 네트워크 의존성은 Google Fonts(IBM Plex Mono/Sans, Instrument Serif, Syne) — 애널리틱스·폼·백엔드 API 없음.
- `index.html`은 강한 no-cache 메타 태그 + `styles.css` 캐시버스팅 쿼리 + 인라인 빌드 타임스탬프 주석을 사용 — 배포마다 수동 캐시 무효화 필요.
- 전체 UI 텍스트/주석은 한국어.
