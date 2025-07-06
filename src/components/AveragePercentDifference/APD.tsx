import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeamSeriesCarDrivers } from '../../hooks/useCarDrivers';
import { BasicDriver } from '../../types/BasicDriver';
import { DriverHistory } from '../../types/DriverHistory';
import { APDPlot } from './Plot';
import { SelectionArea } from './SelectionArea';

export const APDPlots: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getParams = () => {
        const params = new URLSearchParams(location.search);
        const minNumSessions = Number(params.get('minNumSessions'));
        const pastNumSessions = Number(params.get('pastNumSessions'));
        let seasonParams = params.get('seasons')?.split(',').map(Number) || [];
        let selectedDivisions = params.get('selectedDivisions')?.split(',').map(Number) || [];
        const sortByDivisionEnabled = params.get('sortByDivisionEnabled') === 'true';
        const sortBy = params.get('sortBy') as 'apd' | 'slope' | 'variance' | 'apd median';

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
            singleSeason: seasonParams[0] || 15,
        }
    };

    let params = getParams();

    const trackNames: string[] = []
    const divisions: number[] = []

    const [minNumSessionsState, setMinNumSessions] = useState<number>(params.minNumSessions);
    const [pastNumSessionsState, setPastNumSessions] = useState<number>(params.pastNumSessions);
    const [seasonsState, setSeasons] = useState<number[]>(params.seasons);
    const [selectedDivisionsState, setSelectedDivisions] = useState<number[]>(params.selectedDivisions);
    const [sortByDivisionEnabledState, setSortByDivisionEnabled] = useState<boolean>(params.sortByDivisionEnabled);
    const [sortByState, setSortBy] = useState<'apd' | 'avg roc' | 'slope' | 'variance' | 'apd median'>(params.sortBy);
    const [singleSeasonEnabledState, setSingleSeasonEnabled] = useState<boolean>(params.singleSeasonEnabled);
    const [singleSeasonState, setSingleSeason] = useState<number | ''>(params.singleSeason);
    const [selectedDriver, setSelectedDriver] = useState<BasicDriver | null>(null);

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

    const { carDrivers: raceCarDrivers, loading: raceLoading, error: raceError } = useTeamSeriesCarDrivers(trackNames, divisions, seasonsState, ["R"], pastNumSessionsState);
    const { carDrivers: qualiCarDrivers, loading: qualiLoading, error: qualiError } = useTeamSeriesCarDrivers(trackNames, divisions, seasonsState, ["Q"], pastNumSessionsState);

    const uniqueDivisions = Array.from(new Set(raceCarDrivers.map(cd => cd.basicDriver?.raceDivision ?? 0)));
    const raceDriverHistories = DriverHistory.fromCarDrivers(raceCarDrivers, true);
    const qualiDriverHistories = DriverHistory.fromCarDrivers(qualiCarDrivers, true);

    return (
        <div>
            <SelectionArea
                uniqueDivisions={uniqueDivisions}
                selectedDivisions={selectedDivisionsState}
                sortByDivisionEnabled={sortByDivisionEnabledState}
                sortBy={sortByState}
                minNumSessions={minNumSessionsState}
                pastNumSessions={pastNumSessionsState}
                basicDrivers={raceDriverHistories.map(dh => dh.basicDriver).filter(bd => bd !== null) as BasicDriver[]}
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
                setSelectedDriver={setSelectedDriver}
                onDriverSelect={(basicDriver) => setSelectedDriver(basicDriver)}
            />
            {raceLoading && <p>Races Loading...</p>}
            {qualiLoading && <p>Qualis Loading...</p>}
            {raceError && <p>Races Error: {raceError}</p>}
            {qualiError && <p>Qualis Error: {qualiError}</p>}
            <APDPlot
                title={'Average Percent Differences (Race)'}
                driverHistories={raceDriverHistories}
                uniqueDivisions={uniqueDivisions}
                selectedDivisionsState={selectedDivisionsState}
                minNumSessionsState={minNumSessionsState}
                divisionsEnabledState={true}
                sortByState={sortByState}
                sortByDivisionEnabledState={sortByDivisionEnabledState}
                selectedDriver={selectedDriver}
            />
            <APDPlot
                title={'Average Percent Difference (Qualifying)'}
                driverHistories={qualiDriverHistories}
                uniqueDivisions={uniqueDivisions}
                selectedDivisionsState={selectedDivisionsState}
                minNumSessionsState={minNumSessionsState}
                divisionsEnabledState={true}
                sortByState={sortByState}
                sortByDivisionEnabledState={sortByDivisionEnabledState}
                selectedDriver={selectedDriver}
            />
        </div>
    )
}