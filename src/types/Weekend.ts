import { Record } from "neo4j-driver";
import { Session } from "./Session";

export class Weekend {
    qualifying: Session;
    race: Session;

    constructor(data: Partial<Weekend> = {}) {
        this.qualifying = data.qualifying ?? new Session();
        this.race = data.race ?? new Session();
    }

    static fromRecord(record: Record): Weekend {
        const qualifying = Session.fromNode(record.get('q'));
        const race = Session.fromNode(record.get('r'));
        return new Weekend({
            qualifying: qualifying,
            race: race
        });
    }

    toBasicJSON() {
        return {
            qualifying: this.qualifying.toBasicJSON(),
            race: this.race.toBasicJSON()
        }
    };

    toJSON() {
        return {
            ...this.toBasicJSON(),
        }
    }
}