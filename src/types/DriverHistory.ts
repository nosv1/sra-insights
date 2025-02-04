import { BasicDriver } from './BasicDriver';
import { Lap } from './Lap';
import { SessionCar } from './SessionCar';

export class DriverHistory {
    basicDriver: BasicDriver | undefined;
    sessionCars: SessionCar[];
    laps: Lap[] = [];

    bestLap: Lap | undefined;
    bestSplit1: Lap | undefined;
    bestSplit2: Lap | undefined;
    bestSplit3: Lap | undefined;

    bestValidLap: Lap | undefined;
    bestValidSplit1: Lap | undefined;
    bestValidSplit2: Lap | undefined;
    bestValidSplit3: Lap | undefined;

    constructor(data: Partial<DriverHistory> = {}) {
        this.basicDriver = data.basicDriver
        this.sessionCars = data.sessionCars ?? [];
    }

    static fromRecord(record: any): DriverHistory {
        const basicDriver = BasicDriver.fromRecord(record);
        const sessionCar = SessionCar.fromRecord(record);
        const lap = Lap.fromRecord(record);

        return new DriverHistory({
            basicDriver: basicDriver,
            sessionCars: sessionCar ? [sessionCar] : [],
            laps: lap ? [lap] : []
        });
    }


    static fromRecords(records: any[]): DriverHistory[] {
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
            const key = `${driverHistory.basicDriver?.driverId}_${driverHistory.sessionCars[0].carModel}`;
            if (!driverHistories[key]) {
                driverHistories[key] = driverHistory;
            }
            driverHistories[key].sessionCars.push(driverHistory.sessionCars[0]);
            driverHistories[key].updateLaps(lap);
        });

        return Object.values(driverHistories);
    }

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