/*
 * Task2Panorama
 * Stage machine for p -> i -> g -> e -> t -> n -> d. Holds two FrameProcessor instances (Frame A / Frame B)
 */
class Task2Panorama {
  constructor(app) {
    this.app = app;
    this.stage = 'none';
    this.nextPairIndex = 0;
    this.thresholdValue = 60;
    this.slider = null;
    this.sliderVisible = false;
  }

  static SLIDER_STAGES = ['thresholded', 'centroid', 'arrow'];

  handleKey(key) {
    const transitions = {
      p: { from: 'none', run: () => this.loadScreen() },
      i: { from: ['screenLoaded', 'pairSelected', 'arrow'], run: () => this.loadPair() },
      g: { from: 'pairSelected', run: () => this.toGrayscale() },
      e: { from: 'gray', run: () => this.toEdges() },
      t: { from: 'edges', run: () => this.toThresholded() },
      n: { from: 'thresholded', run: () => this.computeCentroids() },
      d: { from: 'centroid', run: () => { this.stage = 'arrow'; } }
    };

    const t = transitions[key];
    if (!t) return;
    const allowedFrom = Array.isArray(t.from) ? t.from : [t.from];
    if (allowedFrom.includes(this.stage)) t.run();
  }

  loadScreen() {
    this.stage = 'screenLoaded';
  }

  createThresholdSlider() {
    const sliderWidth = 200;
    this.slider = createSlider(5, 255, this.thresholdValue, 1);
    this.slider.position((width - sliderWidth) / 2, height - 56);
    this.slider.style('width', `${sliderWidth}px`);
    this.slider.input(() => {
      this.thresholdValue = this.slider.value();
      this.toThresholded();
    });
  }

  syncSlider(forceHidden) {
    const visible = !forceHidden && Task2Panorama.SLIDER_STAGES.includes(this.stage);
    if (visible === this.sliderVisible) return;
    if (visible && !this.slider) this.createThresholdSlider();
    if (this.slider) visible ? this.slider.show() : this.slider.hide();
    this.sliderVisible = visible;
  }

  onDeactivate() {
    this.syncSlider(true);
  }

  onActivate() {
    this.syncSlider();
  }

  loadPair() {
    this.stage = 'loadingPair';
    this.app.lock();

    const pair = PAIRS[this.nextPairIndex];
    this.currentPair = pair;
    this.nextPairIndex = (this.nextPairIndex + 1) % PAIRS.length;

    const onBothLoaded = () => {
      this.stage = 'pairSelected';
      this.app.unlock();
    };

    let remaining = 2;
    const onOneLoaded = () => { remaining--; if (remaining === 0) onBothLoaded(); };

    loadImage(pair.a, (img) => { this.frameA = new FrameProcessor(img); onOneLoaded(); });
    loadImage(pair.b, (img) => { this.frameB = new FrameProcessor(img); onOneLoaded(); });
  }

  toGrayscale() {
    this.frameA.toGrayscale();
    this.frameB.toGrayscale();
    this.stage = 'gray';
  }

  toEdges() {
    this.frameA.toEdges();
    this.frameB.toEdges();
    this.stage = 'edges';
  }

  toThresholded() {
    this.frameA.toThresholded(this.thresholdValue);
    this.frameB.toThresholded(this.thresholdValue);
    if (this.stage !== 'centroid' && this.stage !== 'arrow') this.stage = 'thresholded';
    if (this.stage === 'centroid' || this.stage === 'arrow') this.computeCentroids(true);
  }

  computeCentroids(keepStage) {
    const cA = this.frameA.computeCentroid();
    const cB = this.frameB.computeCentroid();
    const dx = cB.cx - cA.cx;
    const dy = cB.cy - cA.cy;
    this.motion = { cA, cB, dx, dy, direction: MotionAnalysis.classifyDirection(dx, dy) };
    if (!keepStage) this.stage = 'centroid';
  }

  update() {
    // No per-frame animation in Task 2;
  }

  render() {
    background(15);
    this.syncSlider();

    if (this.stage === 'none') {
      this.renderHint('Press p to load the panorama guide screen');
      return;
    }
    if (this.stage === 'screenLoaded') {
      this.renderHint('Press i to load an image pair');
      return;
    }
    if (this.stage === 'loadingPair') {
      this.renderHint('Loading pair...');
      return;
    }

    const slotW = width / 2 - 40;
    const slotH = height - 170;
    // 'd' restores the original colour frames.
    const displayStage = (this.stage === 'pairSelected' || this.stage === 'arrow') ? 'raw'
      : this.stage === 'gray' ? 'gray'
      : this.stage === 'edges' ? 'edges'
      : 'thresholded';

    const imgA = displayStage === 'raw' ? this.frameA.img : this.frameA.toDisplayImage(displayStage);
    const imgB = displayStage === 'raw' ? this.frameB.img : this.frameB.toDisplayImage(displayStage);
    const dispA = PixelEffects.scaleToFit(imgA, slotW, slotH);
    const dispB = PixelEffects.scaleToFit(imgB, slotW, slotH);

    const yTop = 50;
    image(dispA, 20, yTop);
    image(dispB, width / 2 + 20, yTop);

    fill(255);
    noStroke();
    textAlign(CENTER, TOP);
    textSize(16);
    text('Frame A', 20 + dispA.width / 2, yTop + dispA.height + 8);
    text('Frame B', width / 2 + 20 + dispB.width / 2, yTop + dispB.height + 8);

    if (this.stage === 'centroid' || this.stage === 'arrow') {
      this.renderCentroidMarkers(dispA, dispB, slotW, slotH, yTop);
    }

    if (this.stage === 'arrow') {
      ArrowOverlay.draw(this.motion.direction, width / 2, height / 2 + 10);
      this.renderCheck();
    }

    this.renderHint(this.getHint());
  }

  renderCentroidMarkers(dispA, dispB, slotW, slotH, yTop) {
    const scaleA = dispA.width / this.frameA.width;
    const scaleB = dispB.width / this.frameB.width;

    const drawMark = (x0, cx, cy, scale) => {
      const mx = x0 + cx * scale;
      const my = yTop + cy * scale;
      stroke(0, 255, 120);
      strokeWeight(3);
      line(mx - 12, my, mx + 12, my);
      line(mx, my - 12, mx, my + 12);
    };
    drawMark(20, this.motion.cA.cx, this.motion.cA.cy, scaleA);
    drawMark(width / 2 + 20, this.motion.cB.cx, this.motion.cB.cy, scaleB);
  }

  renderCheck() {
    const got = this.motion.direction;
    fill('green');
    noStroke();
    textAlign(CENTER, TOP);
    textSize(20);
    text(`detected: ${got}`, width / 2, height - 150);
  }

  getHint() {
    switch (this.stage) {
      case 'pairSelected': return 'Press g for grayscale  or  i = switch';
      case 'gray': return 'Press e for edge detection';
      case 'edges': return 'Press t to threshold the edge images';
      case 'thresholded': return 'Press n for centroids';
      case 'centroid': return 'Press d to show the direction';
      case 'arrow': return 'Press i to try another pair';
      default: return '';
    }
  }

  renderHint(msg) {
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    if (this.stage === 'none' || this.stage === 'screenLoaded' || this.stage === 'loadingPair') {
      text(msg, width / 2, height / 2);
    } else {
      text(msg, width / 2, height - 20);
    }
  }
}
