import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLaps } from '../../hooks/useLaps';
import { DriverHistory } from '../../types/DriverHistory';
import { Lap } from '../../types/Lap';
import { INDY_QUALIFYING, S14_QUALIFYING, S14_TEAM_SERIES_SCHEDULE } from '../../utils/TeamSeriesSchedule';
import { DivSelection } from '../DivSelection';
import { Footer } from '../Footer';
import { ServerSelection } from '../ServerSelection';
import { TrackSelection } from '../TrackSelection';
import { ArcadeLeaderboard, Cell, Data, Row } from './ArcadeLeaderboard';
import { DateSelection } from './DateSelection';
import { LapTimeLeaderboard } from './LapTimeLeaderboard';
import { LAP_ATTR_TO_TITLE, LapAttrSelection } from './LeaderboardSelection';

export const TeamSeriesLeaderboards: React.FC = () => {
    const currentDateTime = moment.tz('America/New_York').utc().toDate();
    const tzOffset = currentDateTime.getTimezoneOffset();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const localDateTime = new Date(currentDateTime.getTime() - tzOffset * 60 * 1000);
    const localOneWeekAgo = new Date(localDateTime.getTime() - 7 * dayMilliseconds);
    const localTomorrow = new Date(localDateTime.getTime() + dayMilliseconds);

    const location = useLocation();
    const navigate = useNavigate();

    const getParams = () => {
        const params = new URLSearchParams(location.search);
        const afterDate = params.get('afterDate');
        const beforeDate = params.get('beforeDate');
        const trackName = params.get('trackName');
        const selectedDivisions = params.get('selectedDivisions');
        const selectedLapAttrs = params.get('selectedLapAttrs');
        const selectedServers = params.get('selectedServers');
        return {
            afterDate: afterDate || localOneWeekAgo.toISOString().split('T')[0],
            beforeDate: beforeDate || localTomorrow.toISOString().split('T')[0],
            trackName: trackName || S14_TEAM_SERIES_SCHEDULE.getCurrentRound().trackName,
            selectedDivisions: selectedDivisions ? selectedDivisions?.split(',').map(Number) : [],
            selectedLapAttrs: selectedLapAttrs ? selectedLapAttrs?.split(',') : ['lapTime'],
            selectedServers: selectedServers ? selectedServers?.split(',') : ['server1', 'server2', 'server3', 'server4']
        };
    };

    let params = getParams();

    const [afterDateState, setAfterDate] = useState<string>(params.afterDate);
    const [beforeDateState, setBeforeDate] = useState<string>(params.beforeDate);
    const [trackNameState, setTrackName] = useState<string>(params.trackName);
    const [selectedDivisionsState, setSelectedDivisions] = useState<(number)[]>(params.selectedDivisions);
    const [uniqueDivisionsState, setUniqueDivisions] = useState<number[]>([]);
    const [selectedLapAttrsState, setSelectedLapAttrs] = useState<string[]>(params.selectedLapAttrs);
    const [selectedServersState, setSelectedServers] = useState<string[]>(params.selectedServers);
    const [uniqueServersState, setUniqueServers] = useState<string[]>(['server1', 'server2', 'server3', 'server4', 'server7']);
    const [medianDivisionTimesData, setMedianDivisionTimesData] = useState<Data>();
    const { laps, loading, error } = useLaps(afterDateState, beforeDateState, trackNameState, ['GT3']);
    const [filteredLapsState, setFilteredLaps] = useState<Lap[]>([]);

    const driverHistories = DriverHistory.fromLaps(filteredLapsState);
    const divisionTimes = DriverHistory.divisionTimesFromDriverHistories(driverHistories, uniqueDivisionsState);

    const lapPercentString = (time: number, percentAsDecimal: number) => {
        const timeString = Lap.timeToString(time);
        return <div>{`${timeString}`} <br></br> {`(${((percentAsDecimal - 1) * 100).toFixed(2)}%)`}</div>;
    }

    useEffect(() => {
        let params = getParams();
        setAfterDate(params.afterDate);
        setBeforeDate(params.beforeDate);
        setTrackName(params.trackName);
        setSelectedDivisions(params.selectedDivisions);
        setSelectedLapAttrs(params.selectedLapAttrs);
        setSelectedServers(params.selectedServers);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('afterDate', afterDateState);
        params.set('beforeDate', beforeDateState);
        params.set('trackName', trackNameState);
        params.set('selectedDivisions', selectedDivisionsState.join(','));
        params.set('selectedLapAttrs', selectedLapAttrsState.join(','));
        params.set('selectedServers', selectedServersState.join(','));
        navigate({ search: params.toString() });
    }, [afterDateState, beforeDateState, trackNameState, selectedDivisionsState, selectedLapAttrsState, selectedServersState]);

    useEffect(() => {
        if (!laps || laps.length === 0)
            return;

        setFilteredLaps(laps.filter(l => selectedServersState.includes(l.serverNumber)));

        setUniqueDivisions(Array
            .from(new Set(laps.map(lap => lap.driver?.raceDivision ?? 0)))
            .sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b)));
    }, [laps, selectedLapAttrsState]);

    useEffect(() => {
        setMedianDivisionTimesData({
            title: 'Median Division Times',
            columns: [''].concat(uniqueDivisionsState.map(d => `D${d}`)),
            defaultColumns: [''].concat(uniqueDivisionsState.filter(d => d !== 0).map(d => `D${d}`)),
            rows: selectedLapAttrsState.map(lapAttr => {
                const cells: Cell[] = [new Cell(LAP_ATTR_TO_TITLE[lapAttr]), ...uniqueDivisionsState.map(d => {
                    const time = divisionTimes.medianDivisionTimes[d][lapAttr];
                    return new Cell(lapPercentString(time, time / divisionTimes.bestTimes[lapAttr]));
                })];
                return new Row(cells);
            })
        });
    }, [uniqueDivisionsState, selectedLapAttrsState]);

    return (
        <div>
            <div>
                {loading && <p>Loading...</p>}
                {error && <p>Error loading laps: {error}</p>}
                {!loading && !error && (
                    <div>
                        <p>Number of laps loaded: {laps.length}</p>
                        <p>Displaying Season 13's divisions!</p>
                    </div>
                )}
            </div>
            <div className="selection-area">
                <DivSelection
                    selectedDivisions={params.selectedDivisions}
                    setSelectedDivisions={setSelectedDivisions}
                    uniqueDivisions={uniqueDivisionsState}
                />
                <div className="leaderboard-controls">
                    <DateSelection afterDate={params.afterDate} beforeDate={params.beforeDate} onAfterDateChange={setAfterDate} onBeforeDateChange={setBeforeDate} />
                    <TrackSelection trackName={params.trackName} onTrackSelect={setTrackName} />
                </div>
                <LapAttrSelection selectedLapAttrs={selectedLapAttrsState} setSelectedLapAttrs={setSelectedLapAttrs} />
                <ServerSelection selectedServers={selectedServersState} setSelectedServers={setSelectedServers} uniqueServers={uniqueServersState} />
            </div>
            {medianDivisionTimesData &&
                <div className="arcade-leaderboard-container">
                    <ArcadeLeaderboard data={medianDivisionTimesData} includePosition={false} />
                </div>
            }
            <div className="leaderboards">
                {selectedLapAttrsState.map(lapAttr => (
                    <LapTimeLeaderboard key={lapAttr} driverHistories={driverHistories} divisionTimes={divisionTimes} selectedDivisions={selectedDivisionsState} lapAttr={lapAttr as keyof Lap} />
                ))}
            </div>
            <Footer />
        </div >
    );
}
