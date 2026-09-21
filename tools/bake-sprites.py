#!/usr/bin/env python3
"""3D 모션을 스프라이트 시트 한 장으로 굽는다.

판 위 유닛을 실시간 3D 로 돌리면 한 마리당 CPU 를 9%p 씩 먹는다 (시뮬레이터에서
여덟 마리에 31fps / 118%). 모델이 무거워서가 아니라 - 삼각형 5천, 뼈 28개로 이미
모바일 예산 안이다 - 자바스크립트가 매 프레임 그래픽 명령을 건네는 경로가 비싸서다.

그래서 **미리 구워 둔다.** 3D 로 만든 동작을 여러 장의 그림으로 떠 두고 판에서는
넘겨 가며 보여 준다. 움직임은 3D 그대로인데 비용은 그림 한 장이다.

  python3 tools/bake-sprites.py --dir assets/units/mochi --motions idle,walk \
      --frames 12 --size 192 --turn 1.1 --torso 0.6 --belly 1.48 --head 1.2

결과는 가로로 프레임, 세로로 모션이 놓인 PNG 한 장이다. 그리는 설정은
`tools/bake/page.html` 이 `src/ui/art` 쪽과 똑같이 맞춰 두었다.
"""

import argparse
import http.server
import os
import socket
import socketserver
import subprocess
import sys
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def serve(root: str):
    """크롬은 file:// 에서 ES 모듈을 안 읽는다. 잠깐 웹 서버를 띄워 준다."""
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=root, **kw)

        def log_message(self, *a):
            pass

    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    httpd = socketserver.TCPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, port


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--dir', required=True, help='GLB 가 든 폴더 (예: assets/units/mochi)')
    p.add_argument('--motions', default='idle', help='쉼표로 구분. 파일 이름과 같아야 한다')
    p.add_argument('--frames', type=int, default=12, help='한 동작을 몇 장으로 뜰지')
    p.add_argument('--size', type=int, default=192, help='한 장의 픽셀')
    p.add_argument('--cols', type=int, default=0, help='한 줄에 몇 장. 0 이면 한 줄에 다 넣는다')
    p.add_argument('--turn', type=float, default=1.1, help='바라보는 각도(라디안). 0 이면 정면')
    p.add_argument('--torso', type=float, default=1)
    p.add_argument('--belly', type=float, default=1)
    p.add_argument('--head', type=float, default=1)
    p.add_argument('--out', help='없으면 <dir>/sheet.png')
    a = p.parse_args()

    if not os.path.exists(CHROME):
        print('크롬이 없다:', CHROME)
        return 1

    motions = a.motions.split(',')
    cols = a.cols or a.frames
    rows_per = -(-a.frames // cols)
    out = a.out or os.path.join(a.dir, 'sheet.png')
    httpd, port = serve(ROOT)
    try:
        rel = os.path.relpath(os.path.join(ROOT, a.dir), os.path.join(ROOT, 'tools/bake'))
        url = (
            f'http://127.0.0.1:{port}/tools/bake/page.html'
            f'?dir={rel}&motions={a.motions}&frames={a.frames}&size={a.size}&cols={cols}'
            f'&turn={a.turn}&torso={a.torso}&belly={a.belly}&head={a.head}'
        )
        cmd = [
            CHROME, '--headless', '--enable-unsafe-swiftshader', '--hide-scrollbars',
            '--default-background-color=00000000', '--virtual-time-budget=60000',
            f'--window-size={a.size * cols},{a.size * rows_per * len(motions)}',
            f'--screenshot={os.path.join(ROOT, out)}', url,
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if not os.path.exists(os.path.join(ROOT, out)):
            print(r.stderr[-800:])
            return 1
        size = os.path.getsize(os.path.join(ROOT, out))
        print(f'{out} · {a.size}px × {a.frames}장({cols}열) × {len(motions)}동작 · {size // 1024}KB')
        # 내용이 비면 구워지지 않은 것이다 - 조용히 넘어가면 판에서야 알게 된다
        if size < 20_000:
            print('  (경고: 너무 작다. 페이지에서 3D 가 안 그려졌을 수 있다)')
            return 1
    finally:
        httpd.shutdown()
    return 0


if __name__ == '__main__':
    sys.exit(main())
