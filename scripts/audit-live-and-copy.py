# -*- coding: utf-8 -*-
"""Live site + Korean copy audit for niagaekaw."""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIVE = "https://niagaekaw.site"
REPORT = Path.home() / "Desktop" / "niagaekaw-live-copy-audit.json"

# Expected user-facing Korean phrases (must appear somewhere in live HTML or JS modules)
EXPECTED_PHRASES = [
    "접속 중",
    "총 방문자",
    "이 페이지에 머물고 있는 영혼",
    "소멸을 앞 둔 영혼",
    "한 층 더 내려왔다",
    "로컬 드래프트",
    "배포 금지",
    "클라이맥스 조건",
    "3페이즈",
    "2페이즈",
    "일기",
    "길게 누르",
    "네 번",
    "다섯 번",
    "방문자",
]

# JS modules that should carry mission/diary Korean
JS_MODULES = [
    "presence.js",
    "climax-triggers.js",
    "phase3-triggers.js",
    "diary-stories.js",
    "diary.js",
    "ending.js",
    "climax-sequence.js",
]


def fetch(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "niagaekaw-audit/1.0",
            "Cache-Control": "no-cache",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read()
    except Exception as e:
        return -1, str(e).encode("utf-8", errors="replace")


def hangul_count(s: str) -> int:
    return sum(1 for ch in s if "\uac00" <= ch <= "\ud7a3")


def find_broken_tokens(s: str) -> list[str]:
    """Heuristic: common mojibake / replacement patterns in Korean UI."""
    patterns = [
        r"\uFFFD+",
        r"\?{2,}",
        r"Ã.|Â.|ï¿½",
        r"\?[\uac00-\ud7a3]",  # ? mixed into hangul
        r"[\uac00-\ud7a3]\?",
    ]
    hits = []
    for p in patterns:
        for m in re.finditer(p, s):
            start = max(0, m.start() - 12)
            end = min(len(s), m.end() + 12)
            snippet = s[start:end].replace("\n", " ")
            hits.append(snippet)
            if len(hits) >= 40:
                return hits
    return hits


def main() -> int:
    report: dict = {
        "live": LIVE,
        "html": {},
        "assets": [],
        "phrases": [],
        "js_modules": [],
        "local_vs_live": {},
        "issues": [],
    }

    # --- live HTML ---
    status, body = fetch(LIVE + "/?nocache=1")
    report["html"]["status"] = status
    if status != 200:
        report["issues"].append({"sev": "critical", "msg": f"live HTML status {status}"})
        Path(REPORT).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 1

    # detect charset
    try:
        html = body.decode("utf-8")
        report["html"]["decode"] = "utf-8"
    except UnicodeDecodeError:
        html = body.decode("utf-8", errors="replace")
        report["html"]["decode"] = "utf-8-replace"
        report["issues"].append({"sev": "high", "msg": "live HTML is not clean UTF-8"})

    report["html"]["bytes"] = len(body)
    report["html"]["hangul"] = hangul_count(html)
    report["html"]["has_audit1"] = "audit1" in html
    report["html"]["has_presence"] = "presenceHud" in html and "presence.js" in html
    report["html"]["title"] = re.search(r"<title>([^<]+)</title>", html)
    report["html"]["title"] = report["html"]["title"].group(1) if report["html"]["title"] else None

    # sample labels
    for lab in ("presenceLiveLabel", "presenceTotalLabel", "p3DepthMsg"):
        m = re.search(rf'id="{lab}"[^>]*>([^<]*)<', html)
        report["html"][lab] = m.group(1).strip() if m else None

    broken = find_broken_tokens(html)
    report["html"]["broken_snippets"] = broken[:25]
    if report["html"]["hangul"] < 200:
        report["issues"].append(
            {"sev": "critical", "msg": f"live HTML hangul too low: {report['html']['hangul']}"}
        )
    if broken and report["html"]["hangul"] < 500:
        report["issues"].append(
            {"sev": "high", "msg": "possible remaining mojibake in live HTML", "n": len(broken)}
        )

    # --- key assets ---
    asset_paths = [
        "presence.js?v=audit1",
        "climax-triggers.js?v=audit1",
        "phase3-triggers.js?v=audit1",
        "anomalies.js?v=audit1",
        "styles.css?v=audit1",
        "diary-stories.js",
        "assets/faces/face-1.jpg",
        "assets/audio/Iron_Chest_Cavity.mp3",
        "assets/p3-ref-atmosphere-only.png",
    ]
    for p in asset_paths:
        st, data = fetch(f"{LIVE}/{p}")
        ok = 200 <= st < 400
        item = {"path": p, "status": st, "ok": ok, "bytes": len(data) if ok else 0}
        if p.endswith(".js") and ok:
            try:
                t = data.decode("utf-8")
                item["hangul"] = hangul_count(t)
                item["utf8_ok"] = True
            except UnicodeDecodeError:
                item["utf8_ok"] = False
                item["hangul"] = -1
                report["issues"].append({"sev": "high", "msg": f"{p} not valid UTF-8"})
        report["assets"].append(item)
        if not ok:
            report["issues"].append({"sev": "high", "msg": f"asset fail {p} status {st}"})

    # --- expected phrases across live HTML + key JS ---
    corpus = html
    for mod in JS_MODULES:
        st, data = fetch(f"{LIVE}/{mod}")
        entry = {"module": mod, "status": st, "ok": 200 <= st < 400}
        if entry["ok"]:
            try:
                t = data.decode("utf-8")
                entry["hangul"] = hangul_count(t)
                corpus += "\n" + t
                # sample mission-like lines
                samples = re.findall(r'["\']([^"\']*[\uac00-\ud7a3]{2,}[^"\']{0,40})["\']', t)
                entry["ko_string_samples"] = samples[:8]
            except UnicodeDecodeError:
                entry["hangul"] = -1
        report["js_modules"].append(entry)

    for phrase in EXPECTED_PHRASES:
        found = phrase in corpus
        report["phrases"].append({"phrase": phrase, "ok": found})
        if not found:
            report["issues"].append({"sev": "medium", "msg": f"missing phrase: {phrase}"})

    # --- local vs live index hangul ---
    local = (ROOT / "index.html").read_text(encoding="utf-8")
    report["local_vs_live"] = {
        "local_hangul": hangul_count(local),
        "live_hangul": report["html"]["hangul"],
        "local_has_접속": "접속 중" in local,
        "live_has_접속": "접속 중" in html,
        "local_has_총": "총 방문자" in local,
        "live_has_총": "총 방문자" in html,
        "delta_hangul": hangul_count(local) - report["html"]["hangul"],
    }
    if report["local_vs_live"]["live_has_접속"] is False:
        report["issues"].append({"sev": "critical", "msg": "live missing 접속 중"})
    if report["local_vs_live"]["live_has_총"] is False:
        report["issues"].append({"sev": "critical", "msg": "live missing 총 방문자"})

    # diary story titles from live diary-stories.js
    st, ds = fetch(f"{LIVE}/diary-stories.js")
    if 200 <= st < 400:
        t = ds.decode("utf-8", errors="replace")
        titles = re.findall(r'title:\s*"([^"]+)"', t)
        report["diary_titles"] = titles
        report["diary_title_count"] = len(titles)
        broken_titles = [x for x in titles if "\ufffd" in x or "??" in x]
        if broken_titles:
            report["issues"].append(
                {
                    "sev": "high",
                    "msg": "broken diary titles",
                    "samples": broken_titles[:10],
                }
            )
        # hangul in titles
        weak = [x for x in titles if hangul_count(x) < 2]
        if weak:
            report["issues"].append(
                {"sev": "medium", "msg": "diary titles with little hangul", "samples": weak[:10]}
            )

    # mission strings from climax / phase3
    for mod, key in (
        ("climax-triggers.js", "MISSION"),
        ("phase3-triggers.js", "MISSION"),
    ):
        st, data = fetch(f"{LIVE}/{mod}")
        if not (200 <= st < 400):
            continue
        t = data.decode("utf-8", errors="replace")
        # crude extract object mission values
        missions = re.findall(r'^\s*[a-z_]+:\s*"([^"]+)"', t, flags=re.M)
        # filter hangul-heavy
        ko = [m for m in missions if hangul_count(m) >= 4]
        report.setdefault("missions", {})[mod] = {
            "count": len(ko),
            "samples": ko[:6],
            "broken": [m for m in ko if "\ufffd" in m or re.search(r"\?{2,}", m)][:8],
        }
        if report["missions"][mod]["broken"]:
            report["issues"].append(
                {
                    "sev": "high",
                    "msg": f"broken missions in {mod}",
                    "samples": report["missions"][mod]["broken"],
                }
            )

    # summary counts
    report["summary"] = {
        "issues": len(report["issues"]),
        "critical": sum(1 for i in report["issues"] if i.get("sev") == "critical"),
        "high": sum(1 for i in report["issues"] if i.get("sev") == "high"),
        "medium": sum(1 for i in report["issues"] if i.get("sev") == "medium"),
        "phrases_ok": sum(1 for p in report["phrases"] if p["ok"]),
        "phrases_total": len(report["phrases"]),
        "assets_ok": sum(1 for a in report["assets"] if a["ok"]),
        "assets_total": len(report["assets"]),
    }

    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nWrote {REPORT}", file=sys.stderr)
    return 0 if report["summary"]["critical"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
