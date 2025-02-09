import { Node, RecordShape } from "neo4j-driver";

export class BasicDriver {
    driverId: string;
    memberId: string;
    firstName: string;
    lastName: string;
    division: number;

    constructor(data: Partial<BasicDriver> = {}) {
        this.driverId = data.driverId ?? '';
        this.memberId = data.memberId ?? '';
        this.firstName = data.firstName ?? '';
        this.lastName = data.lastName ?? '';
        this.division = data.division ?? 0;
    }

    static fromNode(node: Node): BasicDriver {
        return new BasicDriver({
            driverId: node.properties['driver_id'],
            memberId: node.properties['member_id'],
            firstName: node.properties['first_name'],
            lastName: node.properties['last_name'],
            division: node.properties['division']
        });
    }

    static fromRecord(record: RecordShape): BasicDriver | undefined {
        let node: Node
        try {
            node = record.get('d');
        } catch (error) {
            return undefined;
        }
        return BasicDriver.fromNode(node);
    }

    get raceDivision(): number {
        return this.division !== null ? Math.floor(this.division) : 0;
    }

    get isSilver(): boolean {
        return this.raceDivision !== this.division;
    }

    get name(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    get sraMemberStatsURL(): string {
        // https://www.simracingalliance.com/member_stats/?member=58dd0090a7e8c4582e1db5d77ec20a4185ba73931680af9907a19cc7011f2777
        return `https://www.simracingalliance.com/member_stats/?member=${this.memberId}`;
    }

    get sraInsightsURL(): string {
        // http://localhost:3000/driver?driverId=S76561198368453660
        return `${process.env.REACT_APP_URL}/driver?driverId=${this.driverId}`;
    }

    get cjaURL(): string {
        // https://coach.jeffries.academy/sra/driver/1f74453a2c49f8a748741fadebaff4c7a5df20a11ed3c847662e294a6cbceec5
        return `https://coach.jeffries.academy/sra/driver/${this.memberId}`;
    }

    toBasicJSON() {
        return {
            // These are the properties of the class
            driverId: this.driverId,
            memberId: this.memberId,
            firstName: this.firstName,
            lastName: this.lastName,
            division: this.division,

            // These are computed properties
            raceDivision: this.raceDivision,
            isSilver: this.isSilver,
            name: this.name,
            sraMemberStatsURL: this.sraMemberStatsURL,
            sraInsightsURL: this.sraInsightsURL,
            cjaURL: this.cjaURL,
        }
    }

    toJSON() {
        return {
            ...this.toBasicJSON(),
        };
    }
}