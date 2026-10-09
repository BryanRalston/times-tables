import { SOFT_COLS, SOFT_ROWS, type SquishBody, type SquishVisual } from "./physics";

export interface EyeSpot {
  u: number;
  v: number;
  rx: number;
  ry: number;
}

export interface BodyMap {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  eyeL: EyeSpot | null;
  eyeR: EyeSpot | null;
}

const FULL: BodyMap = { u0: 0, v0: 0, u1: 1, v1: 1, eyeL: null, eyeR: null };
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
  const size = 160;
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
  const eyes = findEyes(data, size, minX, minY, maxX, maxY);
  return { u0, v0, u1, v1, eyeL: eyes.left, eyeR: eyes.right };
}

function findEyes(
  data: Uint8ClampedArray,
  size: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): { left: EyeSpot | null; right: EyeSpot | null } {
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const x0 = minX + bw * 0.18;
  const x1 = maxX - bw * 0.18;
  const y0 = minY + bh * 0.2;
  const y1 = minY + bh * 0.62;
  const pts: number[] = [];
  for (let y = Math.floor(y0); y <= y1; y += 1) {
    for (let x = Math.floor(x0); x <= x1; x += 1) {
      const i = (y * size + x) * 4;
      const a = data[i + 3] ?? 0;
      if (a < 200) continue;
      const lum = 0.3 * (data[i] ?? 0) + 0.55 * (data[i + 1] ?? 0) + 0.15 * (data[i + 2] ?? 0);
      let acc = 0;
      let n = 0;
      for (let k = 0; k < 8; k += 1) {
        const ox = k < 4 ? (k % 2 === 0 ? -3 : 3) : k % 2 === 0 ? -4 : 4;
        const oy = k < 4 ? (k < 2 ? -3 : 3) : k < 6 ? -4 : 4;
        const qx = x + ox;
        const qy = y + oy;
        if (qx < 0 || qy < 0 || qx >= size || qy >= size) continue;
        const j = (qy * size + qx) * 4;
        if ((data[j + 3] ?? 0) < 180) continue;
        acc += 0.3 * (data[j] ?? 0) + 0.55 * (data[j + 1] ?? 0) + 0.15 * (data[j + 2] ?? 0);
        n += 1;
      }
      if (n < 5) continue;
      if (acc / n - lum > 22 && lum < 170) pts.push(x, y);
    }
  }
  const clusters: { n: number; x: number; y: number; minX: number; maxX: number; minY: number; maxY: number }[] = [];
  const used = new Uint8Array(pts.length / 2);
  for (let i = 0; i < used.length; i += 1) {
    if (used[i]) continue;
    used[i] = 1;
    const group = [i];
    for (let g = 0; g < group.length; g += 1) {
      const k = group[g] ?? 0;
      const px = pts[k * 2] ?? 0;
      const py = pts[k * 2 + 1] ?? 0;
      for (let j = 0; j < used.length; j += 1) {
        if (used[j]) continue;
        const qx = pts[j * 2] ?? 0;
        const qy = pts[j * 2 + 1] ?? 0;
        if (Math.abs(qx - px) <= 4 && Math.abs(qy - py) <= 4) {
          used[j] = 1;
          group.push(j);
        }
      }
    }
    if (group.length < 16 || group.length > 180) continue;
    let sx = 0;
    let sy = 0;
    let cminX = size;
    let cminY = size;
    let cmaxX = 0;
    let cmaxY = 0;
    for (const k of group) {
      const x = pts[k * 2] ?? 0;
      const y = pts[k * 2 + 1] ?? 0;
      sx += x;
      sy += y;
      if (x < cminX) cminX = x;
      if (y < cminY) cminY = y;
      if (x > cmaxX) cmaxX = x;
      if (y > cmaxY) cmaxY = y;
    }
    clusters.push({
      n: group.length,
      x: sx / group.length,
      y: sy / group.length,
      minX: cminX,
      maxX: cmaxX,
      minY: cminY,
      maxY: cmaxY,
    });
  }
  let best: { left: (typeof clusters)[number]; right: (typeof clusters)[number]; score: number } | null = null;
  for (let i = 0; i < clusters.length; i += 1) {
    for (let j = i + 1; j < clusters.length; j += 1) {
      const a = clusters[i];
      const b = clusters[j];
      if (!a || !b) continue;
      const left = a.x < b.x ? a : b;
      const right = a.x < b.x ? b : a;
      const gap = right.x - left.x;
      const dy = Math.abs(left.y - right.y);
      const aspect = (spot: (typeof clusters)[number]) => (spot.maxY - spot.minY + 1) / Math.max(1, spot.maxX - spot.minX + 1);
      if (aspect(left) < 0.7 || aspect(right) < 0.7 || aspect(left) > 1.9 || aspect(right) > 1.9) continue;
      if (gap < bw * 0.16 || gap > bw * 0.58 || dy > bh * 0.1) continue;
      if (left.y > minY + bh * 0.62 || right.y > minY + bh * 0.62) continue;
      const score = left.n + right.n - dy * 2;
      if (!best || score > best.score) best = { left, right, score };
    }
  }
  if (!best) return { left: null, right: null };
  const spot = (c: (typeof clusters)[number]): EyeSpot => ({
    u: c.x / size,
    v: c.y / size,
    rx: Math.max(0.03, Math.min(0.07, (c.maxX - c.minX) / size / 2 + 0.014)),
    ry: Math.max(0.026, Math.min(0.06, (c.maxY - c.minY) / size / 2 + 0.012)),
  });
  return { left: spot(best.left), right: spot(best.right) };
}

const VS = `
attribute vec2 aPos;
attribute vec2 aUv;
attribute float aShade;
varying vec2 vUv;
varying float vShade;
void main() {
  vUv = aUv;
  vShade = aShade;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FS = `
precision mediump float;
varying vec2 vUv;
varying float vShade;
uniform sampler2D uTex;
uniform float uSquint;
uniform float uPress;
uniform vec2 uContact;
uniform vec2 uEyeL;
uniform vec2 uEyeR;
uniform vec2 uRadL;
uniform vec2 uRadR;
uniform float uEyes;
float lid(vec2 img, vec2 eye, vec2 rad) {
  if (eye.x < 0.0) return 0.0;
  vec2 d = (img - eye) / max(rad, vec2(0.001));
  float inside = 1.0 - smoothstep(0.5, 1.2, dot(d, d));
  float edge = mix(-1.15, 0.92, clamp(uSquint, 0.0, 1.0));
  float cover = 1.0 - smoothstep(edge, edge + 0.38, d.y);
  return inside * cover;
}
void main() {
  vec4 color = texture2D(uTex, vUv);
  if (color.a < 0.02) discard;
  vec2 img = vec2(vUv.x, 1.0 - vUv.y);
  float shade = clamp(vShade, -1.0, 1.0);
  color.rgb += vec3(0.24, 0.16, 0.12) * shade * (0.28 + uPress * 0.45);
  vec2 fromFinger = img - uContact;
  float dent = exp(-dot(fromFinger, fromFinger) * 90.0) * uPress;
  float rim = exp(-dot(fromFinger, fromFinger) * 28.0) * uPress;
  color.rgb *= 1.0 - dent * 0.42;
  color.rgb += vec3(1.0, 0.95, 0.9) * max(0.0, rim - dent) * 0.16;
  vec2 specAt = uContact + (vec2(0.42, 0.28) - uContact) * 0.55;
  specAt.y -= 0.04;
  float spec = exp(-dot(img - specAt, img - specAt) * 90.0);
  color.rgb += vec3(1.0, 0.98, 0.95) * spec * (0.05 + uPress * 0.16);
  if (uEyes > 0.5 && uSquint > 0.04) {
    float L = lid(img, uEyeL, uRadL);
    float R = lid(img, uEyeR, uRadR);
    float cover = clamp(max(L, R), 0.0, 1.0);
    if (cover > 0.001) {
      vec2 eye = L >= R ? uEyeL : uEyeR;
      vec2 rad = L >= R ? uRadL : uRadR;
      vec2 below = vec2(eye.x, clamp(eye.y + rad.y * 2.2, 0.0, 1.0));
      vec2 sideA = vec2(clamp(eye.x + rad.x * 2.4, 0.0, 1.0), eye.y);
      vec2 sideB = vec2(clamp(eye.x - rad.x * 2.4, 0.0, 1.0), eye.y);
      vec3 fa = texture2D(uTex, vec2(below.x, 1.0 - below.y)).rgb;
      vec3 fb = texture2D(uTex, vec2(sideA.x, 1.0 - sideA.y)).rgb;
      vec3 fc = texture2D(uTex, vec2(sideB.x, 1.0 - sideB.y)).rgb;
      float la = dot(fa, vec3(0.3, 0.55, 0.15));
      float lb = dot(fb, vec3(0.3, 0.55, 0.15));
      float lc = dot(fc, vec3(0.3, 0.55, 0.15));
      vec3 flesh = fa;
      float lum = la;
      if (lb > lum) { flesh = fb; lum = lb; }
      if (lc > lum) flesh = fc;
      color.rgb = mix(color.rgb, flesh * 0.96, cover * 0.92);
    }
  }
  color.rgb = clamp(color.rgb, 0.0, 1.0);
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
    shade: number;
    tex: WebGLUniformLocation | null;
    squint: WebGLUniformLocation | null;
    press: WebGLUniformLocation | null;
    contact: WebGLUniformLocation | null;
    eyeL: WebGLUniformLocation | null;
    eyeR: WebGLUniformLocation | null;
    radL: WebGLUniformLocation | null;
    radR: WebGLUniformLocation | null;
    eyes: WebGLUniformLocation | null;
  };
}

let glState: GlState | null = null;
let glFailed = false;
const verts = new Float32Array(SOFT_COLS * SOFT_ROWS * 5);

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
      shade: gl.getAttribLocation(program, "aShade"),
      tex: gl.getUniformLocation(program, "uTex"),
      squint: gl.getUniformLocation(program, "uSquint"),
      press: gl.getUniformLocation(program, "uPress"),
      contact: gl.getUniformLocation(program, "uContact"),
      eyeL: gl.getUniformLocation(program, "uEyeL"),
      eyeR: gl.getUniformLocation(program, "uEyeR"),
      radL: gl.getUniformLocation(program, "uRadL"),
      radR: gl.getUniformLocation(program, "uRadR"),
      eyes: gl.getUniformLocation(program, "uEyes"),
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
    const ox = rx - 0.5;
    const oy = ry - 0.48;
    const dx = shown.x - rx;
    const dy = shown.y - ry;
    const shade = Math.max(-1, Math.min(1, (dx * ox + dy * oy) / 0.018 - dy * 1.15));
    const o = v * 5;
    verts[o] = (px / cssW) * 2 - 1;
    verts[o + 1] = 1 - (py / cssH) * 2;
    verts[o + 2] = u;
    verts[o + 3] = 1 - imageV;
    verts[o + 4] = shade;
  }
}

function paintGl(
  img: HTMLImageElement,
  body: SquishBody,
  visual: SquishVisual,
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
  const stride = 20;
  gl.enableVertexAttribArray(state.loc.pos);
  gl.vertexAttribPointer(state.loc.pos, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(state.loc.uv);
  gl.vertexAttribPointer(state.loc.uv, 2, gl.FLOAT, false, stride, 8);
  gl.enableVertexAttribArray(state.loc.shade);
  gl.vertexAttribPointer(state.loc.shade, 1, gl.FLOAT, false, stride, 16);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(state.loc.tex, 0);
  gl.uniform1f(state.loc.squint, visual.squint);
  gl.uniform1f(state.loc.press, visual.contact);
  const cu = map.u0 + ((visual.dentX + 1) / 2) * (map.u1 - map.u0);
  const cv = map.v0 + ((visual.dentY + 1) / 2) * (map.v1 - map.v0);
  gl.uniform2f(state.loc.contact, cu, cv);
  const eye = (spot: EyeSpot | null) => spot ?? { u: -1, v: -1, rx: 0.04, ry: 0.03 };
  const left = eye(map.eyeL);
  const right = eye(map.eyeR);
  gl.uniform2f(state.loc.eyeL, left.u, left.v);
  gl.uniform2f(state.loc.eyeR, right.u, right.v);
  gl.uniform2f(state.loc.radL, left.rx, left.ry);
  gl.uniform2f(state.loc.radR, right.rx, right.ry);
  gl.uniform1f(state.loc.eyes, map.eyeL && map.eyeR ? 1 : 0);
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
  const glCanvas = paintGl(img, body, visual, map, cssW, cssH, pxW, pxH);
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
