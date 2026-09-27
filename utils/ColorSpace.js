/*
 * ColorSpace
 * Manual colour-space math, applied per pixel.
 */
const ColorSpace = {
  // RGB (0-255 each) -> HSB, h in [0,360), s and b in [0,1].
  rgbToHsb(r, g, b) {
    const rN = r / 255, gN = g / 255, bN = b / 255;
    const max = Math.max(rN, gN, bN);
    const min = Math.min(rN, gN, bN);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rN) h = 60 * (((gN - bN) / delta) % 6);
      else if (max === gN) h = 60 * ((bN - rN) / delta + 2);
      else h = 60 * ((rN - gN) / delta + 4);
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    const brightness = max;
    return [h, s, brightness];
  },

  rgbToGray(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
};
