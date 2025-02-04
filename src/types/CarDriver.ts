import { BasicDriver } from './BasicDriver';
import { Session } from './Session';
import { SessionCar } from './SessionCar';

export class CarDriver {
    sessionFile: string;
    serverNumber: number;
    carID: string;
    driverId: string;
    carKey: string;
    key_: string;
    timeOnTrack: number;

    sessionCar?: SessionCar;
    basicDriver?: BasicDriver;
    session?: Session;

    constructor(data: Partial<CarDriver> = {}) {
        this.sessionFile = data.sessionFile ?? '';
        this.serverNumber = data.serverNumber ?? 0;
        this.carID = data.carID ?? '';
        this.driverId = data.driverId ?? '';
        this.key_ = data.key_ ?? '';
        this.carKey = data.carKey ?? '';
        this.timeOnTrack = data.timeOnTrack ?? 0;
    }

    get carDriverKey() {
        return `${this.sessionCar?.carModel}-${this.basicDriver?.driverId}`;
    }

    static fromNode(node: any): CarDriver {
        return new CarDriver(
            {
                sessionFile: node.properties['session_file'],
                serverNumber: node.properties['server_number'],
                carID: node.properties['car_id'],
                driverId: node.properties['driver_id'],
                carKey: node.properties['car_key'],
                key_: node.properties['key_'],
                timeOnTrack: node.properties['time_on_track'],
            }
        );
    }

    static fromRecord(record: any): CarDriver | undefined {
        const node = record._fields[record._fieldLookup['cd']];
        if (!node) {
            return undefined
        }
        let carDriver = CarDriver.fromNode(node);
        carDriver.sessionCar = SessionCar.fromRecord(record);
        carDriver.basicDriver = BasicDriver.fromRecord(record);
        carDriver.session = Session.fromRecord(record);
        return carDriver;
    }

    toBasicJSON() {
        return {
            sessionFile: this.sessionFile,
            serverNumber: this.serverNumber,
            carID: this.carID,
            driverId: this.driverId,
            carKey: this.carKey,
            key_: this.key_,
            timeOnTrack: this.timeOnTrack,
            carDriverKey: this.carDriverKey,
            sessionCar: this.sessionCar?.toBasicJSON(),
            basicDriver: this.basicDriver?.toBasicJSON(),
            session: this.session?.toBasicJSON(),
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}