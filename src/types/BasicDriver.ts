export class BasicDriver {
    driverID: string;
    firstName: string;
    lastName: string;
    division: number | null;

    constructor(driverID: string, first_name: string, last_name: string, division: number) {
        this.driverID = driverID;
        this.firstName = first_name;
        this.lastName = last_name;
        this.division = division;
    }

    static fromNode(node: any): BasicDriver {
        return new BasicDriver(
            node.properties['driver_id'],
            node.properties['first_name'],
            node.properties['last_name'],
            node.properties['division']
        );
    }

    static fromRecord(record: any): BasicDriver {
        return BasicDriver.fromNode(record._fields[record._fieldLookup['d']]);
    }

    get raceDivision(): number | null {
        return this.division !== null ? Math.floor(this.division) : null;
    }

    get name(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    toBasicJSON() {
        // these are the attrs that can be included that won't nest
        return {
            driverID: this.driverID,
            firstName: this.firstName,
            lastName: this.lastName,
            division: this.division,

            raceDivision: this.raceDivision,
            name: this.name
        }
    }

    toJSON() {
        return {
            // These are the properties of the class
            driverID: this.driverID,
            firstName: this.firstName,
            lastName: this.lastName,
            division: this.division,

            // These are computed properties
            raceDivision: this.raceDivision,
            name: this.name
        };
    }
}