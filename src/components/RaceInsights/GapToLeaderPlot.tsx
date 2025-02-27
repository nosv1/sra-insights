import { useEffect, useState } from "react";
import Plot from 'react-plotly.js';
import { useLocation, useNavigate } from "react-router-dom";
import { useTeamSeriesWeekendsFromAttrs } from "../../hooks/useSessions";
import { Lap } from "../../types/Lap";
import { SRADivColor } from "../../utils/SRADivColor";
import { S13_TEAM_SERIES_SCHEDULE, TeamSeriesSchedule } from "../../utils/TeamSeriesSchedule";
import { SelectionArea } from "./SelectionArea";

export const GapToLeaderPlot: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getParams = () => {
        const params = new URLSearchParams(location.search);
        const trackName = params.get('trackName');
        const season = params.get('season');
        const sortByDivisionEnabled = params.get('sortByDivisionEnabled') === 'true';
        let selectedDivisions = params.get('selectedDivisions')?.split(',').map(Number) || [];
        selectedDivisions = selectedDivisions[0] == 0 ? [] : selectedDivisions

        return {
            selectedDivisions: selectedDivisions || [],
            trackName: trackName || TeamSeriesSchedule.getTrackFromRound(S13_TEAM_SERIES_SCHEDULE.getCurrentRound().round - 1),
            season: season ? parseInt(season) : 13,
            sortByDivisionEnabled: sortByDivisionEnabled,
        };
    };

    let params = getParams();

    const [trackNameState, setTrackName] = useState<string>(params.trackName);
    const [seasonState, setSeason] = useState<number>(params.season);
    const [selectedDivisionsState, setSelectedDivisions] = useState<(number)[]>(params.selectedDivisions);
    const [sortByDivisionEnabledState, setSortByDivisionEnabled] = useState<boolean>(params.sortByDivisionEnabled);
    const { teamSeriesWeekends, loading, error } = useTeamSeriesWeekendsFromAttrs(trackNameState, seasonState)

    const uniqueDivisions = Array.from(
        new Set(
            teamSeriesWeekends
                .flatMap(tsw => tsw.race.carDrivers?.map(cd => cd.basicDriver?.raceDivision) || [])
                .filter(d => d !== undefined)
        )
    );

    useEffect(() => {
        let params = getParams();
        setTrackName(params.trackName);
        setSeason(params.season);
        setSelectedDivisions(params.selectedDivisions);
        setSortByDivisionEnabled(params.sortByDivisionEnabled);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.set('trackName', trackNameState);
        params.set('season', seasonState.toString());
        params.set('selectedDivisions', selectedDivisionsState.join(','));
        params.set('sortByDivisionEnabled', sortByDivisionEnabledState.toString());
        navigate({ search: params.toString() });
    }, [trackNameState, seasonState]);

    const carDrivers = teamSeriesWeekends
        .flatMap(tsw => tsw.race.carDrivers)
        .filter(cd => selectedDivisionsState.includes(cd?.basicDriver?.raceDivision || 0));

    carDrivers.sort((a, b) => (a ? a.sessionCar?.finishPosition || 0 : 0) - (b ? b.sessionCar?.finishPosition || 0 : 0));

    if (sortByDivisionEnabledState)
        carDrivers.sort((a, b) => (a ? a.basicDriver?.raceDivision || 0 : 0) - (b ? b.basicDriver?.raceDivision || 0 : 0));

    const startingColors = [
        { r: 255, g: 204, b: 0 },  // Highlight color
        { r: 255, g: 77, b: 77 },  // Button color
        { r: 224, g: 224, b: 224 },  // Text color
        { r: 0, g: 122, b: 204 },  // blue
        { r: 0, g: 204, b: 102 },  // green
    ];

    const plotData: Array<{
        x: number[] | undefined,
        y: number[] | undefined,
        type: string,
        name: string | undefined,
        text?: string[] | undefined,
        marker: {
            color?: string,
            size?: number,
            line?: {
                color: string,
                width: number,
            } | undefined,
        } | undefined,
    }> = [];

    carDrivers.forEach((carDriver, cd_idx) => {
        if (!carDriver) return;

        const x: number[] = [];
        const y: number[] = [];
        const text: string[] = [];
        carDriver.sessionCar?.gapToLeaderPerSplit.forEach((gap, g_idx) => {
            if (!carDriver.sessionCar) return;
            const lap = g_idx / 3;
            const gapToLeader = Math.max(gap / 1000.0, 0);
            const totalTime = carDriver?.sessionCar?.splitRunningTime[carDriver.sessionCar?.splitRunningTime.length - 1] || 0;
            const currentTime = carDriver?.sessionCar?.splitRunningTime[g_idx] || 0;
            const timeLeftInRace = Lap.timeToString((totalTime - currentTime));

            x.push(lap);
            y.push(gapToLeader);
            text.push(
                `${carDriver.basicDriver?.name}<br>`
                + `Time Left: ${timeLeftInRace}<br>`
            );
        });

        const baseColor = startingColors[cd_idx % startingColors.length];
        const divisionColor = new SRADivColor(baseColor.r, baseColor.g, baseColor.b);
        const driverColor = (carDriver?.basicDriver?.isSilver ? divisionColor.applySilverTint() : divisionColor).darken();
        plotData.push({
            x: x,
            y: y,
            type: 'markers+lines',
            name: `#${carDriver.sessionCar?.finishPosition} | ${carDriver?.basicDriver?.name}`,
            text: text,
            marker: {
                color: driverColor.toRgba(),
            },
        });
        carDriver.sessionCar?.probablePitLaps.forEach((lap, l_idx) => {
            if (!carDriver.sessionCar || !lap) return;
            plotData.push({
                x: [((lap - 1) * 3 - 1) / 3],
                y: [carDriver.sessionCar?.gapToLeaderPerSplit[(lap - 1) * 3 - 1] / 1000.0],
                type: 'markers',
                name: `#${carDriver.sessionCar?.finishPosition} | Pit Lap ${lap}`,
                text: [text[(lap - 1) * 3 - 1] + `Pit Lap #${l_idx + 1}`],
                marker: {
                    color: plotData[plotData.length - 1].marker?.color,
                    size: 10,
                },
            });
        });
    });



    // fig.update_xaxes(
    //     tickmode="array",
    //     tickvals=list(range(len(race_drivers[0].gap_to_leader_per_split))),
    //     ticktext=[
    //         f"{i/3 + 1:.1f}"
    //         for i in range(len(race_drivers[0].gap_to_leader_per_split))
    //     ],
    // )

    return (
        <div>
            <SelectionArea
                selectedDivisions={selectedDivisionsState}
                uniqueDivisions={uniqueDivisions}
                sortByDivisionEnabled={sortByDivisionEnabledState}
                trackName={trackNameState}
                setSelectedDivisions={setSelectedDivisions}
                setSortByDivisionEnabled={setSortByDivisionEnabled}
                setTrackName={setTrackName}
            />
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            {plotData.length > 0 &&
                <div className="plot">
                    <Plot
                        data={plotData}
                        layout={{
                            height: 800,
                            width: window.innerWidth * 0.98,
                            title: 'Gap to Leader',
                            xaxis: {
                                title: 'Lap',
                                showgrid: true,
                                gridcolor: 'rgba(255,255,255,0.1)',
                            },
                            yaxis: {
                                title: 'Gap to Leader (seconds)',
                                showgrid: true,
                                gridcolor: 'rgba(255,255,255,0.1)',
                                // range: [ss.median(plotData.map(pd => pd?.y[0] as number ?? 0)) - 10, 120],
                                autorange: "reversed",
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
            }
        </div>
    );
};