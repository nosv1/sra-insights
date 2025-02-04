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
        return {
            afterDate: afterDate || localTwoWeeksAgo.toISOString().split('T')[0],
            beforeDate: beforeDate || localTomorrow.toISOString().split('T')[0],
            trackName: trackName || TeamSeriesSchedule.getCurrentRoundTrack(),
            selectedDivisions: selectedDivisions ? selectedDivisions?.split(',').map(Number) : []
        };
    };

    let { afterDate, beforeDate, trackName, selectedDivisions } = getParams();

    const [afterDateState, setAfterDate] = useState<string>(afterDate);
    const [beforeDateState, setBeforeDate] = useState<string>(beforeDate);
    const [trackNameState, setTrackName] = useState<string>(trackName);
    const [selectedDivisionsState, setSelectedDivisions] = useState<(number)[]>(selectedDivisions);
    const { laps, loading, error } = useLaps(afterDateState, beforeDateState, trackNameState);

    useEffect(() => {
        let { afterDate, beforeDate, trackName, selectedDivisions } = getParams();
        setAfterDate(afterDate);
        setBeforeDate(beforeDate);
        setTrackName(trackName);
        setSelectedDivisions(selectedDivisions);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('afterDate', afterDateState);
        params.set('beforeDate', beforeDateState);
        params.set('trackName', trackNameState);
        params.set('selectedDivisions', selectedDivisionsState.join(','));
        navigate({ search: params.toString() });
    }, [afterDateState, beforeDateState, trackNameState, selectedDivisionsState]);

    const lapAttr = 'lapTime';
    laps.sort((a, b) => a[lapAttr] - b[lapAttr]);
    const driverHistories = DriverHistory.fromLaps(laps);
    let potentialValidP1 = Number.MAX_SAFE_INTEGER;
    let bestValidP1 = Number.MAX_SAFE_INTEGER;
    let potentialP1 = Number.MAX_SAFE_INTEGER;
    let bestP1 = Number.MAX_SAFE_INTEGER;

    driverHistories.sort((a, b) => {
        if (a.potentialBestValidLap && b.potentialBestValidLap) {
            potentialValidP1 = min([potentialValidP1, a.potentialBestValidLap, b.potentialBestValidLap]);
            bestValidP1 = min([bestValidP1, a.bestValidLap?.lapTime ?? bestValidP1, b.bestValidLap?.lapTime ?? bestValidP1]);
            potentialP1 = min([potentialP1, a.potentialBestLap ?? potentialP1, b.potentialBestLap ?? potentialP1]);
            bestP1 = min([bestP1, a.bestLap?.lapTime ?? bestP1, b.bestLap?.lapTime ?? bestP1]);
            return a.potentialBestValidLap - b.potentialBestValidLap;
        }
        if (a.potentialBestValidLap) {
            return -1;
        }
        if (b.potentialBestValidLap) {
            return 1;
        }
        return 0;
    });

    const uniqueDivisions = Array
        .from(new Set(laps.map(lap => lap.driver?.raceDivision ?? 0)))
        .sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));

    const lapLink = (lap: Lap | undefined) => {
        if (!lap) {
            return '';
        }
        return `${lap.session?.sraSessionURL}#${lap.session?.sessionTypeSraWord}_${lap.car?.carId}`;
    }

    const lapPercentString = (time: number, percentAsDecimal: number) => {
        const timeString = Lap.timeToString(time);
        return `${timeString} (${((percentAsDecimal - 1) * 100).toFixed(2)}%)`;
    }

    const bestLapData: Data = {
        title: 'Lap Time',
        columns: ['Driver', 'Car', 'Potential Valid', 'Best Valid', 'Potential', 'Best'],
        rows: driverHistories
            .filter(dh => selectedDivisions.includes(dh.basicDriver?.raceDivision ?? 0))
            .map(dh =>
                new Row([
                    // Driver
                    new Cell(
                        <a href={dh.basicDriver?.sraMemberStatsURL} target="_blank" rel="noreferrer">
                            {dh.basicDriver?.name ?? ''}
                        </a>
                    ),

                    // Car
                    new Cell(dh.sessionCars[0].carModel.name),

                    // Potential Valid
                    new Cell(
                        dh.potentialBestValidLap ? lapPercentString(dh.potentialBestValidLap, dh.potentialBestValidLap / potentialValidP1) : '',
                        `Split 1: ${Lap.timeToString(dh.bestValidSplit1?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestValidSplit2?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestValidSplit3?.split3 ?? 0)}`
                    ),

                    // Best Valid
                    new Cell(
                        <a href={lapLink(dh.bestValidLap)} target="_blank" rel="noreferrer">
                            {dh.bestValidLap ? lapPercentString(dh.bestValidLap.lapTime, dh.bestValidLap.lapTime / bestValidP1) : ''}
                        </a>,
                        `Split 1: ${Lap.timeToString(dh.bestValidLap?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestValidLap?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestValidLap?.split3 ?? 0)}`
                    ),

                    // Potential
                    new Cell(
                        Lap.timeToString(dh.potentialBestLap ?? 0),
                        `Split 1: ${Lap.timeToString(dh.bestSplit1?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestSplit2?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestSplit3?.split3 ?? 0)}`
                    ),

                    // Best
                    new Cell(
                        <a href={lapLink(dh.bestLap)} target="_blank" rel="noreferrer">
                            {Lap.timeToString(dh.bestLap?.lapTime ?? 0)}
                        </a>,
                        `Split 1: ${Lap.timeToString(dh.bestLap?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestLap?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestLap?.split3 ?? 0)}`
                    )
                ])
            )
    };

    return (
        <div>
            <div className="selection-area">
                <DivSelection
                    selectedDivisions={selectedDivisions}
                    setSelectedDivisions={setSelectedDivisions}
                    uniqueDivisions={uniqueDivisions}
                />
                <div className="leaderboard-controls">
                    <DateSelection afterDate={afterDate} beforeDate={beforeDate} onAfterDateChange={setAfterDate} onBeforeDateChange={setBeforeDate} />
                    <TrackSelection trackName={trackName} onTrackSelect={setTrackName} />
                </div>
            </div>
            <div>
                {loading && <p>Loading...</p>}
                {error && <p>Error loading laps: {error}</p>}
                {!loading && !error && <p>Number of laps loaded: {laps.length}</p>}
            </div>
            <div className="arcade-leaderboard-container">
                <ArcadeLeaderboard data={bestLapData} />
            </div>
            <Footer />
        </div >
    );
}
