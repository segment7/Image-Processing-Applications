/*
 * AnimatedLayer
 * One reusable state machine used for three different things in the
 * carousel: the foreground cutout, the caption text, and the sliding
 * background.
 */
class AnimatedLayer {
  constructor({ mode, direction, canvasWidth, speed }) {
    this.mode = mode;
    this.direction = direction; // +1 = left-to-right, -1 = right-to-left
    this.canvasWidth = canvasWidth;
    this.speed = speed; // 'loop' mode, pixels per second

    this.FADE_DURATION = 1.4;
    this.ZOOM_DURATION = 3.4;
    this.ZOOM_IN_TARGET = 1.2;
    this.ZOOM_OUT_TARGET = 0.85;

    this.x = direction > 0 ? -canvasWidth : canvasWidth;
    this.alpha = 0;
    this.scale = 1;
    this.done = true;
  }

  // 'cycle' mode
  start(sequence, spriteWidth) {
    this.sequence = sequence;
    this.subPhase = 'fadeIn';
    this.t = 0;
    this.alpha = 0;
    this.scale = 1;
    this.done = false;
    this.elapsed = 0;
    this.totalDuration = this.FADE_DURATION * 2 + this.ZOOM_DURATION;

    const zoomOverhang = sequence === 'in' ? spriteWidth * (this.ZOOM_IN_TARGET - 1) / 2 : 0;
    const inset = zoomOverhang - spriteWidth * 0.1;
    const minX = inset;
    const maxX = this.canvasWidth - spriteWidth - inset;

    this.travelStart = this.direction > 0 ? minX : maxX;
    this.travelEnd = this.direction > 0 ? maxX : minX;
  }

  isDone() {
    return this.done;
  }

  update(dt) {
    if (this.mode === 'loop') {
      this.x += this.direction * this.speed * dt;
      if (this.direction > 0 && this.x > this.canvasWidth) {
        this.x = -this.canvasWidth;
      } else if (this.direction < 0 && this.x < -this.canvasWidth) {
        this.x = this.canvasWidth;
      }
      return;
    }

    if (this.done) return;

    this.elapsed += dt;
    const overallProgress = Math.min(this.elapsed / this.totalDuration, 1);
    this.x = this.travelStart + (this.travelEnd - this.travelStart) * overallProgress;

    if (this.subPhase === 'fadeIn') {
      this.t += dt / this.FADE_DURATION;
      this.alpha = Math.min(this.t, 1);
      this.scale = 1;
      if (this.t >= 1) { this.subPhase = 'zoom'; this.t = 0; }
    } else if (this.subPhase === 'zoom') {
      this.t += dt / this.ZOOM_DURATION;
      const target = this.sequence === 'in' ? this.ZOOM_IN_TARGET : this.ZOOM_OUT_TARGET;
      this.scale = 1 + (target - 1) * Math.min(this.t, 1);
      this.alpha = 1;
      if (this.t >= 1) { this.subPhase = 'fadeOut'; this.t = 0; }
    } else if (this.subPhase === 'fadeOut') {
      this.t += dt / this.FADE_DURATION;
      this.alpha = Math.max(1 - this.t, 0);
      if (this.t >= 1) { this.done = true; }
    }
  }

  getRenderParams() {
    return { x: this.x, alpha: this.alpha, scale: this.scale };
  }
}
