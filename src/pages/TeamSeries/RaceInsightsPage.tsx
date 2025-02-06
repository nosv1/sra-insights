import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { TimeInPitsPlot } from '../../components/RaceInsights/TimeInPitsPlot';

export const RaceInsightsPage: React.FC = () => {
    return (
        <div>
            <Header />
            <TimeInPitsPlot />
            <Footer />
        </div>
    )
}
