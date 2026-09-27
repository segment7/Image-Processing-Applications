/*
 * Commentary
 * -----------------------------------------------------------------------
 * Walkthrough. Key 1 opens Task 1 and key 2 opens Task 2.
 *
 * Task 1. 
 * q loads the carousel and w loads the eight portraits, removing each background 
 * with its own entry in thresholds[i] = [colourSpace, ...]. I tuned every image 
 * in both RGB and HSB and kept the cleaner result: six use HSB (low saturation, 
 * high brightness) and two use RGB with an extra channel-spread limit. Each
 * cutout is then cropped to the subject's bounding box and scaled to a
 * common size. e starts the animation: the person fades in, zooms in and
 * fades out, then fades in, zooms out and fades out, while moving left to
 * right. The caption repeats the sequence right to left and the backdrop
 * scrolls left to right. Zoom and fade are manual pixel operations.
 *
 * Task 2. 
 * p opens the screen and i loads the next of eight frame pairs. g, e and t produce 
 * grayscale, Sobel edge magnitude and a thresholded edge map for both frames, with 
 * a slider for live retuning. n averages the positions of the surviving pixels into 
 * each frame's centroid, and d classifies dx and dy into one of eight 45-degree
 * sectors, draws a large arrow and restores the colour frames. i is locked
 * from g until d, so a pair cannot change mid-analysis.
 *
 * Problems. 
 * Zooming inside a fixed-size buffer cropped the person, so the
 * buffer now grows with the zoom factor. Captions were invisible because
 * p5.Graphics inherits a pixel density of 2 on HiDPI screens, doubling its
 * pixel array; fixing the density at 1 solved it. Scaling whole photos
 * gave very different person sizes, because subjects fill different
 * fractions of their frames; cropping to the alpha bounding box first fixed
 * this. One hand-made pair was classified RIGHT instead of UP-RIGHT.
 * Replaying the pipeline offline showed my GIMP shift was only 21 degrees
 * above horizontal, inside the RIGHT sector, so I remade it and applied more 
 * degrees.
 *
 * On target? 
 * Yes: every required feature works and all eight pairs are classified correctly. 
 * 
 * Extension. 
 * The Task 1 backdrop is generated rather than loaded. Worley
 * cellular noise scatters one feature point per grid cell and measures each
 * pixel's distance to its nearest points; the difference between the
 * second-nearest and nearest distance traces a network of organic cell
 * walls. The cell grid wraps modulo its size, so the texture is continuous
 * across its edges and scrolls without a seam. Colour comes from the person
 * on screen: k-means clustering (k = 2) finds the two dominant colours of
 * each cutout's clothing, which recolour the pattern. Key r switches between
 * membrane, cell and crystal presets. It is unique because a static asset
 * becomes a procedural texture whose colours come from analysing each
 * portrait.
 * -----------------------------------------------------------------------
 */
let app;

function setup() {
  createCanvas(900, 600);
  app = new App();
}

function draw() {
  const dt = deltaTime / 1000;
  app.update(dt);
  app.render();
}

function keyPressed() {
  app.keyPressed(key);
}
