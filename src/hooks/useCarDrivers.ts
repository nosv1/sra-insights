import { useEffect, useRef, useState } from "react";
import { fetchTeamSeriesCarDrivers } from "../services/CarDriverService";
import { CarDriver } from "../types/CarDriver";

export const useTeamSeriesCarDrivers = (trackNames: string[], divisions: number[], seasons: number[], sessionTypes: string[], pastNumSessions: number) => {
    const [carDrivers, setCarDrivers] = useState<CarDriver[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const prevDeps = useRef<{ trackNames: string[], divisions: number[], seasons: number[], sessionTypes: string[], pastNumSessions: number } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const drivers = await fetchTeamSeriesCarDrivers({ trackNames, divisions, seasons, sessionTypes, pastNumSessions });
                setCarDrivers(drivers);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        const depsChanged = prevDeps.current === null || JSON.stringify(prevDeps.current) !== JSON.stringify({ trackNames, divisions, seasons, sessionTypes, pastNumSessions });
        if (depsChanged) {
            fetchData();
            prevDeps.current = { trackNames, divisions, seasons, sessionTypes, pastNumSessions };
        }
    }, [trackNames, divisions, seasons, sessionTypes, pastNumSessions]);

    return { carDrivers, loading, error };
};
