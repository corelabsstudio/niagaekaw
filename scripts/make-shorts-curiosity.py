# -*- coding: utf-8 -*-
"""
모바일 쇼츠 — 전문가 톤 호기심/클리프행어 편집

입력:  Desktop/niagaekaw-shorts-mobile-raw.mp4  (없으면 demo 폴백)
출력:  Desktop/niagaekaw-shorts-curiosity.mp4   (1080x1920, ~16s)

연출:
  훅 → 의심 → 공포 상승 → 점프 직전 블랙 → CTA
  자막 단계: 흰 담백 → 코딩 글리치 → 핏빛 깜박
  사운드: 저음 드론 + 심박 느낌 노이즈 (사이트 BGM 소스 활용, 볼륨 절제)
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
DESKTOP = Path.home() / "Desktop"
ROOT = Path(__file__).resolve().parent.parent
SRC_MOBILE = DESKTOP / "niagaekaw-shorts-mobile-raw.mp4"
SRC_FALLBACK = DESKTOP / "niagaekaw-demo.mp4"
OUT = DESKTOP / "niagaekaw-shorts-curiosity.mp4"
WORK = ROOT / ".demo-shorts-curiosity"
AUDIO1 = ROOT / "assets" / "audio" / "Stalled_Rotor.mp3"
AUDIO2 = ROOT / "assets" / "audio" / "Iron_Chest_Cavity.mp3"
FONT_CLEAN = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")
FONT_CODE = ROOT / "assets" / "fonts" / "NanumGothicCoding-Bold.ttf"
FONT_HORROR = ROOT / "assets" / "fonts" / "BlackHanSans-Regular.ttf"
FONT_FALLBACK = Path(r"C:\Windows\Fonts\malgunbd.ttf")

# 원본(모바일 녹화 ~22s) 기준 클립 — 세로 이미 1080x1920
# (start, dur, name)
CLIPS = [
    (0.4, 3.2, "hook"),  # 클린
    (4.2, 3.4, "doubt"),  # 스크롤 위화감
    (8.3, 4.0, "fear"),  # 2페이즈
    (13.5, 3.6, "deep"),  # 3페이즈
    (18.2, 2.2, "scare"),  # 클라이맥스 시작만
]
BLACK_DUR = 1.15
CTA_HOLD = 1.35  # 블랙 위 CTA 유지(블랙 구간에 포함)


def run(cmd, check=True):
    print("+", " ".join(str(c) for c in cmd[:8]), "...")
    return subprocess.run(cmd, check=check)


def fesc(p: Path) -> str:
    p = p if p.exists() else FONT_FALLBACK
    return str(p).replace("\\", "/").replace(":", "\\:")


def tesc(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\u2019")
        .replace("%", "\\%")
    )


def draw(font, text, fs, y, color, borderw, border, enable, xoff=0, yoff=0):
    xo = f"(w-text_w)/2+{xoff}" if xoff else "(w-text_w)/2"
    yo = f"{y}+{yoff}" if yoff else str(y)
    return (
        f"drawtext=fontfile='{font}':text='{tesc(text)}':fontcolor={color}:"
        f"borderw={borderw}:bordercolor={border}:fontsize={fs}:"
        f"x={xo}:y={yo}:enable='{enable}'"
    )


def main():
    src = SRC_MOBILE if SRC_MOBILE.exists() else SRC_FALLBACK
    if not src.exists():
        print("Missing source video. Run record-shorts-mobile.js first.")
        sys.exit(1)

    is_mobile_src = src == SRC_MOBILE
    WORK.mkdir(parents=True, exist_ok=True)

    fc = fesc(FONT_CLEAN if FONT_CLEAN.exists() else FONT_BOLD)
    fb = fesc(FONT_BOLD)
    fcode = fesc(FONT_CODE)
    fhor = fesc(FONT_HORROR)

    segs = []
    for i, (start, dur, name) in enumerate(CLIPS):
        out = WORK / f"seg_{i}_{name}.mp4"
        if is_mobile_src:
            # already vertical
            if name == "hook":
                vf = "scale=1080:1920:flags=lanczos,setsar=1,eq=contrast=1.03:saturation=1.02"
            elif name == "doubt":
                vf = (
                    "scale=1080:1920:flags=lanczos,setsar=1,"
                    "eq=contrast=1.08:brightness=-0.02:saturation=0.95,"
                    "noise=alls=5:allf=t+u"
                )
            elif name == "fear":
                vf = (
                    "scale=1080:1920:flags=lanczos,setsar=1,"
                    "eq=contrast=1.15:brightness=-0.05:saturation=1.15:gamma_r=1.12:gamma_g=0.94:gamma_b=0.94,"
                    "noise=alls=9:allf=t+u"
                )
            elif name == "deep":
                vf = (
                    "scale=1080:1920:flags=lanczos,setsar=1,"
                    "eq=contrast=1.22:brightness=-0.08:saturation=1.28:gamma_r=1.18:gamma_g=0.88:gamma_b=0.9,"
                    "noise=alls=14:allf=t+u,hue=s=1.12"
                )
            else:  # scare
                vf = (
                    "scale=1080:1920:flags=lanczos,setsar=1,"
                    "eq=contrast=1.35:brightness=-0.1:saturation=1.4:gamma_r=1.25:gamma_g=0.85:gamma_b=0.85,"
                    "noise=alls=18:allf=t+u,"
                    "hue=h=5:s=1.2"
                )
        else:
            # desktop 16:9 crop center→vertical
            x = 420 if name == "hook" else 400 if name == "doubt" else 380
            vf = (
                f"crop=405:720:{x}:0,scale=1080:1920:flags=lanczos,setsar=1,"
                f"eq=contrast=1.1:brightness=-0.04:saturation=1.1"
            )

        run(
            [
                FFMPEG,
                "-y",
                "-ss",
                str(start),
                "-t",
                str(dur),
                "-i",
                str(src),
                "-vf",
                vf,
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "17",
                "-r",
                "30",
                "-pix_fmt",
                "yuv420p",
                str(out),
            ]
        )
        segs.append(out)

    # 블랙 + 미세 레드 비네트 느낌은 drawtext 단계에서 처리
    black = WORK / "black.mp4"
    run(
        [
            FFMPEG,
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0x050208:s=1080x1920:d={BLACK_DUR}:r=30",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-t",
            str(BLACK_DUR),
            str(black),
        ]
    )
    segs.append(black)

    lst = WORK / "list.txt"
    with open(lst, "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"file '{s.as_posix()}'\n")

    concat = WORK / "concat.mp4"
    run(
        [
            FFMPEG,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(lst),
            "-c",
            "copy",
            str(concat),
        ]
    )

    # 타임라인 누적
    # hook 3.2, doubt 3.4, fear 4.0, deep 3.6, scare 2.2, black 1.15
    # 0-3.2 | 3.2-6.6 | 6.6-10.6 | 10.6-14.2 | 14.2-16.4 | 16.4-17.55
    t0 = 0.0
    t_hook1 = 3.2
    t_doubt0, t_doubt1 = 3.25, 6.55
    t_fear0, t_fear1 = 6.65, 10.55
    t_deep0, t_deep1 = 10.65, 14.15
    t_scare0, t_scare1 = 14.25, 16.35
    t_black0 = 16.4
    total = sum(c[1] for c in CLIPS) + BLACK_DUR

    draws = []

    # 상단 작은 워터마크 느낌 (초반만, 담백)
    en = f"between(t\\,0.15\\,2.8)"
    draws.append(
        draw(fc, "실제 웹사이트 녹화", 28, "h*0.08", "white@0.55", 1, "black@0.4", en)
    )

    # —— 훅: 담백 흰색 ——
    en = f"between(t\\,0.35\\,2.0)"
    draws.append(
        draw(fb, "이 사이트… 모니터링 툴인 줄", 44, "h*0.78", "white@0.95", 3, "black@0.7", en)
    )
    en = f"between(t\\,2.0\\,3.15)"
    draws.append(
        draw(fb, "알았음", 52, "h*0.78", "white@0.95", 3, "black@0.75", en)
    )

    # —— 의심: 코딩 폰트 + 글리치 이중 ——
    en = f"between(t\\,{t_doubt0}\\,{t_doubt0 + 1.6})"
    draws.append(
        draw(fcode, "근데 UI 문구가 이상한데?", 46, "h*0.76", "0xFF8098@0.45", 3, "black@0.6", en, xoff=4, yoff=-2)
    )
    draws.append(
        draw(fcode, "근데 UI 문구가 이상한데?", 46, "h*0.76", "0xF0F0F0", 4, "black@0.85", en)
    )
    en = f"between(t\\,{t_doubt0 + 1.55}\\,{t_doubt1})"
    draws.append(
        draw(fcode, "‘주인이 잊은 프로세스’…?", 44, "h*0.76", "0xFFAABB@0.5", 3, "black@0.65", en, xoff=-3, yoff=2)
    )
    draws.append(
        draw(fcode, "‘주인이 잊은 프로세스’…?", 44, "h*0.76", "0xFFE8EC", 4, "black@0.88", en)
    )

    # —— 공포: 핏빛 ——
    en_b = f"between(t\\,{t_fear0}\\,{t_fear0 + 2.0})*lt(mod(t\\,0.22)\\,0.14)"
    draws.append(draw(fhor, "스크롤 내릴수록", 54, "h*0.72", "0x8B0010", 10, "black@0.9", en_b, yoff=3))
    draws.append(draw(fhor, "스크롤 내릴수록", 54, "h*0.72", "0xFF2038", 7, "black@0.95", en_b))
    en = f"between(t\\,{t_fear0 + 2.0}\\,{t_fear1})"
    draws.append(draw(fhor, "화면이 나를 보기 시작함", 48, "h*0.74", "0xFF3048", 7, "black@0.95", en))

    # —— 심화 ——
    en_b = f"between(t\\,{t_deep0}\\,{t_deep0 + 1.8})*lt(mod(t\\,0.18)\\,0.12)"
    draws.append(draw(fhor, "잠깐, 실시간으로", 52, "h*0.70", "0xFF1A30", 8, "black@0.95", en_b))
    en = f"between(t\\,{t_deep0 + 1.7}\\,{t_deep1})"
    draws.append(draw(fhor, "감시당하는 느낌인데…", 48, "h*0.74", "0xFF4058", 7, "black@0.95", en))

    # —— scare: 한 줄 강펀치 ——
    en_b = f"between(t\\,{t_scare0}\\,{t_scare1})*lt(mod(t\\,0.14)\\,0.10)"
    draws.append(draw(fhor, "도망치면", 64, "h*0.68", "0xFF0020", 10, "black@0.95", en_b))
    draws.append(draw(fhor, "더 쫓아옴", 64, "h*0.76", "0xFF1030", 10, "black@0.95", en_b))

    # —— 블랙 CTA ——
    en = f"between(t\\,{t_black0 + 0.12}\\,{total - 0.08})"
    draws.append(draw(fhor, "niagaekaw.site", 58, "h*0.48", "0xFF2040", 8, "black@0.95", en))
    draws.append(
        draw(fc, "직접 들어가 봐. 끝까지.", 36, "h*0.58", "0xFFD0D6@0.92", 3, "black@0.8", en)
    )
    draws.append(
        draw(fc, "링크는 설명란에", 30, "h*0.66", "white@0.55", 2, "black@0.6", en)
    )

    # 비네트 + 미세 플릭커 (후반)
    vf_grade = (
        "eq=contrast=1.04:saturation=1.05,"
        # soft vignette via vignette filter
        "vignette=PI/5"
    )
    vf = vf_grade + "," + ",".join(draws)

    # 오디오: 초반 조용한 드론 → 후반 체스트 캐비티, 마지막 컷
    # concat 영상 길이 total
    voiced = WORK / "with_audio.mp4"
    # build audio mix with ffmpeg amix
    # a1 from 0, a2 from fear start approx 6.6s
    # generate silent base + overlay

    if AUDIO1.exists() and AUDIO2.exists():
        # filter: sidechain-ish simple volumes
        # [1] stalled low from 0
        # [2] iron from 6.5 louder then hard cut before black end
        af = (
            f"[1:a]volume=0.22,afade=t=in:st=0:d=0.8,afade=t=out:st={t_scare1 - 0.4}:d=0.5[a1];"
            f"[2:a]volume=0.0,afade=t=in:st=0:d=0.01[a2mute];"  # placeholder path unused
        )
        # simpler: use atrim/adelay
        # stalled whole, iron starts at 6.6
        af = (
            f"[1:a]volume=0.20,afade=t=in:st=0:d=1.0,afade=t=out:st={t_deep0}:d=1.2[a1];"
            f"[2:a]volume=0.32,afade=t=in:st=0:d=0.6,afade=t=out:st={t_scare1 - t_fear0 + 0.2}:d=0.4,"
            f"adelay={int(t_fear0 * 1000)}|{int(t_fear0 * 1000)}[a2];"
            f"[a1][a2]amix=inputs=2:duration=first:dropout_transition=0.5,"
            f"afade=t=out:st={t_black0 - 0.15}:d=0.35,"
            f"atrim=0:{total},apad=whole_dur={total}[aout]"
        )
        run(
            [
                FFMPEG,
                "-y",
                "-i",
                str(concat),
                "-i",
                str(AUDIO1),
                "-i",
                str(AUDIO2),
                "-filter_complex",
                f"[0:v]{vf}[vout];{af}",
                "-map",
                "[vout]",
                "-map",
                "[aout]",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "17",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-shortest",
                "-movflags",
                "+faststart",
                "-t",
                str(total),
                str(voiced),
            ]
        )
        final_src = voiced
    else:
        # video only with text
        run(
            [
                FFMPEG,
                "-y",
                "-i",
                str(concat),
                "-vf",
                vf,
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "17",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                "-t",
                str(total),
                str(voiced),
            ]
        )
        final_src = voiced

    # final copy to desktop
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(final_src),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(OUT),
        ]
    )

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"\nDONE {OUT}")
    print(f"duration ~{total:.1f}s · {size_mb:.1f} MB · 1080x1920")
    print("Captions: curiosity hook → glitch doubt → blood fear → cliff CTA niagaekaw.site")


if __name__ == "__main__":
    main()
