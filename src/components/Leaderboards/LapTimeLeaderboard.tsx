import React from 'react';
import { ArcadeLeaderboard } from './ArcadeLeaderboard';
import { DriverHistory } from '../../types/DriverHistory';
import { Lap } from '../../types/Lap';
import { Data, Cell, Row } from './ArcadeLeaderboard';

export interface LapTimeLeaderboardProps {
    laps: Lap[];
    selectedDivisions: number[]
    lapAttr: keyof Lap;
};

export const LapTimeLeaderboard: React.FC<LapTimeLeaderboardProps> = ({ laps, selectedDivisions, lapAttr }: LapTimeLeaderboardProps) => {

    laps.sort((a, b) => (a[lapAttr] as number) - (b[lapAttr] as number));
    const driverHistories = DriverHistory.fromLaps(laps);

    let potentialValidP1 = Number.MAX_SAFE_INTEGER;
    let bestValidP1 = Number.MAX_SAFE_INTEGER;
    let potentialP1 = Number.MAX_SAFE_INTEGER;
    let bestP1 = Number.MAX_SAFE_INTEGER;

    driverHistories.sort((a, b) => {
        const compareSplits = (a: DriverHistory, b: DriverHistory, lapAttr: 'split1' | 'split2' | 'split3') => {
            const bestValidSplitAttr = `bestValid${lapAttr.charAt(0).toUpperCase() + lapAttr.slice(1)}` as keyof DriverHistory;
            const bestSplitAttr = `best${lapAttr.charAt(0).toUpperCase() + lapAttr.slice(1)}` as keyof DriverHistory;

            const aLap = (a[bestSplitAttr] as Lap)
            const bLap = (b[bestSplitAttr] as Lap)
            bestP1 = Math.min(
                bestP1,
                aLap[lapAttr] as number,
                bLap[lapAttr] as number
            );

            if (a[bestValidSplitAttr] && b[bestValidSplitAttr]) {
                const aValidLap: Lap = (a[bestValidSplitAttr] as Lap)
                const bValidLap: Lap = (b[bestValidSplitAttr] as Lap)
                bestValidP1 = Math.min(
                    bestValidP1,
                    aValidLap[lapAttr] as number,
                    bValidLap[lapAttr] as number
                );
                return (aValidLap[lapAttr] as number) - (bValidLap[lapAttr] as number);
            }

            if (a[bestValidSplitAttr])
                return -1;

            if (b[bestValidSplitAttr])
                return 1;
            return 0;
        };

        if (lapAttr == 'lapTime') {
            if (a.potentialBestValidLap && b.potentialBestValidLap) {
                potentialValidP1 = Math.min(potentialValidP1, a.potentialBestValidLap, b.potentialBestValidLap);
                bestValidP1 = Math.min(
                    bestValidP1,
                    a.bestValidLap?.[lapAttr] ?? bestValidP1,
                    b.bestValidLap?.[lapAttr] ?? bestValidP1
                );
                potentialP1 = Math.min(
                    potentialP1,
                    a.potentialBestLap ?? potentialP1,
                    b.potentialBestLap ?? potentialP1
                );
                bestP1 = Math.min(
                    bestP1,
                    a.bestLap?.[lapAttr] ?? bestP1,
                    b.bestLap?.[lapAttr] ?? bestP1
                );
                return a.potentialBestValidLap - b.potentialBestValidLap;
            }
            if (a.potentialBestValidLap)
                return -1;
            if (b.potentialBestValidLap)
                return 1;
        } else if (lapAttr == 'split1' || lapAttr == 'split2' || lapAttr == 'split3') {
            return compareSplits(a, b, lapAttr);
        }

        return 0;
    });

    const lapLink = (lap: Lap | undefined) => {
        if (!lap) {
            return '';
        }
        return `${lap.session?.sraSessionURL}#${lap.session?.sessionTypeSraWord}_${lap.car?.carId}`;
    }

    const lapPercentString = (time: number, percentAsDecimal: number) => {
        const timeString = Lap.timeToString(time);
        return <div>{`${timeString}`} <br></br> {`(${((percentAsDecimal - 1) * 100).toFixed(2)}%)`}</div>;
    }

    const lapAttrToTitle = (lapAttr: string) => {
        if (lapAttr === 'lapTime')
            return 'Lap Time';
        if (lapAttr === 'split1')
            return 'Split 1';
        if (lapAttr === 'split2')
            return 'Split 2';
        if (lapAttr === 'split3')
            return 'Split 3';
    }

    const bestValidFromLapAttr = (dh: DriverHistory, lapAttr: string) => {
        if (lapAttr === 'lapTime')
            return dh.bestValidLap;
        if (lapAttr === 'split1')
            return dh.bestValidSplit1;
        if (lapAttr === 'split2')
            return dh.bestValidSplit2;
        if (lapAttr === 'split3')
            return dh.bestValidSplit3;
    }


    const bestLapData: Data = {
        title: `${lapAttrToTitle(lapAttr)}s`,
        columns: lapAttr == 'lapTime' ?
            [
                'Driver',
                'Car',
                'Potential Valid',
                'Best Valid',
                'Potential',
                'Best'
            ] : [
                'Driver',
                'Car',
                'Best Valid',
                'Best',
            ],
        rows: driverHistories
            .filter(dh => selectedDivisions.includes(dh.basicDriver?.raceDivision ?? 0))
            .map(dh => {
                const cells: { [key: string]: Cell } = {
                    'Driver': new Cell(
                        <a href={dh.basicDriver?.sraMemberStatsURL} target="_blank" rel="noreferrer">
                            {dh.basicDriver?.name ?? ''}
                        </a>
                    ),

                    'Car': new Cell(dh.sessionCars[0].carModel.name),

                    'Potential Valid': new Cell(
                        dh.potentialBestValidLap ? lapPercentString(dh.potentialBestValidLap, dh.potentialBestValidLap / potentialValidP1) : '',
                        `Split 1: ${Lap.timeToString(dh.bestValidSplit1?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestValidSplit2?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestValidSplit3?.split3 ?? 0)}`
                    ),

                    'Best Valid': new Cell(
                        <a href={lapLink(dh.bestValidLap)} target="_blank" rel="noreferrer">
                            {bestValidFromLapAttr(dh, lapAttr)
                                ? lapPercentString(
                                    bestValidFromLapAttr(dh, lapAttr)?.[lapAttr] as number,
                                    bestValidFromLapAttr(dh, lapAttr)?.[lapAttr] as number / bestValidP1)
                                : ''
                            }
                        </a>,
                        `Split 1: ${Lap.timeToString(bestValidFromLapAttr(dh, lapAttr)?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(bestValidFromLapAttr(dh, lapAttr)?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(bestValidFromLapAttr(dh, lapAttr)?.split3 ?? 0)}\n` +
                        `-----\n` +
                        `Lap Time: ${Lap.timeToString(bestValidFromLapAttr(dh, lapAttr)?.lapTime ?? 0)}`
                    ),

                    'Potential': new Cell(
                        Lap.timeToString(dh.potentialBestLap ?? 0),
                        `Split 1: ${Lap.timeToString(dh.bestSplit1?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestSplit2?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestSplit3?.split3 ?? 0)}`
                    ),

                    'Best': new Cell(
                        <a href={lapLink(dh.bestLap)} target="_blank" rel="noreferrer">
                            {Lap.timeToString(dh.bestLap?.[lapAttr] as number ?? 0)}
                        </a>,
                        `Split 1: ${Lap.timeToString(dh.bestLap?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(dh.bestLap?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(dh.bestLap?.split3 ?? 0)}`
                    )

                };

                if (lapAttr != 'lapTime') {
                    delete cells['Potential Valid'];
                    delete cells['Potential'];
                }

                return new Row(Object.values(cells));
            })
    };

    return (
        <div className="arcade-leaderboard-container">
            <ArcadeLeaderboard data={bestLapData} />
        </div>
    );
}