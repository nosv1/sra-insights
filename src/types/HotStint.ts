import { Lap } from './Lap';

export class HotStint {
    laps: Lap[];

    get totalTime(): number {
        return this.laps.reduce((sum, lap) => sum + lap.lapTime, 0);
    }

    get averageLapTime(): number {
        return this.totalTime / this.laps.length;
    }

    constructor(laps: Lap[]) {
        if (laps.length === 0) {
            throw new Error('Cannot create a HotStint with no laps');
        }
        this.laps = laps;
    }

    static fromLaps(laps: Lap[]): HotStint {
        return new HotStint(laps);
    }
}