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
    let sessions: { [sessionKey: string]: Lap[] } = {};

    if (!validLaps.length) {
        return <div>No valid laps for {driverHistory.basicDriver?.name}</div>;
    }

    // Calculate median lap time for valid laps
    const validTimes = validLaps.map(l => {
        const session = l.session;
        if (session) {
            if (!sessions[session?.key_])
                sessions[session?.key_] = [];
            sessions[session?.key_].push(l);
        }
        return (l[lapAttr] as number) / 1000.0
    });
    const minValidTime = Math.min(...validTimes);
    const maxValidTime = Math.max(...validTimes);
    // rollingValidMedianLap
    const rollingValidMedian = driverHistory[
        `rollingValidMedian${lapAttr.charAt(0).toUpperCase()
        + (lapAttr === 'lapTime'
            ? 'ap'
            : lapAttr.slice(1))
        }` as keyof DriverHistory
    ] as number[];
    const sessionLines = Object.keys(sessions).reverse().map(sessionKey => {
        const sessionLaps = sessions[sessionKey];
        const session = sessionLaps[0].session;
        const firstLapIndex = driverHistory.laps.indexOf(sessionLaps[0]) + 1;
        return {
            x: [firstLapIndex, firstLapIndex],
            y: [minValidTime, maxValidTime],
            mode: 'lines',
            type: 'scatter',
            name: `SRAM${session?.serverNumber} ${session?.sessionType} | ${session?.timeAgo}`,
            line: {
                color: 'rgba(85, 85, 255, 0.6)',
                dash: 'dot'
            },
        };
    });
    let plotData = [
        {
            x: validLaps.map(l => l.overallLapNumber),
            y: validLaps.map(l => l[lapAttr] as number / 1000.0),
            mode: 'markers',
            type: 'scatter',
            name: `Valid Laps ${(validLaps.length / driverHistory.laps.length * 100).toFixed(2)}%`,
            marker: {
                color: 'rgba(160,160,160,0.5)'
            },
        },
        {
            x: invalidLaps.map(l => l.overallLapNumber),
            y: invalidLaps.map(l => l[lapAttr] as number / 1000.0),
            mode: 'markers',
            type: 'scatter',
            name: `Invalid Laps ${(invalidLaps.length / driverHistory.laps.length * 100).toFixed(2)}%`,
            marker: {
                color: 'rgba(255,0,0,0.5)'
            },
        },
        {
            x: rollingValidMedian.map((_, idx) => idx + 1),
            y: rollingValidMedian.map(l_idx => (driverHistory.laps[l_idx][lapAttr] as number) / 1000.0),
            mode: 'lines',
            type: 'scatter',
            name: `Rolling Median Time`,
            line: {
                color: 'rgba(0,255,0,0.5)',
                dash: 'dash'
            },
        }
    ];
    plotData.push(...sessionLines);

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
                        range: [minValidTime - 0.2, maxValidTime + 0.2],
                    },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: '#2c2c2c',
                    font: {
                        color: '#e0e0e0',
                    },
                    hovermode: 'closest',
                    // legend: {
                    //     orientation: 'h',
                    //     y: 1.15,
                    //     x: 0.5,
                    //     xanchor: 'center',
                    //     yanchor: 'top'
                    // },
                }}
            />
        </div>
    );
};