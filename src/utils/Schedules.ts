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
    // these dates are the thursday of the week (the thursday after the race), given the final race day is wednesday
    new SeriesRound(1, 'suzuka', moment.tz('2026-04-23', 'America/New_York').toDate()),
    new SeriesRound(2, 'spa', moment.tz('2026-04-30', 'America/New_York').toDate()),
    new SeriesRound(3, 'laguna_seca', moment.tz('2026-05-07', 'America/New_York').toDate()),
    new SeriesRound(4, 'monza', moment.tz('2026-05-14', 'America/New_York').toDate()),
    new SeriesRound(5, 'donington_park', moment.tz('2026-05-21', 'America/New_York').toDate()),
    new SeriesRound(6, 'cota', moment.tz('2026-06-04', 'America/New_York').toDate()),
    new SeriesRound(7, 'hungaroring', moment.tz('2026-06-11', 'America/New_York').toDate()),
    new SeriesRound(8, 'nurburgring', moment.tz('2026-06-18', 'America/New_York').toDate())
]);

export const ENDURANCE_SERIES_SCHEDULE = new SeriesSchedule([
    new SeriesRound(1, 'barcelona', moment.tz('2025-09-13', 'America/New_York').toDate()),
    new SeriesRound(2, 'nurburgring_24h', moment.tz('2025-10-18', 'America/New_York').toDate()),
    new SeriesRound(3, 'suzuka', moment.tz('2025-11-22', 'America/New_York').toDate()),
    new SeriesRound(4, 'mount_panorama', moment.tz('2025-12-20', 'America/New_York').toDate()),
    new SeriesRound(5, 'imola', moment.tz('2026-01-31', 'America/New_York').toDate()),
    new SeriesRound(6, 'spa', moment.tz('2026-03-07', 'America/New_York').toDate())
]);