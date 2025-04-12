import moment from 'moment-timezone';
import { Node, RecordShape } from "neo4j-driver";
import { CarDriver } from "./CarDriver";
import { TeamSeriesSession } from "./TeamSeriesSession";

export class Session {
    key_: string;
    trackName: string;
    sessionType: string;
    finishTime: Date;
    sessionFile: string;
    server: string;
    serverName: string;

    teamSeriesSession?: TeamSeriesSession;
    carDrivers?: CarDriver[];

    get serverTitle(): string {
        if (new Array('1', '2', '3', '4', '5', '6', '7').includes(this.server)) {
            return `SRAM${this.server}`;
        } else {
            return this.server;
        }
    }

    get serverURLName(): string {
        return (this.server.length === 1 ? `server` : '') + this.server;
    }

    get sraSessionURL(): string {
        // https://www.simracingalliance.com/results/server3/race/250129_192518_FP
        return `https://www.simracingalliance.com/results/${this.serverURLName}/` +
            this.sessionTypeSraWord + '/' +
            this.sessionFile;
    }

    get sessionTypeSraWord(): string {
        return (this.sessionType === 'R' ? 'race' : this.sessionType === 'Q' ? 'qual' : 'practice')
    }

    get timeAgo(): string {
        const now = moment.tz('America/New_York').utc().toDate();
        const diff = now.getTime() - this.finishTime.getTime();
        const diffSeconds = Math.floor(diff / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 1) {
            return `${diffDays} days ago`;
        } else if (diffHours > 1) {
            return `${diffHours} hours ago`;
        } else if (diffMinutes > 1) {
            return `${diffMinutes} minutes ago`;
        } else {
            return `${diffSeconds} seconds ago`;
        }
    }

    constructor(data: Partial<Session> = {}) {
        this.key_ = data.key_ ?? '';
        this.trackName = data.trackName ?? '';
        this.sessionType = data.sessionType ?? '';
        this.finishTime = data.finishTime ?? new Date();
        this.sessionFile = data.sessionFile ?? '';
        this.server = data.server ?? '';
        this.serverName = data.serverName ?? '';
    }

    static fromNode(node: Node): Session {
        return new Session({
            key_: node.properties['key_'],
            trackName: node.properties['track_name'],
            sessionType: node.properties['session_type'],
            finishTime: moment.tz(
                node.properties['finish_time']
                    .toString()
                    .slice(0, -1),
                'YYYY-MM-DDTHH:mm:ss',
                'America/New_York'
            ).toDate(),
            sessionFile: node.properties['session_file'],
            server: node.properties['server_number'],
            serverName: node.properties['server_name'],
        });
    }

    static fromRecord(
        record: RecordShape,
        {
            getTeamSeriesSession = false,
            getCarDriver = false,
            getCarDriverBasicDriver = false,
            getCarDriverSessionCar = false,
            getCarDriverSessionCarLaps = false,
        }: {
            getTeamSeriesSession?: boolean,
            getCarDriver?: boolean,
            getCarDriverBasicDriver?: boolean,
            getCarDriverSessionCar?: boolean,
            getCarDriverSessionCarLaps?: boolean,
        } = {}
    ): Session | undefined {
        let node: Node
        try {
            node = record.get('s');
        } catch (error) {
            return undefined;
        }
        const session = Session.fromNode(node);
        if (getTeamSeriesSession)
            session.teamSeriesSession = TeamSeriesSession.fromRecord(record);
        if (getCarDriver) {
            const carDriver = CarDriver.fromRecord(record, {
                getBasicDriver: getCarDriverBasicDriver,
                getSessionCar: getCarDriverSessionCar,
                getSessionCarLaps: getCarDriverSessionCarLaps,
            });
            session.carDrivers = carDriver ? [carDriver] : [];
        }
        return session;
    }

    static fromRecordsWithCarDrivers(records: RecordShape): Session | undefined {
        const carSessions: Session[] = records
            .map((r: RecordShape) => Session.fromRecord(r, {
                getCarDriver: true,
                getCarDriverBasicDriver: true,
                getCarDriverSessionCar: true,
                getCarDriverSessionCarLaps: true,
            }))
            .filter((s: Session | undefined): s is Session => s !== undefined);

        if (carSessions.length === 0) {
            return undefined;
        }

        let session = carSessions[0];
        session.carDrivers = carSessions.flatMap(s => s.carDrivers ?? []);
        session.setDriverGapsToLeader();
        return session;
    }

    static trackNameToTtile(trackName: string): string {
        return trackName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    setDriverGapsToLeader() {
        let minRunningTimePerLapPerSplit: { runningTime: number, d_idx: number | undefined }[] = [{ runningTime: Number.MAX_VALUE, d_idx: undefined }]
        this.carDrivers?.forEach((cd, d_idx) => {
            if (!cd.sessionCar || !cd.sessionCar.laps)
                return;

            cd.sessionCar.splitRunningTime.forEach((splitRunningTime, s_idx) => {
                // add the next split to the array
                if (minRunningTimePerLapPerSplit.length - 1 <= s_idx)
                    minRunningTimePerLapPerSplit.push(minRunningTimePerLapPerSplit[minRunningTimePerLapPerSplit.length - 1]);


                // > 0 is a hacky check to handle incorrect start offsets for when drivers' total times are less than sum of splits
                // this could happen if a driver RTGs and their car total time doesn't continue counting (i think)
                if (splitRunningTime > 0 && splitRunningTime < minRunningTimePerLapPerSplit[s_idx].runningTime)
                    minRunningTimePerLapPerSplit[s_idx] = { runningTime: splitRunningTime, d_idx: d_idx };
            });
        });

        this.carDrivers?.forEach((cd, d_idx) => {
            if (!cd.sessionCar)
                return;

            cd.sessionCar.splitRunningTime.forEach((splitRunningTime, s_idx) => {
                const minRunningTime = minRunningTimePerLapPerSplit[s_idx].runningTime;
                cd.sessionCar?.gapToLeaderPerSplit.push(splitRunningTime - minRunningTime);
            });
        });
    }

    toBasicJSON() {
        const easternUTCOffset = moment.tz(new Date(), 'America/New_York').utcOffset() * 60000; // Offset in milliseconds
        const easternTime = moment(this.finishTime.getTime() + easternUTCOffset); // Convert to Eastern Time

        return {
            key_: this.key_,
            trackName: this.trackName,
            sessionType: this.sessionType,
            finishTime: easternTime, // eastern time
            timeAgo: this.timeAgo,
            sessionFile: this.sessionFile,
            serverTitle: this.serverTitle,
            serverURLName: this.serverURLName,
            server: this.server,
            serverName: this.serverName,
            sraSessionURL: this.sraSessionURL,
            sessionTypeSraWord: this.sessionTypeSraWord,
            teamSeriesSession: this.teamSeriesSession?.toBasicJSON(),
            carDrivers: this.carDrivers?.map(cd => cd.toBasicJSON()),
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}