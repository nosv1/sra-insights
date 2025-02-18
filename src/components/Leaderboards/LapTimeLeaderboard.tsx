import React, { useState } from 'react';
import { ArcadeLeaderboard } from './ArcadeLeaderboard';
import { DriverHistory } from '../../types/DriverHistory';
import { Lap } from '../../types/Lap';
import { Data, Cell, Row } from './ArcadeLeaderboard';
import { LAP_ATTR_TO_TITLE } from './LeaderboardSelection';
import { DriverHover } from './DriverHover';
import { BasicDriver } from '../../types/BasicDriver';
import { LapsOverTimePlot } from './LapsOverTimePlot';

export interface LapTimeLeaderboardProps {
    driverHistories: DriverHistory[];
    divisionTimes: {
        medianDivisionTimes: { [division: string]: { [lapAttr: string]: number, potentialBest: number } },
        averageDivisionTimes: { [division: string]: { [lapAttr: string]: number, potentialBest: number } },
        bestTimes: { [lapAttr: string]: number }
    };
    selectedDivisions: number[];
    lapAttr: keyof Lap;
};

export const LapTimeLeaderboard: React.FC<LapTimeLeaderboardProps> = ({ driverHistories, divisionTimes: divisionTimes, selectedDivisions, lapAttr }: LapTimeLeaderboardProps) => {
    const [hoveredDriver, setHoveredDriver] = useState<BasicDriver | undefined>(undefined);

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

        if (lapAttr === 'lapTime') {
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
        } else if (lapAttr === 'split1' || lapAttr === 'split2' || lapAttr === 'split3') {
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

    const bestFromLapAttr = (dh: DriverHistory, lapAttr: string, isValid: boolean = false) => {
        if (isValid) {
            if (lapAttr === 'lapTime')
                return dh.bestValidLap;
            if (lapAttr === 'split1')
                return dh.bestValidSplit1;
            if (lapAttr === 'split2')
                return dh.bestValidSplit2;
            if (lapAttr === 'split3')
                return dh.bestValidSplit3;
        } else {
            if (lapAttr === 'lapTime')
                return dh.bestLap;
            if (lapAttr === 'split1')
                return dh.bestSplit1;
            if (lapAttr === 'split2')
                return dh.bestSplit2;
            if (lapAttr === 'split3')
                return dh.bestSplit3;
        }
    }

    const bestLapData: Data = {
        title: `${LAP_ATTR_TO_TITLE[lapAttr]}s`,
        columns: lapAttr === 'lapTime'
            ? [ // Lap Time Leaderboard
                'Div | Driver',
                'Car',
                'Potential Valid',
                'Best Valid',
                'Potential',
                'Best',
                'Closest Div Median',
            ]
            : [ // Split Leaderboard
                'Div | Driver',
                'Car',
                'Best Valid',
                'Best',
                'Closest Div Median',
            ],
        defaultColumns: lapAttr === 'lapTime' ? ['Div | Driver', 'Potential Valid', 'Best Valid'] : ['Div | Driver', 'Best Valid'],
        rows: driverHistories
            .filter(dh => selectedDivisions.includes(dh.basicDriver?.raceDivision ?? 0) && dh.bestValidLap)
            .map(dh => {
                const best = bestFromLapAttr(dh, lapAttr);
                const bestValid = bestFromLapAttr(dh, lapAttr, true);
                let closestDiv = 0;
                if (bestValid) {
                    const bestValidLapTime = bestValid[lapAttr] as number;
                    let smallestDiff = Number.MAX_SAFE_INTEGER;

                    for (const divStr in divisionTimes.medianDivisionTimes) {
                        const div = parseInt(divStr, 10);
                        const medianTime = divisionTimes.medianDivisionTimes[div][lapAttr];
                        const percentDiff = Math.abs(bestValidLapTime - medianTime) / medianTime;
                        if (percentDiff < smallestDiff) {
                            smallestDiff = percentDiff;
                            closestDiv = div;
                        }
                    }
                }

                const cells: { [key: string]: Cell } = {
                    'Div | Driver': new Cell(
                        <div className="driver-hover-dropdown" onMouseEnter={() => setHoveredDriver(dh.basicDriver)} onMouseLeave={() => setHoveredDriver(undefined)}>
                            <a
                                href={dh.basicDriver?.sraMemberStatsURL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {`${dh.basicDriver?.division.toFixed(1)} | ${dh.basicDriver?.name}`}
                            </a>
                            {hoveredDriver === dh.basicDriver && <DriverHover driver={hoveredDriver} />}
                        </div>
                    ),

                    'Car': new Cell(dh.sessionCars[0].carModel.name),

                    'Potential Valid': new Cell(
                        dh.potentialBestValidLap ? lapPercentString(dh.potentialBestValidLap, dh.potentialBestValidLap / potentialValidP1) : '',
                        `Split 1: ${Lap.timeToString(dh.bestValidSplit1?.split1 ?? 0)} (set ${dh.bestValidSplit1?.session?.timeAgo})\n` +
                        `Split 2: ${Lap.timeToString(dh.bestValidSplit2?.split2 ?? 0)} (set ${dh.bestValidSplit2?.session?.timeAgo})\n` +
                        `Split 3: ${Lap.timeToString(dh.bestValidSplit3?.split3 ?? 0)} (set ${dh.bestValidSplit3?.session?.timeAgo})\n`,
                        (dh.potentialBestValidLap ?? 0) / 1000
                    ),

                    'Best Valid': new Cell(
                        <a href={lapLink(bestValid)} target="_blank" rel="noreferrer">
                            {bestValid
                                ? lapPercentString(
                                    bestValid?.[lapAttr] as number,
                                    bestValid?.[lapAttr] as number / bestValidP1)
                                : ''
                            }
                        </a>,
                        `Split 1: ${Lap.timeToString(bestValid?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(bestValid?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(bestValid?.split3 ?? 0)}\n` +
                        `Set ${dh.bestValidLap?.session?.timeAgo}`,
                        (bestValid?.[lapAttr] as number) / 1000
                    ),

                    'Potential': new Cell(
                        Lap.timeToString(dh.potentialBestLap ?? 0),
                        `Split 1: ${Lap.timeToString(dh.bestSplit1?.split1 ?? 0)} (set ${dh.bestSplit1?.session?.timeAgo})\n` +
                        `Split 2: ${Lap.timeToString(dh.bestSplit2?.split2 ?? 0)} (set ${dh.bestSplit2?.session?.timeAgo})\n` +
                        `Split 3: ${Lap.timeToString(dh.bestSplit3?.split3 ?? 0)} (set ${dh.bestSplit3?.session?.timeAgo})\n`
                    ),

                    'Best': new Cell(
                        <a href={lapLink(best)} target="_blank" rel="noreferrer">
                            {best
                                ? lapPercentString(
                                    best?.[lapAttr] as number,
                                    best?.[lapAttr] as number / bestP1)
                                : ''
                            }
                        </a>,
                        `Split 1: ${Lap.timeToString(best?.split1 ?? 0)}\n` +
                        `Split 2: ${Lap.timeToString(best?.split2 ?? 0)}\n` +
                        `Split 3: ${Lap.timeToString(best?.split3 ?? 0)}\n` +
                        `Set ${dh.bestLap?.session?.timeAgo}`
                    ),

                    'Closest Div Median': new Cell(
                        `Div ${closestDiv}`, '', closestDiv
                    )
                };

                if (lapAttr !== 'lapTime') {
                    delete cells['Potential Valid'];
                    delete cells['Potential'];
                }

                return new Row(Object.values(cells), <LapsOverTimePlot driverHistory={dh} lapAttr={lapAttr} />);
            })
    };

    return (
        <div className="arcade-leaderboard-container">
            <ArcadeLeaderboard data={bestLapData} />
        </div>
    );
}