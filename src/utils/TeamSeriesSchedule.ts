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

    static getCurrentRoundTrack = () => {
        const now = new Date();
        for (const round of TEAM_SERIES_SCHEDULE.rounds) {
            if (round.date > now) {
                return round.trackName;
            }
        }
        return TEAM_SERIES_SCHEDULE.rounds[TEAM_SERIES_SCHEDULE.rounds.length - 1].trackName;
    };
}

export const TEAM_SERIES_SCHEDULE = new TeamSeriesSchedule([
    // these dates are the thursday of the week, given the final race day is wednesday
    new TeamSeriesRound(1, 'suzuka', new Date('2024-12-12')),
    new TeamSeriesRound(2, 'watkins_glen', new Date('2024-12-19')),
    new TeamSeriesRound(3, 'misano', new Date('2025-01-09')),
    new TeamSeriesRound(4, 'nurburgring', new Date('2025-01-16')),
    new TeamSeriesRound(5, 'zolder', new Date('2025-01-23')),
    new TeamSeriesRound(6, 'mount_panorama', new Date('2025-02-06')),
    new TeamSeriesRound(7, 'oulton_park', new Date('2025-02-15')),
    new TeamSeriesRound(8, 'valencia', new Date('2025-02-20'))
]);