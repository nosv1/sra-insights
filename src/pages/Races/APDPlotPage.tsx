import { APDPlots } from '../../components/AveragePercentDifference/APD';
import { Briefing } from '../../components/AveragePercentDifference/Briefing';
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';

export const TeamSeriesAPDPlotPage: React.FC = () => {
    return (
        <div>
            <Header />
            <APDPlots />
            <Briefing />
            <Footer />
        </div>
    )
}
