import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeamSeriesCarDrivers } from '../../hooks/useCarDrivers';
import { SRADivColor } from '../../utils/SRADivColor';
import { SelectionArea } from './SelectionArea';
import { DriverHistory } from '../../types/DriverHistory';

const Legend: React.FC<{ sortBy: 'apd' | 'slope' | 'variance', divMinMaxAPDs: any, divMinMaxSlopes: any, divMinMaxVariances: any }> = ({ sortBy, divMinMaxAPDs, divMinMaxSlopes, divMinMaxVariances }) => {
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
            <h4 style={{ textAlign: 'center', marginBottom: '5px' }}>Legend - Sort: {sortBy.toUpperCase()} | Color: {sortBy === 'apd' ? 'SLOPE' : 'APD'}</h4>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {Object.keys(divMinMaxAPDs).map((division) => {
                    let minMax;
                    if (sortBy === 'apd') {
                        minMax = divMinMaxSlopes[division];
                    } else {
                        minMax = divMinMaxAPDs[division];
                    }
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

export const APDPlot: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getParams = () => {
        const params = new URLSearchParams(location.search);
        const minNumSessions = Number(params.get('minNumSessions'));
        const pastNumSessions = Number(params.get('pastNumSessions'));
        let seasonParams = params.get('seasons')?.split(',').map(Number) || [];
        let selectedDivisions = params.get('selectedDivisions')?.split(',').map(Number) || [];
        const sortByDivisionEnabled = params.get('sortByDivisionEnabled') === 'true';
        const sortBy = params.get('sortBy') as 'apd' | 'slope' | 'variance';

        seasonParams = seasonParams[0] == 0 ? [] : seasonParams
        selectedDivisions = selectedDivisions[0] == 0 ? [] : selectedDivisions

        const singleSeasonEnabled = seasonParams.length === 1;

        return {
            minNumSessions: minNumSessions || 3,
            pastNumSessions: pastNumSessions || 5,
            seasons: seasonParams,
            selectedDivisions: selectedDivisions || [],
            sortByDivisionEnabled: sortByDivisionEnabled,
            sortBy: sortBy || 'apd',
            singleSeasonEnabled: singleSeasonEnabled,
            singleSeason: seasonParams[0] || 13,
        }
    };

    let params = getParams();

    const trackNames: string[] = []
    const divisions: number[] = []
    const sessionTypes = ['R']

    const [minNumSessionsState, setMinNumSessions] = useState<number>(params.minNumSessions);
    const [pastNumSessionsState, setPastNumSessions] = useState<number>(params.pastNumSessions);
    const [seasonsState, setSeasons] = useState<number[]>(params.seasons);
    const [selectedDivisionsState, setSelectedDivisions] = useState<number[]>(params.selectedDivisions);
    const [sortByDivisionEnabledState, setSortByDivisionEnabled] = useState<boolean>(params.sortByDivisionEnabled);
    const [sortByState, setSortBy] = useState<'apd' | 'slope' | 'variance'>(params.sortBy);
    const [singleSeasonEnabledState, setSingleSeasonEnabled] = useState<boolean>(params.singleSeasonEnabled);
    const [singleSeasonState, setSingleSeason] = useState<number | ''>(params.singleSeason);

    useEffect(() => {
        if (location.search === '')
            return;
        const params = getParams();
        setMinNumSessions(params.minNumSessions);
        setPastNumSessions(params.pastNumSessions);
        setSeasons(params.seasons);
        setSelectedDivisions(params.selectedDivisions);
        setSortByDivisionEnabled(params.sortByDivisionEnabled);
        setSortBy(params.sortBy);
        setSingleSeasonEnabled(params.singleSeasonEnabled);
        setSingleSeason(params.singleSeason);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('minNumSessions', minNumSessionsState.toString());
        params.set('pastNumSessions', pastNumSessionsState.toString());
        params.set('seasons', seasonsState.join(','));
        params.set('selectedDivisions', selectedDivisionsState.join(','));
        params.set('sortByDivisionEnabled', sortByDivisionEnabledState.toString());
        params.set('sortBy', sortByState);
        navigate({ search: params.toString() });
    }, [minNumSessionsState, pastNumSessionsState, seasonsState, selectedDivisionsState, sortByDivisionEnabledState, sortByState]);

    const { carDrivers, loading, error } = useTeamSeriesCarDrivers(trackNames, divisions, seasonsState, sessionTypes, pastNumSessionsState);

    const uniqueDivisions = Array.from(new Set(carDrivers.map(cd => cd.basicDriver?.raceDivision ?? 0)));
    const driverHistories = DriverHistory.fromCarDrivers(carDrivers, true);

    const filteredCarDrivers = driverHistories
        .filter(driverHistory => (selectedDivisionsState.includes(driverHistory.basicDriver?.raceDivision ?? 0)
            && (driverHistory.sessions.length >= minNumSessionsState))
        );

    let divDrivers: { [key: number]: { [key: string]: any } } = {}; // { div: { driverId: { ... } }
    let divMinMaxAPDs: { [key: number]: { min: number, max: number } } = {}; // { div: { min: 0, max: 0 } }
    let divMinMaxSlopes: { [key: number]: { min: number, max: number } } = {}; // { div: { min: 0, max: 0 } }
    let divMinMaxVariances: { [key: number]: { min: number, max: number } } = {}; // { div: { min: 0, max: 0 } }

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

        if (!divMinMaxAPDs[division]) {
            divMinMaxAPDs[division] = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
            divMinMaxSlopes[division] = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
            divMinMaxVariances[division] = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
        }
        divMinMaxAPDs[division].min = Math.min(divMinMaxAPDs[division].min, driverHistory.tsAvgPercentDiff);
        divMinMaxAPDs[division].max = Math.max(divMinMaxAPDs[division].max, driverHistory.tsAvgPercentDiff);
        divMinMaxSlopes[division].min = Math.min(divMinMaxSlopes[division].min, driverHistory.apdSlope);
        divMinMaxSlopes[division].max = Math.max(divMinMaxSlopes[division].max, driverHistory.apdSlope);
        divMinMaxVariances[division].min = Math.min(divMinMaxVariances[division].min, driverHistory.apdVariance);
        divMinMaxVariances[division].max = Math.max(divMinMaxVariances[division].max, driverHistory.apdVariance);
    });

    // sort by apd
    if (sortByState === 'apd') {
        filteredCarDrivers.sort((a, b) => a.tsAvgPercentDiff - b.tsAvgPercentDiff);
    }
    // sort by slope
    else if (sortByState === 'slope') {
        filteredCarDrivers.sort((a, b) => a.apdSlope - b.apdSlope);
    }
    // sort by variance
    else if (sortByState === 'variance') {
        filteredCarDrivers.sort((a, b) => a.apdVariance - b.apdVariance);
    }

    // sort by division
    if (sortByDivisionEnabledState) {
        filteredCarDrivers.sort((a, b) =>
            (a.basicDriver?.raceDivision ?? 0) - (b.basicDriver?.raceDivision ?? 0)
        );
    }

    let insertIdxs: { [key: number]: number } = {};

    let plotData = filteredCarDrivers.map((driverHistory, gd_idx) => {
        const driver = driverHistory.basicDriver;
        const divisionColor = SRADivColor.fromDivision(driverHistory.basicDriver?.raceDivision ?? 0).darken().darken().darken();
        const slopeColor = divisionColor.brighten(
            (1 - (driverHistory.apdSlope - divMinMaxSlopes[driver?.raceDivision ?? 0].min)
                / (divMinMaxSlopes[driver?.raceDivision ?? 0].max - divMinMaxSlopes[driver?.raceDivision ?? 0].min))
            / 1.1
        )
        const varianceColor = divisionColor.brighten(
            (1 - (driverHistory.apdVariance - divMinMaxVariances[driver?.raceDivision ?? 0].min)
                / (divMinMaxVariances[driver?.raceDivision ?? 0].max - divMinMaxVariances[driver?.raceDivision ?? 0].min))
            / 1.1
        )
        const apdColor = divisionColor.brighten(
            (1 - (driverHistory.tsAvgPercentDiff - divMinMaxAPDs[driver?.raceDivision ?? 0].min)
                / (divMinMaxAPDs[driver?.raceDivision ?? 0].max - divMinMaxAPDs[driver?.raceDivision ?? 0].min))
            / 1.1
        );

        const barColor = sortByState == 'slope' || sortByState == 'variance' ? apdColor : slopeColor;

        if (insertIdxs[driver?.raceDivision ?? 0] === undefined) {
            insertIdxs[driver?.raceDivision ?? 0] = gd_idx;
        }

        return {
            x: [`<a href="/driver?driverId=${driver?.driverId}" target="_blank">${driver?.division?.toFixed(1)} | ${driver?.name}</a>`],
            y: [sortByState == 'slope' ? driverHistory.apdSlope * 100 : sortByState == 'variance' ? driverHistory.apdVariance * 100 : driverHistory.tsAvgPercentDiff * 100],
            type: 'bar',
            name: `${driverHistory.basicDriver?.division?.toFixed(1)} | ${driverHistory.basicDriver?.name}`,
            marker: {
                color: barColor.toRgba(),
                line: {
                    color: barColor.toRgba(),
                    width: 0,
                },
            },
            text: `${driver?.division} | ${driver?.name}: ${(driverHistory.tsAvgPercentDiff * 100).toFixed(3)}%<br>`
                + `Slope: ${(driverHistory.apdSlope * 100).toFixed(3)}%<br>`
                + `Variance: ${(driverHistory.apdVariance * 100).toFixed(5)}%<br>`
                + driverHistory.sessions
                    .map((s, s_idx) => `Season ${s.teamSeriesSession?.season} Division ${s.teamSeriesSession?.division} @ ${s.trackName}   |   `
                        + `Car APD: ${(driverHistory.avgPercentDiffs[s_idx] * 100).toFixed(3)}%   |   `
                        + `Div APD: ${(s.teamSeriesSession?.avgPercentDiff !== undefined ? (s.teamSeriesSession.avgPercentDiff * 100).toFixed(3) : 'N/A')}%   |   `
                        + `TS APD: ${(driverHistory.tsAvgPercentDiffs[s_idx] * 100).toFixed(3)}%`
                    )
                    .join('<br>'),
        };
    });

    // insert bars for division cutoffs
    if (sortByState == 'apd' && !sortByDivisionEnabledState && selectedDivisionsState.length == uniqueDivisions.length - 1) {
        const driversPerDivision = (plotData.length + (uniqueDivisions.length - 1)) / (uniqueDivisions.length - 1);
        let i = plotData.length - 1;
        let div = uniqueDivisions.length;
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
        <div>
            <SelectionArea
                uniqueDivisions={uniqueDivisions}
                selectedDivisions={selectedDivisionsState}
                sortByDivisionEnabled={sortByDivisionEnabledState}
                sortBy={sortByState}
                minNumSessions={minNumSessionsState}
                pastNumSessions={pastNumSessionsState}
                setSelectedDivisions={setSelectedDivisions}
                setSortByDivisionEnabled={setSortByDivisionEnabled}
                setSortBy={setSortBy}
                setMinNumSessions={setMinNumSessions}
                setPastNumSessions={setPastNumSessions}
                setSeasons={setSeasons}
                singleSeasonEnabled={singleSeasonEnabledState}
                setSingleSeasonEnabled={setSingleSeasonEnabled}
                singleSeason={singleSeasonState}
                setSingleSeason={setSingleSeason}
            />
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            <div className="plot-container">
                <Legend sortBy={sortByState} divMinMaxAPDs={divMinMaxAPDs} divMinMaxSlopes={divMinMaxSlopes} divMinMaxVariances={divMinMaxVariances} />
                <div className="plot">
                    <Plot
                        data={plotData}
                        layout={{
                            height: 800,
                            width: window.innerWidth * 0.98,
                            title: `Average Percent Differences - ${plotData.length} Drivers`,
                            xaxis: {
                                title: 'Driver',
                                showgrid: true,
                                gridcolor: 'rgba(255,255,255,0.1)',
                            },
                            yaxis: {
                                title: sortByState != 'variance' ? 'APD (%)' : 'Variance (%)',
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
            </div>
        </div>
    );
}