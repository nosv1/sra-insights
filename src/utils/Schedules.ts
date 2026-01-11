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
}

export const TEAM_SERIES_SCHEDULE = new SeriesSchedule([
    // these dates are the thursday of the week, given the final race day is wednesday
    new SeriesRound(1, 'indianapolis', moment.tz('2026-01-15', 'America/New_York').toDate()),
    new SeriesRound(2, 'watkins_glen', moment.tz('2026-01-22', 'America/New_York').toDate()),
    new SeriesRound(3, 'barcelona', moment.tz('2026-02-05', 'America/New_York').toDate()),
    new SeriesRound(4, 'zolder', moment.tz('2026-02-12', 'America/New_York').toDate()),
    new SeriesRound(5, 'imola', moment.tz('2026-02-19', 'America/New_York').toDate()),
    new SeriesRound(6, 'snetterton', moment.tz('2026-02-26', 'America/New_York').toDate()),
    new SeriesRound(7, 'kyalami', moment.tz('2026-03-05', 'America/New_York').toDate()),
    new SeriesRound(8, 'red_bull_ring', moment.tz('2026-03-12', 'America/New_York').toDate()),
]);

export const ENDURANCE_SERIES_SCHEDULE = new SeriesSchedule([
    new SeriesRound(1, 'barcelona', moment.tz('2025-09-13', 'America/New_York').toDate()),
    new SeriesRound(2, 'nurburgring_24h', moment.tz('2025-10-18', 'America/New_York').toDate()),
    new SeriesRound(3, 'suzuka', moment.tz('2025-11-22', 'America/New_York').toDate()),
    new SeriesRound(4, 'mount_panorama', moment.tz('2025-12-20', 'America/New_York').toDate()),
    new SeriesRound(5, 'imola', moment.tz('2026-01-31', 'America/New_York').toDate()),
    new SeriesRound(6, 'spa', moment.tz('2026-03-07', 'America/New_York').toDate())
]);