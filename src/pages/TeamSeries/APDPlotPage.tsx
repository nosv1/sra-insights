import { Briefing } from '../../components/AveragePercentDifference/Briefing';
import { APDPlot } from '../../components/AveragePercentDifference/Plot';
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';

export const TeamSeriesAPDPlotPage: React.FC = () => {
    return (
        <div>
            <Header />
            <APDPlot />
            <Briefing />
            <Footer />
        </div>
    )
}
