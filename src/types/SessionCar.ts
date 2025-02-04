import { CarModel } from "./CarModel";

export class SessionCar {
    key_: string;
    carId: number;
    carModel: CarModel;
    carNumber: number;
    finishPosition: number;
    totalTime: number; // this is probably time in control of car, excluding when RTG or car is locked from control (still includes pit time)
    timeInPits: number;
    lapCount: number;
    bestSplit1: number;
    bestSplit2: number;
    bestSplit3: number;
    bestLap: number;

    // not present in every car node
    avgPercentDiff: number | null = null;
    tsAvgPercentDiff: number | null = null;

    constructor(data: Partial<SessionCar> = {}) {
        this.key_ = data.key_ ?? '';
        this.carId = data.carId ?? 0;
        this.carModel = data.carModel ?? new CarModel();
        this.carNumber = data.carNumber ?? 0;
        this.finishPosition = data.finishPosition ?? 0;
        this.totalTime = data.totalTime ?? 0;
        this.timeInPits = data.timeInPits ?? 0;
        this.lapCount = data.lapCount ?? 0;
        this.bestSplit1 = data.bestSplit1 ?? 0;
        this.bestSplit2 = data.bestSplit2 ?? 0;
        this.bestSplit3 = data.bestSplit3 ?? 0;
        this.bestLap = data.bestLap ?? 0;

        // not present in every car node
        this.avgPercentDiff = data.avgPercentDiff ?? null;
        this.tsAvgPercentDiff = data.tsAvgPercentDiff ?? null;
    }

    static fromNode(node: any): SessionCar {
        return new SessionCar({
            key_: node.properties['key_'],
            carId: node.properties['car_id'],
            carModel: CarModel.fromModelId(node.properties['car_model']),
            carNumber: node.properties['car_number'],
            finishPosition: node.properties['finish_position'],
            totalTime: node.properties['total_time'],
            timeInPits: node.properties['time_in_pits'],
            lapCount: node.properties['lap_count'],
            bestSplit1: node.properties['best_split1'],
            bestSplit2: node.properties['best_split2'],
            bestSplit3: node.properties['best_split3'],
            bestLap: node.properties['best_lap'],

            // not present in every car node
            avgPercentDiff: node.properties?.['avg_percent_diff'] ?? null,
            tsAvgPercentDiff: node.properties?.['ts_avg_percent_diff'] ?? null,
        });
    }

    static fromRecord(record: any): SessionCar | undefined {
        const node = record._fields[record._fieldLookup['c']];
        if (!node) {
            return undefined;
        }
        return SessionCar.fromNode(node);
    }

    toBasicJSON() {
        return {
            key_: this.key_,
            carId: this.carId,
            carModel: this.carModel.toBasicJSON(),
            carNumber: this.carNumber,
            finishPosition: this.finishPosition,
            totalTime: this.totalTime,
            timeInPits: this.timeInPits,
            lapCount: this.lapCount,
            bestSplit1: this.bestSplit1,
            bestSplit2: this.bestSplit2,
            bestSplit3: this.bestSplit3,
            bestLap: this.bestLap,

            // not present in every car node
            avgPercentDiff: this.avgPercentDiff,
            tsAvgPercentDiff: this.tsAvgPercentDiff,
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}
