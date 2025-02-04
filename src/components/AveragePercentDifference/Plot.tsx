import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLocation, useNavigate } from 'react-router-dom';
import * as ss from 'simple-statistics';
import { useTeamSeriesCarDrivers } from '../../hooks/useCarDrivers';
import { CarDriver } from '../../types/CarDriver';
import { Session } from '../../types/Session';
import { SRADivColor } from '../../utils/SRADivColor';
import { SelectionArea } from './SelectionArea';

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
        const sortBy = params.get('sortBy') as 'apd' | 'slope';

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
    const [sortByState, setSortBy] = useState<'apd' | 'slope'>(sortBy);
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

    let minSlope = Number.POSITIVE_INFINITY;
    let maxSlope = Number.NEGATIVE_INFINITY;
    let divDrivers: { [key: number]: { [key: string]: any } } = {}; // { div: { driverId: { ... } }
    let divMinMaxAPDs: { [key: number]: { min: number, max: number } } = {}; // { div: { min: 0, max: 0 } }

    const groupedDrivers = carDrivers.reduce((acc, carDriver) => {
        if (!carDriver.basicDriver) return acc;
        if (!carDriver.sessionCar) return acc;

        const driverId = carDriver.basicDriver.driverId;
        if (!driverId) return acc;

        if (!acc[driverId] && carDriver.sessionCar.tsAvgPercentDiff !== null) {
            acc[driverId] = {
                basicDriver: carDriver.basicDriver,
                tsAvgPercentDiff: 0,
                slope: 0,
                sessions: [],
                tsAvgPercentDiffs: [],
                avgPercentDiffs: [],
            };
        }

        if (carDriver.sessionCar.tsAvgPercentDiff == null) {
            return acc;
        }

        if (carDriver.session) {
            acc[driverId].sessions.push(carDriver.session);
        }

        if (carDriver.sessionCar?.avgPercentDiff !== null) {
            acc[driverId].avgPercentDiffs.push(carDriver.sessionCar.avgPercentDiff);
        }

        acc[driverId].tsAvgPercentDiffs.push(carDriver.sessionCar.tsAvgPercentDiff);
        acc[driverId].tsAvgPercentDiff = acc[driverId].tsAvgPercentDiffs.reduce((acc, val) => acc + val, 0) / acc[driverId].tsAvgPercentDiffs.length;

        const linearRegression = ss.linearRegression(acc[driverId].sessions.map((s, idx) => [idx, acc[driverId].tsAvgPercentDiffs[idx]]));
        acc[driverId].slope = -linearRegression.m;
        minSlope = Math.min(minSlope, acc[driverId].slope);
        maxSlope = Math.max(maxSlope, acc[driverId].slope);

        const division = acc[driverId].basicDriver?.raceDivision ?? 0;
        if (!divDrivers[division]) {
            divDrivers[division] = {};
        }
        divDrivers[division][driverId] = acc[driverId];

        if (!divMinMaxAPDs[division]) {
            divMinMaxAPDs[division] = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
        }
        divMinMaxAPDs[division].min = Math.min(divMinMaxAPDs[division].min, acc[driverId].tsAvgPercentDiff);
        divMinMaxAPDs[division].max = Math.max(divMinMaxAPDs[division].max, acc[driverId].tsAvgPercentDiff);

        return acc;
    }, {} as Record<string, {
        basicDriver: CarDriver['basicDriver'],
        tsAvgPercentDiff: number,
        slope: number,
        sessions: Session[],
        tsAvgPercentDiffs: number[],
        avgPercentDiffs: number[],
    }>);

    const filteredCarDrivers = Object.values(groupedDrivers)
        .filter(driver => (selectedDivisions.includes(driver.basicDriver?.raceDivision ?? 0)
            && (driver.sessions.length >= minNumSessions))
        );

    // sort by apd
    if (sortBy === 'apd') {
        filteredCarDrivers.sort((a, b) => a.tsAvgPercentDiff - b.tsAvgPercentDiff);
    }
    // sort by slope
    else if (sortBy === 'slope') {
        filteredCarDrivers.sort((a, b) => a.slope - b.slope);
    }

    // sort by division
    if (sortByDivisionEnabledState) {
        filteredCarDrivers.sort((a, b) =>
            (a.basicDriver?.raceDivision ?? 0) - (b.basicDriver?.raceDivision ?? 0)
        );
    }

    let insertIdxs: { [key: number]: number } = {};

    const plotData = filteredCarDrivers.map((groupedDriver, gd_idx) => {
        const driver = groupedDriver.basicDriver;
        const divisionColor = SRADivColor.fromDivision(groupedDriver.basicDriver?.raceDivision ?? 0).darken().darken().darken();
        const slopeColor = divisionColor.brighten(
            1 - (groupedDriver.slope - minSlope) / (maxSlope - minSlope)
        )
        const apdColor = divisionColor.brighten(
            1 - (groupedDriver.tsAvgPercentDiff - divMinMaxAPDs[driver?.raceDivision ?? 0].min)
            / (divMinMaxAPDs[driver?.raceDivision ?? 0].max - divMinMaxAPDs[driver?.raceDivision ?? 0].min)
        );

        const barColor = sortBy == 'slope' ? apdColor : slopeColor;

        // const driverColor = driver?.isSilver && false ? divisionColor.applySilverTint() : divisionColor;

        if (insertIdxs[driver?.raceDivision ?? 0] === undefined) {
            insertIdxs[driver?.raceDivision ?? 0] = gd_idx;
        }

        return {
            x: [`<a href="/driver?driverId=${driver?.driverId}" target="_blank">${groupedDriver.basicDriver?.division?.toFixed(1)} | ${groupedDriver.basicDriver?.name}</a>`],
            y: [sortBy == 'slope' ? groupedDriver.slope * 100 : groupedDriver.tsAvgPercentDiff * 100],
            type: 'bar',
            // orientation: 'h',
            name: `${groupedDriver.basicDriver?.division?.toFixed(1)} | ${groupedDriver.basicDriver?.name}`,
            marker: {
                color: barColor.toRgba(),
                line: {
                    color: barColor.toRgba(),
                },
            },
            text: `${driver?.division} | ${driver?.name}: ${(groupedDriver.tsAvgPercentDiff * 100).toFixed(3)}%<br>`
                + `Slope: ${(groupedDriver.slope * 100).toFixed(3)}%<br>`
                + groupedDriver.sessions
                    .map((s, s_idx) => `Season ${s.teamSeriesSession?.season} Division ${s.teamSeriesSession?.division} @ ${s.trackName}   |   `
                        + `Car APD: ${(groupedDriver.avgPercentDiffs[s_idx] * 100).toFixed(3)}%   |   `
                        + `Div APD: ${(s.teamSeriesSession?.avgPercentDiff !== undefined ? (s.teamSeriesSession.avgPercentDiff * 100).toFixed(3) : 'N/A')}%   |   `
                        + `TS APD: ${(groupedDriver.tsAvgPercentDiffs[s_idx] * 100).toFixed(3)}%`
                    )
                    .join('<br>'),
        };
    });

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
                        title: 'Average Percent Differences',
                        xaxis: {
                            title: 'Driver',
                            showgrid: true,
                            gridcolor: 'rgba(255,255,255,0.1)',
                        },
                        yaxis: {
                            title: 'APD %',
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