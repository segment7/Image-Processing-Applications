/*
 * PixelUtils
 * Low-level helpers for working directly on p5 pixel arrays (pixels[]).
 */
const PixelUtils = {
  // (x, y) -> index of the red channel for a width-wide RGBA pixel array.
  index(x, y, width) {
    return (y * width + x) * 4;
  },

  inBounds(x, y, width, height) {
    return x >= 0 && y >= 0 && x < width && y < height;
  },

  // Runs callback(x, y, r, g, b, a, i) for every pixel of an RGBA array.
  // If callback returns an [r, g, b, a] array, those values are written
  // back into `pixels` at the same index (in place).
  forEachPixel(pixels, width, height, callback) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = this.index(x, y, width);
        const result = callback(
          x, y,
          pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3],
          i
        );
        if (result) {
          pixels[i] = result[0];
          pixels[i + 1] = result[1];
          pixels[i + 2] = result[2];
          pixels[i + 3] = result[3];
        }
      }
    }
  },

  // Builds a ready-to-draw p5.Image from a raw RGBA buffer.
  bufferToImage(buffer, width, height) {
    const img = createImage(width, height);
    img.loadPixels();
    for (let i = 0; i < buffer.length; i++) {
      img.pixels[i] = buffer[i];
    }
    img.updatePixels();
    return img;
  },

  // Copies an image's pixel data out into a fresh RGBA array to mutate
  // freely without disturbing the source p5.Image.
  copyPixels(img) {
    img.loadPixels();
    return Uint8ClampedArray.from(img.pixels);
  },

  // RGBA buffer -> single-channel buffer (one value per pixel), using the
  // supplied per-pixel function, e.g. ColorSpace.rgbToGray
  toSingleChannel(rgbaPixels, width, height, perPixelFn) {
    const out = new Float32Array(width * height);
    for (let p = 0, i = 0; p < out.length; p++, i += 4) {
      out[p] = perPixelFn(rgbaPixels[i], rgbaPixels[i + 1], rgbaPixels[i + 2]);
    }
    return out;
  },

  // single-channel buffer -> RGBA buffer (replicated into R/G/B, alpha 255)
  singleChannelToRGBA(buffer, width, height) {
    const out = new Uint8ClampedArray(width * height * 4);
    for (let p = 0, i = 0; p < buffer.length; p++, i += 4) {
      const v = buffer[p];
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
    return out;
  }
};
