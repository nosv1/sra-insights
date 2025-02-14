import { Node, Record } from "neo4j-driver";

export class TeamSeriesPointsReference {
    key_: string;
    points: number;
    position: string;
    season: number;

    constructor(data: Partial<TeamSeriesPointsReference> = {}) {
        this.key_ = data.key_ ?? '';
        this.points = data.points ?? 0;
        this.position = data.position ?? '';
        this.season = data.season ?? 0;
    }

    static fromNode(node: Node): TeamSeriesPointsReference {
        return new TeamSeriesPointsReference({
            key_: node.properties['key_'],
            points: node.properties['points'],
            position: node.properties['position'],
            season: node.properties['season'],
        });
    }

    static fromRecord(record: Record): TeamSeriesPointsReference | undefined {
        let node: Node;
        try {
            node = record.get('tspr');
        } catch (error) {
            return undefined;
        }
        return TeamSeriesPointsReference.fromNode(node);
    }

    toBasicJSON() {
        return {
            key_: this.key_,
            points: this.points,
            position: this.position,
            season: this.season,
        };
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        }
    }
}