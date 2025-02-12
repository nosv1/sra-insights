import React, { useEffect, useState } from 'react';
import { useRecentSessions } from '../hooks/useSessions';
import { Session } from '../types/Session';
import { Lap } from '../types/Lap';

export const Header: React.FC = () => {
    const [hoveredSession, setHoveredSession] = useState<Session | null>(null);
    const [refreshKey, setRefreshKey] = useState<number>(0);

    const { recentSessions, loading, error } = useRecentSessions(3, refreshKey);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRefreshKey(prevKey => prevKey + 1);
        }, 60000); // Refetch every minute

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <header>
            <h1>SRA Insights</h1>
            <div className="recent-sessions">
                {recentSessions.map((session) => (
                    <div
                        key={session.key_}
                        className="session-item"
                        onMouseEnter={() => setHoveredSession(session)}
                        onMouseLeave={() => setHoveredSession(null)}
                    >
                        <a href={session.sraSessionURL} target="_blank" rel="noreferrer">
                            SRAM{session.serverNumber} - {session.sessionType} - {session.trackName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())} | {session.timeAgo}
                        </a>
                        {hoveredSession === session && (
                            <div className="tooltip">
                                {session.carDrivers?.map(carDriver => (
                                    <div key={carDriver.driverId}>
                                        D{carDriver.basicDriver?.raceDivision} | {carDriver.basicDriver?.name}: {carDriver.sessionCar?.bestValidLapMilli && Lap.timeToString(carDriver.sessionCar?.bestValidLapMilli)} ({carDriver.sessionCar?.laps.length} laps)
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </header>
    );
};