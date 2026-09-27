/*
 * ColorQuantizer
 * k-means clustering over RGB samples. Task 1's backdrop uses it to find the
 * two dominant colours of a person's clothing, so each portrait drives its
 * own colour scheme.
 */
const ColorQuantizer = {
  // samples: array of [r, g, b]. Returns k centroids as [r, g, b].
  kMeans(samples, k, maxIterations = 12) {
    const centroids = this.initialCentroids(samples, k);
    const assignments = new Int32Array(samples.length);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let changed = false;

      for (let s = 0; s < samples.length; s++) {
        const nearest = this.nearestCentroid(samples[s], centroids);
        if (assignments[s] !== nearest) {
          assignments[s] = nearest;
          changed = true;
        }
      }
      // Converged: another pass would produce identical centroids.
      if (!changed && iteration > 0) break;

      const sums = centroids.map(() => [0, 0, 0, 0]); // r, g, b, count
      for (let s = 0; s < samples.length; s++) {
        const bucket = sums[assignments[s]];
        bucket[0] += samples[s][0];
        bucket[1] += samples[s][1];
        bucket[2] += samples[s][2];
        bucket[3]++;
      }
      for (let c = 0; c < centroids.length; c++) {
        const [r, g, b, count] = sums[c];
        // An empty cluster keeps its previous position.
        if (count > 0) centroids[c] = [r / count, g / count, b / count];
      }
    }
    return centroids;
  },

  // Farthest-point initialisation
  initialCentroids(samples, k) {
    const mean = [0, 0, 0];
    for (const [r, g, b] of samples) {
      mean[0] += r / samples.length;
      mean[1] += g / samples.length;
      mean[2] += b / samples.length;
    }

    const centroids = [this.farthestFrom(samples, [mean])];
    while (centroids.length < k) {
      centroids.push(this.farthestFrom(samples, centroids));
    }
    return centroids;
  },

  farthestFrom(samples, references) {
    let best = samples[0];
    let bestDistance = -1;
    for (const sample of samples) {
      let nearest = Infinity;
      for (const reference of references) {
        nearest = Math.min(nearest, this.squaredDistance(sample, reference));
      }
      if (nearest > bestDistance) {
        bestDistance = nearest;
        best = sample;
      }
    }
    return [best[0], best[1], best[2]];
  },

  nearestCentroid(sample, centroids) {
    let best = 0;
    let bestDistance = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const distance = this.squaredDistance(sample, centroids[c]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = c;
      }
    }
    return best;
  },

  squaredDistance(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return dr * dr + dg * dg + db * db;
  }
};
