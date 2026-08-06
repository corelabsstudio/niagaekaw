# -*- coding: utf-8 -*-
"""
쇼츠 클리프행어 버전 (0~11초 컷오프)
- 클린 SaaS → 위화감 → 공포 직전 블랙아웃
- BGM 없음: 스크롤/타자/글리치 노이즈만
- 자막 스타일 단계적 변화 (평범 → 글리치 → 핏빛 호러)
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
DESKTOP = Path.home() / "Desktop"
SRC = DESKTOP / "niagaekaw-demo.mp4"
OUT = DESKTOP / "niagaekaw-shorts-cliff.mp4"
WORK = Path(__file__).resolve().parent.parent / ".demo-shorts-cliff"
ROOT = Path(__file__).resolve().parent.parent
FONT_CLEAN = Path(r"C:\Windows\Fonts\malgun.ttf")  # 평범 산세리프
FONT_CODE = ROOT / "assets" / "fonts" / "NanumGothicCoding-Bold.ttf"
FONT_HORROR = ROOT / "assets" / "fonts" / "BlackHanSans-Regular.ttf"
FONT_FALLBACK = Path(r"C:\Windows\Fonts\malgunbd.ttf")

# 원본에서 뽑을 구간 (녹화 타임라인 기준)
# 0~: 클린 탐색, 3.5~: 스크롤, 10~: p2, 18~: p3 — 클라이맥스 직전만
CLIPS = [
    (0.2, 3.0, "intro"),  # 평범 랜딩
    (3.6, 3.8, "doubt"),  # 스크롤 이상
    (10.5, 3.5, "rise"),  # 2페이즈 진입 분위기 (클라이맥스 X)
]

# 최종 영상 길이 ≈ 3+3.8+3.5 = 10.3 + black 0.9 ≈ 11.2s
BLACK_DUR = 0.95


def run(cmd, check=True):
    print("+", " ".join(str(c) for c in cmd[:7]), "...")
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


def draw_line(font, text, fs, y, color, borderw, border, enable, xoff=0, yoff=0):
    xo = f"(w-text_w)/2+{xoff}" if xoff else "(w-text_w)/2"
    yo = f"{y}+{yoff}" if yoff else y
    return (
        f"drawtext=fontfile='{font}':text='{tesc(text)}':fontcolor={color}:"
        f"borderw={borderw}:bordercolor={border}:fontsize={fs}:"
        f"x={xo}:y={yo}:enable='{enable}'"
    )


def main():
    if not SRC.exists():
        print("Missing source:", SRC)
        sys.exit(1)
    WORK.mkdir(parents=True, exist_ok=True)

    fc = fesc(FONT_CLEAN)
    fcode = fesc(FONT_CODE)
    fhor = fesc(FONT_HORROR)

    segs = []
    for i, (start, dur, name) in enumerate(CLIPS):
        out = WORK / f"seg_{i}_{name}.mp4"
        # 세로 크롭 — 초반 중앙, 후반 살짝 붉은 쪽
        x = 430 if name == "intro" else 400 if name == "doubt" else 380
        # 후반 rise: 대비/채도 올려 붉은 붕괴 느낌
        if name == "intro":
            vf = f"crop=405:720:{x}:0,scale=1080:1920:flags=lanczos,setsar=1,eq=contrast=1.02:saturation=1.0"
        elif name == "doubt":
            vf = (
                f"crop=405:720:{x}:0,scale=1080:1920:flags=lanczos,setsar=1,"
                f"eq=contrast=1.08:brightness=-0.03:saturation=1.05,"
                f"noise=alls=6:allf=t+u"
            )
        else:
            vf = (
                f"crop=405:720:{x}:0,scale=1080:1920:flags=lanczos,setsar=1,"
                f"eq=contrast=1.18:brightness=-0.06:saturation=1.25:gamma_r=1.15:gamma_g=0.92:gamma_b=0.92,"
                f"noise=alls=12:allf=t+u,"
                f"hue=s=1.1"
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
                str(SRC),
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
                str(out),
            ]
        )
        segs.append(out)

    # 블랙 아웃 컷
    black = WORK / "black.mp4"
    run(
        [
            FFMPEG,
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=black:s=1080x1920:d={BLACK_DUR}:r=25",
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

    total = sum(c[1] for c in CLIPS) + BLACK_DUR
    # 타임라인 자막 (0~11s)
    # 0-3 intro, 3-6.8 doubt, 6.8-10.3 rise, 10.3-11.25 black
    t_intro0, t_intro1 = 0.1, 2.9
    t_d0, t_d1 = 3.1, 5.2
    t_d2, t_d3 = 5.2, 6.7
    t_r0, t_r1 = 7.0, 9.4
    t_r2, t_r3 = 9.4, 10.25
    t_b0, t_b1 = total - BLACK_DUR, total

    draws = []

    # —— 0~3초: 평범 흰색 작은 산세리프 ——
    en = f"between(t\\,{t_intro0}\\,{t_intro1})"
    draws.append(
        draw_line(
            fc,
            "평범한 개인 개발자 툴인 줄 알았음",
            42,
            "h*0.78",
            "white@0.92",
            2,
            "black@0.55",
            en,
        )
    )

    # —— 4~7초: 흔들림+글리치 (이중 레이어 어긋남) ——
    en = f"between(t\\,{t_d0}\\,{t_d1})"
    # glitch offset layer
    draws.append(
        draw_line(
            fcode,
            "근데 문구 왜 이래?",
            50,
            "h*0.76",
            "0xFF6680@0.55",
            3,
            "black@0.7",
            en,
            xoff=3,
            yoff=-2,
        )
    )
    draws.append(
        draw_line(
            fcode,
            "근데 문구 왜 이래?",
            50,
            "h*0.76",
            "0xE8E8E8",
            4,
            "black@0.85",
            en,
        )
    )
    en = f"between(t\\,{t_d2}\\,{t_d3})"
    draws.append(
        draw_line(
            fcode,
            "스크롤 내릴수록…",
            48,
            "h*0.76",
            "0xFF8090@0.5",
            3,
            "black@0.7",
            en,
            xoff=-4,
            yoff=2,
        )
    )
    draws.append(
        draw_line(
            fcode,
            "스크롤 내릴수록…",
            48,
            "h*0.76",
            "0xFFE0E4",
            4,
            "black@0.85",
            en,
        )
    )

    # —— 8~11초: 핏빛 호러 + 깜박임 ——
    en_blink = (
        f"between(t\\,{t_r0}\\,{t_r1})*lt(mod(t\\,0.18)\\,0.12)"
    )
    for yoff, color, bw in [
        (4, "black@0.85", 0),
        (0, "0x8B0000", 12),
        (0, "0xFF1A30", 8),
    ]:
        draws.append(
            draw_line(
                fhor,
                "아니… 이거 미쳤는데?",
                58,
                "h*0.72",
                color if yoff == 0 or "black" in color else color,
                bw if bw else 0,
                "black@0.95" if bw else "black@0",
                en_blink,
                xoff=3 if yoff else 0,
                yoff=yoff,
            )
        )
    # 하이라이트
    draws.append(
        draw_line(
            fhor,
            "아니… 이거 미쳤는데?",
            56,
            "h*0.72",
            "white@0.3",
            0,
            "black@0",
            en_blink,
            yoff=-2,
        )
    )

    en_blink2 = f"between(t\\,{t_r2}\\,{t_r3})*lt(mod(t\\,0.16)\\,0.11)"
    draws.append(
        draw_line(
            fhor,
            "링크는 아래에…",
            52,
            "h*0.80",
            "0xFF2038",
            7,
            "black@0.95",
            en_blink2,
        )
    )

    # 블랙아웃 중 한 줄 여운 (아주 짧게)
    en_b = f"between(t\\,{t_b0 + 0.15}\\,{t_b1 - 0.15})"
    draws.append(
        draw_line(
            fcode,
            "niagaekaw.site",
            36,
            "h*0.48",
            "0xFF4058@0.85",
            3,
            "black@0.9",
            en_b,
        )
    )

    vf = "eq=contrast=1.06:brightness=-0.02," + ",".join(draws)
    with_text = WORK / "with_text.mp4"
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
            "fast",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            str(with_text),
        ]
    )

    # —— 사운드: BGM 없음. 스크롤/타자/글리치만 ——
    # 합성 SFX 체인
    # 1) 조용한 룸톤 아주 약하게
    # 2) 주기적 스크롤 틱 (중반)
    # 3) 타자기 클릭 버스트
    # 4) 후반 글리치 노이즈 급상승 → 블랙에서 뚝
    fa = (
        # base almost silence
        f"anullsrc=r=44100:cl=stereo,atrim=0:{total},asetpts=N/SR/TB[base];"
        # scroll-ish soft noise ticks 3~7s
        f"anoisesrc=color=pink:duration={total}:sample_rate=44100:amplitude=0.08[nscroll];"
        f"[nscroll]highpass=f=800,lowpass=f=4000,volume='if(between(t,3.2,7.0),0.35,0.02)',"
        f"afade=t=in:st=3.0:d=0.3[scroll];"
        # typewriter clicks (narrow noise bursts via tremolo-ish)
        f"anoisesrc=color=white:duration={total}:sample_rate=44100:amplitude=0.12[ntype];"
        f"[ntype]highpass=f=2000,lowpass=f=6000,volume='if(between(t,5.0,9.5),0.55,0)',"
        f"tremolo=f=9:d=0.9[type];"
        # heavy glitch noise late
        f"anoisesrc=color=brown:duration={total}:sample_rate=44100:amplitude=0.5[ng];"
        f"[ng]lowpass=f=300,volume='if(between(t,7.5,10.25),0.7+0.3*t,0)',"
        f"afade=t=out:st=10.2:d=0.15[glitch];"
        # blackout hard cut silence
        f"[base][scroll][type][glitch]amix=inputs=4:duration=first:normalize=0,"
        f"volume=1.1,alimiter=limit=0.9,"
        f"afade=t=out:st={total - 0.85}:d=0.12[aout]"
    )

    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(with_text),
            "-filter_complex",
            fa,
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

    kb = OUT.stat().st_size // 1024
    print(f"\nDONE → {OUT} ({kb} KB), ~{total:.1f}s cliffhanger shorts")


if __name__ == "__main__":
    main()
