/*
 * App
 * Top-level controller: global task switch (keys 1/2) + the key-lockout
 * mechanism that stops a key press from firing while an async
 * load or an in-progress transition would make it conflict with the current
 * state. Task1Carousel / Task2Panorama each own their own stage machine and
 * are only ever asked to handle a key while the app is unlocked.
 */
class App {
  constructor() {
    this.currentTask = null; // null | 'task1' | 'task2'
    this.locked = false;
    this.task1 = new Task1Carousel(this);
    this.task2 = new Task2Panorama(this);
  }

  lock() { this.locked = true; }
  unlock() { this.locked = false; }

  keyPressed(rawKey) {
    if (this.locked) return;
    const key = rawKey.toLowerCase();

    if (key === '1') { this.setTask('task1'); return; }
    if (key === '2') { this.setTask('task2'); return; }

    if (this.currentTask === 'task1') this.task1.handleKey(key);
    else if (this.currentTask === 'task2') this.task2.handleKey(key);
  }

  setTask(task) {
    if (this.currentTask === task) return;
    const prev = this.getInstance(this.currentTask);
    if (prev && prev.onDeactivate) prev.onDeactivate();

    this.currentTask = task;
    const next = this.getInstance(task);
    if (next.onActivate) next.onActivate();
  }

  getInstance(task) {
    if (task === 'task1') return this.task1;
    if (task === 'task2') return this.task2;
    return null;
  }

  update(dt) {
    if (this.currentTask === 'task1') this.task1.update(dt);
    else if (this.currentTask === 'task2') this.task2.update(dt);
  }

  render() {
    if (this.currentTask === 'task1') this.task1.render();
    else if (this.currentTask === 'task2') this.task2.render();
    else this.renderWelcome();
  }

  renderWelcome() {
    background(15);
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(22);
    text('Press 1 for Task 1\nPress 2 for Task 2', width / 2, height / 2);
  }
}
