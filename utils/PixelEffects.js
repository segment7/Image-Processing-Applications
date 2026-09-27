/*
 * PixelEffects
 * Implementations of the two per-frame transforms Task 1's animation needs: zoom and fade.
 */
const PixelEffects = {
  // Nearest-neighbour resample of `srcPixels` (srcW x srcH) into a canvasW x
  // canvasH buffer, magnified/minified by `factor` about its own centre.
  // factor > 1 => zoom in (source appears larger, edges get cropped).
  // factor < 1 => zoom out (source appears smaller, surrounded by
  // transparent pixels so the sprite's footprint stays canvasW x canvasH).
  zoomToCanvas(srcPixels, srcW, srcH, factor, canvasW, canvasH) {
    const out = new Uint8ClampedArray(canvasW * canvasH * 4);
    const srcCx = srcW / 2;
    const srcCy = srcH / 2;
    const dstCx = canvasW / 2;
    const dstCy = canvasH / 2;

    for (let y = 0; y < canvasH; y++) {
      for (let x = 0; x < canvasW; x++) {
        const sx = Math.round(srcCx + (x - dstCx) / factor);
        const sy = Math.round(srcCy + (y - dstCy) / factor);
        const di = (y * canvasW + x) * 4;

        if (sx >= 0 && sy >= 0 && sx < srcW && sy < srcH) {
          const si = (sy * srcW + sx) * 4;
          out[di] = srcPixels[si];
          out[di + 1] = srcPixels[si + 1];
          out[di + 2] = srcPixels[si + 2];
          out[di + 3] = srcPixels[si + 3];
        }
        // else: leave fully transparent (alpha 0).
      }
    }
    return out;
  },

  // Scales every pixel's existing alpha by `alphaFactor` (0..1), mutating
  // `pixels` in place. Applied to an already-cutout buffer, so this 
  // fades the visible foreground in/out.
  applyAlphaFade(pixels, alphaFactor) {
    for (let i = 3; i < pixels.length; i += 4) {
      pixels[i] = pixels[i] * alphaFactor;
    }
  },

  // Aspect-preserving resize of a p5.Image to fit inside maxW x maxH, via
  // the same manual resampler as the zoom animation - the one place both
  // Task 1's cutout downscale and Task 2's frame previews go through.
  scaleToFit(img, maxW, maxH) {
    const factor = Math.min(maxW / img.width, maxH / img.height);
    const outW = Math.round(img.width * factor);
    const outH = Math.round(img.height * factor);
    const srcPixels = PixelUtils.copyPixels(img);
    const buffer = this.zoomToCanvas(srcPixels, img.width, img.height, factor, outW, outH);
    return PixelUtils.bufferToImage(buffer, outW, outH);
  },

  // Crops a cutout down to the bounding box of its non-transparent pixels.
  cropToContent(img) {
    const srcW = img.width;
    const srcH = img.height;
    const srcPixels = PixelUtils.copyPixels(img);

    let minX = srcW, minY = srcH, maxX = -1, maxY = -1;
    PixelUtils.forEachPixel(srcPixels, srcW, srcH, (x, y, r, g, b, a) => {
      if (a > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return null;
    });

    if (maxX < minX) return img;

    const outW = maxX - minX + 1;
    const outH = maxY - minY + 1;
    const out = new Uint8ClampedArray(outW * outH * 4);
    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        const si = PixelUtils.index(minX + x, minY + y, srcW);
        const di = PixelUtils.index(x, y, outW);
        out[di] = srcPixels[si];
        out[di + 1] = srcPixels[si + 1];
        out[di + 2] = srcPixels[si + 2];
        out[di + 3] = srcPixels[si + 3];
      }
    }
    return PixelUtils.bufferToImage(out, outW, outH);
  }
};
