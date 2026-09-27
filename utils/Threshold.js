/*
 * Threshold
 * Shared "is this pixel background / is this pixel a strong edge" predicates.
 * Both Task 1 (colour-key background removal) and Task 2 (edge-map binary
 * threshold) funnel through this one module.
 */
const Threshold = {
  // Task 1: colour-key background test.
  // thresholdConfig = [colourSpace, c1, c2, c3, c4?]
  //   colourSpace 0 (RGB):  [0, minR, minG, minB, maxChannelSpread]
  //   colourSpace 1 (HSB):  [1, maxSaturation, minBrightness]

  isBackgroundPixel(r, g, b, thresholdConfig) {
    const colourSpace = thresholdConfig[0];

    if (colourSpace === 0) {
      const [, minR, minG, minB, maxChannelSpread] = thresholdConfig;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      return r >= minR && g >= minG && b >= minB && spread <= maxChannelSpread;
    }

    if (colourSpace === 1) {
      const [, maxSaturation, minBrightness] = thresholdConfig;
      const [, s, br] = ColorSpace.rgbToHsb(r, g, b);
      return s <= maxSaturation && br >= minBrightness;
    }

    throw new Error(`Unknown colourSpace in threshold config: ${colourSpace}`);
  },

  // Task 2: single-channel edge-strength threshold.
  isStrongEdge(edgeValue, thresholdValue) {
    return edgeValue >= thresholdValue;
  }
};
