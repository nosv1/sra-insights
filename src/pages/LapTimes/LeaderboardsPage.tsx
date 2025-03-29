import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { TeamSeriesLeaderboards } from '../../components/Leaderboards/TeamSeriesLeaderboards';


export const LeaderboardsPage: React.FC = () => {

    const location = useLocation();

    const getParams = () => {
        const params = new URLSearchParams(location.search);
        const seriesParam = params.get('series');
        const series = seriesParam === 'endurance-series' ? 'endurance-series' : 'team-series';
        return {
            series: series,
        };
    };

    let params = getParams();

    const [seriesState, setSeries] = useState<'team-series' | 'endurance-series'>(params.series as 'team-series' | 'endurance-series');

    return (
        <div>
            <Header />
            <TeamSeriesLeaderboards series={seriesState} />
            <Footer />
        </div>
    )
}
