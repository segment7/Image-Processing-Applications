/*
 * Task1Carousel
 * Stage machine for q -> w -> e, owns the 8 cutouts + generated background,
 * and drives the three AnimatedLayer instances (person / caption / bg)
 * during the 'e' animation.
 */
class Task1Carousel {
  constructor(app) {
    this.app = app;
    this.stage = 'idle'; // idle -> loaded -> loadingImages -> imagesReady -> animating
    this.cutouts = [];
    this.currentIndex = 0;
    this.sequence = 'in';
    this.captionCache = {};
    this.presetIndex = 0; // index into WorleyNoise.PRESET_NAMES
  }

  handleKey(key) {
    if (key === 'q' && this.stage === 'idle') {
      this.stage = 'loaded';
    } else if (key === 'w' && this.stage === 'loaded') {
      this.loadImages();
    } else if (key === 'e' && this.stage === 'imagesReady') {
      this.startAnimation();
    } else if (key === 'r' && this.stage === 'animating') {
      this.cycleBackdropPreset();
    }
  }

  loadImages() {
    this.stage = 'loadingImages';
    this.app.lock();

    let remaining = TASK1_IMAGE_FILES.length;
    TASK1_IMAGE_FILES.forEach((path, i) => {
      loadImage(path, (img) => {
        const cutout = Cutout.remove(img, thresholds[i]);
        const person = PixelEffects.cropToContent(cutout);
        this.cutouts[i] = PixelEffects.scaleToFit(person, 450, 400);
        remaining--;
        if (remaining === 0) this.onImagesReady();
      });
    });
  }

  onImagesReady() {
    this.palettes = this.cutouts.map((cutout) => BackgroundGenerator.extractPalette(cutout));
    BackgroundGenerator.generateField(WorleyNoise.PRESET_NAMES[this.presetIndex], width, height);
    this.stage = 'imagesReady';
    this.app.unlock();
  }

  // Extension: regenerates the backdrop with the next Worley noise preset.
  cycleBackdropPreset() {
    this.presetIndex = (this.presetIndex + 1) % WorleyNoise.PRESET_NAMES.length;
    BackgroundGenerator.generateField(WorleyNoise.PRESET_NAMES[this.presetIndex], width, height);
    this.renderBackdropForCurrentPerson();
  }

  // The simulated pattern is shared.
  renderBackdropForCurrentPerson() {
    this.backgroundImage = BackgroundGenerator.render(this.palettes[this.currentIndex]);
  }

  startAnimation() {
    this.stage = 'animating';
    this.currentIndex = 0;
    this.sequence = 'in';
    this.personLayer = new AnimatedLayer({ mode: 'cycle', direction: 1, canvasWidth: width });
    this.textLayer = new AnimatedLayer({ mode: 'cycle', direction: -1, canvasWidth: width });
    this.backgroundLayer = new AnimatedLayer({ mode: 'loop', direction: 1, canvasWidth: width, speed: 25 });
    this.beginImageCycle();
  }

  beginImageCycle() {
    this.renderBackdropForCurrentPerson();

    const cutout = this.cutouts[this.currentIndex];
    this.currentPersonPixels = PixelUtils.copyPixels(cutout);
    this.currentPersonSize = { w: cutout.width, h: cutout.height };
    this.personLayer.start(this.sequence, cutout.width);

    const caption = this.buildCaptionBuffer(TASK1_CAPTIONS[this.currentIndex]);
    this.currentCaptionPixels = caption.pixels;
    this.currentCaptionSize = { w: caption.width, h: caption.height };
    this.textLayer.start(this.sequence, caption.width);
  }

  buildCaptionBuffer(label) {
    if (this.captionCache[label]) return this.captionCache[label];
    const w = 320, h = 90;
    const gfx = createGraphics(w, h);
    // keeps the pixel array's layout identical to the dimensions we carry around with it.
    gfx.pixelDensity(1);
    gfx.clear();
    gfx.textAlign(CENTER, CENTER);
    gfx.textSize(36);
    gfx.fill(255);
    gfx.noStroke();
    gfx.text(label, w / 2, h / 2);
    gfx.loadPixels();
    const result = { pixels: Uint8ClampedArray.from(gfx.pixels), width: w, height: h };
    this.captionCache[label] = result;
    return result;
  }

  update(dt) {
    if (this.stage !== 'animating') return;

    this.backgroundLayer.update(dt);
    this.personLayer.update(dt);
    this.textLayer.update(dt);

    if (this.personLayer.isDone()) {
      this.currentIndex = (this.currentIndex + 1) % this.cutouts.length;
      this.sequence = this.sequence === 'in' ? 'out' : 'in';
      this.beginImageCycle();
    }
  }

  render() {
    background(15);

    if (this.stage === 'idle') {
      this.renderHint('Press q to load the carousel');
    } else if (this.stage === 'loaded') {
      this.renderHint('Press w to load the 8 images');
    } else if (this.stage === 'loadingImages') {
      this.renderHint('Loading...');
    } else if (this.stage === 'imagesReady') {
      this.renderHint('Press e to start the animation');
    } else if (this.stage === 'animating') {
      this.renderBackgroundLayer();
      this.renderPersonLayer();
      this.renderCaptionLayer();
      this.renderBackdropHint();
    }
  }

  renderBackdropHint() {
    fill(255);
    noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(14);
    text(`r: backdrop pattern (${WorleyNoise.PRESET_NAMES[this.presetIndex]})`, 12, height - 10);
  }

  renderHint(msg) {
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    text(msg, width / 2, height / 2);
  }

  renderBackgroundLayer() {
    const p = this.backgroundLayer.getRenderParams();
    image(this.backgroundImage, p.x, 0);
    image(this.backgroundImage, p.x - width, 0);
    image(this.backgroundImage, p.x + width, 0);
  }

  renderPersonLayer() {
    this.renderSprite(this.personLayer, this.currentPersonPixels, this.currentPersonSize, height / 2);
  }

  renderCaptionLayer() {
    const { h } = this.currentCaptionSize;
    this.renderSprite(this.textLayer, this.currentCaptionPixels, this.currentCaptionSize, height * 0.15 + h / 2);
  }

  renderSprite(layer, srcPixels, size, centreY) {
    const p = layer.getRenderParams();
    const growth = Math.max(p.scale, 1);
    const outW = Math.round(size.w * growth);
    const outH = Math.round(size.h * growth);

    const buffer = PixelEffects.zoomToCanvas(srcPixels, size.w, size.h, p.scale, outW, outH);
    PixelEffects.applyAlphaFade(buffer, p.alpha);
    const sprite = PixelUtils.bufferToImage(buffer, outW, outH);
    image(sprite, p.x - (outW - size.w) / 2, centreY - outH / 2);
  }
}
