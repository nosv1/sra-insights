import { Node, RecordShape } from "neo4j-driver";
import { BasicDriver } from './BasicDriver';
import { Lap } from './Lap';
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

    get carDriverKey() {
        return `${this.sessionCar?.carModel}-${this.basicDriver?.driverId}`;
    }

    get timeInPits() {
        if (!this.timeOnTrack || !this.sessionCar?.startOffset)
            return 0;
        return (this.sumLaps + this.sessionCar?.startOffset) - this.timeOnTrack;
    }

    get sumLaps() {
        if (!this.sessionCar)
            return 0;
        return this.laps.reduce((sum, lap) => sum + lap.lapTime, 0);
    }

    get laps() {
        if (!this.sessionCar)
            return [];
        return this.sessionCar.laps.filter(lap => lap.driverId === this.driverId);
    }

    constructor(data: Partial<CarDriver> = {}) {
        this.sessionFile = data.sessionFile ?? '';
        this.serverNumber = data.serverNumber ?? 0;
        this.carID = data.carID ?? '';
        this.driverId = data.driverId ?? '';
        this.key_ = data.key_ ?? '';
        this.carKey = data.carKey ?? '';
        this.timeOnTrack = data.timeOnTrack ?? 0;
    }

    static fromNode(node: Node): CarDriver {
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

    static fromRecord(
        record: RecordShape,
        {
            getSessionCar = false,
            getSessionCarLaps = false,
            getBasicDriver = false,
            getSession = false,
            getSessionTeamSeriesSession = false,
        }: {
            getSessionCar?: boolean,
            getSessionCarLaps?: boolean,
            getBasicDriver?: boolean,
            getSession?: boolean,
            getSessionTeamSeriesSession?: boolean
        } = {}
    ): CarDriver | undefined {
        let node: Node
        try {
            node = record.get('cd');
        } catch (error) {
            return undefined
        }
        const carDriver = CarDriver.fromNode(node);
        if (getSessionCar) {
            carDriver.sessionCar = SessionCar.fromRecord(record);
            if (getSessionCarLaps && carDriver.sessionCar) {
                carDriver.sessionCar.laps = Lap.fromNodes(record.get('laps'));
                carDriver.sessionCar.processLaps();
            }
        }
        if (getBasicDriver)
            carDriver.basicDriver = BasicDriver.fromRecord(record);
        if (getSession)
            carDriver.session = Session.fromRecord(record, { getTeamSeriesSession: getSessionTeamSeriesSession });
        return carDriver
    }

    toBasicJSON(): { [key: string]: any } {
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
            timeInPits: this.timeInPits,
            sumLaps: this.sumLaps,
            laps: this.laps.map(lap => lap.toBasicJSON())
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}