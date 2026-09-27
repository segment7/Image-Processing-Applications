/*
 * BackgroundGenerator
 * Task 1's extension: the carousel backdrop is synthesised, not loaded from a
 * file. Worley cellular noise (utils/WorleyNoise.js) generates an organic
 * cell pattern once, and each portrait recolours it with the two dominant
 * colours of that person's clothing, found by k-means clustering
 * (utils/ColorQuantizer.js). The pattern is shared; the palette is per person.
 */
const BackgroundGenerator = {
  // Clothing sits in the lower part of a cropped portrait; sampling the face
  // and hair above it would let skin and hair tones take over the clusters.
  GARMENT_REGION_START: 0.55,
  SAMPLE_STRIDE: 3, // every 3rd pixel each way is plenty for two clusters

  field: null,

  generateField(presetName, width, height) {
    this.field = WorleyNoise.generate(width, height, presetName);
  },

  // Returns the two dominant garment colours, darker first, so the pattern's
  // structure consistently renders in the lighter one whoever is on screen.
  extractPalette(cutout) {
    const pixels = PixelUtils.copyPixels(cutout);
    const startY = Math.floor(cutout.height * this.GARMENT_REGION_START);
    const samples = [];

    for (let y = startY; y < cutout.height; y += this.SAMPLE_STRIDE) {
      for (let x = 0; x < cutout.width; x += this.SAMPLE_STRIDE) {
        const i = PixelUtils.index(x, y, cutout.width);
        if (pixels[i + 3] > 0) samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
      }
    }

    const luma = ([r, g, b]) => ColorSpace.rgbToGray(r, g, b);
    return ColorQuantizer.kMeans(samples, 2).sort((a, b) => luma(a) - luma(b));
  },

  // Maps the field onto the palette. The preset's contrast exponent sharpens
  // the falloff so cell walls read as crisp lines.
  render(palette) {
    const { values, width, height, min, max, contrast } = this.field;
    const [dark, light] = palette;
    const range = max - min;
    const buffer = new Uint8ClampedArray(width * height * 4);

    for (let p = 0; p < values.length; p++) {
      const t = Math.pow((values[p] - min) / range, contrast);
      const i = p * 4;
      buffer[i] = dark[0] + (light[0] - dark[0]) * t;
      buffer[i + 1] = dark[1] + (light[1] - dark[1]) * t;
      buffer[i + 2] = dark[2] + (light[2] - dark[2]) * t;
      buffer[i + 3] = 255;
    }
    return PixelUtils.bufferToImage(buffer, width, height);
  }
};
