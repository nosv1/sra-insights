import { TeamSeriesSession } from "./TeamSeriesSession";

export class Session {
    key_: string;
    trackName: string;
    sessionType: string;
    finishTime: Date;
    sessionFile: string;
    serverNumber: number;
    serverName: string;

    teamSeriesSession: TeamSeriesSession | undefined;

    constructor(data: Partial<Session> = {}) {
        this.key_ = data.key_ ?? '';
        this.trackName = data.trackName ?? '';
        this.sessionType = data.sessionType ?? '';
        this.finishTime = data.finishTime ?? new Date();
        this.sessionFile = data.sessionFile ?? '';
        this.serverNumber = data.serverNumber ?? 0;
        this.serverName = data.serverName ?? '';
    }

    static fromNode(node: any): Session {

        return new Session({
            key_: node.properties['key_'],
            trackName: node.properties['track_name'],
            sessionType: node.properties['session_type'],
            finishTime: new Date(node.properties['finish_time']),
            sessionFile: node.properties['session_file'],
            serverNumber: node.properties['server_number'],
            serverName: node.properties['server_name'],
        });
    }

    static fromRecord(record: any): Session | undefined {
        const node = record._fields[record._fieldLookup['s']];
        if (!node) {
            return undefined;
        }
        const session = Session.fromNode(node);
        session.teamSeriesSession = TeamSeriesSession.fromRecord(record);
        return session;
    }

    get sraSessionURL(): string {
        // https://www.simracingalliance.com/results/server3/race/250129_192518_FP
        return `https://www.simracingalliance.com/results/server${this.serverNumber}/` +
            this.sessionTypeSraWord + '/' +
            this.sessionFile;
    }

    get sessionTypeSraWord(): string {
        return (this.sessionType === 'R' ? 'race' : this.sessionType === 'Q' ? 'qual' : 'practice')
    }

    toBasicJSON() {
        return {
            key: this.key_,
            trackName: this.trackName,
            sessionType: this.sessionType,
            finishTime: this.finishTime,
            sessionFile: this.sessionFile,
            serverNumber: this.serverNumber,
            serverName: this.serverName,
            sraSessionURL: this.sraSessionURL,
            sessionTypeSraWord: this.sessionTypeSraWord,
            teamSeriesSession: this.teamSeriesSession?.toBasicJSON()
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}