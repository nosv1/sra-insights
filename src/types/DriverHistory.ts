import { Record } from "neo4j-driver";
import * as ss from 'simple-statistics';
import { LAP_ATTRS } from "../components/Leaderboards/LeaderboardSelection";
import { BasicDriver } from './BasicDriver';
import { CarDriver } from './CarDriver';
import { Lap } from './Lap';
import { Session } from './Session';
import { SessionCar } from './SessionCar';

export class DriverHistory {
    basicDriver?: BasicDriver;
    sessionCars: SessionCar[];
    laps: Lap[];

    bestLap?: Lap;
    bestSplit1?: Lap;
    bestSplit2?: Lap;
    bestSplit3?: Lap;

    bestValidLap?: Lap;
    bestValidSplit1?: Lap;
    bestValidSplit2?: Lap;
    bestValidSplit3?: Lap;

    tsAvgPercentDiff: number = 0;
    apdSlope: number = 0;
    sessions: Session[] = [];
    tsAvgPercentDiffs: number[] = [];
    avgPercentDiffs: number[] = [];

    get potentialBestLap() {
        if (!this.bestSplit1 || !this.bestSplit2 || !this.bestSplit3) {
            return null;
        }
        return this.bestSplit1?.split1 + this.bestSplit2?.split2 + this.bestSplit3?.split3;
    }

    get potentialBestValidLap() {
        if (!this.bestValidSplit1 || !this.bestValidSplit2 || !this.bestValidSplit3) {
            return null;
        }
        return this.bestValidSplit1?.split1 + this.bestValidSplit2?.split2 + this.bestValidSplit3?.split3;
    }

    get validLaps() {
        return this.laps.filter(lap => lap.isValidForBest);
    }

    constructor(data: Partial<DriverHistory> = {}) {
        this.basicDriver = data.basicDriver
        this.sessionCars = data.sessionCars ?? [];
        this.laps = data.laps ?? [];
    }

    static fromRecord(record: Record): DriverHistory {
        const basicDriver = BasicDriver.fromRecord(record);
        const sessionCar = SessionCar.fromRecord(record);
        const lap = Lap.fromRecord(record);

        return new DriverHistory({
            basicDriver: basicDriver,
            sessionCars: sessionCar ? [sessionCar] : [],
            laps: lap ? [lap] : []
        });
    }


    static fromRecords(records: Record[]): DriverHistory[] {
        let driverHistories: { [key: string]: DriverHistory } = {}; // {driver_id_car_model: DriverHistory}

        records.forEach(record => {
            const driverHistory = DriverHistory.fromRecord(record);
            const key = `${driverHistory.basicDriver?.driverId}_${driverHistory.sessionCars[0].carModel}`;
            if (!driverHistories[key]) {
                driverHistories[key] = driverHistory;
            }
            driverHistories[key].sessionCars.push(driverHistory.sessionCars[0]);
            driverHistories[key].updateLaps(driverHistory.laps[0]);
        });

        return Object.values(driverHistories);
    }

    static fromLaps(laps: Lap[]): DriverHistory[] {
        let driverHistories: { [key: string]: DriverHistory } = {}; // {driver_id_car_model: DriverHistory}

        laps.forEach(lap => {
            const driverHistory = new DriverHistory({
                basicDriver: lap.driver,
                sessionCars: lap.car ? [lap.car] : [],
            });
            const key = `${driverHistory.basicDriver?.driverId}_${driverHistory.sessionCars[0].carModel.modelId}`;
            if (!driverHistories[key]) {
                driverHistories[key] = driverHistory;
            }
            driverHistories[key].sessionCars.push(driverHistory.sessionCars[0]);
            driverHistories[key].updateLaps(lap);
        });

        return Object.values(driverHistories);
    }

    static fromCarDrivers(carDrivers: CarDriver[], ignoreCarModel: boolean = false): DriverHistory[] {
        let driverHistories: { [key: string]: DriverHistory } = {}; // {driver_id_car_model: DriverHistory}

        carDrivers.forEach(carDriver => {
            if (!carDriver.sessionCar)
                return;

            const driverHistory = new DriverHistory({
                basicDriver: carDriver.basicDriver,
                sessionCars: [carDriver.sessionCar],
            });

            const key = ignoreCarModel
                ? `${driverHistory.basicDriver?.driverId}`
                : `${driverHistory.basicDriver?.driverId}_${driverHistory.sessionCars[0].carModel.modelId}`;
            if (!driverHistories[key]) {
                driverHistories[key] = driverHistory;
            }
            driverHistories[key].sessionCars.push(driverHistory.sessionCars[0]);
            driverHistories[key].updateTSAvgPercentDiff(carDriver);
        });

        return Object.values(driverHistories);
    }

    updateLaps(lap: Lap) {
        this.laps.push(lap);

        if (lap.isValidForBest) {
            if (!this.bestValidLap || lap.lapTime < this.bestValidLap.lapTime) {
                this.bestValidLap = lap;
            }
            if (!this.bestValidSplit1 || lap.split1 < this.bestValidSplit1.split1) {
                this.bestValidSplit1 = lap;
            }
            if (!this.bestValidSplit2 || lap.split2 < this.bestValidSplit2.split2) {
                this.bestValidSplit2 = lap;
            }
            if (!this.bestValidSplit3 || lap.split3 < this.bestValidSplit3.split3) {
                this.bestValidSplit3 = lap;
            }
        }

        if (!this.bestLap || lap.lapTime < this.bestLap.lapTime) {
            this.bestLap = lap;
        }
        if (!this.bestSplit1 || lap.split1 < this.bestSplit1.split1) {
            this.bestSplit1 = lap;
        }
        if (!this.bestSplit2 || lap.split2 < this.bestSplit2.split2) {
            this.bestSplit2 = lap;
        }
        if (!this.bestSplit3 || lap.split3 < this.bestSplit3.split3) {
            this.bestSplit3 = lap;
        }
    }

    updateTSAvgPercentDiff(carDriver: CarDriver) {
        if (!carDriver.sessionCar || !carDriver.sessionCar.tsAvgPercentDiff)
            return;

        if (carDriver.session)
            this.sessions?.push(carDriver.session);

        if (carDriver.sessionCar.avgPercentDiff)
            this.avgPercentDiffs.push(carDriver.sessionCar.avgPercentDiff);

        this.tsAvgPercentDiffs.push(carDriver.sessionCar.tsAvgPercentDiff);
        this.tsAvgPercentDiff = this.tsAvgPercentDiffs.reduce((sum, diff) => sum + diff, 0) / this.tsAvgPercentDiffs.length;

        const linearRegression = ss.linearRegression(this.sessions.map((s, s_idx) => [s_idx, this.tsAvgPercentDiffs[s_idx]]));
        this.apdSlope = linearRegression.m;
    }

    toBasicJSON() {
        return {
            basicDriver: this.basicDriver?.toBasicJSON(),
            sessionCars: this.sessionCars.map(sessionCar => sessionCar.toBasicJSON()),
            laps: this.laps.map(lap => lap.toBasicJSON())
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }

}