import { Record } from "neo4j-driver";
import * as ss from 'simple-statistics';
import { LAP_ATTRS } from "../components/Leaderboards/LeaderboardSelection";
import { BasicDriver } from './BasicDriver';
import { CarDriver } from './CarDriver';
import { HotStint } from './HotStint';
import { Lap } from './Lap';
import { Session } from './Session';
import { SessionCar } from './SessionCar';

export class DriverHistory {
    basicDriver?: BasicDriver;
    sessionCars: SessionCar[];
    laps: Lap[];
    lapsSortedByValidLap: number[] = [];  // index of lap in laps
    lapsSortedByValidSplit1: number[] = [];
    lapsSortedByValidSplit2: number[] = [];
    lapsSortedByValidSplit3: number[] = [];

    bestLap?: Lap;
    bestSplit1?: Lap;
    bestSplit2?: Lap;
    bestSplit3?: Lap;

    bestValidLap?: Lap;
    bestValidSplit1?: Lap;
    bestValidSplit2?: Lap;
    bestValidSplit3?: Lap;

    bestHotStint?: HotStint;

    rollingValidMedianLap: number[] = []; // index of lap in lapsSortedByValidLap
    rollingValidMedianSplit1: number[] = [];
    rollingValidMedianSplit2: number[] = [];
    rollingValidMedianSplit3: number[] = [];

    tsAvgPercentDiff: number = 0;
    apdSlope: number = 0;
    avgAPD_ROC: number = 0;
    apdVariance: number = 0;
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

    static fromLaps(laps: Lap[], bestOnly: boolean = false): DriverHistory[] {
        let driverHistories: { [key: string]: DriverHistory } = {}; // {driver_id_car_model: DriverHistory}
        let drivers: { [key: string]: DriverHistory } = {}; // {driver_id: DriverHistory}

        laps.forEach(lap => {
            const driver = lap.driver;
            const car = lap.car;
            const key = `${driver?.driverId}_${car?.carModel.modelId}`;

            const driverHistory = new DriverHistory({
                basicDriver: driver,
                sessionCars: car ? [car] : [],
            });

            if (!driverHistories[key]) {
                driverHistories[key] = driverHistory;
            }

            const driverId = driver?.driverId ?? '';
            if (!drivers[driverId]) {
                drivers[driverId] = driverHistory;
            }
            driverHistories[key].sessionCars.push(driverHistory.sessionCars[0]);
            driverHistories[key].updateLaps(lap);

            if (drivers[driverId].potentialBestValidLap && driverHistory.potentialBestValidLap)
                if (drivers[driverId].potentialBestValidLap > driverHistory.potentialBestValidLap)
                    drivers[driverId] = driverHistory;
        });

        return Object.values(bestOnly ? drivers : driverHistories);
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
                driverHistory.sessionCars = [];
                driverHistories[key] = driverHistory;
            }
            driverHistories[key].sessionCars.push(carDriver.sessionCar);
            driverHistories[key].updateTSAvgPercentDiff(carDriver);
            carDriver.sessionCar.laps?.forEach(lap => driverHistories[key].updateLaps(lap));
        });

        return Object.values(driverHistories);
    }

    updateLaps(lap: Lap) {
        lap.overallLapNumber = this.laps.length + 1;
        this.laps.push(lap);

        if (lap.isValidForBest) {
            // Update best valid laps
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

            // update sorted arrays
            const insertSorted = (arr: number[], lap: Lap, lapAttr: keyof Lap) => {
                let i = arr.length - 1;
                while (i >= 0) {
                    const arrLap = this.laps[arr[i]];
                    if (arrLap[lapAttr] && lap[lapAttr] && arrLap[lapAttr] < lap[lapAttr])
                        break;
                    i--;
                }
                arr.splice(i + 1, 0, this.laps.length - 1);
            };

            insertSorted(this.lapsSortedByValidLap, lap, 'lapTime');
            insertSorted(this.lapsSortedByValidSplit1, lap, 'split1');
            insertSorted(this.lapsSortedByValidSplit2, lap, 'split2');
            insertSorted(this.lapsSortedByValidSplit3, lap, 'split2');
        }

        // update best laps (possibly invalid)
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

        // update best hot stint
        if (this.validLaps.length >= 5) {
            const lastFiveValidLaps = this.validLaps.slice(-5);
            const areConsecutive = lastFiveValidLaps.every((lap, index, arr) => {
                if (index === 0) return true;
                return lap.lapNumber === arr[index - 1].lapNumber + 1;
            });

            if (areConsecutive) {
                const hotStint = HotStint.fromLaps(lastFiveValidLaps);
                if (!this.bestHotStint || hotStint.averageLapTime < this.bestHotStint.averageLapTime) {
                    this.bestHotStint = hotStint;
                }
            }
        }

        // update rolling median
        if (this.lapsSortedByValidLap.length > 0) {
            const medianIndex = Math.floor((this.lapsSortedByValidLap.length - 1) / 2);
            this.rollingValidMedianLap.push(this.lapsSortedByValidLap[medianIndex]);
            this.rollingValidMedianSplit1.push(this.lapsSortedByValidSplit1[medianIndex]);
            this.rollingValidMedianSplit2.push(this.lapsSortedByValidSplit2[medianIndex]);
            this.rollingValidMedianSplit3.push(this.lapsSortedByValidSplit3[medianIndex]);
        }

    }

    updateTSAvgPercentDiff(carDriver: CarDriver) {
        if (!carDriver.sessionCar || (!carDriver.sessionCar.tsAvgPercentDiff && !carDriver.sessionCar.tsQualiAvgPercentDiff)) {
            return;
        }

        if (carDriver.session) {
            this.sessions.push(carDriver.session);
        }

        const avgPercentDiff = carDriver.sessionCar.avgPercentDiff ?? carDriver.sessionCar.qualiAvgPercentDiff;
        const tsAvgPercentDiff = carDriver.sessionCar.tsAvgPercentDiff ?? carDriver.sessionCar.tsQualiAvgPercentDiff;

        if (avgPercentDiff !== null && tsAvgPercentDiff !== null) {
            this.avgPercentDiffs.push(avgPercentDiff);
            this.tsAvgPercentDiffs.push(tsAvgPercentDiff);
        }

        this.tsAvgPercentDiff = ss.mean(this.tsAvgPercentDiffs);

        const linearRegression = ss.linearRegression(this.sessions.map((_, idx) => [idx, this.tsAvgPercentDiffs[idx]]));
        this.apdSlope = -linearRegression.m;

        const rocs = this.tsAvgPercentDiffs.slice(1).map((diff, idx) => this.tsAvgPercentDiffs[idx] - diff);
        this.avgAPD_ROC = rocs.length > 0 ? ss.mean(rocs) : 0;
        this.apdVariance = ss.variance(this.tsAvgPercentDiffs);
    }

    // everything in this function deals with valid times
    static divisionTimesFromDriverHistories(
        driverHistories: DriverHistory[],
        uniqueDivisions: number[]
    ): {
        medianDivisionTimes: { [division: string]: { [lapAttr: string]: number, potentialBest: number } },
        averageDivisionTimes: { [division: string]: { [lapAttr: string]: number, potentialBest: number } },
        bestTimes: { [lapAttr: string]: number }
    } {
        const medianDivisionTimes: { [division: number]: { [lapAttr: string]: number, potentialBest: number } } = {};
        const averageDivisionTimes: { [division: number]: { [lapAttr: string]: number, potentialBest: number } } = {};
        const bestTimes: { [lapAttr: string]: number } = {};

        uniqueDivisions.forEach(division => {
            const divIsAlien = division === 0.1;
            const divisionDrivers = driverHistories.filter(dh => dh.basicDriver?.raceDivision === (divIsAlien ? 1 : division)).filter(dh => dh.bestValidLap);
            medianDivisionTimes[division] = Object.fromEntries([...LAP_ATTRS.map(lapAttr => [lapAttr, 0]), ['potentialBest', 0]]);
            averageDivisionTimes[division] = Object.fromEntries([...LAP_ATTRS.map(lapAttr => [lapAttr, 0]), ['potentialBest', 0]]);

            const potentialBestDivisionTimes: { [driverId: string]: number } = {};
            LAP_ATTRS.forEach(lapAttr => {
                if (!bestTimes[lapAttr])
                    bestTimes[lapAttr] = Number.MAX_VALUE;

                const bestDivisionTimes: { [driverId: string]: number } = {};
                divisionDrivers.forEach(dh => {
                    const driverId = dh.basicDriver?.driverId ?? '';
                    if (!bestDivisionTimes[driverId]) {
                        bestDivisionTimes[driverId] = Number.MAX_VALUE;
                    }
                    if (!potentialBestDivisionTimes[driverId]) {
                        potentialBestDivisionTimes[driverId] = Number.MAX_VALUE;
                    }
                    let time = 0;
                    if (lapAttr === 'lapTime') {
                        time = dh.bestValidLap?.lapTime ?? 0;
                        potentialBestDivisionTimes[driverId] = Math.min(potentialBestDivisionTimes[driverId], dh.potentialBestValidLap ?? 0);
                    } else {
                        const bestValidSplitAttr = `bestValid${lapAttr.charAt(0).toUpperCase() + lapAttr.slice(1)}` as keyof DriverHistory;
                        const lap = dh[bestValidSplitAttr] as Lap;
                        time = (lap[lapAttr as keyof Lap] ?? 0) as number;
                    }
                    bestDivisionTimes[driverId] = Math.min(bestDivisionTimes[driverId], time);
                });

                let bestTimesArray = Object.values(bestDivisionTimes).filter(time => time > 0);
                bestTimesArray.sort((a, b) => a - b);
                bestTimes[lapAttr] = Math.min(bestTimes[lapAttr], bestTimesArray[0]);

                let potentialBestTimesArray = Object.values(potentialBestDivisionTimes).filter(time => time > 0);
                potentialBestTimesArray.sort((a, b) => a - b);

                if (bestTimesArray.length === 0 || potentialBestTimesArray.length === 0) {
                    medianDivisionTimes[division][lapAttr] = 0;
                    averageDivisionTimes[division][lapAttr] = 0;
                    medianDivisionTimes[division].potentialBest = 0;
                    averageDivisionTimes[division].potentialBest = 0;
                    return;
                }

                if (divIsAlien) {
                    bestTimesArray = bestTimesArray.slice(0, Math.floor(bestTimesArray.length * 0.1));
                    potentialBestTimesArray = potentialBestTimesArray.slice(0, Math.floor(potentialBestTimesArray.length * 0.1));
                }

                const medianBestTime = ss.median(bestTimesArray);
                const averageBestTime = ss.mean(bestTimesArray);
                const medianPotentialBestTime = ss.median(potentialBestTimesArray);
                const averagePotentialBestTime = ss.mean(potentialBestTimesArray);

                medianDivisionTimes[division][lapAttr] = medianBestTime;
                averageDivisionTimes[division][lapAttr] = averageBestTime;
                medianDivisionTimes[division].potentialBest = medianPotentialBestTime;
                averageDivisionTimes[division].potentialBest = averagePotentialBestTime;
            });
        });

        return { medianDivisionTimes, averageDivisionTimes, bestTimes };
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