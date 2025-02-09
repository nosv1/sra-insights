import { DriverHistory } from '../../types/DriverHistory';
import Plot from 'react-plotly.js';
import * as ss from 'simple-statistics';
import { Lap } from '../../types/Lap';

export interface LapsOverTimePlotProps {
    driverHistory: DriverHistory;
    lapAttr: keyof Lap;
}

export const LapsOverTimePlot: React.FC<LapsOverTimePlotProps> = ({ driverHistory, lapAttr }) => {
    const validLaps = driverHistory.laps.filter(l => l.isValidForBest);
    const invalidLaps = driverHistory.laps.filter(l => !l.isValidForBest);

    if (!validLaps.length) {
        return <div>No valid laps for {driverHistory.basicDriver?.name}</div>;
    }

    // Calculate median lap time for valid laps
    const validTimes = validLaps.map(l => (l[lapAttr] as number) / 1000.0);
    const medianTimes = ss.median(validTimes);

    const plotData = [
        {
            x: validLaps.map((l, l_idx) => driverHistory.laps.indexOf(l) + 1),
            y: validLaps.map(l => l[lapAttr] as number / 1000.0),
            mode: 'markers',
            type: 'scatter',
            name: `Valid Laps ${(validLaps.length / driverHistory.laps.length * 100).toFixed(2)}%`,
            marker: {
                color: 'rgba(160,160,160,0.5)'
            },
        },
        {
            x: invalidLaps.map((l, l_idx) => driverHistory.laps.indexOf(l) + 1),
            y: invalidLaps.map(l => l[lapAttr] as number / 1000.0),
            mode: 'markers',
            type: 'scatter',
            name: `Invalid Laps ${(invalidLaps.length / driverHistory.laps.length * 100).toFixed(2)}%`,
            marker: {
                color: 'rgba(255,0,0,0.5)'
            },
        },
        {
            x: [1, driverHistory.laps.length],
            y: [medianTimes, medianTimes],
            mode: 'lines',
            type: 'scatter',
            name: `Median Valid Time: ${medianTimes.toFixed(3)}s`,
            line: {
                color: 'rgba(0,255,0,0.5)',
                dash: 'dash'
            },
        }
    ];

    return (
        <div>
            <Plot className="plot"
                data={plotData}
                layout={{
                    height: 400,
                    title: `${driverHistory.basicDriver?.name}'s ${driverHistory.laps.length} Laps`,
                    xaxis: {
                        title: 'Lap Number',
                        showgrid: true,
                        gridcolor: 'rgba(255,255,255,0.1)',
                    },
                    yaxis: {
                        title: 'Time (s)',
                        showgrid: true,
                        gridcolor: 'rgba(255,255,255,0.1)',
                    },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: '#2c2c2c',
                    font: {
                        color: '#e0e0e0',
                    },
                    hovermode: 'closest',
                    legend: {
                        orientation: 'h',
                        y: 1.15,
                        x: 0.5,
                        xanchor: 'center',
                        yanchor: 'top'
                    },
                }}
            />
        </div>
    );
};