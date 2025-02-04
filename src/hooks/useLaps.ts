import { useEffect, useState } from "react";
import { Lap } from "../types/Lap";
import { fetchLapsByAttrs } from "../services/LapService";

export const useLaps = (afterDate: string, beforeDate: string, trackName: string) => {
    const [laps, setLaps] = useState<Lap[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            try {
                const laps = await fetchLapsByAttrs({ afterDate, beforeDate, trackName });
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
