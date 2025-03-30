import moment from 'moment-timezone';

export class SeriesRound {
    round: number;
    trackName: string;
    date: Date;

    constructor(round: number, trackName: string, date: Date) {
        this.round = round;
        this.trackName = trackName;
        this.date = date;
    }
}

export class SeriesSchedule {
    rounds: SeriesRound[];

    constructor(rounds: SeriesRound[]) {
        this.rounds = rounds;
    }

    getCurrentRound(): SeriesRound {
        const now = moment.tz('America/New_York').utc().toDate();
        for (const round of this.rounds) {
            if (round.date >= now) {
                return round;
            }
        }
        return this.rounds[this.rounds.length - 1];
    };

    static getTrackFromRound(schedule: SeriesSchedule, round: number): string {
        return schedule.rounds[round - 1].trackName;
    };
}

export const TEAM_SERIES_SCHEDULE = new SeriesSchedule([
    // these dates are the thursday of the week, given the final race day is wednesday
    new SeriesRound(1, 'indianapolis', moment.tz('2025-04-03', 'America/New_York').toDate()),
]);

export const ENDURANCE_SERIES_SCHEDULE = new SeriesSchedule([
    new SeriesRound(1, 'red_bull_ring', moment.tz('2024-09-21', 'America/New_York').toDate()),
    new SeriesRound(2, 'brands_hatch', moment.tz('2024-11-02', 'America/New_York').toDate()),
    new SeriesRound(3, 'misano', moment.tz('2024-12-07', 'America/New_York').toDate()),
    new SeriesRound(4, 'nurburgring', moment.tz('2025-01-11', 'America/New_York').toDate()),
    new SeriesRound(5, 'paul_ricard', moment.tz('2025-02-22', 'America/New_York').toDate()),
    new SeriesRound(6, 'indianapolis', moment.tz('2025-04-05', 'America/New_York').toDate())
]);