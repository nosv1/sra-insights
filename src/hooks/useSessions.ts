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

export const useTeamSeriesTracks = (season: string, limit: number) => {
    const [teamSeriesTracks, setTeamSeriesTracks] = useState<{ track: string, season: number }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const prevDeps = useRef<{ season: string, limit: number } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const tracksAndSeasons = await fetchTeamSeriesTracksByAttrs(season, limit);
                setTeamSeriesTracks(tracksAndSeasons);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        if (prevDeps.current === null || JSON.stringify(prevDeps.current) !== JSON.stringify({ season, limit })) {
            fetchData();
            prevDeps.current = { season, limit }
        }
    }, [season, limit]);

    return { teamSeriesTracks, loading, error };
}

export const useTeamSeriesWeekendsFromAttrs = (trackName: string, season: number) => {
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

export const useTeamSeriesWeekendsFromTracks = (teamSeriesTracks: { track: string, season: number }[]) => {
    const [teamSeriesWeekends, setTeamSeriesWeekends] = useState<Weekend[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const prevDeps = useRef<{ track: string, season: number }[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const weekends = await Promise.all(
                    teamSeriesTracks.map(async ({ track, season }: { track: string, season: number }) => {
                        return await fetchTeamSeriesWeekendsByAttrs(track, season);
                    })
                );
                setTeamSeriesWeekends(weekends.flat());
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        const depsChanged = prevDeps.current === null || JSON.stringify(prevDeps.current) !== JSON.stringify(teamSeriesTracks);
        if (depsChanged) {
            fetchData();
            prevDeps.current = teamSeriesTracks;
        }
    }, [teamSeriesTracks]);

    return { teamSeriesWeekends, loading, error };
};