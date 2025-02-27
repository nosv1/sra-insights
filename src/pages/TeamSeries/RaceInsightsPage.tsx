import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { TimeInPitsPlot } from '../../components/RaceInsights/TimeInPitsPlot';
import { GapToLeaderPlot } from '../../components/RaceInsights/GapToLeaderPlot';

export const RaceInsightsPage: React.FC = () => {
    return (
        <div>
            <Header />
            <GapToLeaderPlot />
            <TimeInPitsPlot />
            <Footer />
        </div>
    )
}
