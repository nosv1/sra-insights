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

    static fromNode(node: any): PointsReference {
        return new PointsReference({
            key_: node.properties['key_'],
            points: node.properties['points'],
            position: node.properties['position'],
            season: node.properties['season'],
        });
    }

    static fromRecord(record: any): PointsReference | undefined {
        const node = record._fields[record._fieldLookup['tspr']];
        if (!node) {
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