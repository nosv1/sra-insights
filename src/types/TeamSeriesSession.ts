export class TeamSeriesSession {
    sessionKey: string;
    division: number;
    season: number;
    avgPercentDiff: number;

    constructor(data: Partial<TeamSeriesSession> = {}) {
        this.sessionKey = data.sessionKey ?? '';
        this.division = data.division ?? 0;
        this.season = data.season ?? 0;
        this.avgPercentDiff = data.avgPercentDiff ?? 0;
    }

    static fromNode(node: any): TeamSeriesSession {

        return new TeamSeriesSession({
            sessionKey: node.properties['session_key'],
            division: node.properties['division'],
            season: node.properties['season'],
            avgPercentDiff: node.properties['avg_percent_diff'],
        });
    }

    static fromRecord(record: any): TeamSeriesSession | undefined {
        const node = record._fields[record._fieldLookup['ts']];
        if (!node) {
            return undefined;
        }
        return TeamSeriesSession.fromNode(node);
    }

    toBasicJSON() {
        return {
            sessionKey: this.sessionKey,
            division: this.division,
            season: this.season,
            avgPercentDiff: this.avgPercentDiff,
        }
    }

    toJSON() {
        return {
            ... this.toBasicJSON(),
        };
    }
}