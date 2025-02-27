import { Node, RecordShape } from "neo4j-driver";
import { CarModel } from "./CarModel";
import { Lap } from "./Lap";
import { Stint } from "./Stint";

export class SessionCar {
    key_: string;
    carId: number;
    carModel: CarModel;
    carGroup: string;
    carNumber: number;
    cupCategory: string; // 0 is gold, 3 is silver (im assuming)
    finishPosition: number;
    totalTime: number; // this is probably time in control of car, excluding when RTG or car is locked from control (still includes pit time)
    timeInPits: number;
    lapCount: number;
    bestValidSplit1Milli: number; // these come straight from the results json
    bestValidSplit2Milli: number;
    bestValidSplit3Milli: number;
    bestValidLapMilli: number;

    bestValidSplit1?: Lap = undefined; // these are from processing laps (if present)
    bestValidSplit2?: Lap = undefined;
    bestValidSplit3?: Lap = undefined;
    bestValidLap?: Lap = undefined;

    bestSplit1?: Lap = undefined; // these also come from processing laps (if present)
    bestSplit2?: Lap = undefined;
    bestSplit3?: Lap = undefined;
    bestLap?: Lap = undefined;

    // not present in every car node
    avgPercentDiff: number | null = null;
    tsAvgPercentDiff: number | null = null;

    laps: Lap[] = [];

    // race specific fields
    startOffset?: number = undefined;
    startPosition?: number = undefined;
    lapRunningTime: number[] = [];
    splitRunningTime: number[] = [];
    gapToLeaderPerSplit: number[] = [];
    probablePitLaps: number[] = [];
    stints: Stint[] = [];

    get sumSplits() {
        return this.laps?.reduce((acc, lap) => acc + lap.splits.reduce((acc, split) => acc + split, 0), 0) ?? 0;
    }

    constructor(data: Partial<SessionCar> = {}) {
        this.key_ = data.key_ ?? '';
        this.carId = data.carId ?? 0;
        this.carModel = data.carModel ?? new CarModel();
        this.carGroup = data.carGroup ?? '';
        this.carNumber = data.carNumber ?? 0;
        this.cupCategory = data.cupCategory ?? '';
        this.finishPosition = data.finishPosition ?? 0;
        this.totalTime = data.totalTime ?? 0;
        this.timeInPits = data.timeInPits ?? 0;
        this.lapCount = data.lapCount ?? 0;
        this.bestValidSplit1Milli = data.bestValidSplit1Milli ?? 0;
        this.bestValidSplit2Milli = data.bestValidSplit2Milli ?? 0;
        this.bestValidSplit3Milli = data.bestValidSplit3Milli ?? 0;
        this.bestValidLapMilli = data.bestValidLapMilli ?? 0;

        // not present in every car node
        this.avgPercentDiff = data.avgPercentDiff ?? null;
        this.tsAvgPercentDiff = data.tsAvgPercentDiff ?? null;
    }

    static fromNode(node: Node): SessionCar {
        return new SessionCar({
            key_: node.properties['key_'],
            carId: node.properties['car_id'],
            carModel: CarModel.fromModelId(node.properties['car_model']),
            carGroup: node.properties['car_group'],
            carNumber: node.properties['car_number'],
            cupCategory: node.properties['cup_category'],
            finishPosition: node.properties['finish_position'],
            totalTime: node.properties['total_time'],
            timeInPits: node.properties['time_in_pits'],
            lapCount: node.properties['lap_count'],
            bestValidSplit1Milli: node.properties['best_split1'],
            bestValidSplit2Milli: node.properties['best_split2'],
            bestValidSplit3Milli: node.properties['best_split3'],
            bestValidLapMilli: node.properties['best_lap'],

            // not present in every car node
            avgPercentDiff: node.properties?.['avg_percent_diff'] ?? null,
            tsAvgPercentDiff: node.properties?.['ts_avg_percent_diff'] ?? null,
        });
    }

    static fromRecord(record: RecordShape): SessionCar | undefined {
        let node: Node
        try {
            node = record.get('c');
        } catch (error) {
            return undefined;
        }
        return SessionCar.fromNode(node);
    }

    processLaps() {
        if (!this.laps)
            return;

        // this is the very first time the driver finishes split 1
        // offset is the difference between finish line to lap 1 split 1 and from the time the car spawned in to lap 1 split 1
        // the offset will be added to all the running times to get the correct time
        const lap1Split1 = this.totalTime - (this.sumSplits - this.laps[0].split1)
        this.startOffset = lap1Split1 - this.laps[0].split1;

        this.lapRunningTime = [this.startOffset];
        this.splitRunningTime = [this.startOffset];
        let minSplit3_1Combo = Number.MAX_VALUE;

        this.bestSplit1 = this.laps[0];
        this.bestSplit2 = this.laps[0];
        this.bestSplit3 = this.laps[0];
        this.bestLap = this.laps[0];

        this.laps.forEach((lap, l_idx) => {
            this.lapRunningTime.push(this.lapRunningTime[l_idx] + lap.lapTime);

            lap.splits.forEach((split, s_idx) => {
                this.splitRunningTime.push(this.splitRunningTime[l_idx * 3 + s_idx] + split);
            });

            // after first lap, we can start looking for probable pit laps
            if (l_idx > 0)
                minSplit3_1Combo = Math.min(minSplit3_1Combo, lap.split1 + this.laps[l_idx - 1].split3);

            // try update best lap and splits (and valid versions)
            if (lap.isValidForBest) {
                if (this.bestValidSplit1 && lap.split1 < this.bestValidSplit1.split1)
                    this.bestValidSplit1 = lap;
                if (this.bestValidSplit2 && lap.split2 < this.bestValidSplit2.split2)
                    this.bestValidSplit2 = lap;
                if (this.bestValidSplit3 && lap.split3 < this.bestValidSplit3.split3)
                    this.bestValidSplit3 = lap;
                if (this.bestValidLap && lap.lapTime < this.bestValidLap.lapTime)
                    this.bestValidLap = lap;
            }

            // always update best splits and lap
            if (this.bestSplit1 && lap.split1 < this.bestSplit1.split1)
                this.bestSplit1 = lap;
            if (this.bestSplit2 && lap.split2 < this.bestSplit2.split2)
                this.bestSplit2 = lap;
            if (this.bestSplit3 && lap.split3 < this.bestSplit3.split3)
                this.bestSplit3 = lap;
            if (this.bestLap && lap.lapTime < this.bestLap.lapTime)
                this.bestLap = lap;
        });

        // find probable pit laps
        const stint = new Stint()
        this.laps.forEach((lap, l_idx) => {

            // ignore first lap
            if (!l_idx)
                return;

            // detect pit lap
            const split3_1Combo = lap.split1 + this.laps[l_idx - 1].split3;
            if (split3_1Combo - minSplit3_1Combo > 30_000) {
                this.probablePitLaps.push(lap.lapNumber);

                // pop previous lap, as it's the in lap
                stint.laps.pop();

                this.stints.push(stint);
            } else {
                stint.laps.push(lap);
            }
        });
        this.stints.push(stint);
    }

    toBasicJSON(): { [key: string]: any } {
        return {
            key_: this.key_,
            carId: this.carId,
            carModel: this.carModel.toBasicJSON(),
            carGroup: this.carGroup,
            carNumber: this.carNumber,
            cupCategory: this.cupCategory,
            finishPosition: this.finishPosition,
            totalTime: this.totalTime,
            timeInPits: this.timeInPits,
            lapCount: this.lapCount,
            bestValidSplit1Milli: this.bestValidSplit1Milli,
            bestValidSplit2Milli: this.bestValidSplit2Milli,
            bestValidSplit3Milli: this.bestValidSplit3Milli,
            bestValidLapMilli: this.bestValidLapMilli,
            bestValidSplit1: this.bestValidSplit1?.toBasicJSON(),
            bestValidSplit2: this.bestValidSplit2?.toBasicJSON(),
            bestValidSplit3: this.bestValidSplit3?.toBasicJSON(),
            bestValidLap: this.bestValidLap?.toBasicJSON(),
            bestSplit1: this.bestSplit1?.toBasicJSON(),
            bestSplit2: this.bestSplit2?.toBasicJSON(),
            bestSplit3: this.bestSplit3?.toBasicJSON(),
            bestLap: this.bestLap?.toBasicJSON(),

            // not present in every car node
            avgPercentDiff: this.avgPercentDiff,
            tsAvgPercentDiff: this.tsAvgPercentDiff,

            laps: this.laps.map(lap => lap.toBasicJSON()),
            startOffset: this.startOffset,
            startPosition: this.startPosition,
            lapRunningTime: this.lapRunningTime,
            splitRunningTime: this.splitRunningTime,
            gapToLeaderPerSplit: this.gapToLeaderPerSplit,
            probablePitLaps: this.probablePitLaps,
            stints: this.stints.map(stint => stint.toBasicJSON()),
            sumSplits: this.sumSplits,
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}
