import { SOFT_COLS, SOFT_ROWS, type SquishBody, type SquishVisual } from "./physics";

export interface BodyMap {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

const FULL: BodyMap = { u0: 0, v0: 0, u1: 1, v1: 1 };
const maps = new WeakMap<HTMLImageElement, BodyMap>();

export function bodyMapOf(img: HTMLImageElement): BodyMap {
  if (!img.complete || img.naturalWidth === 0) return FULL;
  const cached = maps.get(img);
  if (cached) return cached;
  const map = analyze(img);
  maps.set(img, map);
  return map;
}

function analyze(img: HTMLImageElement): BodyMap {
  const size = 96;
  const scratch = document.createElement("canvas");
  scratch.width = size;
  scratch.height = size;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) return FULL;
  try {
    ctx.drawImage(img, 0, 0, size, size);
  } catch {
    return FULL;
  }
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return FULL;
  }
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if ((data[(y * size + x) * 4 + 3] ?? 0) < 28) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) return FULL;
  const pad = 1;
  const u0 = Math.max(0, (minX - pad) / size);
  const v0 = Math.max(0, (minY - pad) / size);
  const u1 = Math.min(1, (maxX + pad) / size);
  const v1 = Math.min(1, (maxY + pad) / size);
  return { u0, v0, u1, v1 };
}

const VS = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
void main() {
  vec4 color = texture2D(uTex, vUv);
  if (color.a < 0.02) discard;
  gl_FragColor = color;
}
`;

interface GlState {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  program: WebGLProgram;
  buf: WebGLBuffer;
  index: WebGLBuffer;
  textures: WeakMap<HTMLImageElement, WebGLTexture>;
  loc: {
    pos: number;
    uv: number;
    tex: WebGLUniformLocation | null;
  };
}

let glState: GlState | null = null;
let glFailed = false;
const verts = new Float32Array(SOFT_COLS * SOFT_ROWS * 4);

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function glOf(): GlState | null {
  if (glFailed) return null;
  if (glState) return glState;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) {
    glFailed = true;
    return null;
  }
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) {
    glFailed = true;
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    glFailed = true;
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    glFailed = true;
    return null;
  }
  const buf = gl.createBuffer();
  const index = gl.createBuffer();
  if (!buf || !index) {
    glFailed = true;
    return null;
  }
  const idx = new Uint16Array((SOFT_COLS - 1) * (SOFT_ROWS - 1) * 6);
  let n = 0;
  for (let r = 0; r < SOFT_ROWS - 1; r += 1) {
    for (let c = 0; c < SOFT_COLS - 1; c += 1) {
      const i = r * SOFT_COLS + c;
      idx[n] = i;
      idx[n + 1] = i + 1;
      idx[n + 2] = i + SOFT_COLS;
      idx[n + 3] = i + 1;
      idx[n + 4] = i + SOFT_COLS + 1;
      idx[n + 5] = i + SOFT_COLS;
      n += 6;
    }
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  glState = {
    gl,
    canvas,
    program,
    buf,
    index,
    textures: new WeakMap(),
    loc: {
      pos: gl.getAttribLocation(program, "aPos"),
      uv: gl.getAttribLocation(program, "aUv"),
      tex: gl.getUniformLocation(program, "uTex"),
    },
  };
  return glState;
}

function textureOf(state: GlState, img: HTMLImageElement): WebGLTexture | null {
  const cached = state.textures.get(img);
  if (cached) return cached;
  const gl = state.gl;
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  state.textures.set(img, tex);
  return tex;
}

interface Fit {
  x: number;
  y: number;
  w: number;
  h: number;
}

function fitOf(cssW: number, cssH: number, img: HTMLImageElement): Fit {
  const nw = img.naturalWidth || 1;
  const nh = img.naturalHeight || 1;
  const s = Math.min(cssW / nw, cssH / nh);
  const w = nw * s;
  const h = nh * s;
  return { x: (cssW - w) / 2, y: (cssH - h) / 2, w, h };
}

function shownPos(body: SquishBody, index: number): { x: number; y: number } {
  return { x: body.pos[index] ?? 0, y: body.pos[index + 1] ?? 0 };
}

function fillVerts(body: SquishBody, map: BodyMap, fit: Fit, cssW: number, cssH: number): void {
  const du = map.u1 - map.u0;
  const dv = map.v1 - map.v0;
  for (let v = 0; v < SOFT_COLS * SOFT_ROWS; v += 1) {
    const i = v * 2;
    const rx = body.rest[i] ?? 0;
    const ry = body.rest[i + 1] ?? 0;
    const shown = shownPos(body, i);
    const u = map.u0 + rx * du;
    const imageV = map.v0 + ry * dv;
    const px = fit.x + (map.u0 + shown.x * du) * fit.w;
    const py = fit.y + (map.v0 + shown.y * dv) * fit.h;
    const o = v * 4;
    verts[o] = (px / cssW) * 2 - 1;
    verts[o + 1] = 1 - (py / cssH) * 2;
    verts[o + 2] = u;
    verts[o + 3] = 1 - imageV;
  }
}

function paintGl(
  img: HTMLImageElement,
  body: SquishBody,
  map: BodyMap,
  cssW: number,
  cssH: number,
  pxW: number,
  pxH: number,
): HTMLCanvasElement | null {
  const state = glOf();
  if (!state) return null;
  const tex = textureOf(state, img);
  if (!tex) return null;
  const { gl, canvas } = state;
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  fillVerts(body, map, fitOf(cssW, cssH, img), cssW, cssH);
  gl.viewport(0, 0, pxW, pxH);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(state.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, state.buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.index);
  const stride = 16;
  gl.enableVertexAttribArray(state.loc.pos);
  gl.vertexAttribPointer(state.loc.pos, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(state.loc.uv);
  gl.vertexAttribPointer(state.loc.uv, 2, gl.FLOAT, false, stride, 8);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(state.loc.tex, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawElements(gl.TRIANGLES, (SOFT_COLS - 1) * (SOFT_ROWS - 1) * 6, gl.UNSIGNED_SHORT, 0);
  return canvas;
}

function drawShadow(
  ctx: CanvasRenderingContext2D,
  visual: SquishVisual,
  map: BodyMap,
  fit: Fit,
): void {
  const mid = fit.x + ((map.u0 + map.u1) / 2) * fit.w;
  const footY = fit.y + map.v1 * fit.h;
  const rx = (map.u1 - map.u0) * fit.w * (0.26 + visual.depth * 0.18);
  const ry = Math.max(2.4, rx * 0.15);
  const dark = 0.1 + visual.depth * 0.26;
  const grad = ctx.createRadialGradient(mid, footY, ry * 0.15, mid, footY, rx);
  grad.addColorStop(0, `rgba(58, 28, 48, ${dark.toFixed(3)})`);
  grad.addColorStop(1, "rgba(58, 28, 48, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(mid, footY + ry * 0.2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw the deformed squishee. WebGL when it is available, otherwise a mesh of triangles. */
export function drawSoftBody(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  body: SquishBody,
  visual: SquishVisual,
  map: BodyMap,
): void {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW < 2 || cssH < 2 || img.naturalWidth === 0) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pxW = Math.max(1, Math.round(cssW * dpr));
  const pxH = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const fit = fitOf(cssW, cssH, img);
  const glCanvas = paintGl(img, body, map, cssW, cssH, pxW, pxH);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  drawShadow(ctx, visual, map, fit);
  if (glCanvas) ctx.drawImage(glCanvas, 0, 0, cssW, cssH);
  else paintTriangles(ctx, img, body, map, fit);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function paintTriangles(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  body: SquishBody,
  map: BodyMap,
  fit: Fit,
): void {
  const du = map.u1 - map.u0;
  const dv = map.v1 - map.v0;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const pt = (v: number) => {
    const i = v * 2;
    const shown = shownPos(body, i);
    const rx = body.rest[i] ?? 0;
    const ry = body.rest[i + 1] ?? 0;
    return {
      sx: (map.u0 + rx * du) * nw,
      sy: (map.v0 + ry * dv) * nh,
      dx: fit.x + (map.u0 + shown.x * du) * fit.w,
      dy: fit.y + (map.v0 + shown.y * dv) * fit.h,
    };
  };
  for (let r = 0; r < SOFT_ROWS - 1; r += 1) {
    for (let c = 0; c < SOFT_COLS - 1; c += 1) {
      const i = r * SOFT_COLS + c;
      const a = pt(i);
      const b = pt(i + 1);
      const d = pt(i + SOFT_COLS);
      const e = pt(i + SOFT_COLS + 1);
      tri(ctx, img, a, b, d);
      tri(ctx, img, b, e, d);
    }
  }
}

function tri(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  p0: { sx: number; sy: number; dx: number; dy: number },
  p1: { sx: number; sy: number; dx: number; dy: number },
  p2: { sx: number; sy: number; dx: number; dy: number },
): void {
  const denom = p0.sx * (p1.sy - p2.sy) + p1.sx * (p2.sy - p0.sy) + p2.sx * (p0.sy - p1.sy);
  if (Math.abs(denom) < 1e-4) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.dx, p0.dy);
  ctx.lineTo(p1.dx, p1.dy);
  ctx.lineTo(p2.dx, p2.dy);
  ctx.closePath();
  ctx.clip();
  const a = (p0.dx * (p1.sy - p2.sy) + p1.dx * (p2.sy - p0.sy) + p2.dx * (p0.sy - p1.sy)) / denom;
  const b = (p0.dy * (p1.sy - p2.sy) + p1.dy * (p2.sy - p0.sy) + p2.dy * (p0.sy - p1.sy)) / denom;
  const c = (p0.dx * (p2.sx - p1.sx) + p1.dx * (p0.sx - p2.sx) + p2.dx * (p1.sx - p0.sx)) / denom;
  const d = (p0.dy * (p2.sx - p1.sx) + p1.dy * (p0.sx - p2.sx) + p2.dy * (p1.sx - p0.sx)) / denom;
  const e = (p0.dx * (p1.sx * p2.sy - p2.sx * p1.sy) + p1.dx * (p2.sx * p0.sy - p0.sx * p2.sy) + p2.dx * (p0.sx * p1.sy - p1.sx * p0.sy)) / denom;
  const f = (p0.dy * (p1.sx * p2.sy - p2.sx * p1.sy) + p1.dy * (p2.sx * p0.sy - p0.sx * p2.sy) + p2.dy * (p0.sx * p1.sy - p1.sx * p0.sy)) / denom;
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
