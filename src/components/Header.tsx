import React, { useEffect, useState } from 'react';
import { useRecentSessions } from '../hooks/useSessions';
import { Session } from '../types/Session';
import { Lap } from '../types/Lap';

export const Header: React.FC = () => {
    const { recentSessions, loading, error } = useRecentSessions(3);
    const [timeAgo, setTimeAgo] = useState<string[]>([]);
    const [hoveredSession, setHoveredSession] = useState<Session | null>(null);

    useEffect(() => {
        const updateTimes = () => {
            setTimeAgo(recentSessions.map(session => session.timeAgo));
        };

        updateTimes();
        const intervalId = setInterval(updateTimes, 60000); // Update every minute

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [recentSessions]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>SRA Insights</h1>
            <div className="recent-sessions">
                {recentSessions.map((session, index) => (
                    <div
                        key={session.key_}
                        className="session-item"
                        onMouseEnter={() => setHoveredSession(session)}
                        onMouseLeave={() => setHoveredSession(null)}
                    >
                        <a href={session.sraSessionURL} target="_blank" rel="noreferrer">
                            SRAM{session.serverNumber} - {session.sessionType} - {session.trackName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())} | {timeAgo[index]}
                        </a>
                        {hoveredSession === session && (
                            <div className="tooltip">
                                {session.carDrivers?.map(carDriver => (
                                    <div key={carDriver.driverId}>
                                        {carDriver.basicDriver?.firstName} {carDriver.basicDriver?.lastName}: {carDriver.sessionCar?.bestLap?.lapTime && Lap.timeToString(carDriver.sessionCar?.bestLap?.lapTime)} ({carDriver.sessionCar?.laps.length} laps)
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}