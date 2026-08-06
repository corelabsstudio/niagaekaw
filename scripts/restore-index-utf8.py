# -*- coding: utf-8 -*-
"""Restore index.html UTF-8 Korean / punctuation; keep newest structure.

Usage:
  python scripts/restore-index-utf8.py

Strategy:
  1. Base = last commit with intact Hangul (GOOD_SHA)
  2. Transplant HEAD structure that must stay (screensaver #haunt, presence HUD layout, scripts/audio)
  3. Force clean-stage punctuation (· — ✓) and presence labels
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

# Last known-good encoding before screensaver rewrite corrupted UTF-8
GOOD_SHA = "a569829"
PRISTINE_SHA = "24108b2"  # clean punctuation reference
BAD_SHA = "HEAD"


def git_show(sha: str) -> str:
    return subprocess.check_output(
        ["git", "show", f"{sha}:index.html"], cwd=ROOT
    ).decode("utf-8")


def hangul(text: str) -> int:
    return sum(1 for ch in text if "\uac00" <= ch <= "\ud7a3")


def extract_by_id(html: str, eid: str) -> str | None:
    m = re.search(rf"<([a-zA-Z0-9]+)([^>]*\sid=\"{re.escape(eid)}\"[^>]*)>", html)
    if not m:
        return None
    tag = m.group(1)
    start = m.start()
    pos = m.end()
    if m.group(0).endswith("/>"):
        return m.group(0)
    depth = 1
    open_re = re.compile(rf"<{tag}\b")
    close_re = re.compile(rf"</{tag}>")
    while depth and pos < len(html):
        om = open_re.search(html, pos)
        cm = close_re.search(html, pos)
        if not cm:
            return html[start:]
        if om and om.start() < cm.start():
            depth += 1
            pos = om.end()
        else:
            depth -= 1
            pos = cm.end()
    return html[start:pos]


def replace_by_id(target: str, source: str, eid: str) -> str:
    new_el = extract_by_id(source, eid)
    old_el = extract_by_id(target, eid)
    if not new_el or not old_el:
        print(f"  skip #{eid}: new={bool(new_el)} old={bool(old_el)}")
        return target
    return target.replace(old_el, new_el, 1)


def force_presence_korean(text: str) -> str:
    text = re.sub(
        r'<span id="presenceLiveLabel" class="presence-label">[\s\S]*?(?:</span>|/span>)',
        '<span id="presenceLiveLabel" class="presence-label">접속 중</span>',
        text,
        count=1,
    )
    text = re.sub(
        r'<span id="presenceTotalLabel" class="presence-label">[\s\S]*?(?:</span>|/span>)',
        '<span id="presenceTotalLabel" class="presence-label">총 방문자</span>',
        text,
        count=1,
    )
    text = re.sub(
        r'(id="presenceTotalWrap"[^>]*>)[\s\S]*?(?:</span>|/span>)',
        r"\1·</span>",
        text,
        count=1,
    )
    return text


def replace_scripts_and_audio(text: str, bad: str) -> str:
    audio_i = bad.find("<!-- BGM")
    script_i = bad.find('<script src="app.js"></script>')
    body_i = bad.rfind("</body>")
    if script_i < 0 or body_i < 0:
        return text
    start = audio_i if 0 <= audio_i < script_i else script_i
    block = bad[start:body_i]
    text = re.sub(
        r"\s*<!-- BGM[\s\S]*?</audio>\s*(?=<script src=\"app\.js\")",
        "\n  ",
        text,
    )
    m_text = re.search(
        r"(<script src=\"app\.js\"></script>[\s\S]*?)</body>",
        text,
    )
    if not m_text:
        return text
    return text[: m_text.start()] + block + text[m_text.end(1) :]


def apply_work_cache_busts(text: str, work: str) -> str:
    for name in [
        "styles.css",
        "presence.js",
        "anomalies.js",
        "climax-triggers.js",
        "phase3-triggers.js",
        "diary-stories.js",
        "diary.js",
        "phase1-flash.js",
        "climax-sequence.js",
        "haunt-audio.js",
        "watch-taunts.js",
    ]:
        m = re.search(rf'(?:href|src)="{re.escape(name)}(\?v=[^"]*)?"', work)
        if not m:
            continue
        ver = m.group(1) or ""
        attr = "href" if name.endswith(".css") else "src"
        text = re.sub(
            rf'{attr}="{re.escape(name)}(?:\?v=[^"]*)?"',
            f'{attr}="{name}{ver}"',
            text,
            count=1,
        )
    return text


def polish_clean_strings(text: str, pristine: str) -> str:
    text = re.sub(
        r"<title>.*?</title>",
        "<title>Stasis — simple monitoring</title>",
        text,
        count=1,
    )
    text = re.sub(
        r'<meta name="description" content="[^"]*" />',
        '<meta name="description" content="Stasis — elegant single-developer uptime monitoring." />',
        text,
        count=1,
    )
    # feature list from pristine if it has checkmarks
    pris_log = extract_by_id(pristine, "log")
    cur_log = extract_by_id(text, "log")
    if pris_log and cur_log and "✓ Healthcheck" in pris_log:
        text = text.replace(cur_log, pris_log, 1)

    reps = [
        (r"Uptime .{1,4} Alerts .{1,4} Solo", "Uptime · Alerts · Solo"),
        (r"No credit card .{1,4} Cancel anytime", "No credit card · Cancel anytime"),
        (r"Stasis .{1,4} dashboard", "Stasis · dashboard"),
        (
            r"Stasis .{1,4} simple monitoring for solitary dev",
            "Stasis · simple monitoring for solitary dev",
        ),
        (r"No spam .{1,4} just signals", "No spam — just signals"),
        (r'data-mid="Start[^"]*"', 'data-mid="Start…"'),
        (
            r'data-horror="[^"]*DO NOT LOOK AWAY"',
            'data-horror="● REC · DO NOT LOOK AWAY"',
        ),
        (
            r'data-mid="[^"]*System Status:[^"]*[Uu]nstable[^"]*"',
            'data-mid="⚠ System Status: Unstable"',
        ),
        (
            r'data-horror="[^"]*System Status: STILL BREATHING"',
            'data-horror="⚠ System Status: STILL BREATHING"',
        ),
        (r'(class="wb-icon">)[^<]*(</span>)', r"\1⚠\2"),
        (r'(id="diaryLeakLink"[^>]*>)[^<]*(</button>)', r"\1·\2"),
        (r'(class="diary-close"[^>]*>)[^<]*(</button>)', r"\1×\2"),
        (r'(class="find-hint-x"[^>]*>)[^<]*(</button>)', r"\1×\2"),
    ]
    for a, b in reps:
        text = re.sub(a, b, text)

    # status row from pristine
    m = re.search(
        r'<p class="morph muted stasis-status-row"[\s\S]*?</p>',
        pristine,
    )
    if m and "api · secure" in m.group(0):
        text = re.sub(
            r'<p class="morph muted stasis-status-row"[\s\S]*?</p>',
            m.group(0),
            text,
            count=1,
        )

    text = re.sub(
        r'(class="morph monitor-caption"\s+data-clean=")[^"]*(")',
        r"\1실시간 대시보드 미리보기\2",
        text,
        count=1,
    )
    text = re.sub(
        r'(class="morph monitor-caption"[^>]*>)[^<]*(</p>)',
        r"\1실시간 대시보드 미리보기\2",
        text,
        count=1,
    )
    return text


def main() -> None:
    good = git_show(GOOD_SHA)
    pristine = git_show(PRISTINE_SHA)
    bad = git_show(BAD_SHA)
    work = INDEX.read_text(encoding="utf-8") if INDEX.exists() else bad

    print("good hangul", hangul(good), "접속", "접속 중" in good)
    print("bad hangul", hangul(bad), "ssEscBtn", "ssEscBtn" in bad)

    text = good
    if "ssEscBtn" in bad or 'class="haunt ss-act-a"' in bad:
        text = replace_by_id(text, bad, "haunt")
    if extract_by_id(bad, "presenceHud"):
        text = replace_by_id(text, bad, "presenceHud")
    text = replace_scripts_and_audio(text, bad)
    text = polish_clean_strings(text, pristine)
    text = force_presence_korean(text)
    text = apply_work_cache_busts(text, work)

    INDEX.write_text(text, encoding="utf-8", newline="\n")

    print("wrote", INDEX)
    print("hangul", hangul(text))
    for s in [
        "접속 중",
        "총 방문자",
        "Uptime · Alerts · Solo",
        "✓ Healthcheck pings — always on",
        "실시간 대시보드 미리보기",
        "ssEscBtn",
    ]:
        print(("OK " if s in text else "MISS"), s)


if __name__ == "__main__":
    main()
