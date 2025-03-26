import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { TeamSeriesLeaderboards } from '../../components/Leaderboards/TeamSeriesLeaderboards';

export const LeaderboardsPage: React.FC = () => {
    return (
        <div>
            <Header />
            <TeamSeriesLeaderboards />
            <Footer />
        </div>
    )
}
