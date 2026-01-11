import Plot from 'react-plotly.js';
import { BasicDriver } from '../../types/BasicDriver';
import { DriverHistory } from '../../types/DriverHistory';
import { downloadCSV } from '../../utils/Data';
import { SRADivColor } from '../../utils/SRADivColor';

const Legend: React.FC<{
    sortBy: 'apd' | 'slope' | 'avg roc' | 'variance' | 'apd median';
    divMinMax: {
        [division: number]: {
            APD: { min: number, max: number },
            slope: { min: number, max: number },
            variance: { min: number, max: number },
            avgAPD_ROC: { min: number, max: number }
        }
    }
}> = ({ sortBy, divMinMax }) => {
    const getColor = (value: number, min: number, max: number, division: number) => {
        const divisionColor = SRADivColor.fromDivision(division).darken().darken().darken();
        return divisionColor.brighten((1 - (value - min) / (max - min)) / 1.1).toRgba();
    };

    const renderLegendItems = (minMax: { min: number, max: number }, division: number) => {
        const steps = 5;
        const stepSize = (minMax.max - minMax.min) / steps;
        const items = [];
        for (let i = 0; i <= steps; i++) {
            const value = minMax.min + i * stepSize;
            items.push(
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, backgroundColor: getColor(value, minMax.min, minMax.max, division), marginRight: 8 }}></div>
                    <span>{`${(value * 100).toFixed(2)}%`}</span>
                </div>
            );
        }
        return items;
    };

    return (
        <div className="custom-legend">
            <h4 style={{ textAlign: 'center', marginBottom: '5px' }}>
                Legend - Sort: {sortBy.toUpperCase()} | Color: {sortBy === 'apd' ? 'Avg ROC' : 'APD'}
            </h4>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {Object.keys(divMinMax).map((division) => {
                    const minMax = sortBy === 'apd' ? divMinMax[Number(division)].slope : divMinMax[Number(division)].APD;
                    return (
                        <div key={division} style={{ textAlign: 'center' }}>
                            <h5 style={{ margin: '5px 0' }}>Division {division}</h5>
                            {renderLegendItems(minMax, parseInt(division))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const plotDataToCSV = (plotData: any[]) => {
    const csvData = plotData.map(pd => {
        return pd.x[0] + ',' + pd.y[0];
    });
    return csvData.join('\n');
}

export interface APDProps {
    title: string;
    driverHistories: DriverHistory[];
    uniqueDivisions: number[];
    selectedDivisionsState: number[];
    divisionsEnabledState: boolean;
    minNumSessionsState: number;
    sortByState: 'apd' | 'slope' | 'avg roc' | 'variance' | 'apd median';
    sortByDivisionEnabledState: boolean;
    selectedDriver: BasicDriver | null;
}

export const APDPlot: React.FC<APDProps> = ({
    title,
    driverHistories,
    uniqueDivisions,
    selectedDivisionsState,
    minNumSessionsState,
    sortByState,
    sortByDivisionEnabledState,
    selectedDriver
}) => {

    const filteredCarDrivers = driverHistories
        .filter(driverHistory => (selectedDivisionsState.includes(driverHistory.basicDriver?.raceDivision ?? 0)
            && (driverHistory.sessions.length >= minNumSessionsState))
        );

    let divDrivers: { [key: number]: { [key: string]: any } } = {}; // { div: { driverId: { ... } }
    let divMinMax: {
        [key: number]: {
            APD: { min: number, max: number, median: number, values: number[] },
            slope: { min: number, max: number, median: number, values: number[] },
            variance: { min: number, max: number, median: number, values: number[] },
            avgAPD_ROC: { min: number, max: number, median: number, values: number[] }
        }
    } = {};

    filteredCarDrivers.forEach(driverHistory => {
        if (!driverHistory.basicDriver) return;

        if (!driverHistory.tsAvgPercentDiff) return;

        const driverId = driverHistory.basicDriver.driverId;
        if (!driverId) return;

        const division = driverHistory.basicDriver?.raceDivision ?? 0;
        if (!divDrivers[division]) {
            divDrivers[division] = {};
        }
        divDrivers[division][driverId] = driverHistory;

        if (!divMinMax[division]) {
            divMinMax[division] = {
                APD: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, median: Number.POSITIVE_INFINITY, values: [] },
                slope: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, median: Number.POSITIVE_INFINITY, values: [] },
                variance: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, median: Number.POSITIVE_INFINITY, values: [] },
                avgAPD_ROC: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, median: Number.POSITIVE_INFINITY, values: [] }
            };
        }

        divMinMax[division].APD.min = Math.min(divMinMax[division].APD.min, driverHistory.tsAvgPercentDiff);
        divMinMax[division].APD.max = Math.max(divMinMax[division].APD.max, driverHistory.tsAvgPercentDiff);
        divMinMax[division].APD.values.push(driverHistory.tsAvgPercentDiff);

        divMinMax[division].slope.min = Math.min(divMinMax[division].slope.min, driverHistory.apdSlope);
        divMinMax[division].slope.max = Math.max(divMinMax[division].slope.max, driverHistory.apdSlope);
        divMinMax[division].slope.values.push(driverHistory.apdSlope);

        divMinMax[division].variance.min = Math.min(divMinMax[division].variance.min, driverHistory.apdVariance);
        divMinMax[division].variance.max = Math.max(divMinMax[division].variance.max, driverHistory.apdVariance);
        divMinMax[division].variance.values.push(driverHistory.apdVariance);

        divMinMax[division].avgAPD_ROC.min = Math.min(divMinMax[division].avgAPD_ROC.min, driverHistory.avgAPD_ROC);
        divMinMax[division].avgAPD_ROC.max = Math.max(divMinMax[division].avgAPD_ROC.max, driverHistory.avgAPD_ROC);
        divMinMax[division].avgAPD_ROC.values.push(driverHistory.avgAPD_ROC);
    });

    Object.keys(divMinMax).forEach((division) => {
        divMinMax[parseInt(division)].APD.values.sort((a, b) => a - b);
        divMinMax[parseInt(division)].slope.values.sort((a, b) => a - b);
        divMinMax[parseInt(division)].variance.values.sort((a, b) => a - b);
        divMinMax[parseInt(division)].avgAPD_ROC.values.sort((a, b) => a - b);

        const median_idx = Math.floor(divMinMax[parseInt(division)].APD.values.length / 2);
        divMinMax[parseInt(division)].APD.median = divMinMax[parseInt(division)].APD.values[median_idx];
        divMinMax[parseInt(division)].slope.median = divMinMax[parseInt(division)].slope.values[median_idx];
        divMinMax[parseInt(division)].variance.median = divMinMax[parseInt(division)].variance.values[median_idx];
        divMinMax[parseInt(division)].avgAPD_ROC.median = divMinMax[parseInt(division)].avgAPD_ROC.values[median_idx];
    });


    // sort by apd
    switch (sortByState) {
        case 'apd':
            filteredCarDrivers.sort((a, b) => a.tsAvgPercentDiff - b.tsAvgPercentDiff);
            break;
        case 'slope':
            filteredCarDrivers.sort((a, b) => a.apdSlope - b.apdSlope);
            break;
        case 'avg roc':
            filteredCarDrivers.sort((a, b) => a.avgAPD_ROC - b.avgAPD_ROC);
            break;
        case 'variance':
            filteredCarDrivers.sort((a, b) => a.apdVariance - b.apdVariance);
            break;
        case 'apd median':
            filteredCarDrivers.sort((a, b) =>
                (a.tsAvgPercentDiff - divMinMax[a.basicDriver?.raceDivision ?? 0].APD.median) -
                (b.tsAvgPercentDiff - divMinMax[b.basicDriver?.raceDivision ?? 0].APD.median)
            );
            break;
        default:
            break;
    }

    // sort by division
    if (sortByDivisionEnabledState) {
        filteredCarDrivers.sort((a, b) =>
            (a.basicDriver?.raceDivision ?? 0) - (b.basicDriver?.raceDivision ?? 0)
        );
    }

    let insertIdxs: { [key: number]: number } = {};

    let plotData = filteredCarDrivers.map((driverHistory, cd_idx) => {
        const driver = driverHistory.basicDriver;
        const isSelected = selectedDriver?.driverId === driver?.driverId;
        const divisionColor = SRADivColor.fromDivision(driverHistory.basicDriver?.raceDivision ?? 0).darken().darken().darken();
        const slopeColor = divisionColor.brighten(
            (1 - (driverHistory.apdSlope - divMinMax[driver?.raceDivision ?? 0].slope.min)
                / (divMinMax[driver?.raceDivision ?? 0].slope.max - divMinMax[driver?.raceDivision ?? 0].slope.min))
            / 1.1
        );
        const varianceColor = divisionColor.brighten(
            (1 - (driverHistory.apdVariance - divMinMax[driver?.raceDivision ?? 0].variance.min)
                / (divMinMax[driver?.raceDivision ?? 0].variance.max - divMinMax[driver?.raceDivision ?? 0].variance.min))
            / 1.1
        );
        const avgROCColor = divisionColor.brighten(
            (1 - (driverHistory.avgAPD_ROC - divMinMax[driver?.raceDivision ?? 0].avgAPD_ROC.min)
                / (divMinMax[driver?.raceDivision ?? 0].avgAPD_ROC.max - divMinMax[driver?.raceDivision ?? 0].avgAPD_ROC.min))
            / 1.1
        );
        const apdColor = divisionColor.brighten(
            (1 - (driverHistory.tsAvgPercentDiff - divMinMax[driver?.raceDivision ?? 0].APD.min)
                / (divMinMax[driver?.raceDivision ?? 0].APD.max - divMinMax[driver?.raceDivision ?? 0].APD.min))
            / 1.1
        );

        const barColor = (sortByState == 'slope'
            || sortByState == 'avg roc'
            || sortByState == 'variance'
            || sortByState == 'apd median'
            ? apdColor : avgROCColor
        );

        if (insertIdxs[driver?.raceDivision ?? 0] === undefined) {
            insertIdxs[driver?.raceDivision ?? 0] = cd_idx;
        }

        return {
            x: [`<a href="/driver?driverId=${driver?.driverId}" target="_blank">${driver?.division?.toFixed(1)} | ${driver?.name}</a>`],
            y: [
                sortByState == 'slope' ? driverHistory.apdSlope * 100
                    : sortByState == 'variance' ? driverHistory.apdVariance * 100
                        : sortByState == 'avg roc' ? driverHistory.avgAPD_ROC * 100
                            : sortByState == 'apd median' ? (driverHistory.tsAvgPercentDiff - divMinMax[driver?.raceDivision ?? 0].APD.median) * 100
                                : driverHistory.tsAvgPercentDiff * 100
            ],
            type: 'bar',
            name: `${driverHistory.basicDriver?.division?.toFixed(1)} | ${driverHistory.basicDriver?.name}`,
            marker: {
                color: barColor.toRgba(),
                line: {
                    color: isSelected ? 'rgba(255, 255, 0, 1)' : barColor.toRgba(),
                    width: isSelected ? 2 : 0,
                },
            },
            text: `#${cd_idx + 1} ${driver?.division} | ${driver?.name}: ${(driverHistory.tsAvgPercentDiff * 100).toFixed(3)}%<br>`
                + `Slope: ${(driverHistory.apdSlope * 100).toFixed(3)}%<br>`
                + `Avg Rate of Change: ${(driverHistory.avgAPD_ROC * 100).toFixed(3)}%<br>`
                + `Variance: ${(driverHistory.apdVariance * 100).toFixed(5)}%<br>`
                + `Diff to Div Median: ${((driverHistory.tsAvgPercentDiff - divMinMax[driver?.raceDivision ?? 0].APD.median) * 100).toFixed(3)}%<br>`
                + driverHistory.sessions
                    .map((s, s_idx) => {
                        const isQuali = s.sessionType === 'Q';
                        const tsAvgPercentDiff = s.teamSeriesSession?.avgPercentDiff ?? s.teamSeriesSession?.qualiAvgPercentDiff;
                        return `Season ${s.teamSeriesSession?.season} Division ${s.teamSeriesSession?.division} @ ${s.trackName}   |   `
                            + `Car APD: ${(driverHistory.avgPercentDiffs[s_idx] * 100).toFixed(3)}%   |   `
                            + `${isQuali ? driverHistory.sessionCars[s_idx].tsDivClass : 'Div'} APD: ${(isFinite(tsAvgPercentDiff ?? NaN) ? ((tsAvgPercentDiff ?? 0) * 100).toFixed(3) : 'N/A')}%   |   `
                            + `TS APD: ${(driverHistory.tsAvgPercentDiffs[s_idx] * 100).toFixed(3)}%`
                    })
                    .join('<br>'),
        };
    });

    // insert bars for division cutoffs
    if (sortByState == 'apd' && !sortByDivisionEnabledState && selectedDivisionsState.length == uniqueDivisions.length - 1) {
        const numDivisions = 5 + 1; // uniqueDivisions.length;
        const driversPerDivision = (plotData.length + (numDivisions - 1)) / (numDivisions - 1);
        let i = plotData.length - 1;
        let div = numDivisions;
        while (i > 0) {
            const division = Math.floor(i / driversPerDivision) + 1;
            if (division != div) {
                const pd = plotData[i];
                const barColor = SRADivColor.fromDivision(division);
                plotData.splice(i, 0, {
                    x: [`Division ${division} Cutoff`],
                    y: [-pd.y[0]],
                    type: 'bar',
                    name: `Division ${division}`,
                    marker: {
                        color: barColor.toRgba(),
                        line: {
                            color: barColor.brighten().toRgba(),
                            width: 1.5,
                        }
                    },
                    text: `Division ${division} Cutoff`,
                });
                div = division;
            }
            i--;
        }
    }

    return (
        <div className="plot-container">
            <Legend sortBy={sortByState} divMinMax={divMinMax} />
            <div className="plot">
                <Plot
                    data={plotData}
                    layout={{
                        height: 800,
                        width: window.innerWidth * 0.98,
                        title: `${title} - ${plotData.length} Drivers`,
                        xaxis: {
                            title: 'Driver',
                            showgrid: true,
                            gridcolor: 'rgba(255,255,255,0.1)',
                        },
                        yaxis: {
                            title: (
                                sortByState == 'slope' ? 'Slope'
                                    : sortByState == 'variance' ? 'Variance'
                                        : sortByState == 'avg roc' ? 'Avg ROC'
                                            : 'APD'
                            ),
                            showgrid: true,
                            gridcolor: 'rgba(255,255,255,0.1)',
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: '#2c2c2c',
                        font: {
                            color: '#e0e0e0',
                        },
                        hovermode: 'closest',
                    }}
                />
            </div>
            <button onClick={() => downloadCSV(plotDataToCSV(plotData), 'plot_data.csv')} className="plot-button">
                Download CSV
            </button>
        </div>
    );
}