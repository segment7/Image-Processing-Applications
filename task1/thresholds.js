/*
 * Task 1 image list, carousel captions and per-image background-removal
 * thresholds. All three arrays are indexed by the same image index i.
 *
 * thresholds[i] = [colourSpace, c1, c2, c3, c4]
 *   colourSpace 0 = RGB : [0, minR, minG, minB, maxChannelSpread]
 *   colourSpace 1 = HSB : [1, maxSaturation, minBrightness]
 *
 * See Threshold.isBackgroundPixel() in utils/Threshold.js for exactly how
 * these are applied.
 */
const TASK1_IMAGE_FILES = [
  'assets/task1-images/1.jpg',
  'assets/task1-images/2.jpg',
  'assets/task1-images/3.jpg',
  'assets/task1-images/4.jpg',
  'assets/task1-images/5.jpg',
  'assets/task1-images/6.jpg',
  'assets/task1-images/7.jpg',
  'assets/task1-images/8.jpg'
];

const TASK1_CAPTIONS = [
  'Actor 1',
  'Actress 2',
  'Actor 3',
  'Actor 4',
  'Actor 5',
  'Actor 6',
  'Actor 7',
  'Actress 8'
];

const thresholds = [
  [1, 0.15, 0.48],
  [0, 240, 241, 243, 47],
  [1, 0.14, 0.77],
  [1, 0.05, 0.24],
  [1, 0.11, 0.66],
  [1, 0.09, 0.42],
  [1, 0.03, 0.98],
  [0, 209, 203, 200, 42]
];
