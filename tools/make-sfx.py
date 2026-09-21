#!/usr/bin/env python3
"""효과음을 코드로 만든다.

음원을 받아 오지 않고 파형을 직접 합성한다. 귀여운 그림체에 맞추려고 거친
톱니파 대신 사인·삼각파를 쓰고, 소리는 전부 짧게(대부분 0.2초 안) 끊는다 -
후반 웨이브에는 타격이 초당 수십 번이라 길면 서로 겹쳐 뭉갠다.

  python3 tools/make-sfx.py            # assets/sfx/*.wav 를 새로 만든다
  python3 tools/make-sfx.py --preview  # 하나로 이어 붙인 미리듣기도 만든다

높이를 조금씩 바꿔 가며 재생하는 건 게임 쪽(`src/ui/sfx.ts`)에서 한다.
"""

import argparse
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets/sfx')


def t(dur: float) -> np.ndarray:
    return np.arange(int(SR * dur)) / SR


def env(dur: float, attack: float = 0.004, curve: float = 5.0) -> np.ndarray:
    """앞은 빠르게 서고 뒤는 지수로 사라진다. 타격음은 이 모양이 전부다."""
    x = t(dur)
    a = np.clip(x / max(attack, 1e-4), 0, 1)
    return a * np.exp(-curve * x / dur)


def tone(freq, dur, kind='sine'):
    x = t(dur)
    if callable(freq):
        # 주파수가 변하면 위상을 누적해야 한다 - 그냥 곱하면 소리가 깨진다
        f = freq(x / dur)
        phase = 2 * np.pi * np.cumsum(f) / SR
    else:
        phase = 2 * np.pi * freq * x
    if kind == 'tri':
        return 2 / np.pi * np.arcsin(np.sin(phase))
    return np.sin(phase)


def sweep(f0, f1, dur, kind='sine'):
    return tone(lambda u: f0 * (f1 / f0) ** u, dur, kind)


def noise(dur, low=1.0):
    """low 를 낮추면 둔탁해진다 (한 극점 저역 통과)"""
    n = np.random.default_rng(7).standard_normal(int(SR * dur))
    if low >= 1:
        return n
    out = np.zeros_like(n)
    acc = 0.0
    for i, v in enumerate(n):
        acc += low * (v - acc)
        out[i] = acc
    return out / (np.max(np.abs(out)) + 1e-9)


def pad(a: np.ndarray, dur: float) -> np.ndarray:
    n = int(SR * dur)
    return np.pad(a, (0, max(0, n - len(a))))[:n]


def mix(*parts) -> np.ndarray:
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.9
    # 끝을 짧게 눕혀 '틱' 소리를 없앤다
    tail = min(len(out), int(SR * 0.006))
    out[-tail:] *= np.linspace(1, 0, tail)
    return out


def save(name: str, data: np.ndarray) -> str:
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f'{name}.wav')
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(data, -1, 1) * 32767).astype('<i2').tobytes())
    return path


def build() -> dict:
    s = {}

    # 타격 - 짧고 둔탁한 '퍽'. 제일 자주 울리니 제일 짧다
    s['hit'] = mix(
        sweep(240, 120, 0.07) * env(0.07, 0.001, 6),
        noise(0.02, 0.25) * env(0.02, 0.0005, 8) * 0.5,
    )

    # 처치 - 부풀었다 터지는 '팡'
    s['kill'] = mix(
        sweep(620, 170, 0.16, 'tri') * env(0.16, 0.002, 5),
        noise(0.09, 0.35) * env(0.09, 0.001, 6) * 0.7,
        pad(tone(1480, 0.05) * env(0.05, 0.001, 7) * 0.35, 0.16),
    )

    # 골드 - 밝은 두 음
    s['coin'] = mix(
        tone(1318, 0.06, 'tri') * env(0.06, 0.001, 6),
        pad(tone(1976, 0.09, 'tri') * env(0.09, 0.001, 5) * 0.9, 0.16),
    )

    # 배치 - 딸깍
    s['place'] = mix(
        tone(420, 0.05) * env(0.05, 0.001, 7),
        noise(0.015, 0.4) * env(0.015, 0.0005, 8) * 0.4,
    )

    # 조합 - 올라가는 세 음
    s['combine'] = mix(
        *[
            pad(tone(f, 0.1, 'tri') * env(0.1, 0.002, 5) * 0.8, 0.09 * i + 0.1)
            for i, f in enumerate([1046, 1318, 1568])
        ]
    )

    # 보스 등장 - 낮게 깔리는 쿵
    s['boss'] = mix(
        sweep(150, 55, 0.5) * env(0.5, 0.01, 3.5),
        tone(82, 0.5) * env(0.5, 0.02, 3) * 0.6,
        noise(0.25, 0.12) * env(0.25, 0.005, 4) * 0.35,
    )

    # 성문 피해 - 묵직하게 부서지는 소리
    s['gate'] = mix(
        sweep(180, 70, 0.3) * env(0.3, 0.002, 4),
        noise(0.18, 0.3) * env(0.18, 0.001, 5) * 0.8,
    )

    # 승리 - 올라가는 네 음
    s['win'] = mix(
        *[
            pad(tone(f, 0.16, 'tri') * env(0.16, 0.004, 4) * 0.8, 0.12 * i + 0.16)
            for i, f in enumerate([523, 659, 784, 1046])
        ]
    )

    # 패배 - 내려가는 네 음
    s['lose'] = mix(
        *[
            pad(tone(f, 0.22, 'tri') * env(0.22, 0.006, 3.5) * 0.8, 0.16 * i + 0.22)
            for i, f in enumerate([523, 392, 330, 262])
        ]
    )
    return s


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--preview', help='이어 붙인 미리듣기 파일 경로')
    a = p.parse_args()

    sounds = build()
    for name, data in sounds.items():
        path = save(name, data)
        print(f'{os.path.relpath(path, os.path.dirname(OUT))} · {len(data) / SR:.2f}초 · {os.path.getsize(path) // 1024}KB')

    if a.preview:
        gap = np.zeros(int(SR * 0.35))
        joined = np.concatenate([np.concatenate([v, gap]) for v in sounds.values()])
        with wave.open(a.preview, 'w') as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes((np.clip(joined, -1, 1) * 32767).astype('<i2').tobytes())
        print('미리듣기:', a.preview, f'({len(joined) / SR:.1f}초)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
