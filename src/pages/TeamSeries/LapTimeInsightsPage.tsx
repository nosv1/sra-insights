import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { TeamSeriesLeaderboards } from '../../components/Leaderboards/TeamSeriesLeaderboards';

export const LapTimeInsightsPage: React.FC = () => {
    return (
        <div>
            <Header />
            <TeamSeriesLeaderboards />
            <Footer />
        </div>
    )
}
