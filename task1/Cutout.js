/*
 * Cutout
 * Turns a portrait photo + its threshold config into a cutout p5.Image, with
 * background pixels set to alpha 0. The per-pixel decision is delegated to
 * Threshold.isBackgroundPixel, which reads the RGB-or-HSB mode from the config.
 */
const Cutout = {
  remove(img, thresholdConfig) {
    const width = img.width;
    const height = img.height;
    const pixels = PixelUtils.copyPixels(img);

    PixelUtils.forEachPixel(pixels, width, height, (x, y, r, g, b, a) => {
      if (Threshold.isBackgroundPixel(r, g, b, thresholdConfig)) {
        return [r, g, b, 0];
      }
      return null;
    });

    return PixelUtils.bufferToImage(pixels, width, height);
  }
};
