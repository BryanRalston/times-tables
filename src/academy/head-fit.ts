/**
 * Where each squishee's head is in its 1024x1024 art, so boss hats sit on it.
 * Generated from the PNG alpha by scripts/measure-squishee-heads.py:
 * top = first row at least 45% as wide as the body (skips leaves and ear tips),
 * cx and w = median head span over the next 30% of the body,
 * eye = first row of dark pupil pixels inside the head (hats must stay above it).
 * Fractions of the image width (cx, w) and height (top, eye).
 */
export interface HeadFit {
  top: number;
  cx: number;
  w: number;
  eye: number | null;
}

export const HEAD_FIT: Readonly<Record<string, HeadFit>> = {
  "aurora-jelly": { top: 0.130, cx: 0.501, w: 0.626, eye: 0.345 },
  "avocado": { top: 0.230, cx: 0.507, w: 0.413, eye: 0.370 },
  "axolotl": { top: 0.167, cx: 0.528, w: 0.751, eye: 0.329 },
  "bear": { top: 0.184, cx: 0.502, w: 0.496, eye: 0.355 },
  "blush-cloud": { top: 0.227, cx: 0.500, w: 0.616, eye: 0.429 },
  "boba": { top: 0.146, cx: 0.504, w: 0.622, eye: 0.387 },
  "bun": { top: 0.277, cx: 0.512, w: 0.509, eye: 0.468 },
  "bunny": { top: 0.262, cx: 0.500, w: 0.556, eye: 0.439 },
  "cactus": { top: 0.251, cx: 0.551, w: 0.708, eye: 0.399 },
  "capybara": { top: 0.170, cx: 0.577, w: 0.737, eye: null },
  "cat": { top: 0.235, cx: 0.500, w: 0.564, eye: 0.453 },
  "chick": { top: 0.252, cx: 0.500, w: 0.458, eye: 0.415 },
  "comet-turtle": { top: 0.213, cx: 0.510, w: 0.681, eye: null },
  "cookie": { top: 0.204, cx: 0.502, w: 0.554, eye: 0.241 },
  "corn": { top: 0.196, cx: 0.503, w: 0.434, eye: 0.417 },
  "crystal-axolotl": { top: 0.232, cx: 0.511, w: 0.694, eye: 0.340 },
  "donut": { top: 0.192, cx: 0.502, w: 0.577, eye: 0.576 },
  "duck": { top: 0.207, cx: 0.502, w: 0.433, eye: 0.343 },
  "dumpling": { top: 0.181, cx: 0.510, w: 0.657, eye: 0.413 },
  "fox": { top: 0.186, cx: 0.503, w: 0.527, eye: 0.360 },
  "frog": { top: 0.225, cx: 0.500, w: 0.582, eye: 0.252 },
  "frost-bun": { top: 0.277, cx: 0.518, w: 0.529, eye: 0.480 },
  "galaxy-narwhal": { top: 0.240, cx: 0.512, w: 0.587, eye: null },
  "golden-dragon": { top: 0.181, cx: 0.501, w: 0.506, eye: 0.298 },
  "grape": { top: 0.261, cx: 0.501, w: 0.517, eye: 0.501 },
  "hedgehog": { top: 0.174, cx: 0.507, w: 0.516, eye: 0.344 },
  "ice-phoenix": { top: 0.218, cx: 0.504, w: 0.509, eye: 0.383 },
  "kiwi": { top: 0.277, cx: 0.507, w: 0.491, eye: 0.486 },
  "koala": { top: 0.188, cx: 0.513, w: 0.691, eye: 0.388 },
  "lava-panda": { top: 0.203, cx: 0.504, w: 0.572, eye: null },
  "lemon": { top: 0.310, cx: 0.506, w: 0.564, eye: 0.441 },
  "matcha": { top: 0.229, cx: 0.513, w: 0.479, eye: 0.522 },
  "melon": { top: 0.312, cx: 0.514, w: 0.425, eye: 0.520 },
  "midnight-cat": { top: 0.233, cx: 0.500, w: 0.564, eye: null },
  "mint-dragon": { top: 0.179, cx: 0.503, w: 0.488, eye: 0.296 },
  "mushroom": { top: 0.184, cx: 0.505, w: 0.573, eye: 0.615 },
  "nebula-fox": { top: 0.185, cx: 0.504, w: 0.529, eye: 0.205 },
  "opal-otter": { top: 0.211, cx: 0.509, w: 0.500, eye: 0.301 },
  "otter": { top: 0.206, cx: 0.500, w: 0.481, eye: 0.310 },
  "owl": { top: 0.223, cx: 0.500, w: 0.485, eye: 0.384 },
  "panda": { top: 0.218, cx: 0.500, w: 0.569, eye: null },
  "peach": { top: 0.303, cx: 0.500, w: 0.515, eye: 0.501 },
  "pearl-whale": { top: 0.213, cx: 0.518, w: 0.555, eye: 0.352 },
  "penguin": { top: 0.206, cx: 0.500, w: 0.497, eye: 0.310 },
  "pig": { top: 0.188, cx: 0.502, w: 0.494, eye: 0.371 },
  "pretzel": { top: 0.191, cx: 0.510, w: 0.642, eye: 0.422 },
  "prism-bunny": { top: 0.244, cx: 0.507, w: 0.593, eye: 0.429 },
  "rainbow-cupcake": { top: 0.267, cx: 0.511, w: 0.432, eye: 0.628 },
  "red-panda": { top: 0.139, cx: 0.486, w: 0.632, eye: 0.355 },
  "shark": { top: 0.281, cx: 0.487, w: 0.447, eye: 0.419 },
  "sleepy-moon": { top: 0.152, cx: 0.445, w: 0.404, eye: 0.453 },
  "sloth": { top: 0.147, cx: 0.508, w: 0.472, eye: 0.315 },
  "star-mochi": { top: 0.318, cx: 0.502, w: 0.710, eye: 0.454 },
  "strawberry": { top: 0.227, cx: 0.500, w: 0.541, eye: 0.437 },
  "sugar-comet": { top: 0.262, cx: 0.607, w: 0.650, eye: 0.544 },
  "sunset-sloth": { top: 0.155, cx: 0.508, w: 0.488, eye: 0.348 },
  "sushi": { top: 0.189, cx: 0.514, w: 0.566, eye: 0.464 },
  "taco": { top: 0.287, cx: 0.505, w: 0.525, eye: 0.492 },
  "toast": { top: 0.169, cx: 0.568, w: 0.678, eye: 0.346 },
  "waffle": { top: 0.203, cx: 0.504, w: 0.606, eye: 0.383 },
  "whale": { top: 0.222, cx: 0.509, w: 0.537, eye: 0.356 },
};

const FALLBACK: HeadFit = { top: 0.22, cx: 0.5, w: 0.52, eye: null };

export function headFit(id: string): HeadFit {
  return HEAD_FIT[id] ?? FALLBACK;
}
