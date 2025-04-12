import moment from "moment"
import { useEffect, useState } from "react"
import { Header } from "../components/Header"
import { ArcadeLeaderboard, Cell, Data, Row } from "../components/Leaderboards/ArcadeLeaderboard"
import { LapsOverTimePlot } from "../components/Leaderboards/LapsOverTimePlot"
import { useLaps } from "../hooks/useLaps"
import { DriverHistory } from "../types/DriverHistory"
import { Lap } from "../types/Lap"
import { Session } from "../types/Session"
import { TEAM_SERIES_SCHEDULE } from "../utils/Schedules"

export const LapCountsPage: React.FC = () => {
    const currentRound = TEAM_SERIES_SCHEDULE.getCurrentRound()
    const localWeekAgo = moment.tz(currentRound.date, 'America/New_York').utc().subtract(7, 'days').toDate()

    const { laps, loading: laps_loading, error: laps_error } = useLaps(localWeekAgo.toISOString(), currentRound.date.toISOString(),
        currentRound.trackName, ["GT3"]);
    const [driverHistoriesState, setDriverHistories] = useState<DriverHistory[]>([]);

    useEffect(() => {
        if (laps.length == 0) return;
        const driverHistories = DriverHistory.fromLaps(laps);
        driverHistories.sort((a, b) => {
            return b.laps.length - a.laps.length;
        });
        setDriverHistories(driverHistories);
    }, [laps]);

    const lapCountData: Data = {
        title: `${Session.trackNameToTtile(currentRound.trackName)} Lap Counts`,
        columns: ["Div | Driver", "Car", "Lap Count", "Best Lap", "Median Lap"],
        defaultColumns: ["Div | Driver", "Car", "Lap Count"],
        rows: driverHistoriesState.map((driverHistory) => {

            const cells: { [key: string]: Cell } = {
                "Div | Driver": new Cell(`${driverHistory.basicDriver?.raceDivision} | ${driverHistory.basicDriver?.name}`),
                "Car": new Cell(driverHistory.sessionCars[0].carModel.name),
                "Lap Count": new Cell(driverHistory.laps.length, null, driverHistory.laps.length),
                "Best Lap": new Cell(Lap.timeToString(driverHistory.bestLap ? driverHistory.bestLap.lapTime : 0), null, driverHistory.bestLap ? driverHistory.bestLap.lapTime / 1000.0 : 0),
                "Median Lap": new Cell(Lap.timeToString(driverHistory.medianLap ? driverHistory.medianLap.lapTime : 0), null, driverHistory.medianLap ? driverHistory.medianLap.lapTime / 1000.0 : 0),
            }

            return new Row(Object.values(cells), <LapsOverTimePlot driverHistory={driverHistory} lapAttr={"lapTime"} />);

        })
    }

    return (
        <div>
            <Header />
            {laps_loading && <div>Loading...</div>}
            {laps_error && <div>Error: {laps_error}</div>}
            <div className="leaderboards">
                <ArcadeLeaderboard data={lapCountData} />
            </div>
        </div>
    )
}