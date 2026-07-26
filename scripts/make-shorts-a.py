# -*- coding: utf-8 -*-
"""
A버전 쇼츠: 호기심 훅 + 호러 핏빛 깜박 자막 + 사운드
입력: Desktop/niagaekaw-demo.mp4
출력: Desktop/niagaekaw-shorts-A.mp4
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
DESKTOP = Path.home() / "Desktop"
SRC = DESKTOP / "niagaekaw-demo.mp4"
OUT = DESKTOP / "niagaekaw-shorts-A.mp4"
WORK = Path(__file__).resolve().parent.parent / ".demo-shorts"
ROOT = Path(__file__).resolve().parent.parent
AUDIO1 = ROOT / "assets" / "audio" / "Stalled_Rotor.mp3"
AUDIO2 = ROOT / "assets" / "audio" / "Iron_Chest_Cavity.mp3"
FONT_H = ROOT / "assets" / "fonts" / "BlackHanSans-Regular.ttf"
FONT_C = ROOT / "assets" / "fonts" / "NanumGothicCoding-Bold.ttf"
FONT_FALLBACK = Path(r"C:\Windows\Fonts\malgunbd.ttf")

# 새 녹화 타임라인 대략:
# 0~4  클린 탐색 / 4~10 스크롤 / 10~  p2 / ~20 p3 / ~28 climax
CLIPS = [
    (0.3, 3.2, "clean"),  # 평범한 랜딩 + 커서
    (3.5, 4.5, "scroll"),  # 스크롤 이상
    (10.0, 5.0, "p2"),  # 2페이즈
    (18.0, 5.5, "p3"),  # 3페이즈
    (28.0, 7.0, "climax1"),
    (40.0, 5.5, "climax2"),
]


def run(cmd):
    print("+", " ".join(str(c) for c in cmd[:6]), "...")
    subprocess.run(cmd, check=True)


def font_esc(p: Path) -> str:
    return str(p).replace("\\", "/").replace(":", "\\:")


def esc_text(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\u2019")
        .replace("%", "\\%")
    )


def horror_layers(item, fh, fc):
    text = esc_text(item["t"])
    st, en = item["start"], item["end"]
    fs = item["fs"]
    y = item["y"]
    style = item.get("style", "mid")
    blink = item.get("blink", False)

    if blink:
        en_expr = f"between(t\\,{st}\\,{en})*lt(mod(t\\,0.20)\\,0.13)"
    else:
        en_expr = f"between(t\\,{st}\\,{en})"

    if style in ("hook", "punch"):
        fill, glow, border, font, bw = "0xFF2038", "0x8B0000", "black@0.95", fh, 8
    elif style == "warn":
        fill, glow, border, font, bw = "0xFF0028", "0x990010", "black@0.95", fc, 7
    elif style == "cta":
        fill, glow, border, font, bw = "0xFF3355", "0x660010", "black@0.9", fh, 7
    elif style == "cta_sub":
        fill, glow, border, font, bw = "0xFFD0D6", "0x400010", "black@0.85", fc, 5
    else:
        fill, glow, border, font, bw = "0xFF4A5C", "0x5A0010", "black@0.9", fh, 6

    layers = [
        # shadow
        f"drawtext=fontfile='{font}':text='{text}':fontcolor=black@0.8:"
        f"fontsize={fs}:x=(w-text_w)/2+5:y={y}+7:enable='{en_expr}'",
        # glow
        f"drawtext=fontfile='{font}':text='{text}':fontcolor={glow}:"
        f"borderw={bw + 5}:bordercolor={glow}@0.5:"
        f"fontsize={fs}:x=(w-text_w)/2:y={y}:enable='{en_expr}'",
        # main blood red
        f"drawtext=fontfile='{font}':text='{text}':fontcolor={fill}:"
        f"borderw={bw}:bordercolor={border}:"
        f"fontsize={fs}:x=(w-text_w)/2:y={y}:enable='{en_expr}'",
    ]
    if style in ("hook", "punch", "warn"):
        layers.append(
            f"drawtext=fontfile='{font}':text='{text}':fontcolor=white@0.28:"
            f"fontsize={max(14, fs - 2)}:x=(w-text_w)/2:y={y}-2:enable='{en_expr}'"
        )
    return layers


def main():
    if not SRC.exists():
        print("Missing:", SRC)
        print("Run: node scripts/record-demo.js first")
        sys.exit(1)

    WORK.mkdir(parents=True, exist_ok=True)
    fh = font_esc(FONT_H if FONT_H.exists() else FONT_FALLBACK)
    fc = font_esc(FONT_C if FONT_C.exists() else FONT_FALLBACK)

    segs = []
    for i, (start, dur, name) in enumerate(CLIPS):
        out = WORK / f"seg_{i:02d}_{name}.mp4"
        x = 437
        if name.startswith("climax"):
            x = 390
        elif name in ("p2", "p3", "scroll"):
            x = 410
        run(
            [
                FFMPEG,
                "-y",
                "-ss",
                str(start),
                "-t",
                str(dur),
                "-i",
                str(SRC),
                "-vf",
                f"crop=405:720:{x}:0,scale=1080:1920:flags=lanczos,setsar=1",
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "18",
                "-pix_fmt",
                "yuv420p",
                str(out),
            ]
        )
        segs.append(out)

    lst = WORK / "list.txt"
    with open(lst, "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"file '{s.as_posix()}'\n")

    concat_raw = WORK / "concat_raw.mp4"
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
            str(concat_raw),
        ]
    )

    total = sum(c[1] for c in CLIPS)
    # 사용자 제안 문구 (타임라인에 맞게 배치)
    texts = [
        # 초반 0~3초대 (clean 구간)
        {
            "t": "평범한 개인 개발자용",
            "start": 0.15,
            "end": 1.6,
            "fs": 58,
            "y": "h*0.14",
            "style": "mid",
            "blink": False,
        },
        {
            "t": "모니터링 툴인 줄 알았음",
            "start": 0.15,
            "end": 1.6,
            "fs": 58,
            "y": "h*0.20",
            "style": "mid",
            "blink": False,
        },
        {
            "t": "근데 UI가 살짝 이상한데…",
            "start": 1.65,
            "end": 3.15,
            "fs": 56,
            "y": "h*0.16",
            "style": "hook",
            "blink": True,
        },
        # 중반 스크롤
        {
            "t": "잠깐, 문구 왜 이래?",
            "start": 3.3,
            "end": 5.5,
            "fs": 64,
            "y": "h*0.14",
            "style": "warn",
            "blink": True,
        },
        {
            "t": "‘주인이 잊은 프로세스’?",
            "start": 5.5,
            "end": 7.8,
            "fs": 58,
            "y": "h*0.15",
            "style": "punch",
            "blink": True,
        },
        {
            "t": "스크롤 내릴수록",
            "start": 8.0,
            "end": 10.5,
            "fs": 62,
            "y": "h*0.14",
            "style": "mid",
            "blink": False,
        },
        {
            "t": "분위기 완전 바뀜…",
            "start": 8.0,
            "end": 10.5,
            "fs": 62,
            "y": "h*0.21",
            "style": "mid",
            "blink": False,
        },
        # 후반 공포
        {
            "t": "아니, 나를 실시간으로",
            "start": 12.5,
            "end": 16.5,
            "fs": 64,
            "y": "h*0.14",
            "style": "punch",
            "blink": True,
        },
        {
            "t": "지켜보고 있다고?",
            "start": 12.5,
            "end": 16.5,
            "fs": 68,
            "y": "h*0.21",
            "style": "punch",
            "blink": True,
        },
        {
            "t": "소름 돋아서",
            "start": 17.0,
            "end": 22.0,
            "fs": 70,
            "y": "h*0.14",
            "style": "hook",
            "blink": True,
        },
        {
            "t": "마우스도 못 움직이겠네…",
            "start": 17.0,
            "end": 22.0,
            "fs": 58,
            "y": "h*0.21",
            "style": "hook",
            "blink": True,
        },
        # CTA
        {
            "t": "WAKE AGAIN",
            "start": total - 4.2,
            "end": total - 0.05,
            "fs": 68,
            "y": "h*0.70",
            "style": "cta",
            "blink": True,
        },
        {
            "t": "niagaekaw.site",
            "start": total - 4.2,
            "end": total - 0.05,
            "fs": 46,
            "y": "h*0.80",
            "style": "cta_sub",
            "blink": False,
        },
    ]

    draws = []
    for t in texts:
        draws.extend(horror_layers(t, fh, fc))

    vf = "eq=contrast=1.12:brightness=-0.04:saturation=1.15," + ",".join(draws)
    with_text = WORK / "with_text.mp4"
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(concat_raw),
            "-vf",
            vf,
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            str(with_text),
        ]
    )

    filter_audio = (
        f"[1:a]volume=0.30,afade=t=in:st=0:d=0.5[a1];"
        f"[2:a]volume=0.58,afade=t=in:st=0:d=0.35[a2pre];"
        f"[a2pre]adelay=5000|5000[a2];"
        f"anoisesrc=color=brown:duration={total}:sample_rate=44100:amplitude=0.4[n0];"
        f"[n0]lowpass=f=85,volume=0.42,tremolo=f=1.35:d=0.72[hb];"
        f"[a1][a2][hb]amix=inputs=3:duration=first:normalize=0,"
        f"volume=1.3,alimiter=limit=0.93,afade=t=out:st={max(0, total - 1.1)}:d=1.0[aout]"
    )

    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(with_text),
            "-stream_loop",
            "-1",
            "-i",
            str(AUDIO1),
            "-stream_loop",
            "-1",
            "-i",
            str(AUDIO2),
            "-filter_complex",
            filter_audio,
            "-map",
            "0:v",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(OUT),
        ]
    )

    print(f"\nDONE → {OUT} ({OUT.stat().st_size // 1024} KB), ~{total:.1f}s")


if __name__ == "__main__":
    main()
