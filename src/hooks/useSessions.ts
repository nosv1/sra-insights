import { useEffect, useRef, useState } from "react";
import { fetchRecentSessions, fetchTeamSeriesTracksByAttrs, fetchTeamSeriesWeekendsByAttrs } from "../services/SessionService";
import { Session } from "../types/Session";
import { Weekend } from "../types/Weekend";

export const useRecentSessions = (limit: number, refreshKey: number | null = null) => {
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const prevDeps = useRef<{ limit: number, refreshKey: number | null } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const sessions = await fetchRecentSessions(limit);
                setRecentSessions(sessions);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        const depsChanged = prevDeps.current === null || JSON.stringify(prevDeps.current) !== JSON.stringify({ limit, refreshKey });
        if (depsChanged) {
            fetchData();
            prevDeps.current = { limit, refreshKey };
        }
    }, [limit, refreshKey]);

    return { recentSessions, loading, error, refreshKey };
}

export const useTeamSeriesTracks = (season: number) => {
    const [teamSeriesTracks, setTeamSeriesTracks] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const prevDeps = useRef<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const tracks = await fetchTeamSeriesTracksByAttrs(season);
                setTeamSeriesTracks(tracks);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        if (prevDeps.current !== season) {
            fetchData();
            prevDeps.current = season;
        }
    }, [season]);

    return { teamSeriesTracks, loading, error };
}

export const useTeamSeriesWeekends = (trackName: string, season: number) => {
    const [teamSeriesWeekends, setTeamSeriesWeekends] = useState<Weekend[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const prevDeps = useRef<{ trackName: string, season: number } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const weekends = await fetchTeamSeriesWeekendsByAttrs(trackName, season);
                setTeamSeriesWeekends(weekends);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        const depsChanged = prevDeps.current === null || JSON.stringify(prevDeps.current) !== JSON.stringify({ trackName, season });
        if (depsChanged) {
            fetchData();
            prevDeps.current = { trackName, season };
        }
    }, [trackName, season]);

    return { teamSeriesWeekends, loading, error };
};