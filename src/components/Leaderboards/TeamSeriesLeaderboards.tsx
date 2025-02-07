import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { min } from 'simple-statistics';
import { useLaps } from '../../hooks/useLaps';
import { DriverHistory } from '../../types/DriverHistory';
import { Lap } from '../../types/Lap';
import { TeamSeriesSchedule } from '../../utils/TeamSeriesSchedule';
import { DivSelection } from '../DivSelection';
import { Footer } from '../Footer';
import { TrackSelection } from '../TrackSelection';
import { ArcadeLeaderboard, Cell, Data, Row } from './ArcadeLeaderboard';
import { DateSelection } from './DateSelection';
import { LapTimeLeaderboard } from './LapTimeLeaderboard';
import { LapAttrSelection } from './LeaderboardSelection';
import { LAP_ATTRS } from './LeaderboardSelection';

export const TeamSeriesLeaderboards: React.FC = () => {
    const currentDateTime = new Date();
    const tzOffset = currentDateTime.getTimezoneOffset();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const localDateTime = new Date(currentDateTime.getTime() - tzOffset * 60 * 1000);
    const localTwoWeeksAgo = new Date(localDateTime.getTime() - 14 * dayMilliseconds);
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
        return {
            afterDate: afterDate || localTwoWeeksAgo.toISOString().split('T')[0],
            beforeDate: beforeDate || localTomorrow.toISOString().split('T')[0],
            trackName: trackName || TeamSeriesSchedule.getCurrentRoundTrack(),
            selectedDivisions: selectedDivisions ? selectedDivisions?.split(',').map(Number) : [],
            selectedLapAttrs: selectedLapAttrs ? selectedLapAttrs?.split(',') : []
        };
    };

    let params = getParams();

    const [afterDateState, setAfterDate] = useState<string>(params.afterDate);
    const [beforeDateState, setBeforeDate] = useState<string>(params.beforeDate);
    const [trackNameState, setTrackName] = useState<string>(params.trackName);
    const [selectedDivisionsState, setSelectedDivisions] = useState<(number)[]>(params.selectedDivisions);
    const [selectedLapAttrsState, setSelectedLapAttrs] = useState<string[]>(['lapTime']);
    const { laps, loading, error } = useLaps(afterDateState, beforeDateState, trackNameState);

    useEffect(() => {
        let params = getParams();
        setAfterDate(params.afterDate);
        setBeforeDate(params.beforeDate);
        setTrackName(params.trackName);
        setSelectedDivisions(params.selectedDivisions);
        setSelectedLapAttrs(params.selectedLapAttrs);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('afterDate', afterDateState);
        params.set('beforeDate', beforeDateState);
        params.set('trackName', trackNameState);
        params.set('selectedDivisions', selectedDivisionsState.join(','));
        params.set('selectedLapAttrs', selectedLapAttrsState.join(','));
        navigate({ search: params.toString() });
    }, [afterDateState, beforeDateState, trackNameState, selectedDivisionsState, selectedLapAttrsState]);

    const uniqueDivisions = Array
        .from(new Set(laps.map(lap => lap.driver?.raceDivision ?? 0)))
        .sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));

    return (
        <div>
            <div className="selection-area">
                <DivSelection
                    selectedDivisions={params.selectedDivisions}
                    setSelectedDivisions={setSelectedDivisions}
                    uniqueDivisions={uniqueDivisions}
                />
                <div className="leaderboard-controls">
                    <DateSelection afterDate={params.afterDate} beforeDate={params.beforeDate} onAfterDateChange={setAfterDate} onBeforeDateChange={setBeforeDate} />
                    <TrackSelection trackName={params.trackName} onTrackSelect={setTrackName} />
                </div>
                <LapAttrSelection selectedLapAttrs={selectedLapAttrsState} setSelectedLapAttrs={setSelectedLapAttrs} />
            </div>
            <div>
                {loading && <p>Loading...</p>}
                {error && <p>Error loading laps: {error}</p>}
                {!loading && !error && <p>Number of laps loaded: {laps.length}</p>}
            </div>
            <div className="leaderboards">
                {selectedLapAttrsState.map(lapAttr => (
                    <LapTimeLeaderboard key={lapAttr} laps={laps} selectedDivisions={selectedDivisionsState} lapAttr={lapAttr as keyof Lap} />
                ))}
            </div>
            <Footer />
        </div >
    );
}
