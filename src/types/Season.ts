import { Node, Record } from "neo4j-driver";
import { TeamSeriesPointsReference } from './TeamSeriesPointsReference';

export class Season {
    maxDivisions: number;
    season: number;

    pointsReference: { [key: string]: TeamSeriesPointsReference } = {};

    constructor(data: Partial<Season> = {}) {
        this.maxDivisions = data.maxDivisions ?? 0;
        this.season = data.season ?? 0;
    }

    static fromNode(node: Node): Season {
        return new Season({
            maxDivisions: node.properties['max_divisions'],
            season: node.properties['season'],
        });
    }

    static fromRecord(record: Record): Season {
        let season = Season.fromNode(record.get('tss'));
        let pointsReference = TeamSeriesPointsReference.fromRecord(record);
        if (pointsReference) {
            season.pointsReference[pointsReference.position] = pointsReference;
        }
        return season

    }

    static fromRecords(records: any[]): Season[] {
        let seasons: { [key: string]: Season } = {};

        records.forEach(record => {
            const season = Season.fromRecord(record);
            const key = `${season.season}`;
            if (!seasons[key]) {
                seasons[key] = season;
            }
            if (season.pointsReference) {
                Object.assign(seasons[key].pointsReference, season.pointsReference);
            }
        });
        return Object.values(seasons);
    }

    toBasicJSON() {
        return {
            maxDivisions: this.maxDivisions,
            season: this.season,
        };
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
            pointsReference: this.pointsReference,
        };
    }
}