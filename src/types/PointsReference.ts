import { Node, Record } from "neo4j-driver";

export class PointsReference {
    key_: string;
    points: number;
    position: string;
    season: number;

    constructor(data: Partial<PointsReference> = {}) {
        this.key_ = data.key_ ?? '';
        this.points = data.points ?? 0;
        this.position = data.position ?? '';
        this.season = data.season ?? 0;
    }

    static fromNode(node: Node): PointsReference {
        return new PointsReference({
            key_: node.properties['key_'],
            points: node.properties['points'],
            position: node.properties['position'],
            season: node.properties['season'],
        });
    }

    static fromRecord(record: Record): PointsReference | undefined {
        let node: Node;
        try {
            node = record.get('tspr');
        } catch (error) {
            return undefined;
        }
        return PointsReference.fromNode(node);
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