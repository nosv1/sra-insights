import { useEffect, useState } from "react";
import { fetchLapsByAttrs } from "../services/LapService";
import { Lap } from "../types/Lap";

export const useLaps = (afterDate: string, beforeDate: string, trackName: string, carGroups: string[]) => {
    const [laps, setLaps] = useState<Lap[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const laps = await fetchLapsByAttrs({ afterDate, beforeDate, trackName, carGroups });
                setLaps(laps);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [afterDate, beforeDate, trackName]);

    return { laps, loading, error };
};
