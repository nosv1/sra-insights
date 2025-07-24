import moment from "moment"
import { useEffect, useState } from "react"
import { Footer } from "../components/Footer"
import { Header } from "../components/Header"
import { ArcadeLeaderboard, Cell, Data, Row } from "../components/Leaderboards/ArcadeLeaderboard"
import { DriverHover } from "../components/Leaderboards/DriverHover"
import { LapsOverTimePlot } from "../components/Leaderboards/LapsOverTimePlot"
import { useLaps } from "../hooks/useLaps"
import { BasicDriver } from "../types/BasicDriver"
import { DriverHistory } from "../types/DriverHistory"
import { Lap } from "../types/Lap"
import { Session } from "../types/Session"
import { TEAM_SERIES_SCHEDULE } from "../utils/Schedules"
import { useDriverCarLapCounts } from "../hooks/useBasicDrivers"

export const LapCountsPage: React.FC = () => {
    const [hoveredDriver, setHoveredDriver] = useState<BasicDriver | undefined>(undefined);

    const currentRound = TEAM_SERIES_SCHEDULE.getCurrentRound()
    const localWeekAgo = moment
        .tz(currentRound.date, 'America/New_York')
        .utc()
        .subtract(7, 'days')
        .toDate()

    const { driverCarLapCounts: driverCarLapCounts, loading: lapCountsLoading, error: lapCountsError } = useDriverCarLapCounts(
        moment
            .tz(TEAM_SERIES_SCHEDULE.rounds[0].date, 'America/New_York')
            .utc()
            .subtract(7, 'days')
            .toDate()
            .toISOString(),
        currentRound.date.toISOString()
    );
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
        columns: ["Div", "Driver", "Car", "Round Count", "Season Count", "Best Lap", "Median Lap"],
        defaultColumns: ["Div", "Driver", "Car", "Round Count"],
        rows: driverHistoriesState.map((dh) => {

            const cells: { [key: string]: Cell } = {
                "Div": new Cell(
                    `${dh.basicDriver?.division.toFixed(1)}`,
                    null,
                    `${dh.basicDriver?.division.toFixed(1)}`,
                ),
                "Driver": new Cell(
                    <div
                        className="driver-hover-dropdown"
                        onMouseEnter={() => setHoveredDriver(dh.basicDriver)}
                        onMouseLeave={() => setHoveredDriver(undefined)}
                    >
                        <a
                            href={dh.basicDriver?.sraInsightsURL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {dh.basicDriver?.name}
                        </a>
                        {hoveredDriver === dh.basicDriver && (
                            <DriverHover driver={hoveredDriver} />
                        )}
                    </div>
                ),
                "Car": new Cell(
                    dh.sessionCars[0].carModel.name
                ),
                "Round Count": new Cell(
                    dh.laps.length,
                    null,
                    dh.laps.length
                ),
                "Season Count": (() => {
                    const driverId = dh.basicDriver?.driverId;
                    const carModel = dh.sessionCars[0].carModel
                    const lapEntry = driverId ? driverCarLapCounts[`${driverId}-${carModel.modelId}`] : undefined;

                    if (lapEntry?.lapCount) {
                        const count = lapEntry.lapCount ?? 0;
                        return new Cell(count.toString(), null, count);
                    } else
                        return new Cell("0", null, 0);
                })(),
                "Best Lap": new Cell(
                    Lap.timeToString(dh.bestLap ? dh.bestLap.lapTime : 0),
                    null,
                    dh.bestLap ? dh.bestLap.lapTime / 1000.0 : 0
                ),
                "Median Lap": new Cell(
                    Lap.timeToString(dh.medianLap ? dh.medianLap.lapTime : 0),
                    null,
                    dh.medianLap ? dh.medianLap.lapTime / 1000.0 : 0
                ),
            };

            return new Row(Object.values(cells), <LapsOverTimePlot driverHistory={dh} lapAttr={"lapTime"} />);

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
            <Footer />
        </div>
    )
}