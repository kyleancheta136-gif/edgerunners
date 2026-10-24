export const TRAIN_STATES = Object.freeze({
  APPROACH: 'APPROACH',
  BRAKE: 'BRAKE',
  STOP: 'STOP',
  OPEN_DOORS: 'OPEN_DOORS',
  PASSENGERS_EXIT: 'PASSENGERS_EXIT',
  PASSENGERS_BOARD: 'PASSENGERS_BOARD',
  CLOSE_DOORS: 'CLOSE_DOORS',
  DEPART: 'DEPART',
  RETURN_LATER: 'RETURN_LATER',
});

const NEXT_STATE = {
  APPROACH: TRAIN_STATES.BRAKE,
  BRAKE: TRAIN_STATES.STOP,
  STOP: TRAIN_STATES.OPEN_DOORS,
  OPEN_DOORS: TRAIN_STATES.PASSENGERS_EXIT,
  PASSENGERS_EXIT: TRAIN_STATES.PASSENGERS_BOARD,
  PASSENGERS_BOARD: TRAIN_STATES.CLOSE_DOORS,
  CLOSE_DOORS: TRAIN_STATES.DEPART,
  DEPART: TRAIN_STATES.RETURN_LATER,
  RETURN_LATER: TRAIN_STATES.APPROACH,
};

export class TrainService {
  constructor(config, hooks = {}) {
    this.config = config;
    this.hooks = hooks;
    this.state = TRAIN_STATES.APPROACH;
    this.stateElapsed = 0;
    this.cycleElapsed = 0;
    this.cycle = 0;
    this.x = config.startX;
    this.doors = 0;
  }

  get visible() {
    return this.state !== TRAIN_STATES.RETURN_LATER;
  }

  get display() {
    const labels = {
      APPROACH: 'ARRIVING // LINE 09',
      BRAKE: 'ARRIVING // STAND CLEAR',
      STOP: 'STOPPED // DOORS STANDBY',
      OPEN_DOORS: 'DOORS OPENING',
      PASSENGERS_EXIT: 'EXITING // LET PASSENGERS OFF',
      PASSENGERS_BOARD: 'BOARDING // SUMMIT LOOP',
      CLOSE_DOORS: this.doors > 0.99 && this.stateElapsed === 0 ? 'WAITING // DOORWAY CLEARANCE' : 'DOORS CLOSING',
      DEPART: 'DEPARTING // CITY CENTER',
      RETURN_LATER: `NEXT SERVICE // ${Math.max(0, Math.ceil(this.totalDuration - this.cycleElapsed))}S`,
    };
    return labels[this.state];
  }

  get totalDuration() {
    return Object.values(this.config.timing).reduce((total, duration) => total + duration, 0);
  }

  transition(next) {
    const previous = this.state;
    this.state = next;
    this.stateElapsed = 0;
    if (next === TRAIN_STATES.APPROACH) {
      this.cycle += 1;
      this.cycleElapsed = 0;
      this.x = this.config.startX;
      this.hooks.onCycle?.(this.cycle);
    }
    this.hooks.onTransition?.(next, previous);
  }

  update(delta, { arrivalsClear = true, doorsClear = true } = {}) {
    let remaining = Math.min(Math.max(delta, 0), 0.25);
    while (remaining > 1e-8) {
      const duration = this.config.timing[this.state];
      const blockedAtExit = this.state === TRAIN_STATES.PASSENGERS_EXIT && !arrivalsClear;
      const blockedAtClose = this.state === TRAIN_STATES.CLOSE_DOORS && !doorsClear;
      const available = blockedAtExit || blockedAtClose ? 0 : duration - this.stateElapsed;
      const step = Math.min(remaining, Math.max(available, 0));
      this.stateElapsed += step;
      this.cycleElapsed += step;
      remaining -= step;

      if (this.stateElapsed >= duration - 1e-8 && !blockedAtExit && !blockedAtClose) {
        this.transition(NEXT_STATE[this.state]);
        continue;
      }
      if (step === 0) break;
    }

    const { startX, brakeX, stopX, exitX } = this.config;
    const progress = Math.min(this.stateElapsed / this.config.timing[this.state], 1);
    if (this.state === TRAIN_STATES.APPROACH) this.x = startX + (brakeX - startX) * progress;
    if (this.state === TRAIN_STATES.BRAKE) this.x = brakeX + (stopX - brakeX) * (1 - (1 - progress) ** 2);
    if ([TRAIN_STATES.STOP, TRAIN_STATES.OPEN_DOORS, TRAIN_STATES.PASSENGERS_EXIT, TRAIN_STATES.PASSENGERS_BOARD, TRAIN_STATES.CLOSE_DOORS].includes(this.state)) this.x = stopX;
    if (this.state === TRAIN_STATES.DEPART) this.x = stopX + (exitX - stopX) * progress ** 2;
    if (this.state === TRAIN_STATES.RETURN_LATER) this.x = exitX;

    if (this.state === TRAIN_STATES.OPEN_DOORS) this.doors = progress;
    else if ([TRAIN_STATES.PASSENGERS_EXIT, TRAIN_STATES.PASSENGERS_BOARD].includes(this.state)) this.doors = 1;
    else if (this.state === TRAIN_STATES.CLOSE_DOORS) this.doors = 1 - progress;
    else this.doors = 0;

    return this;
  }
}
