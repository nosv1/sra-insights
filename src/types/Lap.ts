import { Node, RecordShape } from "neo4j-driver";
import { BasicDriver } from './BasicDriver';
import { CarDriver } from './CarDriver';
import { Session } from './Session';
import { SessionCar } from './SessionCar';

export class Lap {
    static readonly LAP_TIME = 'lap_time';
    static readonly SPLIT1 = 'split1';
    static readonly SPLIT2 = 'split2';
    static readonly SPLIT3 = 'split3';

    key_: string;
    carID: string;
    driverId: string;
    lapNumber: number;
    lapTime: number;
    split1: number;
    split2: number;
    split3: number;
    isValidForBest: boolean;
    runningSessionLapCount: number;
    serverNumber: number;
    sessionFile: string;

    car?: SessionCar;
    driver?: BasicDriver;
    carDriver?: CarDriver;
    session?: Session;

    get splits() {
        return [this.split1, this.split2, this.split3];
    }

    constructor(data: Partial<Lap> = {}) {
        this.key_ = data.key_ ?? '';
        this.carID = data.carID ?? '';
        this.driverId = data.driverId ?? '';
        this.lapNumber = data.lapNumber ?? 0;
        this.lapTime = data.lapTime ?? 0;
        this.split1 = data.split1 ?? 0;
        this.split2 = data.split2 ?? 0;
        this.split3 = data.split3 ?? 0;
        this.isValidForBest = data.isValidForBest ?? false;
        this.runningSessionLapCount = data.runningSessionLapCount ?? 0;
        this.serverNumber = data.serverNumber ?? 0;
        this.sessionFile = data.sessionFile ?? '';
    }

    static fromNode(node: Node): Lap {
        return new Lap({
            key_: node.properties['key_'],
            carID: node.properties['car_id'],
            driverId: node.properties['driver_id'],
            lapNumber: node.properties['lap_number'],
            lapTime: node.properties['lap_time'],
            split1: node.properties['split1'],
            split2: node.properties['split2'],
            split3: node.properties['split3'],
            isValidForBest: node.properties['is_valid_for_best'],
            runningSessionLapCount: node.properties['running_session_lap_count'],
            serverNumber: node.properties['server_number'],
            sessionFile: node.properties['session_file']
        });
    }

    static fromNodes(nodes: Node[]): Lap[] {
        return nodes.map(Lap.fromNode);
    }

    static fromRecord(
        record: RecordShape,
        {
            getSessionCar = false,
            getSession = false,
            getCarDriver = false,
            getBasicDriver = false,
        }: {
            getSessionCar?: boolean,
            getSession?: boolean,
            getCarDriver?: boolean,
            getBasicDriver?: boolean,
        } = {}
    ): Lap {
        const lap = Lap.fromNode(record.get('l'));
        if (getSessionCar)
            lap.car = SessionCar.fromRecord(record);
        if (getSession)
            lap.session = Session.fromRecord(record);
        if (getCarDriver)
            lap.carDriver = CarDriver.fromRecord(record);
        if (getBasicDriver)
            lap.driver = BasicDriver.fromRecord(record);
        return lap;
    }

    static fromRecordWithLaps(record: RecordShape,): Lap[] {
        let nodes = record.get('laps');
        let laps: Lap[] = [];
        nodes.forEach((node: Node, n_idx: number) => {
            laps.push(Lap.fromNode(node));
        });
        return laps;
    }

    trySetOptionals(record: RecordShape) {
        this.car = SessionCar.fromRecord(record);
        this.driver = BasicDriver.fromRecord(record);
        this.session = Session.fromRecord(record);
        this.carDriver = CarDriver.fromRecord(record);
    }

    toBasicJSON() {
        return {
            key_: this.key_,
            carID: this.carID,
            driverId: this.driverId,
            lapNumber: this.lapNumber,
            lapTime: this.lapTime,
            split1: this.split1,
            split2: this.split2,
            split3: this.split3,
            isValidForBest: this.isValidForBest,
            running_session_lap_count: this.runningSessionLapCount,
            serverNumber: this.serverNumber,
            sessionFile: this.sessionFile,
            car: this.car?.toBasicJSON(),
            driver: this.driver?.toBasicJSON(),
            carDriver: this.carDriver?.toBasicJSON(),
            session: this.session?.toBasicJSON(),
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }

    static timeToString(time: number): string {
        time = time / 1000;
        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(3);
        return `${minutes}:${seconds.toString().padStart(6, '0')}`;
    }

}
