import { Lap } from './Lap';
export class Stint {
    laps: Lap[] = [];
    constructor() {
    }

    toBasicJSON() {
        return {
            laps: this.laps.map(lap => lap.toBasicJSON())
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}