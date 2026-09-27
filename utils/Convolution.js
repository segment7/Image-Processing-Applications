/*
 * Convolution
 * Generic 3x3 convolution over a single-channel buffer, plus a Sobel edge
 * filter built on top of it.
 */
const Convolution = {
  apply3x3(buffer, width, height, kernel) {
    const out = new Float32Array(width * height);
    const sample = (x, y) => {
      const cx = Math.min(Math.max(x, 0), width - 1);
      const cy = Math.min(Math.max(y, 0), height - 1);
      return buffer[cy * width + cx];
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let k = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += sample(x + kx, y + ky) * kernel[k];
            k++;
          }
        }
        out[y * width + x] = sum;
      }
    }
    return out;
  },

  // Sobel gradient magnitude, clamped to 0-255.
  sobelEdgeMagnitude(grayBuffer, width, height) {
    const gx = this.apply3x3(grayBuffer, width, height, [
      -1, 0, 1,
      -2, 0, 2,
      -1, 0, 1
    ]);
    const gy = this.apply3x3(grayBuffer, width, height, [
      -1, -2, -1,
       0,  0,  0,
       1,  2,  1
    ]);

    const out = new Float32Array(width * height);
    for (let i = 0; i < out.length; i++) {
      const magnitude = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]);
      out[i] = Math.min(255, magnitude);
    }
    return out;
  }
};
