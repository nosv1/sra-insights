import { TrackSelection } from "../TrackSelection";
import * as ss from 'simple-statistics';
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TEAM_SERIES_SCHEDULE, TeamSeriesSchedule } from "../../utils/TeamSeriesSchedule";
import { DivSelection } from "../DivSelection";
import { useTeamSeriesWeekendsFromAttrs } from "../../hooks/useSessions";
import Plot from 'react-plotly.js';
import { SelectionArea } from "./SelectionArea";
import { SRADivColor } from "../../utils/SRADivColor";
import { driver } from "neo4j-driver";

export const TimeInPitsPlot: React.FC = () => {
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
            trackName: trackName || TeamSeriesSchedule.getTrackFromRound(TEAM_SERIES_SCHEDULE.getCurrentRound().round - 1),
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

    carDrivers.sort((a, b) => (a ? a.timeInPits || 0 : 0) - (b ? b.timeInPits || 0 : 0));

    if (sortByDivisionEnabledState)
        carDrivers.sort((a, b) => (a ? a.basicDriver?.raceDivision || 0 : 0) - (b ? b.basicDriver?.raceDivision || 0 : 0));

    const plotData = carDrivers.map(carDriver => {
        if (!carDriver) return;
        const divisionColor = SRADivColor.fromDivision(carDriver?.basicDriver?.raceDivision ?? 0);
        const driverColor = (carDriver?.basicDriver?.isSilver ? divisionColor.applySilverTint() : divisionColor).darken();
        return {
            x: [carDriver.basicDriver?.name],
            y: [carDriver.timeInPits / 1000.0],
            type: 'bar',
            name: carDriver?.basicDriver?.name,
            marker: {
                color: driverColor.toRgba(),
                line: {
                    color: driverColor.brighten(0.25).toRgba(),
                    width: 0.5,
                },
            },
        }
    });

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
                            title: 'Time in Pits',
                            xaxis: {
                                title: 'Driver',
                                showgrid: true,
                                gridcolor: 'rgba(255,255,255,0.1)',
                            },
                            yaxis: {
                                title: 'Time in Pits (seconds)',
                                showgrid: true,
                                gridcolor: 'rgba(255,255,255,0.1)',
                                range: [ss.median(plotData.map(pd => pd?.y[0] as number ?? 0)) - 10, 120],
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