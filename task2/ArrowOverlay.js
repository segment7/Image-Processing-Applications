/*
 * ArrowOverlay
 * Draws the large direction-indicator arrow.
 */
const ArrowOverlay = {
  DIRECTION_ANGLES: {
    RIGHT: 0, 'DOWN-RIGHT': 45, DOWN: 90, 'DOWN-LEFT': 135,
    LEFT: 180, 'UP-LEFT': 225, UP: 270, 'UP-RIGHT': 315
  },

  draw(directionLabel, cx, cy) {
    const angle = this.DIRECTION_ANGLES[directionLabel];
    if (angle === undefined) return;

    const shaftLen = 100;
    const headLen = 40, headWidth = 50;

    push();
    translate(cx, cy);
    rotate(radians(angle));

    stroke(0, 255, 120);
    strokeWeight(12);
    line(-shaftLen, 0, shaftLen, 0);

    noStroke();
    fill(0, 255, 120);
    triangle(
      shaftLen + 15, 0,
      shaftLen + 15 - headLen, -headWidth / 2,
      shaftLen + 15 - headLen, headWidth / 2
    );
    pop();
  }
};
