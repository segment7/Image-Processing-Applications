/*
 * MotionAnalysis
 * Centroid of a thresholded edge map, and 8-way direction classification from two centroids.
 */
const MotionAnalysis = {
  computeCentroid(buffer, width, height) {
    let sumX = 0, sumY = 0, count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (buffer[y * width + x] > 0) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    if (count === 0) return { cx: width / 2, cy: height / 2, count: 0 };
    return { cx: sumX / count, cy: sumY / count, count };
  },

  classifyDirection(dx, dy) {
    const magnitude = Math.hypot(dx, dy);
    if (magnitude < 1) return 'NONE';

    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180..180, y-down screen coords
    const sector = Math.round(angle / 45) * 45;
    const normalized = ((sector % 360) + 360) % 360;

    const DIRECTIONS = {
      0: 'RIGHT',
      45: 'DOWN-RIGHT',
      90: 'DOWN',
      135: 'DOWN-LEFT',
      180: 'LEFT',
      225: 'UP-LEFT',
      270: 'UP',
      315: 'UP-RIGHT'
    };
    return DIRECTIONS[normalized];
  }
};
