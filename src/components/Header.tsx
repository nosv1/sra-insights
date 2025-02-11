import React, { useEffect, useState } from 'react';
import { useRecentSessions } from '../hooks/useSessions';

export const Header: React.FC = () => {
    const { recentSessions, loading, error } = useRecentSessions(3);
    const [timeAgo, setTimeAgo] = useState<string[]>([]);

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
                    <div key={session.key_} className="session-item">
                        <a href={session.sraSessionURL} target="_blank" rel="noreferrer">
                            SRAM{session.serverNumber} - {session.sessionType} - {session.trackName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())} | {timeAgo[index]}
                        </a>
                    </div> // Oulton Park - FP - 2 days ago
                ))}
            </div>
        </div>
    );
}