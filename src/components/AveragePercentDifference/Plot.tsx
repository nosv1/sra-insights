import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLocation, useNavigate } from 'react-router-dom';
import * as ss from 'simple-statistics';
import { useTeamSeriesCarDrivers } from '../../hooks/useCarDrivers';
import { CarDriver } from '../../types/CarDriver';
import { Session } from '../../types/Session';
import { SRADivColor } from '../../utils/SRADivColor';
import { SelectionArea } from './SelectionArea';
import { DriverHistory } from '../../types/DriverHistory';

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

    let { minNumSessions, pastNumSessions, seasons, selectedDivisions, sortByDivisionEnabled, sortBy, singleSeasonEnabled, singleSeason } = getParams();

    const trackNames: string[] = []
    const divisions: number[] = []
    const sessionTypes = ['R']

    const [minNumSessionsState, setMinNumSessions] = useState<number>(minNumSessions);
    const [pastNumSessionsState, setPastNumSessions] = useState<number>(pastNumSessions);
    const [seasonsState, setSeasons] = useState<number[]>(seasons);
    const [selectedDivisionsState, setSelectedDivisions] = useState<(number)[]>(selectedDivisions);
    const [sortByDivisionEnabledState, setSortByDivisionEnabled] = useState<boolean>(sortByDivisionEnabled);
    const [sortByState, setSortBy] = useState<'apd' | 'slope' | 'variance'>(sortBy);
    const [singleSeasonEnabledState, setSingleSeasonEnabled] = useState<boolean>(singleSeasonEnabled);
    const [singleSeasonState, setSingleSeason] = useState<number | ''>(singleSeason);

    useEffect(() => {
        if (location.search === '')
            return;
        let { minNumSessions, pastNumSessions, seasons, selectedDivisions, sortByDivisionEnabled, sortBy, singleSeasonEnabled, singleSeason } = getParams();
        setMinNumSessions(minNumSessions);
        setPastNumSessions(pastNumSessions);
        setSeasons(seasons);
        setSelectedDivisions(selectedDivisions);
        setSortByDivisionEnabled(sortByDivisionEnabled);
        setSortBy(sortBy);
        setSingleSeasonEnabled(singleSeasonEnabled);
        setSingleSeason(singleSeason);
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

    let minSlope = Number.POSITIVE_INFINITY;
    let maxSlope = Number.NEGATIVE_INFINITY;
    let minVariance = Number.POSITIVE_INFINITY;
    let maxVariance = Number.NEGATIVE_INFINITY;
    let divDrivers: { [key: number]: { [key: string]: any } } = {}; // { div: { driverId: { ... } }
    let divMinMaxAPDs: { [key: number]: { min: number, max: number } } = {}; // { div: { min: 0, max: 0 } }

    driverHistories.forEach(driverHistory => {
        if (!driverHistory.basicDriver) return;

        if (!driverHistory.tsAvgPercentDiff) return;

        const driverId = driverHistory.basicDriver.driverId;
        if (!driverId) return;

        minSlope = Math.min(minSlope, driverHistory.apdSlope);
        maxSlope = Math.max(maxSlope, driverHistory.apdSlope);
        minVariance = Math.min(minVariance, driverHistory.apdVariance);
        maxVariance = Math.max(maxVariance, driverHistory.apdVariance);

        const division = driverHistory.basicDriver?.raceDivision ?? 0;
        if (!divDrivers[division]) {
            divDrivers[division] = {};
        }
        divDrivers[division][driverId] = driverHistory;

        if (!divMinMaxAPDs[division]) {
            divMinMaxAPDs[division] = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
        }
        divMinMaxAPDs[division].min = Math.min(divMinMaxAPDs[division].min, driverHistory.tsAvgPercentDiff);
        divMinMaxAPDs[division].max = Math.max(divMinMaxAPDs[division].max, driverHistory.tsAvgPercentDiff);
    });

    const filteredCarDrivers = driverHistories
        .filter(driverHistory => (selectedDivisions.includes(driverHistory.basicDriver?.raceDivision ?? 0)
            && (driverHistory.sessions.length >= minNumSessions))
        );

    // sort by apd
    if (sortBy === 'apd') {
        filteredCarDrivers.sort((a, b) => a.tsAvgPercentDiff - b.tsAvgPercentDiff);
    }
    // sort by slope
    else if (sortBy === 'slope') {
        filteredCarDrivers.sort((a, b) => a.apdSlope - b.apdSlope);
    }
    // sort by variance
    else if (sortBy === 'variance') {
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
            1 - (driverHistory.apdSlope - minSlope) / (maxSlope - minSlope)
        )
        const varianceColor = divisionColor.brighten(
            1 - (driverHistory.apdVariance - minVariance) / (maxVariance - minVariance)
        )
        const apdColor = divisionColor.brighten(
            1 - (driverHistory.tsAvgPercentDiff - divMinMaxAPDs[driver?.raceDivision ?? 0].min)
            / (divMinMaxAPDs[driver?.raceDivision ?? 0].max - divMinMaxAPDs[driver?.raceDivision ?? 0].min)
        );

        const barColor = sortBy == 'slope' || sortBy == 'variance' ? apdColor : slopeColor;

        if (insertIdxs[driver?.raceDivision ?? 0] === undefined) {
            insertIdxs[driver?.raceDivision ?? 0] = gd_idx;
        }

        return {
            x: [`<a href="/driver?driverId=${driver?.driverId}" target="_blank">${driver?.division?.toFixed(1)} | ${driver?.name}</a>`],
            y: [sortBy == 'slope' ? driverHistory.apdSlope * 100 : sortBy == 'variance' ? driverHistory.apdVariance * 100 : driverHistory.tsAvgPercentDiff * 100],
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
    if (sortBy == 'apd' && !sortByDivisionEnabledState && selectedDivisionsState.length == uniqueDivisions.length - 1) {
        const driversPerDivision = (plotData.length + uniqueDivisions.length - 1) / (uniqueDivisions.length - 1);
        let i = plotData.length - 1;
        while (i > 0) {
            const division = Math.floor(i / driversPerDivision) + 1;
            if (i % Math.floor(driversPerDivision * division) === 0) {
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
                            title: sortBy != 'variance' ? 'APD (%)' : 'Variance (%)',
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
    );
}