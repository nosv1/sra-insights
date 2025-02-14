import moment from 'moment-timezone';

export class TeamSeriesRound {
    round: number;
    trackName: string;
    date: Date;

    constructor(round: number, trackName: string, date: Date) {
        this.round = round;
        this.trackName = trackName;
        this.date = date;
    }
}

export class TeamSeriesSchedule {
    rounds: TeamSeriesRound[];

    constructor(rounds: TeamSeriesRound[]) {
        this.rounds = rounds;
    }

    getCurrentRound(): TeamSeriesRound {
        const now = moment.tz('America/New_York').utc().toDate();
        for (const round of this.rounds) {
            if (round.date >= now) {
                return round;
            }
        }
        return this.rounds[this.rounds.length - 1];
    };

    static getTrackFromRound(round: number): string {
        return TEAM_SERIES_SCHEDULE.rounds[round - 1].trackName;
    };
}

export const TEAM_SERIES_SCHEDULE = new TeamSeriesSchedule([
    // these dates are the thursday of the week, given the final race day is wednesday
    new TeamSeriesRound(1, 'suzuka', moment.tz('2024-12-12', 'America/New_York').toDate()),
    new TeamSeriesRound(2, 'watkins_glen', moment.tz('2024-12-19', 'America/New_York').toDate()),
    new TeamSeriesRound(3, 'misano', moment.tz('2025-01-09', 'America/New_York').toDate()),
    new TeamSeriesRound(4, 'nurburgring', moment.tz('2025-01-16', 'America/New_York').toDate()),
    new TeamSeriesRound(5, 'zolder', moment.tz('2025-01-23', 'America/New_York').toDate()),
    new TeamSeriesRound(6, 'mount_panorama', moment.tz('2025-02-06', 'America/New_York').toDate()),
    new TeamSeriesRound(7, 'oulton_park', moment.tz('2025-02-13', 'America/New_York').toDate()),
    new TeamSeriesRound(8, 'valencia', moment.tz('2025-02-20', 'America/New_York').toDate())
]);