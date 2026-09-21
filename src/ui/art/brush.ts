import {
  BlendMode,
  PaintStyle,
  Skia,
  StrokeCap,
  type SkCanvas,
  type SkColor,
  type SkColorFilter,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkRect,
} from '@shopify/react-native-skia';

/**
 * 전투 캔버스의 붓과 기본 도형 (`BattleCanvas.tsx`).
 *
 * 도형은 View 로 그리던 때와 **같은 모양**이 나오게 맞췄다. 막대는 양끝이
 * 반원인 알약, 고리는 테가 지름 안쪽으로 들어가는 원, 덩이는 꽉 찬 원이다 -
 * 연출 수치를 그대로 옮겨도 화면이 안 바뀌어야 다시 다듬을 일이 없다.
 *
 * 붓(Paint)과 색은 만들어 두고 돌려 쓴다. 이것도 네이티브 객체라 도형마다
 * 새로 만들면 공격이 몰리는 순간 그대로 쓰레기가 된다.
 */

/** 미리 읽어 둔 그림 한 장 */
export interface Sprite {
  image: SkImage;
  /** 그림 전체 - 찍을 때마다 크기를 묻지 않게 들고 다닌다 */
  src: SkRect;
}

export interface Brush {
  /** 지금 녹화 중인 캔버스 - 그리는 쪽이 프레임마다 바꿔 끼운다 */
  canvas: SkCanvas;
  fill: SkPaint;
  /** 끝이 둥근 선 */
  stroke: SkPaint;
  /** 그림을 그대로 찍는다 */
  image: SkPaint;
  /** 흰 그림에 색을 입혀 찍는다 (예전 tintColor) */
  tinted: SkPaint;
  /** 날아가는 불꽃 - 아직 못 읽었으면 null */
  fire: Sprite | null;
  /** 날아가는 화살 */
  arrow: Sprite | null;
  /** 총구 화염 - 가로로 이어 붙은 띠다. 칸은 그리는 쪽이 고른다 */
  muzzle: Sprite | null;
  /** 날아가는 총알 */
  bullet: Sprite | null;
  /** 뾰족한 것을 그릴 때 쓰는 길 하나. 매번 새로 만들면 그만큼 쓰레기가 된다 */
  path: SkPath;
  color: (c: string) => SkColor;
  tint: (c: string) => SkColorFilter;
}

export function spriteOf(image: SkImage | null): Sprite | null {
  return image ? { image, src: { x: 0, y: 0, width: image.width(), height: image.height() } } : null;
}

export function createBrush(
  fire: SkImage | null,
  arrow: SkImage | null,
  muzzle: SkImage | null,
  bullet: SkImage | null,
): Brush {
  const paint = () => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    return p;
  };
  const stroke = paint();
  stroke.setStyle(PaintStyle.Stroke);
  stroke.setStrokeCap(StrokeCap.Round);

  const colors = new Map<string, SkColor>();
  const tints = new Map<string, SkColorFilter>();
  const color = (c: string) => {
    let v = colors.get(c);
    if (!v) {
      v = Skia.Color(c);
      colors.set(c, v);
    }
    return v;
  };

  return {
    // 그리기 직전에 끼운다 - 녹화기가 프레임마다 새 캔버스를 준다
    canvas: null as unknown as SkCanvas,
    fill: paint(),
    stroke,
    image: paint(),
    tinted: paint(),
    fire: spriteOf(fire),
    arrow: spriteOf(arrow),
    muzzle: spriteOf(muzzle),
    bullet: spriteOf(bullet),
    path: Skia.Path.Make(),
    color,
    tint: (c) => {
      let v = tints.get(c);
      if (!v) {
        v = Skia.ColorFilter.MakeBlend(color(c), BlendMode.SrcIn);
        tints.set(c, v);
      }
      return v;
    },
  };
}

/** 붓에 색을 묻힌다. 투명도는 색에 원래 든 투명도에 곱한다 */
export function ink(b: Brush, p: SkPaint, color: string, opacity: number) {
  const c = b.color(color);
  p.setColor(c);
  p.setAlphaf(c[3] * opacity);
}

/** 꽉 찬 원. size 는 지름 */
export function blob(b: Brush, x: number, y: number, size: number, color: string, opacity: number) {
  if (size <= 0 || opacity <= 0) return;
  ink(b, b.fill, color, opacity);
  b.canvas.drawCircle(x, y, size / 2, b.fill);
}

/** 고리. 테(w)는 지름 안쪽으로 들어간다 - 테가 반지름보다 두꺼우면 꽉 찬 원이 된다 */
export function ring(
  b: Brush,
  x: number,
  y: number,
  size: number,
  w: number,
  color: string,
  opacity: number,
) {
  if (size <= 0 || w <= 0 || opacity <= 0) return;
  const r = size / 2;
  if (w >= r) {
    blob(b, x, y, size, color, opacity);
    return;
  }
  ink(b, b.stroke, color, opacity);
  b.stroke.setStrokeWidth(w);
  b.canvas.drawCircle(x, y, r - w / 2, b.stroke);
}

/** 둥근 네모. 둥글기는 짧은 변의 반까지만 먹는다 */
export function box(
  b: Brush,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  opacity: number,
) {
  if (w <= 0 || h <= 0 || opacity <= 0) return;
  const rr = Math.min(r, w / 2, h / 2);
  ink(b, b.fill, color, opacity);
  b.canvas.drawRRect({ rect: { x, y, width: w, height: h }, rx: rr, ry: rr }, b.fill);
}

/**
 * 두 점 사이에 놓는 막대. 굵기 w.
 *
 * 양끝이 반원인 알약이라 끝이 둥근 선 한 줄과 같다 - 선은 끝이 굵기의 반만큼
 * 튀어나오니 그만큼 안으로 당겨 긋는다. 막대가 굵기보다 짧으면 둥근 끝이
 * 굵기 쪽으로 붙어서, 방향과 엇갈려 선 알약이 된다 (View 때 모양 그대로).
 */
export function bar(
  b: Brush,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  w: number,
  color: string,
  opacity: number,
) {
  const len = Math.hypot(bx - ax, by - ay);
  if (len <= 0 || w <= 0 || opacity <= 0) return;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const along = len >= w;
  const width = along ? w : len;
  const half = Math.abs(len - w) / 2;
  if (half < 0.01) {
    blob(b, mx, my, width, color, opacity);
    return;
  }
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  const dx = along ? ux * half : -uy * half;
  const dy = along ? uy * half : ux * half;
  ink(b, b.stroke, color, opacity);
  b.stroke.setStrokeWidth(width);
  b.canvas.drawLine(mx - dx, my - dy, mx + dx, my + dy, b.stroke);
}

/** 세 점을 잇는 삼각형. 화살촉처럼 뾰족한 것에 쓴다 */
export function tri(
  b: Brush,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  color: string,
  opacity: number,
) {
  if (opacity <= 0) return;
  const p = b.path;
  p.reset();
  p.moveTo(x1, y1);
  p.lineTo(x2, y2);
  p.lineTo(x3, y3);
  p.close();
  ink(b, b.fill, color, opacity);
  b.canvas.drawPath(p, b.fill);
}
