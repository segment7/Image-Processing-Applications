/*
 * WorleyNoise
 * Cellular noise, the generator behind Task 1's backdrop.
 *
 * The cell grid wraps: neighbour cell indices are taken modulo the grid size,
 * so points just inside one edge also count for pixels just inside the
 * opposite edge. The texture is continuous across its borders and tiles
 * seamlessly, which is what lets the carousel scroll it without a visible join.
 */
const WorleyNoise = {
  // contrast is an exponent applied when colouring: a high value squeezes
  // the soft F2-F1 falloff into thin, crisp walls.
  PRESETS: {
    membranes: { cellSize: 60, metric: 'euclidean', feature: 'walls', contrast: 6 },
    cells: { cellSize: 45, metric: 'euclidean', feature: 'nearest', contrast: 1.5 },
    crystals: { cellSize: 75, metric: 'manhattan', feature: 'walls', contrast: 4 }
  },
  PRESET_NAMES: ['membranes', 'cells', 'crystals'],

  generate(width, height, presetName) {
    const { cellSize, metric, feature, contrast } = this.PRESETS[presetName];

    // A whole number of cells each way, so the wrap lands exactly on the edge.
    const cellsX = Math.round(width / cellSize);
    const cellsY = Math.round(height / cellSize);
    const cellW = width / cellsX;
    const cellH = height / cellsY;

    // Each cell's feature point.
    const jitterX = new Float32Array(cellsX * cellsY);
    const jitterY = new Float32Array(cellsX * cellsY);
    for (let c = 0; c < jitterX.length; c++) {
      jitterX[c] = Math.random();
      jitterY[c] = Math.random();
    }

    const values = new Float32Array(width * height);
    let min = Infinity;
    let max = -Infinity;

    for (let y = 0; y < height; y++) {
      const cellY = Math.floor(y / cellH);

      for (let x = 0; x < width; x++) {
        const cellX = Math.floor(x / cellW);
        let f1 = Infinity;
        let f2 = Infinity;

        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = cellX + ox;
            const ny = cellY + oy;
            // Wrap the lookup but keep the unwrapped position, so a point
            // borrowed from the far edge sits just beyond this one.
            const c = ((ny + cellsY) % cellsY) * cellsX + ((nx + cellsX) % cellsX);
            const dx = (nx + jitterX[c]) * cellW - x;
            const dy = (ny + jitterY[c]) * cellH - y;
            const distance = metric === 'manhattan'
              ? Math.abs(dx) + Math.abs(dy)
              : Math.sqrt(dx * dx + dy * dy);

            if (distance < f1) {
              f2 = f1;
              f1 = distance;
            } else if (distance < f2) {
              f2 = distance;
            }
          }
        }

        // Walls are where F2 - F1 is smallest; negating it makes them the
        // highest values, so they map to the lighter palette colour.
        const value = feature === 'walls' ? f1 - f2 : f1;
        values[y * width + x] = value;
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    return { values, width, height, min, max, contrast };
  }
};
