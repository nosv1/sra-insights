import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { useTeamSeriesTracks, useTeamSeriesWeekendsFromTracks } from "../../hooks/useSessions";
import { DriverHistory } from "../../types/DriverHistory";
import { Weekend } from "../../types/Weekend";
import Plot from 'react-plotly.js';
import { SRADivColor } from "../../utils/SRADivColor";

export const DivisionPercentDifferences: React.FC = () => {
    const { teamSeriesTracks, loading: tracksLoading, error: tracksError } = useTeamSeriesTracks('', 8);
    const { teamSeriesWeekends, loading: weekendsLoading, error: weekendsError } = useTeamSeriesWeekendsFromTracks(teamSeriesTracks);

    const getWeekendKey = (weekend: Weekend): string => {
        return `${weekend.race.teamSeriesSession?.season}_${weekend.race.trackName}`;
    };

    const teamSeriesWeekendsByWeekendKey: { [weekendKey: string]: Weekend } = {};
    teamSeriesWeekends.forEach((weekend) => {
        if (weekend.race.teamSeriesSession?.avgPercentDiff === 0) {
            return;
        }
        teamSeriesWeekendsByWeekendKey[getWeekendKey(weekend)] = weekend;
    });

    const driverHistoriesByWeekend: {
        [weekendKey: string]: { [division: string]: { weekend: Weekend, driverHistories: DriverHistory[] } }
    } = {};
    teamSeriesWeekends.forEach((weekend) => {
        const weekendKey = getWeekendKey(weekend);
        if (!teamSeriesWeekendsByWeekendKey[weekendKey])
            return;
        const driverHistories = DriverHistory.fromCarDrivers([...weekend.qualifying.carDrivers ?? [], ...weekend.race.carDrivers ?? []])
        const div = weekend.race.teamSeriesSession?.division;
        if (!div)
            return;

        if (!driverHistoriesByWeekend[weekendKey])
            driverHistoriesByWeekend[weekendKey] = {};

        if (!driverHistoriesByWeekend[weekendKey][div])
            driverHistoriesByWeekend[weekendKey][div] = { weekend: weekend, driverHistories: [] };

        driverHistoriesByWeekend[weekendKey][div] = { weekend: weekend, driverHistories: driverHistories };
    });

    const divMediansByWeekend: { [weekendKey: string]: { [div: string]: number } } = {};
    Object.values(driverHistoriesByWeekend).reverse().forEach((driverHistoryByWeekend) => {
        Object.values(driverHistoryByWeekend).forEach((divDriverHistories) => {
            const { weekend, driverHistories } = divDriverHistories;
            const div = weekend.race.teamSeriesSession?.division;
            if (!div)
                return;

            if (!divMediansByWeekend[getWeekendKey(weekend)])
                divMediansByWeekend[getWeekendKey(weekend)] = {};

            [div, div === 1 ? 0.1 : null].forEach((div) => {
                if (div === null) return;

                const divisionTimes = DriverHistory.divisionTimesFromDriverHistories(driverHistories, [div]);
                Object.keys(divisionTimes.medianDivisionTimes).forEach(division => {
                    divMediansByWeekend[getWeekendKey(weekend)][division] = divisionTimes.medianDivisionTimes[division].potentialBest;
                });
            });
        });
    });

    const plotData: {
        [division: string]: {
            x: string[],
            y: number[],
            name: string,
            lineColor: string,
            avgColor: string,
            text: string[],
            annotations: string[]
        }
    } = {};

    Object.keys(divMediansByWeekend).forEach(weekendKey => {
        const divisions = Object.keys(divMediansByWeekend[weekendKey]);

        divisions.forEach(div => {
            if (div === '0.1') return; // Exclude division 0.1

            const div0_1Median = divMediansByWeekend[weekendKey]['0.1'];
            const divMedian = divMediansByWeekend[weekendKey][div];
            const percentDifference = ((divMedian - div0_1Median) / div0_1Median) * 100;
            let divColor = SRADivColor.fromDivision(parseFloat(div));
            if (divColor.isBright()) {
                divColor = divColor.darken(0.1);
            } else {
                divColor = divColor.brighten(0.4);
            }

            if (!plotData[div]) {
                plotData[div] = {
                    x: [],
                    y: [],
                    name: `Division ${div}`,
                    lineColor: divColor.toRgba(),
                    avgColor: divColor.toRgba(0.5),
                    text: [],
                    annotations: [],
                };
            }

            plotData[div].x.push(`S${teamSeriesWeekendsByWeekendKey[weekendKey].race.teamSeriesSession?.season} - ${teamSeriesWeekendsByWeekendKey[weekendKey].race.trackName
                .replace(/_/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase())}`);
            plotData[div].y.push(percentDifference);
            plotData[div].text.push(
                `${percentDifference.toFixed(2)}% (${(1 + (percentDifference / 100) * 90).toFixed(1)}s for a 90s track)<br>` +
                `${(divMedian / 1000).toFixed(3)}s`
            );
            plotData[div].annotations.push(`${percentDifference.toFixed(2)}%`);
        });
    });

    const plotSeries = Object.values(plotData).map(data => ({
        x: data.x,
        y: data.y,
        mode: 'lines+markers',
        name: data.name,
        line: { color: data.lineColor },
        marker: { color: data.lineColor },
        text: data.text,
        hoverinfo: 'text',
    }));

    const annotations = Object.values(plotData).flatMap(data =>
        data.x.map((x, idx) => ({
            x: x,
            y: data.y[idx],
            text: data.annotations[idx],
            // showarrow: true,
            // arrowhead: 2,
            ax: 0,
            ay: -20,
            font: {
                color: data.lineColor,
            },
            bgcolor: 'rgba(0, 0, 0, 1)',
            bordercolor: data.lineColor,
        }))
    );

    const averageLines = Object.keys(plotData).map(div => {
        const data = plotData[div];
        const avgY = data.y.reduce((sum, val) => sum + val, 0) / data.y.length;
        const extendedX = [...data.x, 'Average'];
        return {
            x: extendedX,
            y: Array(extendedX.length).fill(avgY),
            mode: 'lines',
            name: `D${div} Avg. (${avgY.toFixed(2)}%)`,
            line: {
                color: data.avgColor,
                dash: 'dash',
                width: 2,
            },
        };
    });

    const avgAnnotations = Object.keys(averageLines).map((line, index) => {
        const data = averageLines[index];
        return {
            x: data.x[data.x.length - 1],
            y: data.y[data.y.length - 1],
            text: `${data.name.split(' ')[1]}: ${data.y[data.y.length - 1].toFixed(2)}%<br>` +
                ` (${(1 + (data.y[data.y.length - 1] / 100) * 90).toFixed(1)}s for a 90s track)`,
            showarrow: false,
            font: {
                color: plotSeries[index].line.color,
            },
            bgcolor: 'rgba(0, 0, 0, 1)',
            bordercolor: data.line.color,
        };
    });

    return (
        <div>
            <Header />
            <h1>Division Percent Differences</h1>
            {tracksLoading && <p>Loading tracks...</p>}
            {tracksError && <p>Error loading tracks: {tracksError}</p>}
            {!tracksLoading && teamSeriesTracks.length > 0 && weekendsLoading && (
                <div>
                    Loaded {teamSeriesTracks.length} tracks.
                </div>
            )}

            {weekendsLoading && <p>Loading weekends...</p>}
            {weekendsError && <p>Error loading weekends: {weekendsError}</p>}
            {!weekendsLoading && teamSeriesWeekends.length > 0 && (
                // <div>
                //     <p>Team Series Weekends:</p>
                //     {Object.keys(divMediansByWeekend).map((weekendKey, index) => (
                //         Object.keys(divMediansByWeekend[weekendKey]).sort().map((div, index) => (
                //             <div key={index}>
                //                 <p>Season: {teamSeriesWeekendsByWeekendKey[weekendKey].race.teamSeriesSession?.season} |
                //                     Track: {teamSeriesWeekendsByWeekendKey[weekendKey].race.trackName} |
                //                     Division: {div} |
                //                     Median: {(divMediansByWeekend[weekendKey][div] / 1000).toFixed(3)}
                //                 </p>
                //             </div>
                //         ))
                //     ))}
                <Plot
                    data={[...plotSeries, ...averageLines]}
                    layout={{
                        title: `Division Medians Percent Difference to Aliens - Last ${teamSeriesTracks.length} Races (excluding wet races)<br>`
                            + '<sup>The plot is using the median per division of the potential best valid times per driver for a race weekend (qualifying + race). The plot is considering <i>aliens</i> as the top 10% of Division 1. Every 0.5% is a little under 0.5 seconds on a 1:30 track.</sup>',
                        xaxis: {
                            title: 'Track',
                            showgrid: true,
                            gridcolor: 'rgba(255,255,255,0.1)',
                            // autorange: "reversed",
                        },
                        yaxis: {
                            title: 'Percent Difference (%)',
                            showgrid: true,
                            gridcolor: 'rgba(255,255,255,0.1)',
                            range: [0, null]
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: '#2c2c2c',
                        font: { color: '#e0e0e0' },
                        width: window.innerWidth * 0.98,
                        height: 800,
                        annotations: [...annotations, ...avgAnnotations],
                    }}
                />
                // </div>
            )
            }
            <Footer />
        </div >
    );
};